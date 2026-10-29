"use client";

import { Check, Gift, Lock } from "lucide-react";
import { describeMods, dayLites } from "@/lib/bakery-events";
import { useBakeryDays } from "@/lib/bakery-sales";
import { eventIcon } from "@/lib/event-icons";
import { activeEvents, criticVisited, goalText, progressOf, upcoming, type EventInstance } from "@/lib/game/events";
import { ALL_ITEMS } from "@/lib/game/shop";
import { useGame } from "@/lib/game/use-game";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

const fmtDay = (ms: number) => new Date(ms).toLocaleDateString("es", { day: "numeric", month: "long" });

function daysLeft(win: { to: number }, now: number) {
  const n = Math.ceil((win.to - now) / 86_400_000);
  return n <= 1 ? "Termina hoy" : `Termina en ${n} días (${fmtDay(win.to - 86_400_000)})`;
}

function EventCard({ e, days, claimed, now }: { e: EventInstance; days: ReturnType<typeof dayLites>; claimed: boolean; now: number }) {
  const Icon = eventIcon(e.def.icon);
  const p = progressOf(e.def, days, e.win);
  const mods = describeMods(e.def.mods);
  const critic = e.def.goal.kind === "critic";
  const visited = critic && criticVisited(days, e.win);
  const items = e.def.reward.items.map((id) => ALL_ITEMS.find((i) => i.id === id)?.name).filter(Boolean);

  return (
    <li className={cn("flex flex-col gap-3 rounded-3xl border bg-card p-5", p.done && "border-primary")}>
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Icon className="size-6" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-xl">{e.def.name}</p>
          <p className="text-sm text-muted-foreground">{e.def.blurb}</p>
          <p className="text-xs font-semibold text-primary">{e.weekly ? "Evento de la semana · " : ""}{daysLeft(e.win, now)}</p>
        </div>
      </div>

      {mods.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {mods.map((m) => <li key={m} className="flex gap-2"><span aria-hidden>•</span> {m}</li>)}
        </ul>
      )}

      <div className="rounded-2xl bg-secondary p-3">
        <div className="flex items-center justify-between gap-2 text-sm font-semibold">
          <span>{goalText(e.def)}</span>
          <span className="tabular-nums">{critic ? (p.done ? "¡Hecho!" : visited ? "Se te escapó" : "Pendiente") : `${Math.min(p.value, p.goal)} de ${p.goal}`}</span>
        </div>
        {!critic && (
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-card" role="progressbar" aria-label="Meta del evento" aria-valuemin={0} aria-valuemax={p.goal} aria-valuenow={Math.min(p.value, p.goal)}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (p.value / p.goal) * 100)}%` }} />
          </div>
        )}
        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <Gift className="size-4 text-primary" aria-hidden />
          Premio: +{e.def.reward.coins} monedas, +{e.def.reward.xp} XP{items.length ? `, ${items.join(" y ")}` : ""}
          {claimed && <span className="flex items-center gap-1 font-semibold text-primary"><Check className="size-4" aria-hidden /> Cobrado</span>}
        </p>
      </div>
    </li>
  );
}

function EventsInner() {
  const days = useBakeryDays();
  const game = useGame();
  if (days === undefined || !game.ready) return null;

  const now = Date.now();
  const lites = dayLites(days);
  const active = activeEvents(now).sort((a, b) => Number(a.weekly) - Number(b.weekly));
  const claimedIds = new Set(game.events.map((e) => e.id));
  const next = upcoming(now, 4);
  const done = game.events.filter((e) => e.id.startsWith("event:"));

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <h1 className="text-4xl">Eventos</h1>
      <p className="text-muted-foreground">
        Las fiestas y la semana te cambian los turnos de venta: llegan más clientes, piden otros postres o paga mejor. Cumple la meta
        del evento para ganar monedas y, en las fiestas, ropa y pegatinas que no se compran.
      </p>

      <section aria-labelledby="ahora" className="flex flex-col gap-3">
        <h2 id="ahora" className="text-2xl">En marcha</h2>
        <ul className="flex flex-col gap-3">
          {active.map((e) => <EventCard key={e.key} e={e} days={lites} claimed={claimedIds.has(`event:${e.key}`)} now={now} />)}
        </ul>
        <p className="text-sm text-muted-foreground">Los efectos se aplican solos cuando abres el local.</p>
      </section>

      <section aria-labelledby="proximas" className="flex flex-col gap-3">
        <h2 id="proximas" className="text-2xl">Próximas fiestas</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {next.map(({ def, start }) => {
            const Icon = eventIcon(def.icon);
            const items = def.reward.items.map((id) => ALL_ITEMS.find((i) => i.id === id)?.name).filter(Boolean);
            return (
              <li key={def.id} className="flex items-start gap-3 rounded-3xl border bg-card p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><Icon className="size-5" aria-hidden /></span>
                <div className="min-w-0">
                  <p className="font-semibold">{def.name}</p>
                  <p className="text-xs text-muted-foreground">Desde el {fmtDay(start)}</p>
                  {items.length > 0 && <p className="mt-1 flex items-center gap-1 text-xs"><Lock className="size-3" aria-hidden /> Premio exclusivo: {items.join(", ")}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {done.length > 0 && (
        <section aria-labelledby="cumplidos" className="flex flex-col gap-3">
          <h2 id="cumplidos" className="text-2xl">Eventos cumplidos ({done.length})</h2>
          <ul className="flex flex-col divide-y rounded-3xl border bg-card">
            {done.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>{e.label.replace("Evento: ", "")} · {fmtDay(e.at)}</span>
                <span className="font-semibold text-primary">+{e.coins} monedas</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function EventsPage() {
  return useIsClient() ? <EventsInner /> : null;
}
