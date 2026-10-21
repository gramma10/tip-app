import { describe, expect, it } from "vitest";
import { postTipPrompts } from "@/lib/review-prompts";

describe("postTipPrompts", () => {
  it("shows the Google review CTA only for 5 stars", () => {
    expect(postTipPrompts(5).googleReview).toBe(true);
    for (const rating of [1, 2, 3, 4]) expect(postTipPrompts(rating).googleReview).toBe(false);
    expect(postTipPrompts(null).googleReview).toBe(false);
  });

  it("confirms private feedback only for 1 to 3 stars", () => {
    for (const rating of [1, 2, 3]) expect(postTipPrompts(rating).privateFeedbackConfirmation).toBe(true);
    for (const rating of [4, 5]) expect(postTipPrompts(rating).privateFeedbackConfirmation).toBe(false);
    expect(postTipPrompts(null).privateFeedbackConfirmation).toBe(false);
  });

  it("never shows both prompts at once", () => {
    for (const rating of [null, 1, 2, 3, 4, 5]) {
      const p = postTipPrompts(rating);
      expect(p.googleReview && p.privateFeedbackConfirmation).toBe(false);
    }
  });
});
