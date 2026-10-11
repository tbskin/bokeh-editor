import { describe, it, expect } from "vitest";
import { joinUrl } from "../src/lib/url";

describe("joinUrl", () => {
  it("joins base and path with one slash", () => {
    expect(joinUrl("http://x:8787", "/api/projects")).toBe("http://x:8787/api/projects");
  });
  it("trims trailing base slash and adds missing leading slash", () => {
    expect(joinUrl("http://x:8787/", "api/projects")).toBe("http://x:8787/api/projects");
  });
});
