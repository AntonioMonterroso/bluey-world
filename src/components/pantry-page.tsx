"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pencil, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/fields";
import { addShoppingItem, dateInput, fromDateInput } from "@/lib/budget";
import type { PantryItem } from "@/lib/db/db";
import { PANTRY_UNITS, daysUntil, pantryState, removePantryItem, savePantryItem, usePantry, whatCanICook, type PantryState } from "@/lib/kitchen";
import { formatQty, parseQty, useRecipes } from "@/lib/recipes";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

const BADGE: Record<PantryState, string | null> = { ok: null, poco: "Queda poco", "por-vencer": "Por vencer", vencido: "Vencido" };

function ItemForm({ item, onClose }: { item: PantryItem | null; onClose: () => void }) {
  const [name, setName] = useState(item?.name ?? "");
  const [qty, setQty] = useState(item?.qty != null ? formatQty(item.qty) : "");
  const [unit, setUnit] = useState(item?.unit ?? "g");
  const [expires, setExpires] = useState(item?.expires ? dateInput(item.expires) : "");
  const [min, setMin] = useState(item?.min != null ? formatQty(item.min) : "");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await savePantryItem({ name: name.trim(), qty: qty.trim() ? (parseQty(qty) ?? null) : null, unit, expires: expires ? fromDateInput(expires) : null, min: min.trim() ? (parseQty(min) ?? null) : null }, item?.id);
    onClose();
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl border-2 border-primary bg-card p-5">
      <h2 className="text-2xl">{item ? "Editar" : "Agregar a la despensa"}</h2>
      <div className="flex flex-col gap-2"><label htmlFor="p-name" className={labelClass}>Qué es</label><input id="p-name" required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Harina, mantequilla, huevos…" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2"><label htmlFor="p-qty" className={labelClass}>Cantidad</label><input id="p-qty" inputMode="decimal" className={inputClass} value={qty} onChange={(e) => setQty(e.target.value)} /></div>
        <div className="flex flex-col gap-2"><label htmlFor="p-unit" className={labelClass}>Unidad</label><select id="p-unit" className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value)}>{PANTRY_UNITS.map((u) => <option key={u}>{u}</option>)}</select></div>
        <div className="flex flex-col gap-2"><label htmlFor="p-exp" className={labelClass}>Caduca</label><input id="p-exp" type="date" className={inputClass} value={expires} onChange={(e) => setExpires(e.target.value)} /></div>
        <div className="flex flex-col gap-2"><label htmlFor="p-min" className={labelClass}>Avisar si queda menos de</label><input id="p-min" inputMode="decimal" className={inputClass} value={min} onChange={(e) => setMin(e.target.value)} /></div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" className="h-12 rounded-2xl px-6 text-base">Guardar</Button>
        <Button type="button" variant="outline" className="h-12 rounded-2xl px-6 text-base" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
}

function Inner() {
  const pantry = usePantry();
  const recipes = useRecipes();
  const [editing, setEditing] = useState<PantryItem | "new" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const now = Date.now();

  const cook = useMemo(() => (pantry && recipes ? whatCanICook(recipes, pantry, Date.now()).slice(0, 6) : []), [pantry, recipes]);
  const needs = (pantry ?? []).filter((p) => ["poco", "vencido"].includes(pantryState(p, now)));
  const soon = (pantry ?? []).filter((p) => pantryState(p, now) === "por-vencer");

  async function restock(list: PantryItem[]) {
    for (const p of list) await addShoppingItem(p.name);
    setMessage(`${list.length} ${list.length === 1 ? "cosa agregada" : "cosas agregadas"} a la lista de compras.`);
  }

  if (pantry === undefined) return null;
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Despensa</h1>
        <Button className="h-12 rounded-2xl px-6 text-base" onClick={() => setEditing("new")}><Plus aria-hidden /> Agregar</Button>
      </div>

      {soon.length > 0 && <p role="status" className="rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground">Usa pronto: {soon.map((p) => `${p.name} (${daysUntil(p.expires!, now) === 0 ? "hoy" : `${daysUntil(p.expires!, now)} d`})`).join(", ")}.</p>}
      {editing && <ItemForm key={editing === "new" ? "new" : editing.id} item={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}

      {pantry.length === 0 && !editing ? (
        <p className="rounded-3xl border border-dashed bg-card p-6 text-center text-muted-foreground">Anota lo que tienes en casa y te digo qué puedes cocinar hoy y qué se te va a vencer.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pantry.map((p) => {
            const st = pantryState(p, now);
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-3xl border bg-card p-3 pl-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.qty !== null ? `${p.qty === 0 ? "0" : formatQty(p.qty)} ${p.unit}` : "Sin cantidad"}
                    {p.expires ? ` · caduca ${new Date(p.expires).toLocaleDateString("es", { day: "numeric", month: "short" })}` : ""}
                  </p>
                </div>
                {BADGE[st] && <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", st === "vencido" ? "bg-destructive text-white" : "bg-secondary")}>{BADGE[st]}</span>}
                <Button variant="outline" className="size-11 rounded-2xl p-0" aria-label={`Editar ${p.name}`} onClick={() => setEditing(p)}><Pencil aria-hidden /></Button>
                <Button variant="ghost" className="size-11 rounded-2xl p-0" aria-label={`Quitar ${p.name}`} onClick={() => void removePantryItem(p.id)}><Trash2 aria-hidden /></Button>
              </li>
            );
          })}
        </ul>
      )}

      {needs.length > 0 && (
        <div className="flex flex-col gap-2">
          <Button variant="outline" className="h-12 w-fit rounded-2xl px-5" onClick={() => void restock(needs)}><ShoppingCart aria-hidden /> Pasar a la lista de compras lo que falta ({needs.length})</Button>
        </div>
      )}
      <p role="status" className="min-h-5 text-sm font-semibold text-primary">{message}</p>

      {cook.length > 0 && (
        <section aria-labelledby="hoy" className="flex flex-col gap-3">
          <h2 id="hoy" className="text-2xl">¿Qué puedo cocinar hoy?</h2>
          <ul className="flex flex-col gap-2">
            {cook.map((c) => (
              <li key={c.recipe.id} className="flex flex-col gap-1 rounded-3xl border bg-card p-4">
                <p className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link href={`/cocinar?id=${c.recipe.id}`} className="font-semibold text-primary underline underline-offset-4">{c.recipe.title}</Link>
                  <span className="text-sm font-semibold">{c.missing.length === 0 ? "¡Tienes todo!" : `Tienes ${c.have} de ${c.total}`}</span>
                </p>
                {c.missing.length > 0 && <p className="text-sm text-muted-foreground">Te falta: {c.missing.join(", ")}</p>}
                {c.expiring > 0 && <p className="text-sm font-semibold">Usa algo que está por vencer.</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function PantryPage() {
  return useIsClient() ? <Inner /> : null;
}
