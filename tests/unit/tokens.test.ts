import { describe, expect, it } from "vitest";
import { signTipToken, verifyTipToken } from "@/lib/tokens";

describe("tip tokens", () => {
  const secret = "test-secret";

  it("verifies a token for the tip it was signed for", () => {
    expect(verifyTipToken("t_1", signTipToken("t_1", secret), secret)).toBe(true);
  });

  it("rejects a token for another tip, another secret, or garbage", () => {
    const token = signTipToken("t_1", secret);
    expect(verifyTipToken("t_2", token, secret)).toBe(false);
    expect(verifyTipToken("t_1", token, "other-secret")).toBe(false);
    expect(verifyTipToken("t_1", "", secret)).toBe(false);
    expect(verifyTipToken("t_1", "short", secret)).toBe(false);
  });
});
