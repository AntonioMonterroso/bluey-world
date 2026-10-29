"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_TWEAK, TWEAK_LIMITS, WEAR_COLORS, parseWear, withTweak, type Tweak } from "@/lib/game/outfit";
import { cn } from "@/lib/utils";

type Axis = "x" | "y" | "s" | "r";
const AXES: { id: Axis; label: string; step: number; unit: string; show: (v: number) => string }[] = [
  { id: "x", label: "Mover a los lados", step: 0.5, unit: "◀ ▶", show: (v) => `${v > 0 ? "+" : ""}${v}` },
  { id: "y", label: "Mover arriba o abajo", step: 0.5, unit: "▲ ▼", show: (v) => `${v > 0 ? "+" : ""}${v}` },
  { id: "s", label: "Tamaño", step: 0.05, unit: "", show: (v) => `${Math.round(v * 100)} %` },
  { id: "r", label: "Girar", step: 1, unit: "°", show: (v) => `${v > 0 ? "+" : ""}${v}°` },
];

/** Colores y ajustes finos de una prenda que ya tienes puesta. `value` es la prenda tal como se guarda. */
export function WearTuner({ name, value, onChange }: { name: string; value: string; onChange: (next: string) => void }) {
  const { tweak } = parseWear(value);
  const changed = JSON.stringify(tweak) !== JSON.stringify(DEFAULT_TWEAK);
  const set = (patch: Partial<Tweak>) => onChange(withTweak(value, patch));

  return (
    <section aria-label={`Personalizar ${name}`} className="flex flex-col gap-4 rounded-3xl border-2 border-primary bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl">Personalizar: {name}</h2>
        <Button variant="outline" disabled={!changed} className="h-11 rounded-2xl" onClick={() => onChange(parseWear(value).id)}><RotateCcw aria-hidden /> Restablecer</Button>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Color</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color de la prenda">
          {WEAR_COLORS.map((c) => {
            const on = (tweak.c ?? null) === c.hex;
            return (
              <button
                key={c.name}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={c.name}
                title={c.name}
                onClick={() => set({ c: c.hex })}
                className={cn("flex size-11 items-center justify-center rounded-full border-2", on ? "border-primary ring-2 ring-primary/40" : "border-border")}
                style={c.hex ? { background: `#${c.hex}` } : { background: "conic-gradient(var(--primary), #fff, var(--primary))" }}
              >
                {!c.hex && <span className="rounded-full bg-card px-1 text-[10px] font-bold">Tema</span>}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">El color cambia la parte principal de la prenda; los detalles blancos o dorados se quedan igual.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {AXES.map((a) => {
          const [lo, hi] = TWEAK_LIMITS[a.id];
          const v = tweak[a.id];
          const nudge = (d: number) => set({ [a.id]: Math.round((v + d) * 100) / 100 } as Partial<Tweak>);
          return (
            <div key={a.id} className="flex flex-col gap-1">
              <label htmlFor={`tune-${a.id}`} className="flex justify-between text-sm font-semibold"><span>{a.label}</span><span className="tabular-nums text-muted-foreground">{a.show(v)}</span></label>
              <div className="flex items-center gap-2">
                <button type="button" aria-label={`${a.label}: menos`} onClick={() => nudge(-a.step)} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-bold">−</button>
                <input id={`tune-${a.id}`} type="range" min={lo} max={hi} step={a.step} value={v} onChange={(e) => set({ [a.id]: Number(e.target.value) } as Partial<Tweak>)} className="h-11 w-full min-w-0 accent-[var(--primary)]" />
                <button type="button" aria-label={`${a.label}: más`} onClick={() => nudge(a.step)} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-bold">+</button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">Cada personaje es distinto: ajusta la prenda hasta que le quede bien. Se guarda con tu look.</p>
    </section>
  );
}
