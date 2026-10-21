import { repo } from "@/lib/data";
import { qrSvg, tipUrl } from "@/lib/qr";

/** Print-ready SVG for a card. The QR only encodes the public tip URL, so no auth is needed. */
export async function GET(_request: Request, ctx: RouteContext<"/api/qr/[code]">) {
  const { code } = await ctx.params;
  const card = await repo().getCardByCode(code);
  if (!card) return new Response("Not found", { status: 404 });
  const svg = await qrSvg(tipUrl(card.code), { light: "#ffffff" });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="tip-card-${card.code}.svg"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
