"use client";

import { useState } from "react";
import { Pencil, PiggyBank, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/fields";
import { dateInput, fromDateInput } from "@/lib/budget";
import type { SavingsGoal } from "@/lib/db/db";
import { addToGoal, leftOf, perMonth, progressOf, removeGoal, saveGoal, useGoals } from "@/lib/goals";
import { useIsClient } from "@/lib/use-is-client";
import { useMoney } from "@/lib/use-money";

const num = (v: string) => { const n = Number(v.replace(",", ".")); return Number.isFinite(n) && n > 0 ? n : 0; };

function GoalForm({ goal, onClose }: { goal: SavingsGoal | null; onClose: () => void }) {
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal ? String(goal.target) : "");
  const [deadline, setDeadline] = useState(goal?.deadline ? dateInput(goal.deadline) : "");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = num(target);
    if (!name.trim() || t <= 0) return;
    await saveGoal({ name: name.trim(), target: t, deadline: deadline ? fromDateInput(deadline) : null }, goal?.id);
    onClose();
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl border-2 border-primary bg-card p-5">
      <h2 className="text-2xl">{goal ? "Editar meta" : "Meta nueva"}</h2>
      <div className="flex flex-col gap-2"><label htmlFor="g-name" className={labelClass}>Qué quieres lograr</label><input id="g-name" required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Batidora nueva" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2"><label htmlFor="g-target" className={labelClass}>Cuánto necesitas</label><input id="g-target" required inputMode="decimal" className={inputClass} value={target} onChange={(e) => setTarget(e.target.value)} /></div>
        <div className="flex flex-col gap-2"><label htmlFor="g-date" className={labelClass}>Para cuándo (opcional)</label><input id="g-date" type="date" className={inputClass} value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" className="h-12 rounded-2xl px-6 text-base">Guardar</Button>
        <Button type="button" variant="outline" className="h-12 rounded-2xl px-6 text-base" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
}

function GoalCard({ g, now, fmt, onEdit }: { g: SavingsGoal; now: number; fmt: (n: number) => string; onEdit: () => void }) {
  const [amount, setAmount] = useState("");
  const pct = Math.round(progressOf(g) * 100);
  const pm = perMonth(g, now);
  const late = !g.done_at && g.deadline !== null && g.deadline < now;
  const a = num(amount);
  return (
    <li className="flex flex-col gap-3 rounded-3xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold"><PiggyBank className="size-5 text-primary" aria-hidden /> {g.name}</p>
        <p className="text-sm font-semibold tabular-nums">{fmt(g.saved)} de {fmt(g.target)}</p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label={`Progreso de ${g.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%`, transition: "width 400ms cubic-bezier(0.23, 1, 0.32, 1)" }} />
      </div>
      <p className="text-sm text-muted-foreground">
        {g.done_at ? "¡Meta cumplida!" : `Faltan ${fmt(leftOf(g))} (${pct} %)`}
        {g.deadline && !g.done_at ? ` · para el ${new Date(g.deadline).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}` : ""}
        {pm !== null ? ` · aparta ${fmt(pm)} al mes` : ""}
        {late ? " · ya pasó la fecha" : ""}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`a-${g.id}`} className="text-xs font-semibold">Monto</label>
          <input id={`a-${g.id}`} inputMode="decimal" className={`${inputClass} w-32`} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <Button disabled={a <= 0} className="h-12 rounded-2xl" onClick={() => { void addToGoal(g, a); setAmount(""); }}>Abonar</Button>
        <Button disabled={a <= 0 || g.saved <= 0} variant="outline" className="h-12 rounded-2xl" onClick={() => { void addToGoal(g, -a); setAmount(""); }}>Retirar</Button>
        <Button variant="outline" className="size-12 rounded-2xl p-0" aria-label={`Editar ${g.name}`} onClick={onEdit}><Pencil aria-hidden /></Button>
        <Button variant="ghost" className="size-12 rounded-2xl p-0" aria-label={`Borrar ${g.name}`} onClick={() => { if (confirm("¿Borrar esta meta?")) void removeGoal(g.id); }}><Trash2 aria-hidden /></Button>
      </div>
    </li>
  );
}

function Inner() {
  const goals = useGoals();
  const fmt = useMoney();
  const [editing, setEditing] = useState<SavingsGoal | "new" | null>(null);
  const now = Date.now();
  if (goals === undefined) return null;
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Metas de ahorro</h1>
        <Button className="h-12 rounded-2xl px-6 text-base" onClick={() => setEditing("new")}><Plus aria-hidden /> Meta nueva</Button>
      </div>
      {editing && <GoalForm key={editing === "new" ? "new" : editing.id} goal={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {goals.length === 0 && !editing ? (
        <p className="rounded-3xl border border-dashed bg-card p-6 text-center text-muted-foreground">Ponle nombre a algo que quieras comprar para tu cocina y ve cuánto llevas ahorrado.</p>
      ) : (
        <ul className="flex flex-col gap-3">{goals.map((g) => <GoalCard key={g.id} g={g} now={now} fmt={fmt} onEdit={() => setEditing(g)} />)}</ul>
      )}
    </div>
  );
}

export function GoalsPage() {
  return useIsClient() ? <Inner /> : null;
}
