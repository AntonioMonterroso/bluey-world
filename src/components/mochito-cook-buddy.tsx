"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { MochitoFigure } from "@/components/mochito-figure";
import { useProfile } from "@/lib/db/profile";
import { mochitoLog } from "@/lib/mochito-actions";
import { COOK_DONE_LINES, cookBuddyLine } from "@/lib/mochito-life";
import { cn } from "@/lib/utils";

/** Mochito en el modo cocina: te da ánimos en cada paso y celebra al terminar. Se esconde si escondiste a Mochito. */
export function MochitoCookBuddy({ phase, step = 0, total = 0, text = "", recipe, className }: {
  phase: "ing" | "steps" | "finish" | "done"; step?: number; total?: number; text?: string; recipe: string; className?: string;
}) {
  const { profile } = useProfile();
  const reduce = useReducedMotion();
  const logged = useRef(false);
  useEffect(() => {
    if (phase !== "done" || logged.current || profile.mochito === false) return;
    logged.current = true;
    void mochitoLog({ kind: "cooked", recipe });
  }, [phase, recipe, profile.mochito]);
  if (profile.mochito === false) return null;

  const line =
    phase === "ing" ? "Primero juntemos todo. Marca lo que ya tienes en la mesa."
    : phase === "finish" ? "¡Ya casi! Cuéntame cómo quedó y le ponemos estrellitas."
    : phase === "done" ? COOK_DONE_LINES[recipe.length % COOK_DONE_LINES.length]
    : cookBuddyLine(text, step, total);

  return (
    <div className={cn("flex items-end gap-2", className)} aria-live="polite">
      <motion.span
        className="block h-20 shrink-0"
        style={{ transformOrigin: "50% 100%" }}
        animate={reduce ? undefined : phase === "done" ? { transform: ["translateY(0px) rotate(-6deg)", "translateY(-10px) rotate(0deg)", "translateY(0px) rotate(6deg)", "translateY(-10px) rotate(0deg)", "translateY(0px) rotate(-6deg)"] } : { transform: ["rotate(-2deg)", "rotate(2deg)", "rotate(-2deg)"] }}
        transition={{ duration: phase === "done" ? 0.7 : 2.6, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
      >
        <MochitoFigure outfit={profile.mochito_outfit} />
      </motion.span>
      <motion.p
        key={line}
        className="mb-3 min-w-0 flex-1 rounded-3xl rounded-bl-md bg-secondary px-4 py-2 text-sm leading-snug text-pretty"
        initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(4px)" }}
        animate={{ opacity: 1, transform: "translateY(0px)" }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      >
        {line}
      </motion.p>
    </div>
  );
}
