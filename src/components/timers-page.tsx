"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/fields";
import { SOUNDS, playSound } from "@/lib/alarm";
import { updateProfile, useProfile } from "@/lib/db/profile";
import { SOUND_ITEMS, owns } from "@/lib/game/shop";
import { useGame } from "@/lib/game/use-game";
import { createTimer, useNow, useTimers } from "@/lib/timers";
import { TimerCard } from "@/components/timer-card";
import { cn } from "@/lib/utils";

const PRESETS = [1, 5, 10, 15, 20, 30, 45, 60];

export function TimersPage() {
  const timers = useTimers();
  const { profile } = useProfile();
  const [label, setLabel] = useState("");
  const [min, setMin] = useState("10");
  const [sec, setSec] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const now = useNow(!!timers?.some((t) => t.status === "running"));
  const sound = profile.sound ?? "campana";
  const game = useGame();

  async function start(e: React.FormEvent) {
    e.preventDefault();
    const ms = (Math.max(0, Number(min) || 0) * 60 + Math.max(0, Number(sec) || 0)) * 1000;
    if (ms < 1000) return setError("Pon al menos un segundo.");
    setError(null);
    await createTimer({ label, ms });
    setLabel("");
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <h1 className="text-4xl">Temporizadores</h1>

      <form onSubmit={start} className="flex flex-col gap-4 rounded-3xl border bg-card p-5" noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor="etiqueta" className={labelClass}>¿Para qué es?</label>
          <input id="etiqueta" className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} placeholder="Ej. Pastel en el horno" />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Tiempos rápidos">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={min === String(p) && sec === "0"}
              onClick={() => { setMin(String(p)); setSec("0"); }}
              className={cn(
                "min-h-11 rounded-full border-2 px-4 text-sm font-semibold",
                min === String(p) && sec === "0" ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary hover:border-border",
              )}
            >
              {p} min
            </button>
          ))}
        </div>
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="min" className={labelClass}>Minutos</label>
            <input id="min" inputMode="numeric" className={cn(inputClass, "w-24")} value={min} onChange={(e) => setMin(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="sec" className={labelClass}>Segundos</label>
            <input id="sec" inputMode="numeric" className={cn(inputClass, "w-24")} value={sec} onChange={(e) => setSec(e.target.value)} />
          </div>
          <Button type="submit" size="lg" className="h-12 rounded-2xl px-6 text-base">
            <Play aria-hidden /> Iniciar
          </Button>
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
      </form>

      <section aria-labelledby="activos" className="flex flex-col gap-3">
        <h2 id="activos" className="text-2xl">En marcha</h2>
        {timers === undefined ? null : timers.length === 0 ? (
          <p className="text-muted-foreground">No hay temporizadores. Pon uno arriba o desde el paso de una receta.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {timers.map((t) => (
              <li key={t.id}>
                <TimerCard timer={t} now={now} character={profile.character} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-2xl font-heading">Sonido de la alarma</legend>
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Sonido de la alarma">
          {SOUNDS.filter((s) => !game.ready || owns(SOUND_ITEMS.find((i) => i.id === `sound:${s.id}`)!, game.ownedIds) || s.id === sound).map((s) => (
            <div key={s.id} className={cn("flex items-center gap-1 rounded-full border-2 bg-card pl-1", sound === s.id ? "border-primary" : "border-transparent")}>
              <button
                type="button"
                role="radio"
                aria-checked={sound === s.id}
                onClick={() => { void updateProfile({ sound: s.id }); playSound(s.id); }}
                className="min-h-11 rounded-full px-4 text-sm font-semibold"
              >
                {s.name}
              </button>
              <button type="button" aria-label={`Probar ${s.name}`} onClick={() => playSound(s.id)} className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent/60">
                <Volume2 className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
        {game.ready && SOUNDS.some((s) => !owns(SOUND_ITEMS.find((i) => i.id === `sound:${s.id}`)!, game.ownedIds) && s.id !== sound) && (
          <Link href="/tienda" className="flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">
            <Lock className="size-4" aria-hidden /> Más sonidos en la tienda
          </Link>
        )}
        <p className="text-sm text-muted-foreground">
          La alarma suena, vibra y avisa con una notificación. Si cierras la app o bloqueas el teléfono, el navegador puede no
          dejarla sonar hasta que vuelvas: al abrirla, los temporizadores vencidos suenan al instante.
        </p>
      </fieldset>
    </div>
  );
}
