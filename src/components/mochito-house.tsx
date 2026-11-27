"use client";

import { useState } from "react";
import { updateProfile } from "@/lib/db/profile";
import { cn } from "@/lib/utils";

export interface House { style?: string; roof?: string; wall?: string; flowers?: string; sign?: string }

export const HOUSE_STYLES = [
  { id: "clasica", name: "Clásica" },
  { id: "cabana", name: "Cabaña" },
  { id: "castillo", name: "Castillo" },
];
export const HOUSE_COLORS = [
  { id: "rojo", name: "Rojo", hex: "#c8473d" },
  { id: "azul", name: "Azul", hex: "#3f74c4" },
  { id: "verde", name: "Verde", hex: "#4a9a5b" },
  { id: "rosa", name: "Rosa", hex: "#e27aa3" },
  { id: "mostaza", name: "Mostaza", hex: "#d9a53a" },
  { id: "crema", name: "Crema", hex: "#f2e3c6" },
  { id: "madera", name: "Madera", hex: "#a8703f" },
  { id: "lila", name: "Lila", hex: "#9b7fd1" },
];
export const HOUSE_FLOWERS = [
  { id: "", name: "Sin flores" },
  { id: "margaritas", name: "Margaritas" },
  { id: "girasoles", name: "Girasoles" },
  { id: "rosas", name: "Rosas" },
];
const hex = (id: string | undefined, fallback: string) => HOUSE_COLORS.find((c) => c.id === id)?.hex ?? fallback;

/** La casita de Mochito dibujada (100×90). */
export function HouseArt({ house, className }: { house?: House; className?: string }) {
  const style = house?.style ?? "clasica";
  const roof = hex(house?.roof, "#c8473d");
  const wall = hex(house?.wall, "#f2e3c6");
  const sign = (house?.sign ?? "Mochito").slice(0, 14);
  const line = "rgb(0 0 0 / 0.28)";
  const flower = house?.flowers ?? "";
  const petal = flower === "girasoles" ? "#f6c13a" : flower === "rosas" ? "#e0467a" : "#ffffff";
  const center = flower === "girasoles" ? "#7a4a1d" : "#f6c13a";
  return (
    <svg viewBox="0 0 100 90" className={cn("h-full w-full overflow-visible", className)} aria-hidden>
      <rect x="16" y="38" width="68" height="46" fill={wall} stroke={line} strokeWidth="1" />
      {style === "cabana" && [44, 52, 60, 68, 76].map((y) => <path key={y} d={`M16 ${y} H84`} stroke={line} strokeWidth="0.8" />)}
      {style === "castillo" ? (
        <>
          <rect x="10" y="26" width="80" height="14" fill={roof} stroke={line} strokeWidth="1" />
          {[10, 26, 42, 58, 74].map((x) => <rect key={x} x={x} y="18" width="10" height="9" fill={roof} stroke={line} strokeWidth="1" />)}
          <path d="M50 6 V18" stroke={line} strokeWidth="1" />
          <path d="M50 6 L60 9 L50 12 Z" fill="#f6c744" />
        </>
      ) : style === "cabana" ? (
        <path d="M8 42 Q50 6 92 42 Z" fill={roof} stroke={line} strokeWidth="1" />
      ) : (
        <>
          <path d="M8 42 L50 10 L92 42 Z" fill={roof} stroke={line} strokeWidth="1" />
          <path d="M20 40 L50 18 L80 40" stroke="rgb(255 255 255 / 0.35)" strokeWidth="2" fill="none" />
        </>
      )}
      <path d="M38 84 V64 Q50 50 62 64 V84 Z" fill="#3b2a24" />
      <rect x="31" y="44" width="38" height="10" rx="2" fill="#fffaf0" stroke={line} strokeWidth="0.8" />
      <text x="50" y="51.6" textAnchor="middle" fontSize={sign.length > 9 ? 5 : 6.5} fontWeight="700" fill="#5a3b2e">{sign}</text>
      {flower && [12, 22, 78, 88].map((x, i) => (
        <g key={x} transform={`translate(${x} ${84 - (i % 2) * 3})`}>
          <path d="M0 0 V-8" stroke="#3f8a4a" strokeWidth="1.4" />
          {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-11" rx="1.6" ry="3" fill={petal} stroke={line} strokeWidth="0.3" transform={`rotate(${a} 0 -8.5)`} />)}
          <circle cx="0" cy="-8.5" r="1.6" fill={center} />
        </g>
      ))}
    </svg>
  );
}

function Swatches({ label, value, onPick }: { label: string; value?: string; onPick: (id: string) => void }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1 text-xs font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {HOUSE_COLORS.map((c) => (
          <button key={c.id} type="button" aria-label={c.name} aria-pressed={value === c.id} onClick={() => onPick(c.id)} className={cn("size-11 rounded-full border-4 active:scale-[0.97]", value === c.id ? "border-primary" : "border-card shadow")} style={{ background: c.hex }} />
        ))}
      </div>
    </fieldset>
  );
}

/** Decorar la casita: estilo, colores, flores y el letrero con su nombre. Sale en el jardín del paseo y en sus fotos. */
export function HouseDesigner({ house, onLine }: { house?: House; onLine: (s: string) => void }) {
  const [sign, setSign] = useState(house?.sign ?? "Mochito");
  const set = (patch: House) => void updateProfile({ mochito_house: { ...house, ...patch } });
  const chip = (on: boolean) => cn("min-h-11 rounded-full border-2 px-4 text-sm font-semibold active:scale-[0.97]", on ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary");
  return (
    <section aria-labelledby="casita" className="flex flex-col gap-3 rounded-3xl border bg-card p-3">
      <h3 id="casita" className="text-sm font-semibold">Su casita en el jardín</h3>
      <div className="mx-auto h-36 w-40"><HouseArt house={{ ...house, sign }} /></div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Estilo">
        {HOUSE_STYLES.map((s) => <button key={s.id} type="button" role="radio" aria-checked={(house?.style ?? "clasica") === s.id} onClick={() => set({ style: s.id })} className={chip((house?.style ?? "clasica") === s.id)}>{s.name}</button>)}
      </div>
      <Swatches label="Color del techo" value={house?.roof ?? "rojo"} onPick={(roof) => set({ roof })} />
      <Swatches label="Color de las paredes" value={house?.wall ?? "crema"} onPick={(wall) => set({ wall })} />
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Flores">
        {HOUSE_FLOWERS.map((f) => <button key={f.id || "no"} type="button" role="radio" aria-checked={(house?.flowers ?? "") === f.id} onClick={() => set({ flowers: f.id })} className={chip((house?.flowers ?? "") === f.id)}>{f.name}</button>)}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="letrero" className="text-xs font-semibold">Letrero</label>
        <div className="flex gap-2">
          <input id="letrero" value={sign} maxLength={14} onChange={(e) => setSign(e.target.value)} className="h-11 min-w-0 flex-1 rounded-2xl border bg-background px-3 text-base" />
          <button type="button" onClick={() => { set({ sign: sign.trim() || "Mochito" }); onLine("¡Qué bonito letrero! Ahora todos saben que es mi casa."); }} className="min-h-11 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-[0.97]">Guardar</button>
        </div>
      </div>
    </section>
  );
}
