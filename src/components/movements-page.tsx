"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ArrowDownCircle, ArrowLeftRight, ArrowUpCircle, Camera, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthSwitch } from "@/components/month-switch";
import { inputClass, labelClass } from "@/components/ui/fields";
import { dateInput, deleteExpense, fromDateInput, monthEnd, monthStart, saveExpense, useExpenses } from "@/lib/budget";
import type { Expense, MoneyKind } from "@/lib/db/db";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, kindOf, totalsOf } from "@/lib/money-core";
import { useAccounts } from "@/lib/money";
import { photoToDataUrl } from "@/lib/recipes";
import { useIsClient } from "@/lib/use-is-client";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";

const noop = () => () => {};
function usePrefillKind(): MoneyKind {
  const v = useSyncExternalStore(noop, () => new URLSearchParams(window.location.search).get("tipo") ?? "", () => "");
  return v === "ingreso" || v === "transferencia" ? v : "gasto";
}

const KINDS: { id: MoneyKind; label: string; icon: typeof ArrowDownCircle }[] = [
  { id: "gasto", label: "Gasto", icon: ArrowDownCircle },
  { id: "ingreso", label: "Ingreso", icon: ArrowUpCircle },
  { id: "transferencia", label: "Transferencia", icon: ArrowLeftRight },
];

function MoveForm({ move, initialKind, onDone }: { move: Expense | null; initialKind: MoneyKind; onDone: () => void }) {
  const accounts = useAccounts();
  const live = (accounts ?? []).filter((a) => !a.archived);
  const [kind, setKind] = useState<MoneyKind>(move ? kindOf(move) : initialKind);
  const [amount, setAmount] = useState(move ? String(move.amount) : "");
  const [date, setDate] = useState(dateInput(move?.date ?? Date.now()));
  const [category, setCategory] = useState(move?.category ?? "");
  const [account, setAccount] = useState(move?.account_id ?? "");
  const [toAccount, setToAccount] = useState(move?.to_account_id ?? "");
  const [note, setNote] = useState(move?.note ?? "");
  const [store, setStore] = useState(move?.store ?? "");
  const [photo, setPhoto] = useState<string | null>(move?.photo ?? null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cats: readonly string[] = kind === "ingreso" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const cat = category && cats.includes(category) ? category : (move && category) || cats[0];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const a = Number(amount.replace(",", "."));
    if (!Number.isFinite(a) || a <= 0) return setError("Pon un monto mayor que cero.");
    if (kind === "transferencia" && (!account || !toAccount || account === toAccount)) return setError("Elige dos cuentas distintas.");
    await saveExpense({
      date: fromDateInput(date), amount: a, kind,
      category: kind === "transferencia" ? "Transferencia" : cat,
      note: note.trim(), store: kind === "gasto" ? store.trim() : "", photo: kind === "gasto" ? photo : null,
      account_id: account || null, to_account_id: kind === "transferencia" ? toAccount || null : null,
      recurring_id: move?.recurring_id ?? null,
    }, move?.id);
    onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl border-2 border-primary bg-card p-5">
      <h2 className="text-2xl">{move ? "Editar movimiento" : "Anotar un movimiento"}</h2>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo de movimiento">
        {KINDS.map((k) => {
          const Icon = k.icon;
          return (
            <button key={k.id} type="button" role="radio" aria-checked={kind === k.id} onClick={() => setKind(k.id)} className={cn("flex min-h-12 items-center gap-2 rounded-full border-2 px-5 font-semibold", kind === k.id ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary")}>
              <Icon className="size-5" aria-hidden /> {k.label}
            </button>
          );
        })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2"><label htmlFor="m-monto" className={labelClass}>Monto</label><input id="m-monto" inputMode="decimal" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
        <div className="flex flex-col gap-2"><label htmlFor="m-fecha" className={labelClass}>Fecha</label><input id="m-fecha" type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} /></div>
        {kind !== "transferencia" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="m-cat" className={labelClass}>Categoría</label>
            <select id="m-cat" className={inputClass} value={cat} onChange={(e) => setCategory(e.target.value)}>
              {move && category && !cats.includes(category) && <option value={category}>{category}</option>}
              {cats.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label htmlFor="m-cuenta" className={labelClass}>{kind === "ingreso" ? "Entra a" : kind === "transferencia" ? "De la cuenta" : "Pagado con"}</label>
          <select id="m-cuenta" className={inputClass} value={account} onChange={(e) => setAccount(e.target.value)}>
            <option value="">{kind === "transferencia" ? "Elige…" : "Sin cuenta"}</option>
            {live.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        {kind === "transferencia" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="m-a" className={labelClass}>A la cuenta</label>
            <select id="m-a" className={inputClass} value={toAccount} onChange={(e) => setToAccount(e.target.value)}>
              <option value="">Elige…</option>
              {live.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}
        {kind === "gasto" && <div className="flex flex-col gap-2"><label htmlFor="m-tienda" className={labelClass}>Dónde (opcional)</label><input id="m-tienda" className={inputClass} value={store} onChange={(e) => setStore(e.target.value)} /></div>}
      </div>
      <div className="flex flex-col gap-2"><label htmlFor="m-nota" className={labelClass}>Nota (opcional)</label><input id="m-nota" className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder={kind === "ingreso" ? "Ej. Quincena de octubre" : kind === "transferencia" ? "Ej. Pago de la tarjeta" : "Ej. Almuerzo con mamá"} /></div>
      {kind === "gasto" && (
        <div className="flex flex-wrap items-center gap-3">
          {photo && <img src={photo} alt="Recibo" className="size-20 rounded-2xl object-cover" />}
          <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={() => fileRef.current?.click()}><Camera aria-hidden /> {photo ? "Cambiar foto del recibo" : "Foto del recibo"}</Button>
          {photo && <Button type="button" variant="ghost" className="h-11 rounded-2xl" onClick={() => setPhoto(null)}>Quitar</Button>}
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await photoToDataUrl(f, 1000)); e.target.value = ""; }} />
        </div>
      )}
      {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" className="h-12 rounded-2xl px-6 text-base">Guardar</Button>
        {move && <Button type="button" variant="outline" className="h-12 rounded-2xl px-6 text-base" onClick={onDone}>Cancelar</Button>}
      </div>
    </form>
  );
}

function Inner() {
  const moves = useExpenses();
  const accounts = useAccounts();
  const fmt = useMoney();
  const initial = usePrefillKind();
  const [month, setMonth] = useState(() => new Date());
  const [editing, setEditing] = useState<Expense | null>(null);
  const [filter, setFilter] = useState<"todos" | MoneyKind>("todos");
  const [q, setQ] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const from = monthStart(month);
  const to = monthEnd(month);
  const inMonth = useMemo(() => (moves ?? []).filter((e) => e.date >= from && e.date < to), [moves, from, to]);
  const totals = useMemo(() => totalsOf(inMonth, from, to), [inMonth, from, to]);
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return inMonth.filter((e) => (filter === "todos" || kindOf(e) === filter) && (!t || `${e.note} ${e.category} ${e.store}`.toLowerCase().includes(t)));
  }, [inMonth, filter, q]);
  const accName = (id?: string | null) => (accounts ?? []).find((a) => a.id === id)?.name;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-4xl">Movimientos</h1>
      <MoveForm key={editing?.id ?? `new-${initial}`} move={editing} initialKind={initial} onDone={() => setEditing(null)} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthSwitch month={month} onChange={setMonth} />
        <p className="text-sm font-semibold tabular-nums">
          <span className="text-primary">+{fmt(totals.income)}</span> · <span>−{fmt(totals.spent)}</span> · <span className={cn(totals.net < 0 && "text-destructive")}>{totals.net < 0 ? "−" : ""}{fmt(Math.abs(totals.net))}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
          {(["todos", "gasto", "ingreso", "transferencia"] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cn("min-h-11 rounded-full border-2 px-4 text-sm font-semibold capitalize", filter === f ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-card")}>{f === "todos" ? "Todos" : f === "gasto" ? "Gastos" : f === "ingreso" ? "Ingresos" : "Transferencias"}</button>
          ))}
        </div>
        <label htmlFor="m-buscar" className="sr-only">Buscar</label>
        <input id="m-buscar" className={`${inputClass} h-11 w-48`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" />
      </div>

      {moves === undefined ? null : shown.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">{inMonth.length === 0 ? "No hay movimientos este mes." : "Nada coincide con tu búsqueda."}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((e) => {
            const k = kindOf(e);
            const sign = k === "ingreso" ? "+" : k === "gasto" ? "−" : "";
            return (
              <li key={e.id} className="flex items-center gap-3 rounded-3xl border bg-card p-3 pr-2">
                {e.photo ? <img src={e.photo} alt="Recibo" className="size-14 shrink-0 rounded-2xl object-cover" /> : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.note || e.category}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.date).toLocaleDateString("es", { day: "numeric", month: "short" })} · {k === "transferencia" ? `${accName(e.account_id) ?? "?"} → ${accName(e.to_account_id) ?? "?"}` : e.category}
                    {k !== "transferencia" && accName(e.account_id) ? ` · ${accName(e.account_id)}` : ""}{e.store ? ` · ${e.store}` : ""}{e.recurring_id ? " · fijo" : ""}
                  </p>
                </div>
                <p className={cn("font-heading text-lg tabular-nums", k === "ingreso" && "text-primary")}>{sign}{fmt(e.amount)}</p>
                <button type="button" aria-label="Editar movimiento" onClick={() => { setEditing(e); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent/60"><Pencil className="size-4" aria-hidden /></button>
                {confirmId === e.id ? (
                  <Button variant="destructive" className="h-11 rounded-2xl" onClick={() => { void deleteExpense(e.id); setConfirmId(null); }}>¿Borrar?</Button>
                ) : (
                  <button type="button" aria-label="Borrar movimiento" onClick={() => setConfirmId(e.id)} className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent/60"><Trash2 className="size-4" aria-hidden /></button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function MovementsPage() {
  return useIsClient() ? <Inner /> : null;
}
