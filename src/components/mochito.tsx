"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, useReducedMotion } from "motion/react";
import { Gamepad2, Heart, Moon, Smile, UtensilsCrossed } from "lucide-react";
import { DressedImage } from "@/components/dressed-image";
import { MochitoPanel } from "@/components/mochito-panel";
import { MochitoHome } from "@/components/mochito-things";
import { db } from "@/lib/db/db";
import { useProfile } from "@/lib/db/profile";
import type { DidKind } from "@/lib/mochito-lines";
import { useJournal } from "@/lib/journal";
import { useOrders } from "@/lib/kitchen";
import { MOOD_LABEL, mochitoNews, mochitoState, type MochitoMood } from "@/lib/mochito";
import { useRecurring } from "@/lib/money";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/timers";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const DANCE = ["translateY(0px) rotate(-6deg)", "translateY(-12px) rotate(0deg)", "translateY(0px) rotate(6deg)", "translateY(-12px) rotate(0deg)", "translateY(0px) rotate(-6deg)"];
const MOOD_ICON: Record<MochitoMood, typeof Moon> = { sueno: Moon, hambre: UtensilsCrossed, aburrido: Gamepad2, feliz: Heart, contento: Smile };

export { MOCHITO_GOTO, cameFromMochito, goTo, mochitoGameGoto, useClearMochitoGoto, type MochitoGoto } from "@/lib/mochito-goto";

/** ¿Mochito acompaña? (se puede esconder en Ajustes). */
export function useMochitoOn() {
  const { profile } = useProfile();
  return profile.mochito !== false;
}

/** Lo que Mochito te recuerda ahora (temporizadores, pagos, pedidos y diario). */
export function useMochitoNews(now: number) {
  const timers = useTimers();
  const payments = useRecurring();
  const orders = useOrders();
  const journal = useJournal();
  const fmt = useMoney();
  if (!timers || !payments || !orders || !journal || !now) return [];
  return mochitoNews({ timers, payments, orders, journal, fmt }, now);
}

/** Lo que hiciste hoy (cocinar, anotar, diario, pedidos, recetas), para que Mochito lo comente. */
export function useMochitoDid(now: number): DidKind[] | undefined {
  return useLiveQuery(async () => {
    if (!now) return undefined;
    const d = new Date(now);
    const from = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const alive = <T extends { deleted_at?: number | null }>(r: T) => !r.deleted_at;
    const [cooks, money, journal, orders, recipes] = await Promise.all([
      db.cook_log.where("cooked_at").aboveOrEqual(from).toArray(),
      db.expenses.toArray(), db.journal.toArray(), db.client_orders.toArray(), db.recipes.toArray(),
    ]);
    const out: DidKind[] = [];
    if (cooks.some(alive)) out.push("cooked");
    const today = money.filter((e) => alive(e) && e.date >= from);
    if (today.some((e) => (e.kind ?? "gasto") === "gasto")) out.push("spent");
    if (today.some((e) => e.kind === "ingreso")) out.push("earned");
    if (journal.some((j) => alive(j) && j.at >= from)) out.push("wrote");
    if (orders.some((o) => alive(o) && o.status === "entregado" && o.updated_at >= from)) out.push("delivered");
    if (recipes.some((r) => alive(r) && r.created_at >= from)) out.push("recipe");
    return out;
  }, [now]);
}

/** Mochito, el perrito que siempre va junto a tu personaje. Tocarlo abre su rincón: cariños, comida, juego, ropa y avisos. */
export function Mochito({ className, style, interactive = true, dance = false, home = false }: {
  className?: string; style?: React.CSSProperties; interactive?: boolean; dance?: boolean; home?: boolean;
}) {
  const on = useMochitoOn();
  const { profile } = useProfile();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [taps, setTaps] = useState(0);
  const news = useMochitoNews(interactive ? now : 0);

  if (!on) return null;

  const img = <DressedImage char="mochito" outfit={profile.mochito_outfit} alt="" className="h-full" imgClassName="drop-shadow-sm" />;
  if (!interactive) {
    return (
      <div className={cn("pointer-events-none", className)} style={style} aria-hidden>
        {home ? <MochitoHome home={profile.mochito_home}>{img}</MochitoHome> : img}
      </div>
    );
  }

  const state = mochitoState(profile.mochito_care, now);
  const MoodIcon = MOOD_ICON[state.mood];
  const urgent = news.some((n) => n.urgent);
  const badge = news.length > 0;

  return (
    <div className={cn("relative inline-block", className)} style={style}>
      <motion.button
        type="button"
        aria-label={`Abrir el rincón de Mochito. Está ${MOOD_LABEL[state.mood].toLowerCase()}${badge ? `, tiene ${news.length} ${news.length === 1 ? "aviso" : "avisos"}` : ""}`}
        onClick={() => { setNow(Date.now()); setTaps((n) => n + 1); setOpen(true); sfx("click"); }}
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
      <span aria-hidden className={cn("pointer-events-none absolute -top-1 right-0 flex size-6 items-center justify-center rounded-full shadow", badge ? (urgent ? "bg-destructive text-white" : "bg-primary text-primary-foreground") : "bg-card text-primary")}>
        {badge ? <span className="text-[11px] font-bold tabular-nums">{news.length}</span> : <MoodIcon className="size-3.5" />}
      </span>
      <MochitoPanel open={open} onOpenChange={setOpen} now={now} news={news} />
    </div>
  );
}

