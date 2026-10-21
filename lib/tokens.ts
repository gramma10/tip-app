import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

/**
 * A tip token proves the browser holding it created that tip. It gates the
 * review, Google-click and manager-message actions so they can't be forged
 * for tips that someone else paid.
 */
export function signTipToken(tipId: string, secret = env.tokenSecret) {
  return createHmac("sha256", secret).update(`tip:${tipId}`).digest("base64url");
}

export function verifyTipToken(tipId: string, token: string, secret = env.tokenSecret) {
  if (!token) return false;
  const expected = Buffer.from(signTipToken(tipId, secret));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
