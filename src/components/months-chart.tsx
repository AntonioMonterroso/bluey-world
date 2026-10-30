"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Month = { from: number; income: number; spent: number; net: number };

/** Lo que entró y lo que gastaste en los últimos meses: dos barras por mes y, al tocar, el detalle. */
export function MonthsChart({ months, fmt }: { months: Month[]; fmt: (n: number) => string }) {
  const [pick, setPick] = useState(months.length - 1);
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.spent]));
  const name = (m: Month, style: "short" | "long") => new Date(m.from).toLocaleDateString("es", { month: style });
  const cur = months[pick];

  return (
    <section aria-labelledby="meses" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="meses" className="text-2xl">Tus últimos meses</h2>
        <div className="flex gap-4 text-sm" aria-hidden>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-primary" /> Te entró</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-foreground/30" /> Gastaste</span>
        </div>
      </div>
      <div className="rounded-3xl bg-card p-4">
        <p className="mb-3 min-h-10 text-sm text-pretty" aria-live="polite">
          <span className="inline-block font-semibold first-letter:uppercase">{name(cur, "long")}</span>: te entraron {fmt(cur.income)} y gastaste {fmt(cur.spent)}.{" "}
          {cur.net >= 0 ? <>Te quedaron <span className="font-semibold">{fmt(cur.net)}</span>.</> : <>Gastaste <span className="font-semibold text-destructive">{fmt(-cur.net)}</span> más de lo que entró.</>}
        </p>
        <ol className="flex h-40 items-end gap-2 border-b border-border" aria-label="Ingresos y gastos por mes">
          {months.map((m, i) => (
            <li key={m.from} className="flex h-full flex-1 flex-col">
              <button
                type="button"
                aria-pressed={pick === i}
                aria-label={`${name(m, "long")}: entró ${fmt(m.income)}, gastaste ${fmt(m.spent)}`}
                onClick={() => setPick(i)}
                onMouseEnter={() => setPick(i)}
                onFocus={() => setPick(i)}
                className={cn("flex h-full w-full items-end justify-center gap-0.5 rounded-t-xl px-1 transition-[background-color] duration-150", pick === i ? "bg-secondary" : "hover:bg-secondary/60")}
              >
                <span className="w-full max-w-5 rounded-t bg-primary" style={{ height: `${(m.income / max) * 100}%`, minHeight: m.income ? 2 : 0 }} />
                <span className="w-full max-w-5 rounded-t bg-foreground/30" style={{ height: `${(m.spent / max) * 100}%`, minHeight: m.spent ? 2 : 0 }} />
              </button>
            </li>
          ))}
        </ol>
        <ol className="mt-1 flex gap-2 text-center text-xs text-muted-foreground" aria-hidden>
          {months.map((m, i) => <li key={m.from} className={cn("flex-1", pick === i && "font-semibold text-foreground")}>{name(m, "short").replace(".", "")}</li>)}
        </ol>
      </div>
    </section>
  );
}
