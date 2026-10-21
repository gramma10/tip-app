import { describe, expect, it } from "vitest";
import { dominantColor, rgbToHsl } from "@/lib/color";

function pixels(...colors: [number, number, number, number][]) {
  return new Uint8ClampedArray(colors.flatMap((c) => Array(25).fill(c).flat()));
}

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

describe("dominantColor", () => {
  it("picks the saturated subject over a grey background", () => {
    const hex = dominantColor(pixels([200, 30, 40, 255], [128, 128, 128, 255], [130, 130, 130, 255]));
    const [r, g, b] = channels(hex);
    expect(r).toBeGreaterThan(g * 2);
    expect(r).toBeGreaterThan(b * 2);
  });

  it("always returns a colour dark enough for white text", () => {
    for (const c of [[255, 240, 120, 255], [20, 200, 255, 255], [250, 160, 200, 255]] as [number, number, number, number][]) {
      const [r, g, b] = channels(dominantColor(pixels(c)));
      expect(rgbToHsl(r, g, b).l).toBeLessThan(0.42);
    }
  });

  it("falls back when the photo has no usable colour", () => {
    expect(dominantColor(pixels([255, 255, 255, 255], [0, 0, 0, 255]))).toBe("#6B46C1");
  });
});
