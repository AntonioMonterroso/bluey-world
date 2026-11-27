"use client";

import { useState } from "react";
import { Bone, Check, Droplets, Gamepad2, Gift, Heart, Target } from "lucide-react";
import { Mochito, useMochitoDid, useMochitoOn } from "@/components/mochito";
import { useProfile } from "@/lib/db/profile";
import { dayKey, rng } from "@/lib/game/engine";
import { useGame } from "@/lib/game/use-game";
import { MOOD_LABEL, mochitoSays, mochitoState } from "@/lib/mochito";
import { missionsEventId } from "@/lib/mochito-actions";
import { giftOpened } from "@/lib/mochito-life";
import { EMPTY_STATS, missionProgress, missionsFor, mochitoLevel } from "@/lib/mochito-play";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

function Mini({ value, icon: Icon, label }: { value: number; icon: typeof Heart; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground"><Icon className="size-3 text-primary" aria-hidden /> {label}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Inner() {
  const on = useMochitoOn();
  const { profile } = useProfile();
  const g = useGame();
  const [now] = useState(() => Date.now());
  const did = useMochitoDid(now);
  if (!on) return null;

  const care = profile.mochito_care ?? {};
  const state = mochitoState(care, now);
  const stats = { ...EMPTY_STATS, ...profile.mochito_stats };
  const lvl = mochitoLevel(stats.xp);
  const doneSet = new Set([...(did ?? []), ...(did?.includes("earned") ? ["spent"] : []), ...(giftOpened(profile.mochito_gift, now) ? ["gift"] : [])]);
  const missions = missionsFor(now).map((m) => ({ m, ...missionProgress(m, stats, now, doneSet) }));
  const left = missions.filter((x) => !x.done);
  const claimed = g.events.some((e) => e.id === missionsEventId(now));
  const gift = !giftOpened(profile.mochito_gift, now);
  const phrase = mochitoSays("contento", new Date(now).getHours(), rng(`frase:${dayKey(now)}`)(), { now, birthday: profile.birthday, did });

  return (
    <section aria-labelledby="mochito-inicio" className="flex items-center gap-4 rounded-[2rem] border bg-card p-5">
      <Mochito className="h-28 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 id="mochito-inicio" className="text-xl">Mochito · Nivel {lvl.level}</h2>
          <p className="text-sm text-muted-foreground">Está <span className="font-semibold text-foreground">{MOOD_LABEL[state.mood].toLowerCase()}</span></p>
        </div>
        <p className="rounded-2xl rounded-tl-md bg-secondary px-3 py-2 text-sm leading-snug text-pretty">«{phrase}»</p>
        <div className="flex gap-3">
          <Mini value={state.belly} icon={Bone} label="Barriga" />
          <Mini value={state.love} icon={Heart} label="Cariño" />
          <Mini value={state.fun} icon={Gamepad2} label="Diversión" />
          <Mini value={state.clean} icon={Droplets} label="Limpieza" />
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5", left.length ? "bg-secondary" : "bg-primary text-primary-foreground")}>
            {left.length ? <Target className="size-3.5 text-primary" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
            {left.length ? `Falta: ${left[0].m.text.toLowerCase()}${left.length > 1 ? ` (+${left.length - 1})` : ""}` : claimed ? "Misiones cumplidas" : "¡Misiones listas! Cobra tu premio"}
          </span>
          {gift && <span className="flex items-center gap-1.5 rounded-full bg-[var(--gold)] px-3 py-1.5 text-foreground"><Gift className="size-3.5" aria-hidden /> Tiene un regalo para ti</span>}
        </div>
        <p className="text-xs text-muted-foreground">Tócalo para abrir su rincón.</p>
      </div>
    </section>
  );
}

/** Mochito en el Inicio: su ánimo, sus barras, la misión que falta y su frase del día. */
export function MochitoHomeCard() {
  return useIsClient() ? <Inner /> : null;
}
