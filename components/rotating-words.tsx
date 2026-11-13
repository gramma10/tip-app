"use client";

import { useEffect, useState } from "react";

/**
 * Cycles through short phrases on a line of its own, so a change of width never reflows the heading.
 * Screen readers get the whole list once instead of a stream of updates.
 */
export function RotatingWords({ words, intervalMs = 2200 }: { words: readonly string[]; intervalMs?: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), intervalMs);
    return () => clearInterval(id);
  }, [words.length, intervalMs]);

  return (
    <span className="block">
      <span className="sr-only">{words.join(" ")}</span>
      <span
        key={index}
        aria-hidden
        className="animate-word-in inline-block bg-clip-text text-transparent"
        style={{ backgroundImage: "linear-gradient(100deg, #3d8bff 0%, #c94f95 90%)" }}
      >
        {words[index]}
      </span>
    </span>
  );
}
