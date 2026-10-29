"use client";

import { useState } from "react";
import { Check, Hand, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BingoStage } from "@/components/bingo-stage";
import { useIsClient } from "@/lib/use-is-client";
import {
  REWARDS, cardState, challengeById, dayKey, dayStart, lineName, missionState, weekEnd, weekKey, weekStart,
} from "@/lib/game/engine";
import { setMark, useGame, useGameData } from "@/lib/game/use-game";
import { cn } from "@/lib/utils";

const fmtDay = (ms: number) => new Date(ms).toLocaleDateString("es", { day: "numeric", month: "long" });

function BingoInner() {
  const data = useGameData();
  const g = useGame();
  const [selected, setSelected] = useState<number | null>(null);
  if (!data) return null;

  const now = Date.now();
  const ws = weekStart(now);
  const wk = weekKey(now);
  const card = cardState(data, wk, { from: ws, to: weekEnd(ws) });
  const today = dayStart(now);
  const missions = missionState(data, dayKey(now), { from: today, to: today + 86_400_000 });
  const lineCells = new Set(card.doneLines.flatMap((l) => [0, 1, 2, 3, 4].map((i) => (l < 5 ? l * 5 + i : l < 10 ? i * 5 + (l - 5) : l === 10 ? i * 6 : 4 + i * 4))));
  const doneCount = card.cells.filter((c) => c.done).length;
  const sel = selected !== null ? card.cells[selected] : null;
  const selChallenge = sel && !sel.free ? challengeById(sel.id) : null;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-4xl">Bingo en la cocina</h1>
        <p className="mt-1 text-muted-foreground">
          Cartón de la semana · {fmtDay(ws)} al {fmtDay(weekEnd(ws) - 86_400_000)}
        </p>
      </div>

      <section aria-labelledby="carton" className="flex flex-col gap-4">
        <h2 id="carton" className="sr-only">Cartón de la semana</h2>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold">
          <span>{doneCount} de 25 casillas</span>
          <span>{card.doneLines.length} {card.doneLines.length === 1 ? "línea" : "líneas"} de 12</span>
          {card.full && <span className="text-primary">¡Cartón completo!</span>}
        </div>
        <ul className="grid grid-cols-5 gap-1.5">
          {card.cells.map((c, i) => {
            const ch = c.free ? null : challengeById(c.id)!;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setSelected(selected === i ? null : i)}
                  aria-pressed={selected === i}
                  aria-label={c.free ? "Casilla libre" : `${ch!.label}: ${c.done ? "hecho" : "pendiente"}`}
                  className={cn(
                    "relative flex aspect-square w-full flex-col items-center justify-center gap-0.5 rounded-2xl border-2 p-1 text-center text-[11px] font-semibold leading-tight sm:text-xs",
                    c.done ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-card",
                    lineCells.has(i) && "ring-2 ring-offset-2 ring-amber-400",
                    selected === i && "outline outline-2 outline-offset-2 outline-ring",
                  )}
                >
                  {c.free ? (
                    <Star className="size-6 fill-current" aria-hidden />
                  ) : (
                    <>
                      {c.done && <Check className="size-4 shrink-0" aria-hidden />}
                      <span className="line-clamp-4">{ch!.label}</span>
                      {c.manual && !c.done && <Hand className="size-3 shrink-0 text-muted-foreground" aria-hidden />}
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="min-h-20 rounded-3xl border bg-card p-4" aria-live="polite">
          {sel ? (
            sel.free ? (
              <p className="font-semibold">¡Casilla libre! Ya cuenta para tus líneas.</p>
            ) : (
              <div className="flex flex-col items-start gap-2">
                <p className="font-heading text-lg">{selChallenge!.label}</p>
                <p className="text-sm text-muted-foreground">{selChallenge!.detail}</p>
                {sel.manual ? (
                  <Button variant={sel.done ? "outline" : "default"} className="h-11 rounded-2xl" onClick={() => void setMark(wk, sel.id, !sel.done)}>
                    {sel.done ? "Desmarcar" : "Marcar como hecha"}
                  </Button>
                ) : (
                  <p className="text-sm font-semibold">{sel.done ? "Hecho ✓" : "Se marca solo cuando lo hagas en la app."}</p>
                )}
              </div>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Toca una casilla para ver qué pide. Cada línea da +{REWARDS.line.xp} XP y +{REWARDS.line.coins} monedas; el cartón lleno,
              +{REWARDS.full.xp} XP y +{REWARDS.full.coins} monedas.
              {card.doneLines.length > 0 && ` Llevas: ${card.doneLines.map(lineName).join(", ")}.`}
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="misiones" className="flex flex-col gap-3">
        <h2 id="misiones" className="text-2xl">Misiones de hoy</h2>
        <ul className="flex flex-col gap-2">
          {missions.map((m) => {
            const ch = challengeById(m.id)!;
            return (
              <li key={m.id} className={cn("flex items-center gap-3 rounded-2xl border p-3 pr-4", m.done ? "bg-secondary" : "bg-card")}>
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border-2", m.done ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                  {m.done && <Check className="size-4" aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("font-semibold", m.done && "line-through")}>{ch.label}</p>
                  <p className="text-xs text-muted-foreground">{ch.detail}</p>
                </div>
                <p className="shrink-0 text-xs font-semibold text-primary">+{REWARDS.mission.xp} XP · +{REWARDS.mission.coins}</p>
              </li>
            );
          })}
        </ul>
        {g.ready && <p className="text-sm text-muted-foreground">Cambian cada día. Las que completes ayer también cuentan si abres la app hoy.</p>}
      </section>

      <BingoStage />
    </div>
  );
}

export function BingoPage() {
  return useIsClient() ? <BingoInner /> : null;
}
