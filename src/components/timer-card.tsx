"use client";

import { Pause, Play, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DancingCharacter } from "@/components/character";
import type { Timer } from "@/lib/db/db";
import { addTime, formatClock, pauseTimer, remainingMs, removeTimer, resumeTimer } from "@/lib/timers";
import { cn } from "@/lib/utils";

export function TimerCard({
  timer,
  now,
  character,
  compact = false,
}: {
  timer: Timer;
  now: number;
  character: string;
  compact?: boolean;
}) {
  const left = remainingMs(timer, now);
  const ringing = timer.status === "ringing";
  const progress = timer.duration_ms ? 1 - left / timer.duration_ms : 1;

  if (ringing) {
    return (
      <div role="alert" className="flex items-center gap-3 overflow-hidden rounded-3xl bg-primary p-3 pr-4 text-primary-foreground">
        <DancingCharacter id={character} className="h-20 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="truncate font-heading text-lg">¡Tiempo! {timer.label}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="h-11 rounded-2xl" onClick={() => void removeTimer(timer.id)}>
              Detener
            </Button>
            <Button variant="secondary" className="h-11 rounded-2xl" onClick={() => void addTime(timer, 5 * 60_000)}>
              +5 min
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-3xl border bg-card", compact ? "p-3" : "p-4")}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{timer.label}</p>
          <p
            className={cn("font-heading tabular-nums", compact ? "text-2xl" : "text-4xl", timer.status === "paused" && "text-muted-foreground")}
            aria-label={`Quedan ${formatClock(left)}`}
          >
            {formatClock(left)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={timer.status === "paused" ? "Reanudar" : "Pausar"}
            onClick={() => void (timer.status === "paused" ? resumeTimer(timer) : pauseTimer(timer))}
            className="flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          >
            {timer.status === "paused" ? <Play className="size-5" aria-hidden /> : <Pause className="size-5" aria-hidden />}
          </button>
          <button
            type="button"
            aria-label="Sumar un minuto"
            onClick={() => void addTime(timer, 60_000)}
            className="flex h-11 items-center justify-center gap-0.5 rounded-full px-3 text-sm font-semibold hover:bg-accent/60"
          >
            <Plus className="size-4" aria-hidden /> 1
          </button>
          <button
            type="button"
            aria-label="Cancelar temporizador"
            onClick={() => void removeTimer(timer.id)}
            className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent/60"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden>
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%`, transition: "width 500ms linear" }} />
      </div>
    </div>
  );
}
