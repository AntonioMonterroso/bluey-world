"use client";

import { useEffect, useRef, useState } from "react";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/stars";
import { sfx } from "@/lib/sfx";
import { GOLD, inGold, needlePos, ovenQuality, ovenStars } from "@/lib/game/oven";

/** Minijuego "Horno perfecto": saca el postre cuando la aguja pase por la zona dorada. */
export function OvenGame({ name, onDone, onCancel, period }: { name: string; onDone: (quality: number) => void; onCancel: () => void; period?: number }) {
  const [pos, setPos] = useState(0);
  const [stopped, setStopped] = useState<number | null>(null);
  const start = useRef(0);

  useEffect(() => {
    if (stopped !== null) return;
    start.current = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      setPos(needlePos(t - start.current, period));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [stopped, period]);

  function pull() {
    if (stopped !== null) return;
    setStopped(pos);
    sfx(inGold(pos) ? "bake" : "serve");
  }

  const q = stopped !== null ? ovenQuality(stopped) : null;
  const shown = stopped ?? pos;

  return (
    <div role="dialog" aria-modal="true" aria-label="Horno perfecto" className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-foreground/40 p-3 sm:items-center">
      <div className="flex w-full max-w-lg flex-col gap-5 rounded-[2rem] bg-background p-6 shadow-xl">
        <div>
          <h2 className="flex items-center gap-2 text-2xl"><Flame className="size-6 text-primary" aria-hidden /> Horno perfecto</h2>
          <p className="text-sm text-muted-foreground">Horneando {name}. Toca <span className="font-semibold">¡Sacar!</span> cuando la aguja pase por la zona dorada.</p>
        </div>

        <div className="relative h-12 overflow-hidden rounded-full bg-secondary" aria-hidden>
          <div className="absolute inset-y-0 rounded-full bg-amber-200" style={{ left: "26%", width: "50%" }} />
          <div className="absolute inset-y-0 rounded-full bg-amber-400" style={{ left: `${GOLD[0] * 100}%`, width: `${(GOLD[1] - GOLD[0]) * 100}%` }} />
          <div className="absolute inset-y-0 w-1.5 rounded-full bg-primary shadow" style={{ left: `calc(${shown * 100}% - 3px)` }} />
        </div>

        {q === null ? (
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="h-14 flex-1 rounded-2xl text-lg" onClick={pull} autoFocus>¡Sacar!</Button>
            <Button variant="ghost" className="h-14 rounded-2xl px-4" onClick={() => onDone(0.7)}>Hornear sin juego</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4" role="status">
            <p className="flex items-center gap-2 font-heading text-xl">
              {q >= 0.9 ? "¡En su punto!" : q >= 0.65 ? "Quedó bien" : "Se pasó o faltó"} <Stars value={ovenStars(q) * (5 / 3)} />
            </p>
            <p className="text-sm text-muted-foreground">Calidad {Math.round(q * 100)} %: se nota en el precio al que lo vendes.</p>
            <div className="flex gap-3">
              <Button className="h-12 rounded-2xl px-6" onClick={() => onDone(q)}>Sacar la tanda</Button>
              <Button variant="outline" className="h-12 rounded-2xl px-6" onClick={() => setStopped(null)}>Intentar otra vez</Button>
            </div>
          </div>
        )}
        {q === null && <button type="button" onClick={onCancel} className="w-fit text-sm font-semibold text-muted-foreground underline underline-offset-4">Cancelar</button>}
      </div>
    </div>
  );
}
