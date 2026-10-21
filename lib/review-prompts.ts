/**
 * Which prompts the thank-you screen shows for a guest's rating.
 *
 * - 5 stars: the Google review CTA.
 * - 1–3 stars: a confirmation that the feedback went privately to the manager.
 * - 4 stars or no rating: neither.
 *
 * Note: showing the Google CTA only to 5-star guests is "review gating", which
 * Google's review policy prohibits (risk: the venue's reviews being removed).
 * This is a deliberate product decision; see README "Reviews".
 */
export function postTipPrompts(rating: number | null) {
  return {
    googleReview: rating === 5,
    privateFeedbackConfirmation: rating != null && rating <= 3,
  };
}
