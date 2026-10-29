"use client";

import { useState } from "react";
import { Award, CalendarDays, ChefHat, Coins, Flame, Gamepad2, Lock, Target, Wallet } from "lucide-react";
import { LevelCard } from "@/components/level-card";
import { BADGES, statsOf } from "@/lib/game/engine";
import {
  ALL_WEEK_BONUS, MONTH_REWARD, MORE_BADGES, STREAK_MILESTONES, WEEK_REWARD, bestRun, currentRun, goalStates, measure,
  monthGoals, monthWindow, streakDays, weekGoals, weekWindow, type GoalState, type StreakKind,
} from "@/lib/game/progress";
import { STICKER_ITEMS } from "@/lib/game/shop";
import { useGame, useGameData } from "@/lib/game/use-game";
import { useProgressData } from "@/lib/progress-data";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

const AREA_ICON = { cocina: ChefHat, dinero: Wallet, juego: Gamepad2 } as const;
const STREAKS: { kind: StreakKind; label: string; verb: string }[] = [
  { kind: "cocina", label: "Cocina", verb: "cocinando" },
  { kind: "dinero", label: "Dinero", verb: "anotando tu dinero" },
  { kind: "juego", label: "Juego", verb: "jugando" },
];

function GoalRow({ g, reward }: { g: GoalState; reward: { coins: number } }) {
  const Icon = AREA_ICON[g.area];
  const pct = Math.round((g.have / g.target) * 100);
  return (
    <li className={cn("flex flex-col gap-2 rounded-3xl border bg-card p-4", g.done && "border-primary")}>
      <div className="flex items-center gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", g.done ? "bg-primary text-primary-foreground" : "bg-secondary text-primary")}><Icon className="size-5" aria-hidden /></span>
        <p className="min-w-0 flex-1 font-semibold">{g.label}</p>
        <p className="shrink-0 text-sm font-semibold tabular-nums">{g.done ? "¡Hecho!" : `${g.have} de ${g.target}`}</p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label={g.label} aria-valuemin={0} aria-valuemax={g.target} aria-valuenow={g.have}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%`, transition: "width 400ms cubic-bezier(0.23, 1, 0.32, 1)" }} />
      </div>
      <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Coins className="size-3.5" aria-hidden /> +{reward.coins} monedas al cumplirla</p>
    </li>
  );
}

function LogrosInner() {
  const data = useGameData();
  const progress = useProgressData();
  const g = useGame();
  const [filter, setFilter] = useState<"todas" | "si" | "no">("todas");
  if (!data || !progress || !g.ready) return null;

  const now = Date.now();
  const ids = new Set(g.events.map((e) => e.id));
  const stats = statsOf(data, { bingoLines: g.events.filter((e) => e.id.includes(":line:")).length, fullCards: g.events.filter((e) => e.id.endsWith(":full")).length, level: g.level, events: g.events.filter((e) => e.id.startsWith("event:")).length }, now);
  const w = weekWindow(now);
  const m = monthWindow(now);
  const week = goalStates(weekGoals(now), progress, w.from, w.to);
  const month = goalStates(monthGoals(now), progress, m.from, m.to);
  const daysLeftWeek = Math.ceil((w.to - now) / 86_400_000);
  const daysLeftMonth = Math.ceil((m.to - now) / 86_400_000);

  const allBadges = [
    ...BADGES.map((b) => ({ id: b.id, name: b.name, desc: b.desc, coins: b.coins, group: "Clásicas" })),
    ...MORE_BADGES.map((b) => ({ id: b.id, name: b.name, desc: b.desc, coins: b.coins, group: b.group })),
  ];
  const got = (id: string) => ids.has(`badge:${id}`);
  const shownBadges = allBadges.filter((b) => filter === "todas" || (filter === "si" ? got(b.id) : !got(b.id)));
  const groups = [...new Set(shownBadges.map((b) => b.group))];
  const stickers = STICKER_ITEMS.filter((s) => g.ownedIds.has(s.id));
  const all = { from: 0, to: Number.MAX_SAFE_INTEGER };

  const numbers: { area: string; items: [string, number][] }[] = [
    { area: "Cocina", items: [["Veces que cocinaste", stats.cooks], ["Recetas distintas", stats.recipesCooked], ["Recetas guardadas", stats.recipesCreated]] },
    { area: "Dinero", items: [["Días anotando", measure("moneyDays", progress, all.from, all.to)], ["Ingresos anotados", measure("income", progress, all.from, all.to)], ["Pagos fijos hechos", measure("fixedPaid", progress, all.from, all.to)]] },
    { area: "Juego", items: [["Turnos atendidos", stats.shifts], ["Minijuegos jugados", measure("minis", progress, all.from, all.to)], ["Capítulos leídos", progress.storyDone.length]] },
  ];

  return (
    <div className="flex max-w-4xl flex-col gap-10">
      <h1 className="text-4xl">Logros y metas</h1>
      <LevelCard />

      <section aria-labelledby="rachas" className="flex flex-col gap-3">
        <h2 id="rachas" className="text-2xl">Rachas</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {STREAKS.map((s) => {
            const days = streakDays(s.kind, progress);
            const run = currentRun(days, now);
            const best = bestRun(days);
            const next = STREAK_MILESTONES.find((x) => x.days > run.length);
            return (
              <li key={s.kind} className="flex flex-col gap-2 rounded-3xl border bg-card p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Flame className={cn("size-5", run.length ? "text-primary" : "text-muted-foreground")} aria-hidden /> {s.label}</p>
                <p className="font-heading text-4xl tabular-nums">{run.length}<span className="ml-1 text-base font-normal text-muted-foreground">{run.length === 1 ? "día" : "días"}</span></p>
                <p className="text-xs text-muted-foreground">
                  {run.length === 0 ? `Empieza hoy ${s.verb}.` : run.today ? "Hoy ya cuenta." : `Hoy todavía no: sigue ${s.verb} para no perderla.`}
                  {" "}Mejor: {best}.
                </p>
                {next && <p className="text-xs font-semibold text-primary">A {next.days - run.length} {next.days - run.length === 1 ? "día" : "días"} del premio de {next.days} (+{next.coins})</p>}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="semana" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="semana" className="flex items-center gap-2 text-2xl"><Target className="size-6 text-primary" aria-hidden /> Metas de la semana</h2>
          <p className="text-sm font-semibold text-muted-foreground">{daysLeftWeek === 1 ? "Queda 1 día" : `Quedan ${daysLeftWeek} días`}</p>
        </div>
        <ul className="grid gap-3 md:grid-cols-3">{week.map((x) => <GoalRow key={x.id} g={x} reward={WEEK_REWARD} />)}</ul>
        <p className="text-sm text-muted-foreground">{week.every((x) => x.done) ? "¡Cumpliste las 3! Ya tienes el bono de la semana." : `Si cumples las 3, ganas +${ALL_WEEK_BONUS.coins} monedas extra. Cada lunes salen metas nuevas.`}</p>
      </section>

      <section aria-labelledby="mes" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="mes" className="flex items-center gap-2 text-2xl"><CalendarDays className="size-6 text-primary" aria-hidden /> Metas del mes</h2>
          <p className="text-sm font-semibold text-muted-foreground">{daysLeftMonth === 1 ? "Queda 1 día" : `Quedan ${daysLeftMonth} días`}</p>
        </div>
        <ul className="grid gap-3 md:grid-cols-3">{month.map((x) => <GoalRow key={x.id} g={x} reward={MONTH_REWARD} />)}</ul>
      </section>

      <section aria-labelledby="numeros" className="flex flex-col gap-3">
        <h2 id="numeros" className="text-2xl">Tus números</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {numbers.map((n) => (
            <div key={n.area} className="flex flex-col gap-2 rounded-3xl bg-secondary p-4">
              <p className="text-sm font-semibold">{n.area}</p>
              {n.items.map(([label, v]) => (
                <p key={label} className="flex items-baseline justify-between gap-2 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-heading text-2xl tabular-nums">{v}</span></p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="insignias" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="insignias" className="text-2xl">Insignias ({allBadges.filter((b) => got(b.id)).length} de {allBadges.length})</h2>
          <div className="flex gap-2" role="group" aria-label="Filtrar insignias">
            {([["todas", "Todas"], ["si", "Conseguidas"], ["no", "Por conseguir"]] as const).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} className={cn("min-h-11 rounded-full border-2 px-4 text-sm font-semibold", filter === id ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-card")}>{label}</button>
            ))}
          </div>
        </div>
        {groups.map((grp) => (
          <div key={grp} className="flex flex-col gap-2">
            <h3 className="text-lg">{grp}</h3>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shownBadges.filter((b) => b.group === grp).map((b) => {
                const has = got(b.id);
                return (
                  <li key={b.id} className={cn("flex items-center gap-3 rounded-3xl border p-4", has ? "bg-card" : "bg-muted/50 text-muted-foreground")}>
                    <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-full", has ? "bg-[var(--gold)] text-foreground" : "bg-secondary")}>
                      {has ? <Award className="size-6" aria-hidden /> : <Lock className="size-5" aria-hidden />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold">{b.name}</p>
                      <p className="text-xs">{b.desc}</p>
                      <p className="text-xs font-semibold text-primary">{has ? "¡Conseguida!" : `+${b.coins} monedas`}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="album" className="flex flex-col gap-3">
        <h2 id="album" className="text-2xl">Álbum de pegatinas ({stickers.length} de {STICKER_ITEMS.length})</h2>
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {STICKER_ITEMS.map((s) => {
            const has = g.ownedIds.has(s.id);
            const Icon = s.icon!;
            return (
              <li key={s.id} className={cn("flex aspect-square flex-col items-center justify-center gap-1 rounded-3xl border p-2 text-center", has ? "bg-card text-primary" : "bg-muted/50 text-muted-foreground/50")}>
                {has ? <Icon className="size-8" aria-hidden /> : <Lock className="size-6" aria-hidden />}
                <span className="text-[11px] font-semibold">{has ? s.name : s.event ? "Evento" : "Tienda"}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="historial" className="flex flex-col gap-3">
        <h2 id="historial" className="text-2xl">Últimos puntos</h2>
        <ul className="flex flex-col divide-y rounded-3xl border bg-card">
          {g.events.slice(0, 15).map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="min-w-0 truncate">{e.label}</span>
              <span className="shrink-0 font-semibold tabular-nums text-primary">
                {e.xp ? `+${e.xp} XP` : ""}{e.xp && e.coins ? " · " : ""}{e.coins ? `${e.coins > 0 ? "+" : ""}${e.coins}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function LogrosPage() {
  return useIsClient() ? <LogrosInner /> : null;
}
