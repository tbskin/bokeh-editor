// The creator's cloned voice: explicit consent in the app, one ~60s passage, one ElevenLabs
// instant clone. The clone id lives in the creator profile; deleting is one call (consent
// hygiene). Cloning NEVER happens outside this route — reel takes are never used as samples.
import express from "express";
import multer from "multer";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { speechSeconds } from "@ole/engine";
import { readProfile, setVoice, clearVoice } from "./profiles";
import { track } from "./telemetry";
import { userId } from "./auth";

export type ElevenClient = {
  addVoice(name: string, samplePath: string): Promise<{ voiceId: string }>;
  deleteVoice(voiceId: string): Promise<void>;
};

const MIN_SPEECH_SEC = 45;

const realEleven = (): ElevenClient => {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("Voice setup isn't available right now.");
  return {
    async addVoice(name, samplePath) {
      const form = new FormData();
      form.append("name", name);
      const { readFile } = await import("node:fs/promises");
      form.append("files", new Blob([await readFile(samplePath)]), "sample.m4a");
      const res = await fetch("https://api.elevenlabs.io/v1/voices/add", { method: "POST", headers: { "xi-api-key": key }, body: form });
      if (!res.ok) throw new Error(`We couldn't set up your voice just now — try again in a moment. (${res.status})`);
      const j = (await res.json()) as { voice_id: string };
      return { voiceId: j.voice_id };
    },
    async deleteVoice(voiceId) {
      const res = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, { method: "DELETE", headers: { "xi-api-key": key } });
      // 404 = already gone upstream, which is the goal state. Anything else failing means the clone
      // may still exist — surface it rather than pretending consent was withdrawn.
      if (!res.ok && res.status !== 404) {
        throw new Error(`We couldn't remove your voice just now — try again in a moment. (${res.status})`);
      }
    },
  };
};

export function createVoiceRoutes(opts: { eleven?: ElevenClient; speech?: (p: string) => Promise<number> } = {}): express.Router {
  const speech = opts.speech ?? speechSeconds;
  const upload = multer({ dest: join(tmpdir(), "ole-voice"), limits: { fileSize: 64 * 1024 * 1024 } });
  const r = express.Router();

  r.get("/", (req, res) => res.json({ hasVoice: !!readProfile(userId(req)).voiceId }));

  // Missing key answers fast (503) before the upload even lands on disk — checked directly against
  // the env var so it gates real traffic even when a test injects its own `eleven` client.
  const requireVoiceCapability: express.RequestHandler = (req, res, next) => {
    if (!process.env.ELEVENLABS_API_KEY) return res.status(503).json({ error: "Voice setup isn't available right now." });
    next();
  };

  r.post("/setup", requireVoiceCapability, upload.single("sample"), async (req, res) => {
    const f = req.file;
    if (!f) return res.status(400).json({ error: "We didn't get your recording — try again." });
    try {
      const sec = await speech(f.path);
      if (sec < MIN_SPEECH_SEC) {
        return res.status(400).json({ error: `We need about a minute of you talking — this take had ${Math.round(sec)} seconds of speech.` });
      }
      const eleven = opts.eleven ?? realEleven();
      const { voiceId } = await eleven.addVoice(`ole-${userId(req).slice(0, 8)}`, f.path);
      setVoice(userId(req), { voiceId, sampleSec: Math.round(sec) });
      track(userId(req), "voice_cloned", { sampleSec: Math.round(sec) });
      res.json({ ok: true });
    } catch (e) {
      // Raw failure text (ffmpeg stderr, "fetch failed") is for the logs, never the app.
      console.warn("[voice] setup failed:", String(e));
      res.status(500).json({ error: "We couldn't set up your voice just now — try again in a moment." });
    } finally {
      await unlink(f.path).catch(() => {});
    }
  });

  r.delete("/", async (req, res) => {
    const p = readProfile(userId(req));
    if (p.voiceId) {
      try {
        await (opts.eleven ?? realEleven()).deleteVoice(p.voiceId);
      } catch (e) {
        console.warn("[voice] upstream delete failed:", String(e));
        return res.status(502).json({ error: String((e as Error).message ?? "We couldn't remove your voice just now — try again in a moment.") });
      }
    }
    clearVoice(userId(req));
    res.json({ ok: true });
  });

  return r;
}
