export type CreatedTip = {
  tipId: string;
  token: string;
  clientSecret: string | null;
  thanksUrl: string;
};

export type PayHandlers = {
  /** Total charged, including any fee cover; null until an amount is chosen. */
  totalCents: number | null;
  disabled: boolean;
  /** Creates the tip + payment on the server. Returns null (and shows an error) on failure. */
  createTip: () => Promise<CreatedTip | null>;
  onPaid: (tip: CreatedTip) => void;
  onError: (message: string) => void;
};
