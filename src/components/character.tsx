"use client";

import { DressedImage } from "@/components/dressed-image";
import { Mochito } from "@/components/mochito";
import { useProfile } from "@/lib/db/profile";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Heart, Music, Music2 } from "lucide-react";
import { getCharacter } from "@/lib/characters";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function Character({
  id,
  className,
  interactive = true,
  priority = false,
  outfit,
  buddy,
}: {
  id: string;
  className?: string;
  interactive?: boolean;
  priority?: boolean;
  outfit?: Record<string, string>; // si no se pasa, usa tu ropa cuando es tu personaje
  buddy?: boolean; // Mochito al lado (por defecto, cuando es tu personaje y se puede tocar)
}) {
  const c = getCharacter(id);
  const reduce = useReducedMotion();
  const [hearts, setHearts] = useState(0);
  const { profile } = useProfile();
  const dress = outfit ?? (id === profile.character ? profile.outfit : undefined);

  const img = <DressedImage char={id} outfit={dress} priority={priority} className="h-full" imgClassName="drop-shadow-sm" />;
  const withBuddy = buddy ?? (interactive && id === profile.character);

  if (!interactive) {
    return withBuddy ? (
      <div className={cn("inline-flex items-end", className)}>
        <div className="h-full">{img}</div>
        <Mochito interactive={false} className="-ml-[6%] h-[46%] shrink-0" />
      </div>
    ) : <div className={className}>{img}</div>;
  }

  const main = (
    <div className={cn("relative inline-block", withBuddy ? "h-full" : className)}>
      <motion.button
        type="button"
        aria-label={`Acariciar a ${c.name}`}
        onClick={() => setHearts((n) => n + 1)}
        className="h-full cursor-pointer rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        animate={
          reduce
            ? undefined
            : { transform: ["translateY(0px)", "translateY(-6px)", "translateY(0px)"] }
        }
        transition={{ duration: 3.2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
        whileTap={{ transform: "translateY(-14px) scale(1.04)" }}
      >
        {img}
      </motion.button>
      {hearts > 0 && (
        <motion.span
          key={hearts}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-4 text-primary"
          initial={{ opacity: 1, transform: "translate(-50%, 0px) scale(0.95)" }}
          animate={{ opacity: 0, transform: "translate(-50%, -48px) scale(1.2)" }}
          transition={{ duration: reduce ? 0.4 : 0.8, ease: EASE_OUT }}
        >
          <Heart className="size-7 fill-current" />
        </motion.span>
      )}
    </div>
  );
  if (!withBuddy) return main;
  return (
    <div className={cn("inline-flex items-end", className)}>
      {main}
      <Mochito className="-ml-[6%] h-[46%] shrink-0" />
    </div>
  );
}

const DANCE_KEYS = [
  "translateY(0px) rotate(-7deg) scale(1, 1)",
  "translateY(-22px) rotate(0deg) scale(0.96, 1.05)",
  "translateY(0px) rotate(7deg) scale(1.04, 0.96)",
  "translateY(-22px) rotate(0deg) scale(0.96, 1.05)",
  "translateY(0px) rotate(-7deg) scale(1, 1)",
];

/** Personaje bailando al ritmo (rebote + vaivén + notas). Tocar = vuelta. */
export function DancingCharacter({ id, className, outfit }: { id: string; className?: string; outfit?: Record<string, string> }) {
  const c = getCharacter(id);
  const reduce = useReducedMotion();
  const [spin, setSpin] = useState(0);
  const { profile } = useProfile();
  const dress = outfit ?? (id === profile.character ? profile.outfit : undefined);
  const withBuddy = id === profile.character;

  const main = (
    <div className={cn("relative inline-block", withBuddy ? "h-full" : className)}>
      {!reduce &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="pointer-events-none absolute top-1/4 text-primary"
            style={{ left: `${12 + i * 36}%` }}
            animate={{
              opacity: [0, 1, 0],
              transform: [
                "translateY(0px) scale(0.95)",
                `translateY(-40px) rotate(${i % 2 ? 12 : -12}deg) scale(1)`,
                `translateY(-90px) rotate(${i % 2 ? 20 : -20}deg) scale(1.05)`,
              ],
            }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            {i === 1 ? <Music2 className="size-8" /> : <Music className="size-7" />}
          </motion.span>
        ))}
      <motion.button
        type="button"
        aria-label={`Hacer bailar a ${c.name}`}
        onClick={() => setSpin((n) => n + 1)}
        style={{ transformOrigin: "50% 100%" }}
        className="h-full cursor-pointer rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        animate={
          reduce
            ? { transform: ["rotate(-2deg)", "rotate(2deg)", "rotate(-2deg)"] }
            : { transform: DANCE_KEYS }
        }
        transition={{ duration: reduce ? 3 : 1.2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
      >
        <motion.span
          key={spin}
          className="block h-full"
          initial={spin ? { transform: "rotate(0deg)" } : false}
          animate={{ transform: "rotate(360deg)" }}
          transition={{ duration: spin && !reduce ? 0.7 : 0, ease: [0.23, 1, 0.32, 1] }}
        >
          <DressedImage char={id} outfit={dress} className="h-full" imgClassName="drop-shadow-sm" />
        </motion.span>
      </motion.button>
    </div>
  );
  if (!withBuddy) return main;
  return (
    <div className={cn("inline-flex items-end", className)}>
      {main}
      <Mochito dance className="-ml-[6%] h-[46%] shrink-0" />
    </div>
  );
}
