import { describe, expect, it } from "vitest";

const rgb = (hex: string) => hex.match(/[0-9a-f]{2}/gi)!.map((value) => Number.parseInt(value, 16));
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map((value) => value / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
};
const composite = (foreground: string, background: string, alpha: number) => {
  const fg = rgb(foreground); const bg = rgb(background);
  return fg.map((value, index) => Math.round(value * alpha + bg[index] * (1 - alpha)).toString(16).padStart(2, "0")).join("");
};

describe("warm editorial light theme", () => {
  it("keeps normal text and primary controls at WCAG AA contrast", () => {
    expect(contrast("241D16", "F6F1E8")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("6F655A", "F6F1E8")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("A8600A", "FFFDF8")).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps interactive boundaries at 3:1 against the canvas", () => {
    expect(contrast(composite("241D16", "F6F1E8", 0.5), "F6F1E8")).toBeGreaterThanOrEqual(3);
  });
});
