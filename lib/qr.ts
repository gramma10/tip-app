import "server-only";
import QRCode from "qrcode";
import { env } from "./env";

export function tipUrl(code: string) {
  return `${env.appUrl.replace(/\/$/, "")}/t/${code}`;
}

/** Crisp SVG QR (scales to any print size). Quartile error correction survives scuffed table cards. */
export async function qrSvg(text: string, opts: { dark?: string; light?: string } = {}) {
  return QRCode.toString(text, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "Q",
    color: { dark: opts.dark ?? "#000000", light: opts.light ?? "#00000000" },
  });
}
