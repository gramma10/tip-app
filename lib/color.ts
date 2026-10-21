/**
 * Picks a header colour from a photo's pixels (RGBA bytes): the most
 * saturated common hue, then clamped so white text on it stays readable.
 */
export function dominantColor(pixels: Uint8ClampedArray): string {
  const bins = Array.from({ length: 12 }, () => ({ weight: 0, r: 0, g: 0, b: 0 }));
  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b, a] = [pixels[i]!, pixels[i + 1]!, pixels[i + 2]!, pixels[i + 3]!];
    if (a < 128) continue;
    const { h, s, l } = rgbToHsl(r, g, b);
    if (l < 0.08 || l > 0.95) continue; // ignore near-black/white backgrounds
    const weight = s * s + 0.02;
    const bin = bins[Math.floor(h * 12) % 12]!;
    bin.weight += weight;
    bin.r += r * weight;
    bin.g += g * weight;
    bin.b += b * weight;
  }
  const best = bins.reduce((a, b) => (b.weight > a.weight ? b : a));
  if (best.weight === 0) return "#6B46C1";
  const { h, s } = rgbToHsl(best.r / best.weight, best.g / best.weight, best.b / best.weight);
  // Rich but not neon, dark enough for white text (≈ 4.5:1 at these lightness values).
  return hslToHex(h, Math.min(Math.max(s, 0.38), 0.72), 0.38);
}

export function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h / 6, s, l };
}

export function hslToHex(h: number, s: number, l: number) {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
