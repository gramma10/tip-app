"use client";

import { Camera } from "lucide-react";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { dominantColor } from "@/lib/color";
import { useI18n } from "@/lib/i18n/client";
import { updatePhoto } from "../actions";

const SIZE = 384;

/** Centre-crops to a square JPEG and samples the header colour, all in the browser. */
async function prepare(file: File) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);

  const sample = document.createElement("canvas");
  sample.width = sample.height = 32;
  const sctx = sample.getContext("2d")!;
  sctx.drawImage(canvas, 0, 0, 32, 32);
  const color = dominantColor(sctx.getImageData(0, 0, 32, 32).data);

  return { dataUrl: canvas.toDataURL("image/jpeg", 0.82), color };
}

export function PhotoPicker({ name, color, photoUrl }: { name: string; color: string; photoUrl: string | null }) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      disabled={pending}
      className="relative rounded-full transition active:scale-95 disabled:opacity-60"
      aria-label={t("me.changePhoto")}
    >
      <Avatar name={name} color={color} photoUrl={photoUrl} size={88} />
      <span className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full bg-brand text-white ring-3 ring-grouped">
        <Camera size={16} aria-hidden />
      </span>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          start(async () => {
            try {
              const res = await updatePhoto(await prepare(file));
              if (res.ok) toast.success(t("common.saved"));
              else toast.error(t("common.genericError"));
            } catch {
              toast.error(t("common.genericError"));
            }
          });
        }}
      />
    </button>
  );
}
