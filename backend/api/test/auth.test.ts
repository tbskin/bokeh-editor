import { describe, it, expect, vi } from "vitest";
process.env.SUPABASE_URL ??= "https://example.supabase.co";
import { dailyLimit, requireAuth, requireOwner, overQuota } from "../src/auth";

const mkRes = () => {
  const r: any = { statusCode: 200, body: undefined };
  r.status = (c: number) => { r.statusCode = c; return r; };
  r.json = (b: unknown) => { r.body = b; return r; };
  return r;
};
const mkReq = (o: { headers?: Record<string, string>; query?: any; params?: any }): any => ({
  header: (n: string) => o.headers?.[n.toLowerCase()],
  query: o.query ?? {},
  params: o.params ?? {},
});
const UUID = "11111111-1111-1111-1111-111111111111";

describe("requireAuth", () => {
  it("401s when no token is present", async () => {
    const res = mkRes(); const next = vi.fn();
    await requireAuth(async () => ({ sub: "x" }))(mkReq({}), res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
  it("401s when the token fails verification", async () => {
    const res = mkRes(); const next = vi.fn();
    await requireAuth(async () => { throw new Error("bad"); })(mkReq({ headers: { authorization: "Bearer nope" } }), res, next);
    expect(res.statusCode).toBe(401);
  });
  it("attaches req.userId and calls next on a valid token", async () => {
    const res = mkRes(); const next = vi.fn(); const req = mkReq({ headers: { authorization: "Bearer good" } });
    await requireAuth(async () => ({ sub: "user-1" }))(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBe("user-1");
  });
  it("reads the token from ?token= when there is no header (media requests)", async () => {
    const res = mkRes(); const next = vi.fn(); const req = mkReq({ query: { token: "good" } });
    await requireAuth(async (t) => ({ sub: t === "good" ? "user-1" : "" }))(req, res, next);
    expect(req.userId).toBe("user-1");
    expect(next).toHaveBeenCalledOnce();
  });
});

describe("requireOwner", () => {
  const owner = async (id: string) => (id === UUID ? "owner-1" : null);
  it("400s on a non-uuid id", async () => {
    const res = mkRes(); const next = vi.fn();
    await requireOwner(owner)(mkReq({ params: { id: "abc" } }), res, next);
    expect(res.statusCode).toBe(400);
  });
  it("404s when the project does not exist", async () => {
    const res = mkRes(); const next = vi.fn();
    const req = mkReq({ params: { id: "22222222-2222-2222-2222-222222222222" } }); req.userId = "owner-1";
    await requireOwner(owner)(req, res, next);
    expect(res.statusCode).toBe(404);
  });
  it("403s when the caller is not the owner", async () => {
    const res = mkRes(); const next = vi.fn();
    const req = mkReq({ params: { id: UUID } }); req.userId = "someone-else";
    await requireOwner(owner)(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });
  it("calls next when the caller owns the project", async () => {
    const res = mkRes(); const next = vi.fn();
    const req = mkReq({ params: { id: UUID } }); req.userId = "owner-1";
    await requireOwner(owner)(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe("overQuota", () => {
  it("is false below the daily limit and true at it", async () => {
    expect(await overQuota("u", async () => 4)).toBe(false);
    expect(await overQuota("u", async () => 5)).toBe(true);
  });
  it("reads the configured limit lazily after local env loading", () => {
    const before = process.env.OLE_DAILY_LIMIT;
    process.env.OLE_DAILY_LIMIT = "9";
    expect(dailyLimit()).toBe(9);
    if (before == null) delete process.env.OLE_DAILY_LIMIT; else process.env.OLE_DAILY_LIMIT = before;
  });
});
