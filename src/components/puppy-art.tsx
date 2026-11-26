"use client";

import { cn } from "@/lib/utils";
import type { Friend } from "@/lib/mochito-play";

/** Un perrito del parque, dibujado sencillo con sus colores. `unknown` lo deja en silueta. */
export function PuppyArt({ friend, unknown = false, className }: { friend: Friend; unknown?: boolean; className?: string }) {
  const coat = unknown ? "var(--muted-foreground)" : friend.coat;
  const ear = unknown ? "var(--muted-foreground)" : friend.ear;
  const line = unknown ? "transparent" : "rgb(0 0 0 / 0.35)";
  return (
    <svg viewBox="0 0 80 80" className={cn("h-full w-full overflow-visible", unknown && "opacity-40", className)} aria-hidden>
      <path d="M58 52 Q72 40 68 30" stroke={coat} strokeWidth="6" strokeLinecap="round" fill="none" />
      <ellipse cx="40" cy="56" rx="22" ry="15" fill={coat} stroke={line} strokeWidth="1.5" />
      {friend.spot && !unknown && <ellipse cx="46" cy="54" rx="8" ry="6" fill={friend.spot} />}
      <rect x="22" y="62" width="7" height="14" rx="3.5" fill={coat} stroke={line} strokeWidth="1.5" />
      <rect x="50" y="62" width="7" height="14" rx="3.5" fill={coat} stroke={line} strokeWidth="1.5" />
      <circle cx="30" cy="30" r="17" fill={coat} stroke={line} strokeWidth="1.5" />
      <path d="M15 22 Q8 34 16 42 Q20 34 20 24 Z" fill={ear} />
      <path d="M45 22 Q52 34 44 42 Q40 34 40 24 Z" fill={ear} />
      {!unknown && (
        <>
          {friend.spot && <circle cx="24" cy="26" r="5" fill={friend.spot} />}
          <ellipse cx="30" cy="38" rx="8" ry="6" fill="#fff" opacity="0.6" />
          <circle cx="24" cy="29" r="2.4" fill="#2a211c" />
          <circle cx="36" cy="29" r="2.4" fill="#2a211c" />
          <circle cx="24.8" cy="28.2" r="0.8" fill="#fff" />
          <circle cx="36.8" cy="28.2" r="0.8" fill="#fff" />
          <ellipse cx="30" cy="36" rx="3.2" ry="2.4" fill="#2a211c" />
          <path d="M27 40 Q30 43 33 40" stroke="#2a211c" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
