import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import { mkdtemp, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Server } from "node:http";
import { createUploads } from "../src/uploads";

// Full tus protocol round-trip against a real HTTP server: create → PATCH a chunk → (connection
// "drops") → HEAD reads the confirmed offset → PATCH resumes from there → the finished file lands
// in the project's clips/ dir. This is the exact resume dance the app performs.

const PROJECT = "11111111-2222-4333-8444-555555555555";
const b64 = (s: string) => Buffer.from(s).toString("base64");
const META = `filename ${b64("clip.mp4")},projectId ${b64(PROJECT)}`;

let base = "";
let server: Server;
let dataDir = "";

beforeAll(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "ole-tus-"));
  process.env.OLE_DATA = dataDir; // store.projectDir reads this lazily
  const u = createUploads({
    dataDir,
    verify: async (t) => { if (t !== "good-token") throw new Error("bad token"); return { sub: "user-1" }; },
    owner: async (id) => (id === PROJECT ? "user-1" : "someone-else"),
  });
  const app = express();
  app.use(express.json()); // same global parser the real server mounts — must not eat tus bodies
  app.all("/api/uploads", u.handler);
  app.all("/api/uploads/*", u.handler);
  await new Promise<void>((r) => { server = app.listen(0, "127.0.0.1", () => r()); });
  const addr = server.address() as { port: number };
  base = `http://127.0.0.1:${addr.port}`;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

const TUS = { "Tus-Resumable": "1.0.0", Authorization: "Bearer good-token" };

describe("resumable clip uploads (tus)", () => {
  it("uploads in chunks, resumes from the server's confirmed offset, and lands in clips/", async () => {
    const body = Buffer.from("0123456789"); // 10 bytes, split 4 + 6

    const create = await fetch(`${base}/api/uploads`, {
      method: "POST",
      headers: { ...TUS, "Upload-Length": "10", "Upload-Metadata": META },
    });
    expect(create.status).toBe(201);
    const loc = create.headers.get("location")!;
    expect(loc).toContain("/api/uploads/");

    const patch1 = await fetch(loc, {
      method: "PATCH",
      headers: { ...TUS, "Content-Type": "application/offset+octet-stream", "Upload-Offset": "0" },
      body: body.subarray(0, 4),
    });
    expect(patch1.status).toBe(204);
    expect(patch1.headers.get("upload-offset")).toBe("4");

    // The app relaunches / retries: HEAD asks where we left off. THIS is what makes the progress
    // bar resume at 40% instead of restarting at zero.
    const head = await fetch(loc, { method: "HEAD", headers: TUS });
    expect(head.headers.get("upload-offset")).toBe("4");

    const patch2 = await fetch(loc, {
      method: "PATCH",
      headers: { ...TUS, "Content-Type": "application/offset+octet-stream", "Upload-Offset": "4" },
      body: body.subarray(4),
    });
    expect(patch2.status).toBe(204);
    expect(patch2.headers.get("upload-offset")).toBe("10");

    const dest = join(dataDir, PROJECT, "clips", "clip.mp4");
    expect(existsSync(dest)).toBe(true);
    expect((await readFile(dest)).toString()).toBe("0123456789");
  });

  it("rejects a missing/bad token before storing a byte", async () => {
    const r = await fetch(`${base}/api/uploads`, {
      method: "POST",
      headers: { "Tus-Resumable": "1.0.0", "Upload-Length": "5", "Upload-Metadata": META, Authorization: "Bearer wrong" },
    });
    expect(r.status).toBe(401);
  });

  it("rejects an upload into someone else's project", async () => {
    const other = "99999999-2222-4333-8444-555555555555";
    const r = await fetch(`${base}/api/uploads`, {
      method: "POST",
      headers: { ...TUS, "Upload-Length": "5", "Upload-Metadata": `filename ${b64("clip.mp4")},projectId ${b64(other)}` },
    });
    expect(r.status).toBe(403);
  });

  it("rejects non-video filenames", async () => {
    const r = await fetch(`${base}/api/uploads`, {
      method: "POST",
      headers: { ...TUS, "Upload-Length": "5", "Upload-Metadata": `filename ${b64("evil.sh")},projectId ${b64(PROJECT)}` },
    });
    expect(r.status).toBe(400);
  });
});
