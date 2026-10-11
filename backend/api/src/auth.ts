import type { RequestHandler, Request } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { projectOwner as realOwner, countProjectsSince } from "./db";

// Lazily built so importing this module (e.g. in tests) doesn't require a reachable URL.
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
let jwksIssuer: string | undefined;
const issuer = () => {
  const base = process.env.SUPABASE_URL;
  if (!base) throw new Error("SUPABASE_URL is not configured");
  return `${base.replace(/\/$/, "")}/auth/v1`;
};
const getJwks = (currentIssuer: string) => {
  if (!jwks || jwksIssuer !== currentIssuer) {
    jwksIssuer = currentIssuer;
    jwks = createRemoteJWKSet(new URL(`${currentIssuer}/.well-known/jwks.json`));
  }
  return jwks;
};

export type Verify = (token: string) => Promise<{ sub: string }>;

/** Verify a Supabase access token locally against the project's public JWKS (ES256). No secret. */
export const verifySupabaseToken: Verify = async (token) => {
  const currentIssuer = issuer();
  const { payload } = await jwtVerify(token, getJwks(currentIssuer), { issuer: currentIssuer });
  if (!payload.sub) throw new Error("token has no sub");
  return { sub: String(payload.sub) };
};

export const userId = (req: Request): string => (req as Request & { userId: string }).userId;

/** Gate every /api/projects route. Attaches req.userId. Injectable verify for tests. */
export function requireAuth(verify: Verify = verifySupabaseToken): RequestHandler {
  return async (req, res, next) => {
    const h = req.header("authorization") ?? "";
    const q = typeof req.query.token === "string" ? req.query.token : "";
    // Header normally; ?token= only for media the <video> element fetches without headers.
    const token = h.startsWith("Bearer ") ? h.slice(7) : q;
    if (!token) return res.status(401).json({ error: "not signed in" });
    try {
      (req as Request & { userId: string }).userId = (await verify(token)).sub;
      next();
    } catch {
      res.status(401).json({ error: "session expired" });
    }
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Enforce project ownership — the single place isolation is guarded. Injectable owner for tests. */
export function requireOwner(owner: (id: string) => Promise<string | null> = realOwner): RequestHandler {
  return async (req, res, next) => {
    const id = req.params.id;
    if (!UUID.test(id)) return res.status(400).json({ error: "bad project id" });
    const o = await owner(id);
    if (!o) return res.status(404).json({ error: "not found" });
    if (o !== userId(req)) return res.status(403).json({ error: "not yours" });
    next();
  };
}

// Env-overridable so the founder's own instance can test past the public default.
export const dailyLimit = (): number => Number(process.env.OLE_DAILY_LIMIT ?? 5);

/** True if the user has already created DAILY_LIMIT projects since local midnight. */
export async function overQuota(uid: string, count: typeof countProjectsSince = countProjectsSince): Promise<boolean> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  return (await count(uid, since)) >= dailyLimit();
}
