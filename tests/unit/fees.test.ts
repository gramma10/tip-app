import { describe, expect, it } from "vitest";
import {
  computeTipBreakdown,
  COVER_FEES_BY_DEFAULT,
  DEFAULT_FEES,
  estimateProcessorFee,
  feeCoverFor,
  MAX_TIP_CENTS,
  MIN_TIP_CENTS,
} from "@/lib/fees";

describe("computeTipBreakdown", () => {
  it("without cover: guest pays the tip, payee absorbs processing and take", () => {
    const b = computeTipBreakdown(200, false);
    // 1.5% of 200 = 3, + 25 fixed = 28 processing; 4% take = 8.
    expect(b).toEqual({ tipCents: 200, feeCoverCents: 0, totalCents: 200, applicationFeeCents: 36, payeeNetCents: 164 });
  });

  it("with cover: payee receives exactly the tip", () => {
    for (const tip of [100, 150, 200, 250, 300, 500, 1000, 2000, 15000]) {
      const b = computeTipBreakdown(tip, true);
      expect(b.payeeNetCents).toBe(tip);
      expect(b.totalCents).toBe(tip + b.feeCoverCents);
      expect(b.applicationFeeCents).toBe(b.feeCoverCents);
    }
  });

  it("cover always pays processing on the larger total plus the take", () => {
    for (let tip = MIN_TIP_CENTS; tip <= 5000; tip += 37) {
      const cover = feeCoverFor(tip);
      const processing = estimateProcessorFee(tip + cover);
      const take = Math.round(tip * DEFAULT_FEES.takeRate);
      expect(cover).toBeGreaterThanOrEqual(processing + take);
      expect(cover % 5).toBe(0); // reads as €0.35, not €0.33
    }
  });

  it("defaults to covering fees, so the payee gets the full tip unless the guest opts out", () => {
    expect(COVER_FEES_BY_DEFAULT).toBe(true);
    const b = computeTipBreakdown(500, COVER_FEES_BY_DEFAULT);
    expect(b).toMatchObject({ totalCents: 555, feeCoverCents: 55, payeeNetCents: 500 });
  });

  it("respects a custom take rate", () => {
    const b = computeTipBreakdown(1000, false, { ...DEFAULT_FEES, takeRate: 0.05 });
    expect(b.applicationFeeCents).toBe(15 + 25 + 50);
  });

  it("rejects out-of-range and fractional amounts", () => {
    expect(() => computeTipBreakdown(MIN_TIP_CENTS - 1, false)).toThrow(RangeError);
    expect(() => computeTipBreakdown(MAX_TIP_CENTS + 1, false)).toThrow(RangeError);
    expect(() => computeTipBreakdown(250.5, false)).toThrow(RangeError);
  });
});
