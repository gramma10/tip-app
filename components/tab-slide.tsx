"use client";

import { usePathname } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";

/** Index of the tab a path belongs to. The longest matching href wins, so "/me/card" beats "/me". */
function tabIndex(hrefs: readonly string[], pathname: string) {
  let best = -1;
  hrefs.forEach((href, i) => {
    const match = pathname === href || pathname.startsWith(`${href}/`);
    if (match && (best < 0 || href.length > hrefs[best]!.length)) best = i;
  });
  return best;
}

/**
 * Slides page content in when the tab changes: from the right when moving to a later tab,
 * from the left when moving back. Going deeper inside the same tab just fades.
 */
export function TabSlide({ hrefs, children }: { hrefs: readonly string[]; children: ReactNode }) {
  const pathname = usePathname();
  const [seen, setSeen] = useState({ pathname, from: "0px", animate: false });

  if (seen.pathname !== pathname) {
    const direction = Math.sign(tabIndex(hrefs, pathname) - tabIndex(hrefs, seen.pathname));
    setSeen({ pathname, from: `${direction * 28}px`, animate: true });
  }

  return (
    <div
      key={seen.pathname}
      className={seen.animate ? "animate-tab-in" : undefined}
      style={{ "--tab-from": seen.from } as CSSProperties}
    >
      {children}
    </div>
  );
}
