"use client";

import { Coins } from "lucide-react";
import { Character } from "@/components/character";
import { useProfile } from "@/lib/db/profile";
import { useGame } from "@/lib/game/use-game";

export function LevelCard() {
  const g = useGame();
  const { profile } = useProfile();
  if (!g.ready) return <div className="h-40 rounded-[2rem] bg-card" aria-hidden />;

  return (
    <section aria-label="Tu nivel" className="flex items-center gap-5 rounded-[2rem] border bg-card p-5">
      <Character id={profile.character} interactive={false} buddy className="h-24 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="font-heading text-2xl">Nivel {g.level} · {g.title}</p>
          <p className="flex items-center gap-1.5 font-semibold text-primary">
            <Coins className="size-5" aria-hidden /> {g.coins} monedas
          </p>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label="Experiencia" aria-valuemin={0} aria-valuemax={g.need} aria-valuenow={g.into}>
          <div className="h-full rounded-full bg-primary" style={{ width: `${(g.into / g.need) * 100}%`, transition: "width 500ms cubic-bezier(0.23, 1, 0.32, 1)" }} />
        </div>
        <p className="text-sm text-muted-foreground">{g.into} de {g.need} XP para el nivel {g.level + 1}</p>
      </div>
    </section>
  );
}
