"use client";

import { motion, useReducedMotion } from "motion/react";
import { DressedImage } from "@/components/dressed-image";
import type { Festive } from "@/lib/mochito-life";
import { cn } from "@/lib/utils";

/** Lo que se pone solo en fiestas. Dibujado sobre la cabeza de Mochito (centro 60, arriba 6 en un lienzo de 100×143). */
function FestiveArt({ kind }: { kind: Festive }) {
  const line = "rgb(0 0 0 / 0.25)";
  switch (kind) {
    case "cumple":
    case "anio": {
      const a = kind === "cumple" ? "#f28ab2" : "#f6c744";
      const b = kind === "cumple" ? "#7cc6f2" : "#ffffff";
      return (
        <g transform="rotate(12 60 8)">
          <path d="M60 -24 L47 9 L73 9 Z" fill={a} stroke={line} strokeWidth="0.8" />
          <path d="M55.5 -12 L64.5 -12 L66.5 -5 L53.5 -5 Z" fill={b} />
          <path d="M51.5 1 L68.5 1 L70 5 L50 5 Z" fill={b} />
          <circle cx="60" cy="-25" r="3.6" fill={b} stroke={line} strokeWidth="0.6" />
        </g>
      );
    }
    case "navidad":
      return (
        <g transform="rotate(10 60 8)">
          <path d="M44 8 Q50 -20 74 -14 Q66 -6 76 8 Z" fill="#d23b3b" stroke={line} strokeWidth="0.8" />
          <rect x="42" y="4" width="36" height="7" rx="3.5" fill="#ffffff" stroke={line} strokeWidth="0.6" />
          <circle cx="75" cy="-14" r="4" fill="#ffffff" stroke={line} strokeWidth="0.6" />
        </g>
      );
    case "halloween":
      return (
        <g transform="rotate(-8 60 8)">
          <ellipse cx="60" cy="8" rx="20" ry="4" fill="#4b2a6b" stroke={line} strokeWidth="0.8" />
          <path d="M50 7 L58 -24 Q62 -26 63 -20 L70 7 Z" fill="#5d3585" stroke={line} strokeWidth="0.8" />
          <rect x="50.5" y="2" width="19" height="3.5" fill="#f6a623" />
        </g>
      );
    case "carino":
      return (
        <g>
          <path d="M40 12 Q60 -6 80 12" stroke="#d23b6b" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M60 2 C 53 -4, 50 -10, 55 -13 C 58 -15, 60 -12, 60 -10 C 60 -12, 62 -15, 65 -13 C 70 -10, 67 -4, 60 2 Z" fill="#e2457a" stroke={line} strokeWidth="0.6" />
        </g>
      );
    case "patria":
      return (
        <g>
          <path d="M40 58 Q53 66 66 58 L53 78 Z" fill="#4997d0" stroke={line} strokeWidth="0.8" />
          <path d="M47 61 Q53 64 59 61 L53 70 Z" fill="#ffffff" />
        </g>
      );
  }
}

/** Mochito con su ropa, más lo que se pone solo en fiestas, y con «zzz» cuando duerme. */
export function MochitoFigure({ outfit, festive, sleeping = false, className, children }: {
  outfit?: Record<string, string>; festive?: Festive | null; sleeping?: boolean; className?: string; children?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <span className={cn("relative inline-block h-full", className)}>
      <DressedImage char="mochito" outfit={outfit} alt="" className={cn("h-full transition-[filter] duration-500", sleeping && "brightness-[0.82] saturate-[0.85]")} />
      {festive && (
        <svg viewBox="0 0 100 143" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <FestiveArt kind={festive} />
        </svg>
      )}
      {children}
      {sleeping && (
        <span aria-hidden className="pointer-events-none absolute -top-[6%] right-[-10%] flex flex-col items-start font-heading font-semibold text-primary">
          {["z", "z", "Z"].map((z, i) => (
            <motion.span
              key={i}
              style={{ fontSize: `${0.7 + i * 0.25}em`, marginLeft: `${i * 0.5}em` }}
              initial={{ opacity: 0, transform: "translateY(6px)" }}
              animate={reduce ? { opacity: 0.85 } : { opacity: [0, 1, 0], transform: ["translateY(6px)", "translateY(-4px)", "translateY(-12px)"] }}
              transition={{ duration: 2.4, delay: i * 0.6, repeat: reduce ? 0 : Infinity, ease: [0.45, 0, 0.55, 1] }}
            >
              {z}
            </motion.span>
          ))}
        </span>
      )}
    </span>
  );
}
