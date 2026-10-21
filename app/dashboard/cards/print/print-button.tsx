"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ label }: { label: string }) {
  return (
    <Button size="sm" variant="brand" onClick={() => window.print()}>
      <Printer size={15} aria-hidden />
      {label}
    </Button>
  );
}
