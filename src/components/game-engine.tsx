"use client";

import { useEffect, useRef } from "react";
import { Sparkles, Trophy, X } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import { computeAwards } from "@/lib/game/engine";
import { progressAwards } from "@/lib/game/progress";
import { useProgressData } from "@/lib/progress-data";
import { dismissToast, useGameData, useToasts, writeAwards } from "@/lib/game/use-game";

/** Calcula los premios cada vez que cambian tus datos y muestra los avisos. */
export function GameEngine() {
  const data = useGameData();
  const progress = useProgressData();
  const events = useLiveQuery(() => db.game_events.toArray(), []);
  const busy = useRef(false);

  useEffect(() => {
    if (!data || !progress || !events || busy.current) return;
    const now = Date.now();
    const awards = computeAwards(data, events, now);
    const have = new Set([...events.map((e) => e.id), ...awards.map((a) => a.id)]);
    awards.push(...progressAwards(progress, have, now));
    if (!awards.length) return;
    busy.current = true;
    void writeAwards(awards, events).finally(() => {
      busy.current = false;
    });
  }, [data, progress, events]);

  return <Toasts />;
}

function Toasts() {
  const toasts = useToasts();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-3 top-3 z-[60] flex flex-col gap-2 md:inset-x-auto md:right-4 md:w-80">
      {toasts.map((t) => (
        <Toast key={t.id} id={t.id} title={t.title} lines={t.lines} levelUp={t.levelUp} />
      ))}
    </div>
  );
}

function Toast({ id, title, lines, levelUp }: { id: number; title: string; lines: string[]; levelUp: boolean }) {
  useEffect(() => {
    const timer = setTimeout(() => dismissToast(id), levelUp ? 8000 : 5000);
    return () => clearTimeout(timer);
  }, [id, levelUp]);

  return (
    <div role="status" className="pointer-events-auto flex items-start gap-3 rounded-3xl border bg-card p-4 shadow-lg">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        {levelUp ? <Trophy className="size-5" aria-hidden /> : <Sparkles className="size-5" aria-hidden />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-lg leading-tight">{title}</p>
        {lines.map((l) => (
          <p key={l} className="text-sm text-muted-foreground">{l}</p>
        ))}
      </div>
      <button type="button" aria-label="Cerrar aviso" onClick={() => dismissToast(id)} className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent/60">
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
