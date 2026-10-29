"use client";

import { useState } from "react";
import { Archive, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/fields";
import { useExpenses } from "@/lib/budget";
import type { Account, AccountType } from "@/lib/db/db";
import { ACCOUNT_TYPES, balanceOf, positionOf } from "@/lib/money-core";
import { saveAccount, useAccounts } from "@/lib/money";
import { useIsClient } from "@/lib/use-is-client";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";

const parse = (v: string) => { const n = Number(v.replace(",", ".")); return Number.isFinite(n) ? n : 0; };

function AccountForm({ account, onClose }: { account: Account | null; onClose: () => void }) {
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "banco");
  const [opening, setOpening] = useState(account ? String(account.type === "tarjeta" ? -account.opening : account.opening) : "");
  const [limit, setLimit] = useState(account?.limit ? String(account.limit) : "");
  const card = type === "tarjeta";
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const o = parse(opening);
    await saveAccount({ name: name.trim(), type, opening: card ? -Math.abs(o) : o, limit: card && parse(limit) > 0 ? parse(limit) : null, archived: account?.archived ?? false }, account?.id);
    onClose();
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl border-2 border-primary bg-card p-5">
      <h2 className="text-2xl">{account ? "Editar cuenta" : "Cuenta nueva"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2"><label htmlFor="a-name" className={labelClass}>Nombre</label><input id="a-name" required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Billetera, Banco Industrial, Visa…" /></div>
        <div className="flex flex-col gap-2"><label htmlFor="a-type" className={labelClass}>Tipo</label><select id="a-type" className={inputClass} value={type} onChange={(e) => setType(e.target.value as AccountType)}>{ACCOUNT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
        <div className="flex flex-col gap-2"><label htmlFor="a-open" className={labelClass}>{card ? "Lo que debes hoy" : "Saldo con el que empiezas"}</label><input id="a-open" inputMode="decimal" className={inputClass} value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="0.00" /></div>
        {card && <div className="flex flex-col gap-2"><label htmlFor="a-limit" className={labelClass}>Límite de crédito (opcional)</label><input id="a-limit" inputMode="decimal" className={inputClass} value={limit} onChange={(e) => setLimit(e.target.value)} /></div>}
      </div>
      <p className="text-sm text-muted-foreground">Desde este saldo se suma lo que anotes en Movimientos. Si hoy tienes Q 500 en la billetera, pon 500.</p>
      <div className="flex gap-3">
        <Button type="submit" className="h-12 rounded-2xl px-6 text-base">Guardar</Button>
        <Button type="button" variant="outline" className="h-12 rounded-2xl px-6 text-base" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
}

function Inner() {
  const accounts = useAccounts();
  const moves = useExpenses();
  const fmt = useMoney();
  const [editing, setEditing] = useState<Account | "new" | null>(null);
  if (!accounts || !moves) return null;
  const live = accounts.filter((a) => !a.archived);
  const archived = accounts.filter((a) => a.archived);
  const pos = positionOf(accounts, moves);
  const loose = moves.filter((e) => !e.account_id && (e.kind ?? "gasto") !== "transferencia").length;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Cuentas</h1>
        <Button className="h-12 rounded-2xl px-6 text-base" onClick={() => setEditing("new")}><Plus aria-hidden /> Cuenta nueva</Button>
      </div>
      {live.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-3xl bg-secondary p-4"><p className="text-xs font-semibold text-muted-foreground">Tienes</p><p className="font-heading text-xl tabular-nums sm:text-2xl">{fmt(pos.cash)}</p></div>
          <div className="rounded-3xl bg-secondary p-4"><p className="text-xs font-semibold text-muted-foreground">Debes</p><p className="font-heading text-xl tabular-nums sm:text-2xl">{fmt(pos.debt)}</p></div>
          <div className="rounded-3xl bg-secondary p-4"><p className="text-xs font-semibold text-muted-foreground">Neto</p><p className={cn("font-heading text-xl tabular-nums sm:text-2xl", pos.net < 0 && "text-destructive")}>{pos.net < 0 ? "−" : ""}{fmt(Math.abs(pos.net))}</p></div>
        </div>
      )}
      {editing && <AccountForm key={editing === "new" ? "new" : editing.id} account={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {live.length === 0 && !editing ? (
        <p className="rounded-3xl border border-dashed bg-card p-6 text-center text-muted-foreground">Crea tus cuentas (efectivo, banco, tarjetas) con el saldo de hoy. Así cada gasto e ingreso va sumando o restando donde corresponde.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {live.map((a) => {
            const b = balanceOf(a, moves);
            const card = a.type === "tarjeta";
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-3xl border bg-card p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ACCOUNT_TYPES.find((t) => t.id === a.type)?.label}
                    {card && a.limit ? ` · crédito disponible ${fmt(Math.max(0, a.limit + b))}` : ""}
                  </p>
                </div>
                <p className={cn("font-heading text-xl tabular-nums", b < 0 && "text-destructive")}>{card ? (b < 0 ? `Debes ${fmt(-b)}` : fmt(b)) : `${b < 0 ? "−" : ""}${fmt(Math.abs(b))}`}</p>
                <Button variant="outline" className="size-11 rounded-2xl p-0" aria-label={`Editar ${a.name}`} onClick={() => setEditing(a)}><Pencil aria-hidden /></Button>
                <Button variant="ghost" className="size-11 rounded-2xl p-0" aria-label={`Archivar ${a.name}`} onClick={() => void saveAccount({ name: a.name, type: a.type, opening: a.opening, limit: a.limit, archived: true }, a.id)}><Archive aria-hidden /></Button>
              </li>
            );
          })}
        </ul>
      )}
      {loose > 0 && <p className="rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground">Tienes {loose} {loose === 1 ? "movimiento" : "movimientos"} sin cuenta: no suman ni restan a ningún saldo. Puedes editarlos en Movimientos para asignarles una.</p>}
      {archived.length > 0 && (
        <section aria-labelledby="arch" className="flex flex-col gap-2">
          <h2 id="arch" className="text-xl">Archivadas</h2>
          <ul className="flex flex-col gap-2">
            {archived.map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3">
                <span className="min-w-0 flex-1 font-semibold">{a.name}</span>
                <Button variant="outline" className="h-11 rounded-2xl" onClick={() => void saveAccount({ name: a.name, type: a.type, opening: a.opening, limit: a.limit, archived: false }, a.id)}>Reactivar</Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function AccountsPage() {
  return useIsClient() ? <Inner /> : null;
}
