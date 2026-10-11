import { afterEach, describe, expect, it, vi } from "vitest";
import { assertStoredObject } from "../src/object-storage";

describe("project object storage verification", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("prefers the modern secret key and uses a one-byte range GET", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_modern-test";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy-test";
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => new Response(new Uint8Array([1]), {
      status: 206,
      headers: { "content-range": "bytes 0-0/42", "content-length": "1" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    await assertStoredObject("user/project/source/asset", 42);
    expect(fetchMock).toHaveBeenCalledOnce();
    const sent = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect(sent.Range).toBe("bytes=0-0");
    expect(sent.apikey).toBe("sb_secret_modern-test");
    expect(sent.Authorization).toBeUndefined();
  });

  it("keeps the legacy service-role fallback and rejects a short TUS object", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test";
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(new Uint8Array([1]), {
      status: 206,
      headers: { "content-range": "bytes 0-0/12" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(assertStoredObject("user/project/source/asset", 42)).rejects.toThrow(/incomplete/i);
    const sent = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect(sent.apikey).toBe("service-test");
    expect(sent.Authorization).toBe("Bearer service-test");
  });
});
