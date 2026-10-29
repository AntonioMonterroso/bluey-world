"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DueRow } from "@/components/due-row";
import { inputClass, labelClass } from "@/components/ui/fields";
import { dateInput, fromDateInput } from "@/lib/budget";
import type { Frequency, Recurring } from "@/lib/db/db";
import { EXPENSE_CATEGORIES, FREQUENCIES, INCOME_CATEGORIES, frequencyLabel, occurrences } from "@/lib/money-core";
import { removeRecurring, saveRecurring, useAccounts, useRecurring } from "@/lib/money";
import { useIsClient } from "@/lib/use-is-client";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";

const num = (v: string) => { const n = Number(v.replace(",", ".")); return Number.isFinite(n) && n > 0 ? n : 0; };

function RecurringForm({ item, onClose }: { item: Recurring | null; onClose: () => void }) {
  const accounts = useAccounts();
  const [kind, setKind] = useState<"gasto" | "ingreso">(item?.kind ?? "gasto");
  const [name, setName] = useState(item?.name ?? "");
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [account, setAccount] = useState(item?.account_id ?? "");
  const [freq, setFreq] = useState<Frequency>(item?.frequency ?? "mensual");
  const [due, setDue] = useState(dateInput(item?.next_due ?? Date.now()));
  const [remind, setRemind] = useState(String(item?.remind_days ?? 3));
  const [note, setNote] = useState(item?.note ?? "");
  const cats: readonly string[] = kind === "ingreso" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const cat = category && cats.includes(category) ? category : cats[0];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const a = num(amount);
    if (!name.trim() || a <= 0) return;
    const next = fromDateInput(due);
    await saveRecurring({
      name: name.trim(), kind, amount: a, category: cat, account_id: account || null, frequency: freq,
      next_due: next, anchor_day: new Date(next).getDate(), active: item?.active ?? true,
      remind_days: Math.max(0, Math.round(Number(remind) || 0)), note: note.trim(),
    }, item?.id);
    onClose();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl border-2 border-primary bg-card p-5">
      <h2 className="text-2xl">{item ? "Editar" : "Pago o ingreso fijo nuevo"}</h2>
      <div className="flex gap-2" role="radiogroup" aria-label="Tipo">
        {(["gasto", "ingreso"] as const).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={cn("min-h-12 rounded-full border-2 px-5 font-semibold", kind === k ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary")}>{k === "gasto" ? "Pago (gasto)" : "Ingreso"}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2"><label htmlFor="r-name" className={labelClass}>Nombre</label><input id="r-name" required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "gasto" ? "Renta, luz, internet…" : "Sueldo, alquiler que cobras…"} /></div>
        <div className="flex flex-col gap-2"><label htmlFor="r-monto" className={labelClass}>Monto</label><input id="r-monto" required inputMode="decimal" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div className="flex flex-col gap-2"><label htmlFor="r-cat" className={labelClass}>Categoría</label><select id="r-cat" className={inputClass} value={cat} onChange={(e) => setCategory(e.target.value)}>{cats.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="flex flex-col gap-2"><label htmlFor="r-cuenta" className={labelClass}>{kind === "gasto" ? "Se paga con" : "Entra a"}</label><select id="r-cuenta" className={inputClass} value={account} onChange={(e) => setAccount(e.target.value)}><option value="">Sin cuenta</option>{(accounts ?? []).filter((a) => !a.archived).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
        <div className="flex flex-col gap-2"><label htmlFor="r-freq" className={labelClass}>Cada cuánto</label><select id="r-freq" className={inputClass} value={freq} onChange={(e) => setFreq(e.target.value as Frequency)}>{FREQUENCIES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></div>
        <div className="flex flex-col gap-2"><label htmlFor="r-due" className={labelClass}>Próxima fecha</label><input id="r-due" type="date" required className={inputClass} value={due} onChange={(e) => setDue(e.target.value)} /></div>
        <div className="flex flex-col gap-2"><label htmlFor="r-rem" className={labelClass}>Avisar con (días de anticipación)</label><input id="r-rem" inputMode="numeric" className={inputClass} value={remind} onChange={(e) => setRemind(e.target.value)} /></div>
        <div className="flex flex-col gap-2"><label htmlFor="r-note" className={labelClass}>Nota (opcional)</label><input id="r-note" className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} /></div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" className="h-12 rounded-2xl px-6 text-base">Guardar</Button>
        <Button type="button" variant="outline" className="h-12 rounded-2xl px-6 text-base" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
}

function Inner() {
  const items = useRecurring();
  const accounts = useAccounts();
  const fmt = useMoney();
  const [editing, setEditing] = useState<Recurring | "new" | null>(null);
  const now = Date.now();
  if (items === undefined) return null;
  const accName = (id: string | null) => (accounts ?? []).find((a) => a.id === id)?.name;
  const active = items.filter((r) => r.active);
  const paused = items.filter((r) => !r.active);
  const monthly = (kind: "gasto" | "ingreso") => active.filter((r) => r.kind === kind).reduce((s, r) => s + r.amount * occurrences({ ...r, next_due: r.next_due }, 0, now + 31 * 86_400_000).length, 0);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Pagos fijos</h1>
        <Button className="h-12 rounded-2xl px-6 text-base" onClick={() => setEditing("new")}><Plus aria-hidden /> Agregar</Button>
      </div>
      <p className="text-muted-foreground">Lo que se repite: renta, luz, internet, suscripciones, cuotas y tu sueldo. Cuando venza, aquí y en el Resumen te aparece para marcarlo como hecho.</p>
      {active.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-secondary p-4"><p className="text-xs font-semibold text-muted-foreground">Pagos de los próximos 30 días</p><p className="font-heading text-2xl tabular-nums">{fmt(monthly("gasto"))}</p></div>
          <div className="rounded-3xl bg-secondary p-4"><p className="text-xs font-semibold text-muted-foreground">Ingresos de los próximos 30 días</p><p className="font-heading text-2xl tabular-nums text-primary">{fmt(monthly("ingreso"))}</p></div>
        </div>
      )}
      {editing && <RecurringForm key={editing === "new" ? "new" : editing.id} item={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}

      {active.length === 0 && !editing ? (
        <p className="rounded-3xl border border-dashed bg-card p-6 text-center text-muted-foreground">Todavía no tienes pagos fijos. Agrega el primero: la renta o el sueldo.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {active.map((r) => (
            <li key={r.id} className="flex flex-col gap-1">
              <DueRow r={r} now={now} accountName={accName(r.account_id)} />
              <div className="flex flex-wrap items-center gap-2 px-2 text-xs text-muted-foreground">
                <span>{frequencyLabel(r.frequency)}</span>
                <button type="button" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary" onClick={() => setEditing(r)}><Pencil className="size-3.5" aria-hidden /> Editar</button>
                <button type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 font-semibold text-primary" onClick={() => void saveRecurring({ ...r, active: false }, r.id)}>Pausar</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {paused.length > 0 && (
        <section aria-labelledby="pausados" className="flex flex-col gap-2">
          <h2 id="pausados" className="text-xl">En pausa</h2>
          <ul className="flex flex-col gap-2">
            {paused.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card px-4 py-3">
                <span className="min-w-0 flex-1 font-semibold">{r.name} <span className="font-normal text-muted-foreground">· {fmt(r.amount)} · {frequencyLabel(r.frequency)}</span></span>
                <Button variant="outline" className="h-11 rounded-2xl" onClick={() => void saveRecurring({ ...r, active: true }, r.id)}>Reactivar</Button>
                <Button variant="ghost" className="size-11 rounded-2xl p-0" aria-label={`Borrar ${r.name}`} onClick={() => { if (confirm("¿Borrar este pago fijo?")) void removeRecurring(r.id); }}><Trash2 aria-hidden /></Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function RecurringPage() {
  return useIsClient() ? <Inner /> : null;
}
