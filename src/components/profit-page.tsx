"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Stars } from "@/components/stars";
import { useBakeryDays } from "@/lib/bakery-sales";
import { useMenu } from "@/lib/bakery";
import { dayKey, dayStart, weekStart } from "@/lib/game/engine";
import { reputationOf } from "@/lib/game/sales";
import { useIsClient } from "@/lib/use-is-client";
import { useMoney } from "@/lib/use-money";

function ProfitInner() {
  const days = useBakeryDays();
  const menu = useMenu();
  const fmt = useMoney();

  const data = useMemo(() => {
    const list = days ?? [];
    const sum = (rows: typeof list) => ({
      shifts: rows.length,
      served: rows.reduce((n, d) => n + d.served, 0),
      lost: rows.reduce((n, d) => n + d.lost, 0),
      sales: rows.reduce((n, d) => n + d.sales + d.tips, 0),
      cost: rows.reduce((n, d) => n + d.cost, 0),
      coins: rows.reduce((n, d) => n + d.coins, 0),
    });
    const ws = weekStart(Date.now());
    const week = list.filter((d) => d.at >= ws);
    // Ganancia por día de los últimos 7 días
    const today = dayStart(Date.now());
    const bars = Array.from({ length: 7 }, (_, i) => {
      const t = new Date(new Date(today).getFullYear(), new Date(today).getMonth(), new Date(today).getDate() - (6 - i)).getTime();
      const rows = list.filter((d) => dayKey(d.at) === dayKey(t));
      return { t, profit: rows.reduce((n, d) => n + d.sales + d.tips - d.cost, 0) };
    });
    const sold = new Map<string, number>();
    for (const d of list) for (const [id, n] of Object.entries(d.items)) sold.set(id, (sold.get(id) ?? 0) + n);
    const best = [...sold.entries()].sort((a, b) => b[1] - a[1])[0];
    return { all: sum(list), week: sum(week), bars, best, list };
  }, [days]);

  if (days === undefined || menu === undefined) return null;

  const maxBar = Math.max(1, ...data.bars.map((b) => Math.abs(b.profit)));
  const bestName = data.best ? (menu.find((m) => m.id === data.best![0])?.name ?? "Postre") : null;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <h1 className="text-4xl">Ganancias</h1>

      {days.length === 0 ? (
        <p className="rounded-3xl border border-dashed bg-card p-6 text-muted-foreground">
          Todavía no has atendido ningún turno. <Link href="/pasteleria/vender" className="font-semibold text-primary underline underline-offset-4">Abrir el local</Link>
        </p>
      ) : (
        <>
          <section aria-labelledby="semana" className="flex flex-col gap-3">
            <h2 id="semana" className="text-2xl">Esta semana</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([
                ["Turnos", String(data.week.shifts)],
                ["Ventas", fmt(data.week.sales)],
                ["Ganancia", fmt(data.week.sales - data.week.cost)],
                ["Clientes", String(data.week.served)],
              ] as const).map(([l, v]) => (
                <div key={l} className="rounded-3xl bg-secondary p-4">
                  <p className="font-heading text-2xl">{v}</p>
                  <p className="text-xs font-semibold text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="dias" className="flex flex-col gap-3">
            <h2 id="dias" className="text-2xl">Últimos 7 días</h2>
            <ul className="flex h-40 items-end gap-2 rounded-3xl border bg-card p-4" aria-label="Ganancia por día">
              {data.bars.map((b) => (
                <li key={b.t} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">{b.profit ? Math.round(b.profit) : ""}</span>
                  <span className="w-full rounded-t-lg bg-primary" style={{ height: `${(Math.abs(b.profit) / maxBar) * 100}%`, minHeight: b.profit ? 4 : 0 }} />
                  <span className="text-[10px] capitalize text-muted-foreground">{new Date(b.t).toLocaleDateString("es", { weekday: "short" })}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="total" className="flex flex-col gap-3">
            <h2 id="total" className="text-2xl">En total</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-secondary p-4">
                <p className="text-xs font-semibold text-muted-foreground">Ganancia estimada</p>
                <p className="font-heading text-3xl">{fmt(data.all.sales - data.all.cost)}</p>
                <p className="text-xs text-muted-foreground">{fmt(data.all.sales)} de ventas y propinas menos {fmt(data.all.cost)} de costo</p>
              </div>
              <div className="flex flex-col justify-center gap-2 rounded-3xl bg-secondary p-4">
                <p className="text-xs font-semibold text-muted-foreground">Reputación</p>
                <Stars value={reputationOf(days)} />
                <p className="text-sm">{data.all.served} clientes atendidos · {data.all.lost} {data.all.lost === 1 ? "se fue" : "se fueron"}</p>
                {bestName && <p className="text-sm">El más vendido: <span className="font-semibold">{bestName}</span> ({data.best![1]})</p>}
                <p className="text-sm">{data.all.coins} monedas ganadas vendiendo</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="turnos" className="flex flex-col gap-3">
            <h2 id="turnos" className="text-2xl">Tus turnos</h2>
            <ul className="flex flex-col divide-y rounded-3xl border bg-card">
              {data.list.slice(0, 12).map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm">
                  <span className="font-semibold capitalize">{new Date(d.at).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" })} · {new Date(d.at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="text-muted-foreground">{d.served} clientes · {d.lost} {d.lost === 1 ? "se fue" : "se fueron"}</span>
                  <span className="font-semibold tabular-nums">{fmt(d.sales + d.tips - d.cost)}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      <p className="text-xs text-muted-foreground">
        La ganancia resta el costo estimado de cada postre: el costo real por porción de tu receta si ya guardaste los precios del súper, o un porcentaje del precio si no.
      </p>
    </div>
  );
}

export function ProfitPage() {
  return useIsClient() ? <ProfitInner /> : null;
}
