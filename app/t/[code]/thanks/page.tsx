import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MotionProvider } from "@/components/motion-provider";
import { ThanksView } from "@/components/tip/thanks-view";
import { getThanksContext } from "@/lib/services/tips";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

export default async function ThanksPage(props: PageProps<"/t/[code]/thanks">) {
  const [{ code }, search] = await Promise.all([props.params, props.searchParams]);
  const tipId = typeof search.tip === "string" ? search.tip : "";
  const token = typeof search.k === "string" ? search.k : "";
  const ctx = tipId && token ? await getThanksContext(tipId, token) : null;
  if (!ctx) notFound();
  return (
    <MotionProvider>
      <ThanksView code={code} token={token} ctx={ctx} />
    </MotionProvider>
  );
}
