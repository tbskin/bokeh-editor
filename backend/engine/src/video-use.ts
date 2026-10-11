import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { promisify } from "node:util";

const pExecFile = promisify(execFile);
export const VIDEO_USE_DIR = process.env.OLE_VIDEO_USE_DIR ?? fileURLToPath(new URL("../../vendor/video-use", import.meta.url));

export function runVideoUse(args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
  const helper = join(VIDEO_USE_DIR, "helpers", args[0]);
  return pExecFile("uv", ["run", "--project", VIDEO_USE_DIR, "python", helper, ...args.slice(1)], {
    cwd,
    env: { ...process.env, UV_CACHE_DIR: process.env.UV_CACHE_DIR ?? "/tmp/video-use-uv-cache" },
    maxBuffer: 64 * 1024 * 1024,
  });
}
