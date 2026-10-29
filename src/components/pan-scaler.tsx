"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/fields";
import { PAN_PRESETS, panFactor, type Pan } from "@/lib/pan";

const ROUND: Pan = PAN_PRESETS[3].pan;

function PanPicker({ id, title, value, onChange }: { id: string; title: string; value: Pan; onChange: (p: Pan) => void }) {
  const preset = PAN_PRESETS.findIndex((p) => p.pan.shape === value.shape && p.pan.a === value.a && p.pan.b === value.b);
  const num = (v: string) => { const n = Number(v.replace(",", ".")); return Number.isFinite(n) && n > 0 ? n : 0; };
  return (
    <fieldset className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-p`} className={labelClass}>Molde</label>
        <select id={`${id}-p`} className={inputClass} value={preset >= 0 ? String(preset) : "otro"} onChange={(e) => { if (e.target.value !== "otro") onChange(PAN_PRESETS[Number(e.target.value)].pan); }}>
          {PAN_PRESETS.map((p, i) => <option key={p.label} value={i}>{p.label}</option>)}
          <option value="otro">Otra medida…</option>
        </select>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-s`} className={labelClass}>Forma</label>
          <select id={`${id}-s`} className={inputClass} value={value.shape} onChange={(e) => onChange({ shape: e.target.value as Pan["shape"], a: value.a, b: e.target.value === "round" ? 0 : value.b || value.a })}>
            <option value="round">Redondo</option>
            <option value="rect">Rectangular</option>
          </select>
        </div>
        <div className="flex w-24 flex-col gap-2">
          <label htmlFor={`${id}-a`} className={labelClass}>{value.shape === "round" ? "Diámetro" : "Largo"} (cm)</label>
          <input id={`${id}-a`} inputMode="decimal" className={inputClass} value={value.a || ""} onChange={(e) => onChange({ ...value, a: num(e.target.value) })} />
        </div>
        {value.shape === "rect" && (
          <div className="flex w-24 flex-col gap-2">
            <label htmlFor={`${id}-b`} className={labelClass}>Ancho (cm)</label>
            <input id={`${id}-b`} inputMode="decimal" className={inputClass} value={value.b || ""} onChange={(e) => onChange({ ...value, b: num(e.target.value) })} />
          </div>
        )}
      </div>
    </fieldset>
  );
}

/** Calcula cuánto cambiar la receta al usar otro molde. `onApply(null)` vuelve a las porciones normales. */
export function PanScaler({ active, onApply }: { active: number | null; onApply: (factor: number | null) => void }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState<Pan>(ROUND);
  const [to, setTo] = useState<Pan>(PAN_PRESETS[2].pan);
  const factor = panFactor(from, to);

  return (
    <div className="flex flex-col gap-3">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary underline underline-offset-4">
        {active ? `Escalada por molde (×${Math.round(active * 100) / 100})` : "Cambiar de molde"}
      </button>
      {open && (
        <div className="flex flex-col gap-3 rounded-3xl bg-secondary p-4">
          <p className="text-sm text-muted-foreground">Dime con qué molde se hizo la receta y cuál vas a usar. Ajusto las cantidades según el área.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <PanPicker id="pan-from" title="Molde de la receta" value={from} onChange={setFrom} />
            <PanPicker id="pan-to" title="Tu molde" value={to} onChange={setTo} />
          </div>
          <p role="status" className="font-semibold">
            {factor > 0 ? `Necesitas ${factor >= 1 ? "" : "solo "}${Math.round(factor * 100)} % de la receta (×${Math.round(factor * 100) / 100}).` : "Completa las medidas de los dos moldes."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button disabled={factor <= 0} className="h-11 rounded-2xl px-5" onClick={() => { onApply(factor); setOpen(false); }}>Aplicar</Button>
            {active && <Button variant="outline" className="h-11 rounded-2xl px-5" onClick={() => { onApply(null); setOpen(false); }}>Quitar</Button>}
          </div>
        </div>
      )}
    </div>
  );
}
