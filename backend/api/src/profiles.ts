// Per-creator learned parameters — the account-level half of the closed loop (the ledger:
// docs/learning-ledger.md). One JSON per user under DATA/_profiles; tiny, file-based, MVP-honest.
// Today it learns one thing: speaking pace (words/sec), measured from every recorded take and fed
// back into the next script's length math. New learned fields join this record, not new stores.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type RecentReel = { angle?: string; title?: string; opener?: string; at: string };

export type CreatorProfile = {
  wps?: number;        // recent-weighted mean words/sec across takes
  wpsSamples?: number; // how many takes informed it
  recentReels?: RecentReel[]; // newest first — the writer reads these so no two reels re-tread
  voiceId?: string;           // ElevenLabs cloned voice (consented)
  voiceConsentAt?: string;    // when the creator said "this is my voice, clone it"
  voiceSampleSec?: number;    // speech seconds in the setup passage
  updatedAt?: string;
};

const dir = () => join(process.env.OLE_DATA ?? join(process.cwd(), "data"), "_profiles");
const fileFor = (uid: string) => join(dir(), `${uid.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`);

export function readProfile(uid: string): CreatorProfile {
  try { return JSON.parse(readFileSync(fileFor(uid), "utf8")) as CreatorProfile; } catch { return {}; }
}

/** Fold one take's measured pace into the profile: a recent-weighted mean (window ~5 takes), so a
 *  creator's real pace settles fast but one weird take can't yank it. Returns the updated profile. */
export function noteWps(uid: string, wps: number): CreatorProfile {
  const p = readProfile(uid);
  const n = Math.min(p.wpsSamples ?? 0, 4); // cap history weight → window of ~5
  const mean = p.wps && n > 0 ? (p.wps * n + wps) / (n + 1) : wps;
  const next: CreatorProfile = { ...p, wps: Number(mean.toFixed(2)), wpsSamples: (p.wpsSamples ?? 0) + 1, updatedAt: new Date().toISOString() };
  mkdirSync(dir(), { recursive: true });
  writeFileSync(fileFor(uid), JSON.stringify(next, null, 2));
  return next;
}

/** Remember a reel this creator actually MADE (recorded and assembled — not every draft plan), so
 *  the next script can be told what ground is already covered. Newest first, capped. */
export function noteReel(uid: string, reel: Omit<RecentReel, "at">): CreatorProfile {
  const p = readProfile(uid);
  const entry: RecentReel = { ...reel, at: new Date().toISOString() };
  const next: CreatorProfile = { ...p, recentReels: [entry, ...(p.recentReels ?? [])].slice(0, 8), updatedAt: entry.at };
  mkdirSync(dir(), { recursive: true });
  writeFileSync(fileFor(uid), JSON.stringify(next, null, 2));
  return next;
}

/** The creator consented and their clone exists — remember both. */
export function setVoice(uid: string, v: { voiceId: string; sampleSec: number }): CreatorProfile {
  const p = readProfile(uid);
  const next: CreatorProfile = { ...p, voiceId: v.voiceId, voiceSampleSec: v.sampleSec, voiceConsentAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  mkdirSync(dir(), { recursive: true });
  writeFileSync(fileFor(uid), JSON.stringify(next, null, 2));
  return next;
}

/** Consent withdrawn or the upstream voice vanished — forget the clone, keep everything else. */
export function clearVoice(uid: string): CreatorProfile {
  const { voiceId: _v, voiceConsentAt: _c, voiceSampleSec: _s, ...rest } = readProfile(uid);
  const next: CreatorProfile = { ...rest, updatedAt: new Date().toISOString() };
  mkdirSync(dir(), { recursive: true });
  writeFileSync(fileFor(uid), JSON.stringify(next, null, 2));
  return next;
}
