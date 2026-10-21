/**
 * Fee math for a single tip, in integer cents.
 *
 * Money flow (Stripe destination charge): the platform pays the card processor,
 * so the application fee must cover processing plus the platform take rate.
 *
 * - Without fee cover: guest pays the tip; staff receive tip − processing − take.
 * - With fee cover (on by default, guest can switch it off): guest adds a small
 *   amount so the staff member receives 100% of the tip.
 *
 * Legal note: an EU card surcharge is banned (PSD2), and pre-selected extra
 * payments are not binding on consumers (Consumer Rights Directive art. 22).
 */

export type FeeConfig = {
  /** Platform commission on the tip, e.g. 0.04 for 4%. */
  takeRate: number;
  /** Estimated processor percentage, e.g. 0.015 for standard EEA cards. */
  processorRate: number;
  /** Estimated processor fixed fee in cents. */
  processorFixedCents: number;
};

export const DEFAULT_FEES: FeeConfig = {
  takeRate: 0.04,
  processorRate: 0.015,
  processorFixedCents: 25,
};

/** The tip page pre-selects fee cover; guests can switch it off before paying. */
export const COVER_FEES_BY_DEFAULT = true;

export const MIN_TIP_CENTS = 100;
export const MAX_TIP_CENTS = 15_000;

export type TipBreakdown = {
  tipCents: number;
  feeCoverCents: number;
  /** What the guest is charged. */
  totalCents: number;
  /** application_fee_amount kept by the platform (it pays processing out of this). */
  applicationFeeCents: number;
  /** What lands in the staff member's (or venue's) account. */
  payeeNetCents: number;
};

export function estimateProcessorFee(chargeCents: number, cfg: FeeConfig = DEFAULT_FEES) {
  return Math.round(chargeCents * cfg.processorRate) + cfg.processorFixedCents;
}

export function platformTake(tipCents: number, cfg: FeeConfig = DEFAULT_FEES) {
  return Math.round(tipCents * cfg.takeRate);
}

/** Rounds up to the next 5 cents so the cover amount reads cleanly (€0.35, not €0.33). */
function ceilTo5(cents: number) {
  return Math.ceil(cents / 5) * 5;
}

/**
 * Smallest clean amount that, added to the tip, pays both processing on the
 * larger total and the platform take — so the payee nets the full tip.
 */
export function feeCoverFor(tipCents: number, cfg: FeeConfig = DEFAULT_FEES) {
  const take = platformTake(tipCents, cfg);
  let cover = ceilTo5(estimateProcessorFee(tipCents, cfg) + take);
  // Processing grows with the cover itself; converge (one or two iterations in practice).
  for (let i = 0; i < 5; i++) {
    const needed = ceilTo5(estimateProcessorFee(tipCents + cover, cfg) + take);
    if (needed <= cover) break;
    cover = needed;
  }
  return cover;
}

export function computeTipBreakdown(
  tipCents: number,
  coverFees: boolean,
  cfg: FeeConfig = DEFAULT_FEES,
): TipBreakdown {
  if (!Number.isInteger(tipCents) || tipCents < MIN_TIP_CENTS || tipCents > MAX_TIP_CENTS) {
    throw new RangeError(`Tip must be between ${MIN_TIP_CENTS} and ${MAX_TIP_CENTS} cents`);
  }

  if (coverFees) {
    const feeCoverCents = feeCoverFor(tipCents, cfg);
    return {
      tipCents,
      feeCoverCents,
      totalCents: tipCents + feeCoverCents,
      applicationFeeCents: feeCoverCents,
      payeeNetCents: tipCents,
    };
  }

  const applicationFeeCents = estimateProcessorFee(tipCents, cfg) + platformTake(tipCents, cfg);
  return {
    tipCents,
    feeCoverCents: 0,
    totalCents: tipCents,
    applicationFeeCents,
    payeeNetCents: tipCents - applicationFeeCents,
  };
}
