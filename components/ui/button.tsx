import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "brand" | "secondary" | "plain" | "danger";
type Size = "lg" | "md" | "sm";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg",
  brand: "bg-brand text-white",
  secondary: "bg-fill text-ink",
  plain: "bg-transparent text-brand",
  danger: "bg-negative-soft text-negative",
};

const sizes: Record<Size, string> = {
  lg: "h-14 px-6 rounded-[16px] text-headline",
  md: "h-11 px-5 rounded-[12px] text-subhead font-semibold",
  sm: "h-8 px-3.5 rounded-full text-footnote font-semibold",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 select-none whitespace-nowrap",
    "transition-[transform,opacity,background-color] duration-150 ease-out",
    "active:scale-[0.97] active:opacity-90 disabled:opacity-40 disabled:active:scale-100",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClasses(variant, size, className)} {...props} />;
}

export function LinkButton({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
