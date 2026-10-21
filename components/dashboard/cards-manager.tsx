"use client";

import { Check, ChevronRight, Download, ExternalLink, Plus, QrCode, Users } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { assignCard, createCard } from "@/app/dashboard/actions";
import { EmptyState } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonClasses } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n/client";
import type { Card } from "@/lib/types";
import { cn } from "@/lib/utils";

type CardRow = Card & { url: string; svg: string };
type StaffLite = { id: string; displayName: string; color: string; photoUrl: string | null; roleLabel: string };

export function CardsManager({ cards, staff }: { cards: CardRow[]; staff: StaffLite[] }) {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const selected = cards.find((c) => c.id === selectedId) ?? null;
  const staffById = new Map(staff.map((s) => [s.id, s]));

  return (
    <>
      {cards.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const person = card.assignedStaffId ? staffById.get(card.assignedStaffId) : null;
            return (
              <li key={card.id}>
                <button
                  onClick={() => setSelectedId(card.id)}
                  className="flex w-full items-center gap-4 rounded-card bg-surface p-3 text-left shadow-card transition active:scale-[0.98]"
                >
                  <span
                    className="size-16 shrink-0 rounded-[12px] bg-white p-1.5 ring-1 ring-black/5 [&_svg]:h-full [&_svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: card.svg }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-headline">{card.label}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-subhead text-ink-2">
                      {card.kind === "venue" ? (
                        <>
                          <Users size={15} aria-hidden />
                          {t("dash.cards.guestChooses")}
                        </>
                      ) : person ? (
                        <>
                          <Avatar name={person.displayName} color={person.color} photoUrl={person.photoUrl} size={20} />
                          <span className="truncate">{person.displayName}</span>
                        </>
                      ) : (
                        <span className="text-negative">{t("dash.cards.unassigned")}</span>
                      )}
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-ink-3" aria-hidden />
                </button>
              </li>
            );
          })}
          <li>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex h-full min-h-[88px] w-full items-center justify-center gap-2 rounded-card border-2 border-dashed border-line text-subhead font-semibold text-brand transition active:scale-[0.98]"
            >
              <Plus size={18} aria-hidden />
              {t("dash.cards.create")}
            </button>
          </li>
        </ul>
      ) : (
        <EmptyState
          icon={<QrCode size={26} aria-hidden />}
          title={t("dash.cards.empty")}
          hint={t("dash.cards.emptyHint")}
          action={
            <Button variant="brand" onClick={() => setCreateOpen(true)}>
              <Plus size={18} aria-hidden />
              {t("dash.cards.create")}
            </Button>
          }
        />
      )}

      <CardSheet card={selected} staff={staff} onClose={() => setSelectedId(null)} />
      <CreateCardSheet open={createOpen} onOpenChange={setCreateOpen} staff={staff} />
    </>
  );
}

function CardSheet({ card, staff, onClose }: { card: CardRow | null; staff: StaffLite[]; onClose: () => void }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  // Keep the last card rendered while the sheet animates closed.
  const [shown, setShown] = useState<CardRow | null>(card);
  if (card && card !== shown) setShown(card);
  const c = card ?? shown;

  return (
    <Sheet open={Boolean(card)} onOpenChange={(o) => !o && onClose()} title={c?.label ?? ""} description={c ? `/t/${c.code}` : undefined}>
      {c && (
        <div className="space-y-5 pt-2 pb-2">
          <div
            className="mx-auto size-48 rounded-[20px] bg-white p-4 ring-1 ring-black/5 [&_svg]:h-full [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: c.svg }}
            role="img"
            aria-label={c.url}
          />
          <div className="grid grid-cols-2 gap-3">
            <a href={`/api/qr/${c.code}`} className={buttonClasses("secondary", "md")}>
              <Download size={17} aria-hidden />
              {t("dash.cards.downloadQr")}
            </a>
            <a href={`/t/${c.code}`} target="_blank" rel="noopener" className={buttonClasses("secondary", "md")}>
              <ExternalLink size={17} aria-hidden />
              {t("dash.cards.openPage")}
            </a>
          </div>

          {c.kind === "staff" ? (
            <section>
              <h3 className="px-1 pb-1.5 text-footnote text-ink-2">{t("dash.cards.assignedTo")}</h3>
              <div role="radiogroup" className="overflow-hidden rounded-[16px] bg-fill">
                {[{ id: null as string | null, displayName: t("dash.cards.unassigned") }, ...staff].map((s) => {
                  const active = c.assignedStaffId === s.id;
                  const person = s.id ? staff.find((p) => p.id === s.id) : null;
                  return (
                    <button
                      key={s.id ?? "none"}
                      role="radio"
                      aria-checked={active}
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          // revalidatePath in the action returns fresh props in the same round trip.
                          await assignCard(c.id, s.id);
                          toast.success(s.id ? t("dash.cards.reassigned", { name: s.displayName }) : t("dash.cards.unassignedToast"));
                        })
                      }
                      className="group/row flex w-full items-center gap-3 pl-3 text-left"
                    >
                      {person ? (
                        <Avatar name={person.displayName} color={person.color} photoUrl={person.photoUrl} size={32} />
                      ) : (
                        <span className="size-8 rounded-full border-2 border-dashed border-ink-3" aria-hidden />
                      )}
                      <span className="flex flex-1 items-center py-3 pr-4 shadow-[inset_0_-0.5px_0_var(--line)] group-last/row:shadow-none">
                        <span className={cn("flex-1 text-body", !person && "text-ink-2")}>{s.displayName}</span>
                        {active && <Check size={20} className="text-brand" aria-hidden />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <p className="flex items-center gap-2 rounded-[14px] bg-fill px-4 py-3 text-subhead text-ink-2">
              <Users size={18} aria-hidden />
              {t("dash.cards.kindVenueHint")}
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}

function CreateCardSheet({
  open,
  onOpenChange,
  staff,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffLite[];
}) {
  const { t } = useI18n();
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<"staff" | "venue">("staff");
  const [staffId, setStaffId] = useState<string>("");
  const [pending, start] = useTransition();

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("dash.cards.createTitle")}>
      <form
        className="space-y-4 pt-2 pb-2"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await createCard({ label, kind, staffId: kind === "staff" && staffId ? staffId : null });
            if (res.ok) {
              onOpenChange(false);
              setLabel("");
            } else toast.error(t("common.genericError"));
          });
        }}
      >
        <Segmented
          label={t("dash.cards.label")}
          value={kind}
          onChange={setKind}
          options={[
            { value: "staff", label: t("dash.cards.kindStaff") },
            { value: "venue", label: t("dash.cards.kindVenue") },
          ]}
        />
        <p className="-mt-2 px-1 text-footnote text-ink-2">
          {kind === "staff" ? t("dash.cards.kindStaffHint") : t("dash.cards.kindVenueHint")}
        </p>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          maxLength={60}
          placeholder={t("dash.cards.labelPlaceholder")}
          aria-label={t("dash.cards.label")}
          className="h-12 w-full rounded-[14px] bg-fill px-4 text-body placeholder:text-ink-3 focus:outline-none"
        />
        {kind === "staff" && (
          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            aria-label={t("dash.cards.assignedTo")}
            className="h-12 w-full appearance-none rounded-[14px] bg-fill px-4 text-body focus:outline-none"
          >
            <option value="">{t("dash.cards.unassigned")}</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName}
              </option>
            ))}
          </select>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={pending || !label.trim()}>
          {t("dash.cards.create")}
        </Button>
      </form>
    </Sheet>
  );
}
