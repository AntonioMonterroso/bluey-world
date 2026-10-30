"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Bone, Heart } from "lucide-react";
import { MOCHITO } from "@/lib/characters";
import { useProfile } from "@/lib/db/profile";
import { mochitoLine } from "@/lib/mochito";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const DANCE = ["translateY(0px) rotate(-6deg)", "translateY(-12px) rotate(0deg)", "translateY(0px) rotate(6deg)", "translateY(-12px) rotate(0deg)", "translateY(0px) rotate(-6deg)"];

/** ¿Mochito acompaña? (se puede esconder en Ajustes). */
export function useMochitoOn() {
  const { profile } = useProfile();
  return profile.mochito !== false;
}

/** Mochito, el perrito que siempre va junto a tu personaje. Tocarlo = saltito y una frase. */
export function Mochito({ className, style, interactive = true, dance = false, bubble = "left" }: {
  className?: string; style?: React.CSSProperties; interactive?: boolean; dance?: boolean; bubble?: "left" | "right";
}) {
  const on = useMochitoOn();
  const reduce = useReducedMotion();
  const [taps, setTaps] = useState(0);
  const [line, setLine] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (!on) return null;

  const img = <Image src={MOCHITO.src} alt="" width={MOCHITO.w} height={MOCHITO.h} className="h-full w-auto object-contain drop-shadow-sm" />;
  if (!interactive) return <div className={cn("pointer-events-none", className)} style={style} aria-hidden>{img}</div>;

  function pet() {
    setTaps((n) => n + 1);
    setLine(mochitoLine(new Date().getHours(), Math.random()));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLine(null), 4500);
  }

  const Icon = taps % 2 ? Bone : Heart;

  return (
    <div className={cn("relative inline-block", className)} style={style}>
      <motion.button
        type="button"
        aria-label="Acariciar a Mochito"
        onClick={pet}
        style={{ transformOrigin: "50% 100%" }}
        className="h-full cursor-pointer rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        animate={reduce ? undefined : { transform: dance ? DANCE : ["rotate(-2deg)", "rotate(2deg)", "rotate(-2deg)"] }}
        transition={{ duration: dance ? 0.6 : 2.6, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
      >
        <motion.span
          key={taps}
          className="block h-full"
          initial={taps && !reduce ? { transform: "translateY(0px)" } : false}
          animate={{ transform: ["translateY(0px)", "translateY(-18px)", "translateY(0px)"] }}
          transition={{ duration: taps && !reduce ? 0.45 : 0, ease: EASE_OUT }}
        >
          {img}
        </motion.span>
      </motion.button>
      {taps > 0 && (
        <motion.span
          key={`i${taps}`}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 text-primary"
          initial={{ opacity: 1, transform: "translate(-50%, 0px) scale(0.95)" }}
          animate={{ opacity: 0, transform: "translate(-50%, -40px) scale(1.2)" }}
          transition={{ duration: reduce ? 0.4 : 0.8, ease: EASE_OUT }}
        >
          <Icon className="size-6 fill-current" />
        </motion.span>
      )}
      <p role="status" aria-live="polite" className="sr-only">{line ? `Mochito dice: ${line}` : ""}</p>
      {line && (
        <motion.span
          key={line}
          aria-hidden
          className={cn(
            "pointer-events-none absolute bottom-full z-30 mb-2 w-max max-w-44 rounded-2xl bg-card px-3 py-2 text-left text-xs font-semibold leading-snug text-foreground shadow-md",
            bubble === "left" ? "right-1/3 rounded-br-sm" : "left-1/3 rounded-bl-sm",
          )}
          initial={{ opacity: 0, transform: "translateY(6px) scale(0.95)" }}
          animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
        >
          <span className="block text-[10px] text-primary">Mochito</span>
          {line}
        </motion.span>
      )}
    </div>
  );
}
