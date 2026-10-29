"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarClock, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass, textareaClass } from "@/components/ui/fields";
import { dateInput, fromDateInput } from "@/lib/budget";
import type { ClientOrder, OrderStatus } from "@/lib/db/db";
import {
  STATUSES, balanceOf, dueLabel, daysUntil, isOpen, nextStatus, profitOf, removeOrder, saveOrder, setOrderStatus, statusLabel, useOrders,
} from "@/lib/kitchen";
import { useRecipes } from "@/lib/recipes";
import { useIsClient } from "@/lib/use-is-client";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";

const num = (v: string) => { const n = Number(v.replace(",", ".")); return Number.isFinite(n) && n > 0 ? n : 0; };

function OrderForm({ order, onClose }: { order: ClientOrder | null; onClose: () => void }) {
  const recipes = useRecipes();
  const [client, setClient] = useState(order?.client ?? "");
  const [phone, setPhone] = useState(order?.phone ?? "");
  const [item, setItem] = useState(order?.item ?? "");
  const [design, setDesign] = useState(order?.design ?? "");
  const [due, setDue] = useState(dateInput(order?.due ?? Date.now() + 3 * 86_400_000));
  const [price, setPrice] = useState(order ? String(order.price) : "");
  const [deposit, setDeposit] = useState(order && order.deposit ? String(order.deposit) : "");
  const [cost, setCost] = useState(order && order.cost ? String(order.cost) : "");
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "cotizado");
  const [recipeId, setRecipeId] = useState(order?.recipe_id ?? "");
  const [notes, setNotes] = useState(order?.notes ?? "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!client.trim() || !item.trim()) return;
    await saveOrder({
      client: client.trim(), phone: phone.trim(), item: item.trim(), design: design.trim(), due: fromDateInput(due),
      price: num(price), deposit: num(deposit), cost: num(cost), status, recipe_id: recipeId || null, notes: notes.trim(),
    }, order?.id);
    onClose();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl border-2 border-primary bg-card p-5">
      <h2 className="text-2xl">{order ? "Editar pedido" : "Pedido nuevo"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2"><label htmlFor="o-client" className={labelClass}>Cliente</label><input id="o-client" required className={inputClass} value={client} onChange={(e) => setClient(e.target.value)} /></div>
        <div className="flex flex-col gap-2"><label htmlFor="o-phone" className={labelClass}>Teléfono</label><input id="o-phone" inputMode="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      </div>
      <div className="flex flex-col gap-2"><label htmlFor="o-item" className={labelClass}>Qué pidió</label><input id="o-item" required className={inputClass} value={item} onChange={(e) => setItem(e.target.value)} placeholder="Torta de chocolate para 20 personas" /></div>
      <div className="flex flex-col gap-2"><label htmlFor="o-design" className={labelClass}>Diseño y detalles</label><textarea id="o-design" className={textareaClass} value={design} onChange={(e) => setDesign(e.target.value)} placeholder="Colores, mensaje, tema…" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2"><label htmlFor="o-due" className={labelClass}>Fecha de entrega</label><input id="o-due" type="date" required className={inputClass} value={due} onChange={(e) => setDue(e.target.value)} /></div>
        <div className="flex flex-col gap-2">
          <label htmlFor="o-status" className={labelClass}>Estado</label>
          <select id="o-status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>{STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2"><label htmlFor="o-price" className={labelClass}>Precio</label><input id="o-price" inputMode="decimal" className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} /></div>
        <div className="flex flex-col gap-2"><label htmlFor="o-dep" className={labelClass}>Anticipo</label><input id="o-dep" inputMode="decimal" className={inputClass} value={deposit} onChange={(e) => setDeposit(e.target.value)} /></div>
        <div className="flex flex-col gap-2"><label htmlFor="o-cost" className={labelClass}>Costo estimado</label><input id="o-cost" inputMode="decimal" className={inputClass} value={cost} onChange={(e) => setCost(e.target.value)} /></div>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="o-recipe" className={labelClass}>Receta que vas a usar (opcional)</label>
        <select id="o-recipe" className={inputClass} value={recipeId} onChange={(e) => setRecipeId(e.target.value)}>
          <option value="">Ninguna</option>
          {(recipes ?? []).map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-2"><label htmlFor="o-notes" className={labelClass}>Notas</label><textarea id="o-notes" className={textareaClass} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <div className="flex gap-3">
        <Button type="submit" className="h-12 rounded-2xl px-6 text-base">Guardar</Button>
        <Button type="button" variant="outline" className="h-12 rounded-2xl px-6 text-base" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
}

function OrderCard({ o, now, fmt, onEdit }: { o: ClientOrder; now: number; fmt: (n: number) => string; onEdit: () => void }) {
  const next = nextStatus(o.status);
  const left = daysUntil(o.due, now);
  const urgent = isOpen(o) && left <= 1;
  const recipes = useRecipes();
  const recipe = recipes?.find((r) => r.id === o.recipe_id);
  return (
    <li className={cn("flex flex-col gap-3 rounded-3xl border bg-card p-4", urgent && "border-primary")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">{o.client} · {o.item}</p>
          {o.design && <p className="text-sm text-muted-foreground">{o.design}</p>}
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{statusLabel(o.status)}</span>
      </div>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className={cn("flex items-center gap-1 font-semibold", urgent && "text-primary")}><CalendarClock className="size-4" aria-hidden /> {isOpen(o) ? dueLabel(o.due, now) : new Date(o.due).toLocaleDateString("es", { day: "numeric", month: "short" })}</span>
        <span>Precio {fmt(o.price)}</span>
        {isOpen(o) && o.deposit > 0 && <span>Anticipo {fmt(o.deposit)}</span>}
        {isOpen(o) && <span className="font-semibold">Falta cobrar {fmt(balanceOf(o))}</span>}
        {o.cost > 0 && <span className="text-muted-foreground">Ganancia {fmt(profitOf(o))}</span>}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {next && <Button className="h-11 rounded-2xl" onClick={() => void setOrderStatus(o, next)}>Pasar a {statusLabel(next).toLowerCase()}</Button>}
        {recipe && isOpen(o) && <Button asChild variant="outline" className="h-11 rounded-2xl"><Link href={`/cocinar?id=${recipe.id}`}>Cocinar {recipe.title}</Link></Button>}
        {o.phone && <Button asChild variant="outline" className="h-11 rounded-2xl"><a href={`tel:${o.phone}`}><Phone aria-hidden /> Llamar</a></Button>}
        <Button variant="outline" className="h-11 rounded-2xl" onClick={onEdit}><Pencil aria-hidden /> Editar</Button>
        <Button variant="ghost" className="h-11 rounded-2xl" aria-label={`Borrar pedido de ${o.client}`} onClick={() => { if (confirm("¿Borrar este pedido?")) void removeOrder(o.id); }}><Trash2 aria-hidden /></Button>
      </div>
    </li>
  );
}

function Inner() {
  const orders = useOrders();
  const fmt = useMoney();
  const [editing, setEditing] = useState<ClientOrder | "new" | null>(null);
  const [showDone, setShowDone] = useState(false);
  const now = Date.now();

  const { open, done, owed, monthIn } = useMemo(() => {
    const all = orders ?? [];
    const d = new Date();
    const m0 = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    return {
      open: all.filter(isOpen),
      done: all.filter((o) => !isOpen(o)).sort((a, b) => b.due - a.due),
      owed: all.filter(isOpen).reduce((s, o) => s + balanceOf(o), 0),
      monthIn: all.filter((o) => o.status === "pagado" && (o.paid_at ?? 0) >= m0).reduce((s, o) => s + o.price, 0),
    };
  }, [orders]);
  const soon = open.filter((o) => daysUntil(o.due, now) <= 1);

  if (orders === undefined) return null;
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Pedidos</h1>
        <Button className="h-12 rounded-2xl px-6 text-base" onClick={() => setEditing("new")}><Plus aria-hidden /> Pedido nuevo</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {([["Abiertos", String(open.length)], ["Falta cobrar", fmt(owed)], ["Cobrado este mes", fmt(monthIn)]] as const).map(([l, v]) => (
          <div key={l} className="rounded-3xl bg-secondary p-4"><p className="font-heading text-xl sm:text-2xl">{v}</p><p className="text-xs font-semibold text-muted-foreground">{l}</p></div>
        ))}
      </div>

      {soon.length > 0 && (
        <p role="status" className="rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground">
          {soon.length === 1 ? "Tienes 1 pedido" : `Tienes ${soon.length} pedidos`} para hoy o mañana (o atrasados): {soon.map((o) => o.client).join(", ")}.
        </p>
      )}

      {editing && <OrderForm key={editing === "new" ? "new" : editing.id} order={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}

      {open.length === 0 && !editing ? (
        <p className="rounded-3xl border border-dashed bg-card p-6 text-center text-muted-foreground">Nada pendiente. Cuando alguien te pida algo, anótalo aquí con su fecha y su anticipo.</p>
      ) : (
        <ul className="flex flex-col gap-3">{open.map((o) => <OrderCard key={o.id} o={o} now={now} fmt={fmt} onEdit={() => setEditing(o)} />)}</ul>
      )}

      {done.length > 0 && (
        <section className="flex flex-col gap-3">
          <button type="button" aria-expanded={showDone} onClick={() => setShowDone((v) => !v)} className="w-fit text-sm font-semibold text-primary underline underline-offset-4">
            {showDone ? "Ocultar" : "Ver"} pedidos terminados ({done.length})
          </button>
          {showDone && <ul className="flex flex-col gap-3">{done.map((o) => <OrderCard key={o.id} o={o} now={now} fmt={fmt} onEdit={() => setEditing(o)} />)}</ul>}
        </section>
      )}
    </div>
  );
}

export function OrdersPage() {
  return useIsClient() ? <Inner /> : null;
}
