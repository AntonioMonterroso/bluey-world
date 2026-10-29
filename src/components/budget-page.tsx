"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MonthSwitch } from "@/components/month-switch";
import { inputClass } from "@/components/ui/fields";
import { EXPENSE_CATEGORIES, monthEnd, monthStart, setBudget, useBudgets, useExpenses } from "@/lib/budget";
import { totalsOf } from "@/lib/money-core";
import { parseQty } from "@/lib/recipes";
import { useIsClient } from "@/lib/use-is-client";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";

function CategoryRow({ category, spent, limit, fmt }: { category: string; spent: number; limit: number | null; fmt: (n: number) => string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(limit ? String(limit) : "");
  const ratio = limit ? spent / limit : 0;
  const state = !limit ? "none" : ratio >= 1 ? "over" : ratio >= 0.8 ? "warn" : "ok";
  return (
    <li className="rounded-3xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{category}</p>
        <p className="text-sm tabular-nums">{fmt(spent)}{limit ? <span className="text-muted-foreground"> de {fmt(limit)}</span> : null}</p>
      </div>
      {limit ? (
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label={`Gastado en ${category}`} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={Math.min(spent, limit)}>
          <div className={cn("h-full rounded-full", state === "over" ? "bg-destructive" : state === "warn" ? "bg-amber-500" : "bg-primary")} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
        </div>
      ) : null}
      {state === "over" && <p className="mt-1 text-xs font-semibold text-destructive">Te pasaste {fmt(spent - limit!)}</p>}
      {state === "warn" && <p className="mt-1 text-xs font-semibold text-amber-700">Vas en {Math.round(ratio * 100)} % del tope</p>}
      <div className="mt-2">
        {editing ? (
          <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); const n = value.trim() ? parseQty(value) : 0; if (n === undefined) return; void setBudget(category, n ?? 0); setEditing(false); }}>
            <label htmlFor={`tope-${category}`} className="sr-only">Tope mensual de {category}</label>
            <input id={`tope-${category}`} inputMode="decimal" className={cn(inputClass, "h-11 w-36")} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Tope al mes" autoFocus />
            <Button type="submit" className="h-11 rounded-2xl">Guardar</Button>
            <Button type="button" variant="ghost" className="h-11 rounded-2xl" onClick={() => setEditing(false)}>Cancelar</Button>
          </form>
        ) : (
          <button type="button" onClick={() => { setValue(limit ? String(limit) : ""); setEditing(true); }} className="min-h-11 text-sm font-semibold text-primary underline underline-offset-4">{limit ? "Cambiar tope" : "Fijar tope mensual"}</button>
        )}
      </div>
    </li>
  );
}

function Inner() {
  const moves = useExpenses();
  const budgets = useBudgets();
  const fmt = useMoney();
  const [month, setMonth] = useState(() => new Date());
  const totals = useMemo(() => (moves ? totalsOf(moves, monthStart(month), monthEnd(month)) : null), [moves, month]);
  if (!totals || !budgets) return null;
  const limitSum = budgets.reduce((s, b) => s + b.limit, 0);
  const extra = Object.keys(totals.byCategory).filter((c) => !(EXPENSE_CATEGORIES as readonly string[]).includes(c));
  const cats = [...EXPENSE_CATEGORIES, ...extra];

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-4xl">Presupuesto</h1>
      <p className="text-muted-foreground">Ponle un tope mensual a cada categoría y mira cuánto llevas. Cuenta lo que anotas como gasto; las transferencias no.</p>
      <MonthSwitch month={month} onChange={setMonth} />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-secondary p-4"><p className="text-xs font-semibold text-muted-foreground">Gastado</p><p className="font-heading text-2xl tabular-nums">{fmt(totals.spent)}</p></div>
        <div className="rounded-3xl bg-secondary p-4"><p className="text-xs font-semibold text-muted-foreground">{limitSum > 0 ? "Suma de topes" : "Topes"}</p><p className="font-heading text-2xl tabular-nums">{limitSum > 0 ? fmt(limitSum) : "Sin topes"}</p></div>
      </div>
      <ul className="flex flex-col gap-3">
        {cats.map((c) => <CategoryRow key={c} category={c} spent={totals.byCategory[c] ?? 0} limit={budgets.find((b) => b.category === c)?.limit ?? null} fmt={fmt} />)}
      </ul>
    </div>
  );
}

export function BudgetPage() {
  return useIsClient() ? <Inner /> : null;
}
