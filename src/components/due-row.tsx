"use client";

import { useState } from "react";
import { Check, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/fields";
import type { Recurring } from "@/lib/db/db";
import { dueLabel, dueState } from "@/lib/money-core";
import { payRecurring, skipRecurring } from "@/lib/money";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";

const num = (v: string) => { const n = Number(v.replace(",", ".")); return Number.isFinite(n) && n > 0 ? n : 0; };

/** Un pago o ingreso fijo con sus botones: hecho, otro monto, saltar. */
export function DueRow({ r, now, accountName }: { r: Recurring; now: number; accountName?: string }) {
  const fmt = useMoney();
  const [other, setOther] = useState(false);
  const [amount, setAmount] = useState(String(r.amount));
  const state = dueState(r, now);
  const income = r.kind === "ingreso";
  return (
    <div className={cn("flex flex-col gap-2 rounded-3xl border bg-card p-4", state === "atrasado" && "border-destructive", state === "hoy" && "border-primary")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">{r.name}</p>
          <p className="text-xs text-muted-foreground">{r.category}{accountName ? ` · ${accountName}` : ""}</p>
        </div>
        <div className="text-right">
          <p className={cn("font-heading text-xl tabular-nums", income && "text-primary")}>{income ? "+" : "−"}{fmt(r.amount)}</p>
          <p className={cn("text-xs font-semibold", state === "atrasado" ? "text-destructive" : "text-muted-foreground")}>{dueLabel(r.next_due, now)}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {other ? (
          <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); const a = num(amount); if (a > 0) { void payRecurring(r, { amount: a }); setOther(false); } }}>
            <label htmlFor={`m-${r.id}`} className="sr-only">Monto real</label>
            <input id={`m-${r.id}`} inputMode="decimal" className={`${inputClass} h-11 w-32`} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
            <Button type="submit" className="h-11 rounded-2xl"><Check aria-hidden /> {income ? "Cobrado" : "Pagado"}</Button>
            <Button type="button" variant="ghost" className="h-11 rounded-2xl" onClick={() => setOther(false)}>Cancelar</Button>
          </form>
        ) : (
          <>
            <Button className="h-11 rounded-2xl" onClick={() => void payRecurring(r)}><Check aria-hidden /> {income ? "Ya lo cobré" : "Ya lo pagué"}</Button>
            <Button variant="outline" className="h-11 rounded-2xl" onClick={() => setOther(true)}>Otro monto</Button>
            <Button variant="ghost" className="h-11 rounded-2xl" onClick={() => void skipRecurring(r)}><SkipForward aria-hidden /> Saltar</Button>
          </>
        )}
      </div>
    </div>
  );
}
