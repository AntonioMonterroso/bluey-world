"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Bone, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MochitoFigure } from "@/components/mochito-figure";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import { useProfile } from "@/lib/db/profile";
import { mochitoDo } from "@/lib/mochito-actions";
import {
  BONE_ROUNDS, HEAT_LABEL, HEAT_SAYS, RHYTHM_GOOD, RHYTHM_TRAVEL, boneAt, boneDigs, boneDist, boneScore, boneSize, heatOf, judge, rhythmScore, rhythmSong,
  type Heat, type Judge,
} from "@/lib/mochito-life";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

// ---------- Busca el hueso ----------

const HEAT_CLASS: Record<Heat, string> = {
  aqui: "bg-[var(--gold)] text-foreground",
  ardiendo: "bg-red-500 text-white",
  caliente: "bg-orange-400 text-white",
  tibio: "bg-amber-200 text-amber-900",
  frio: "bg-sky-200 text-sky-900",
  congelado: "bg-sky-500 text-white",
};

/** Mochito olfatea el parque: cava donde creas y te dice si está frío o caliente. */
export function BoneGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const { profile } = useProfile();
  const size = boneSize(play.level);
  const max = boneDigs(play.level);
  const [start] = useState(() => { const r = rngFor(play, true); return { r, at: boneAt(r, size) }; });
  const rnd = useRef(start.r);
  const [bone, setBone] = useState(start.at);
  const [dug, setDug] = useState<Record<string, Heat>>({});
  const [scores, setScores] = useState<number[]>([]);
  const [phase, setPhase] = useState<"dig" | "found" | "lost">("dig");
  const [say, setSay] = useState("¡Snif, snif! Ayúdame a encontrar mi hueso.");
  const digs = Object.keys(dug).length;

  const over = scores.length >= BONE_ROUNDS;
  useEffect(() => { if (over) void mochitoDo("game", { game: "Busca el hueso" }); }, [over]);

  useEffect(() => {
    if (phase === "dig" || over) return;
    const t = setTimeout(() => {
      setBone(boneAt(rnd.current, size)); setDug({}); setPhase("dig");
      setSay("¡Otro hueso! Lo escondí en otro lado.");
    }, 1500);
    return () => clearTimeout(t);
  }, [phase, over, size]);

  function dig(r: number, c: number) {
    const key = `${r}-${c}`;
    if (phase !== "dig" || dug[key]) return;
    const heat = heatOf(boneDist({ r, c }, bone));
    const n = digs + 1;
    setDug((d) => ({ ...d, [key]: heat }));
    setSay(HEAT_SAYS[heat]);
    if (heat === "aqui") { sfx("success"); setScores((s) => [...s, boneScore(true, n, max)]); setPhase("found"); return; }
    sfx(heat === "ardiendo" || heat === "caliente" ? "coin" : "click");
    if (n >= max) { sfx("sad"); setScores((s) => [...s, 0]); setPhase("lost"); setSay("Se nos acabaron los hoyos. Estaba ahí, ¿ves?"); }
  }
  function again() {
    rnd.current = rngFor(play, false);
    setBone(boneAt(rnd.current, size)); setDug({}); setScores([]); setPhase("dig"); setSay("¡Snif, snif! Ayúdame a encontrar mi hueso.");
  }

  return (
    <section aria-labelledby="g-hueso" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-hueso" className="text-3xl">Busca el hueso</h2>
      <p className="text-muted-foreground">Mochito escondió su hueso en el parque. Toca dónde cavar: te dice si está frío o caliente. Tienes {max} hoyos por hueso.</p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
        <span>Hueso: <span className="tabular-nums">{Math.min(scores.length + 1, BONE_ROUNDS)} de {BONE_ROUNDS}</span></span>
        <span>Hoyos: <span className="tabular-nums">{digs} de {max}</span></span>
      </div>
      <div className="flex items-end gap-3">
        <span className="h-20 shrink-0"><MochitoFigure outfit={profile.mochito_outfit} /></span>
        <p aria-live="polite" className="mb-2 min-w-0 flex-1 rounded-3xl rounded-bl-md bg-secondary px-4 py-2 text-sm font-semibold">{say}</p>
      </div>
      <div className="grid gap-1.5 rounded-[2rem] bg-emerald-200 p-3 dark:bg-emerald-900" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {Array.from({ length: size * size }, (_, i) => {
          const r = Math.floor(i / size), c = i % size;
          const key = `${r}-${c}`;
          const heat = dug[key];
          const reveal = phase === "lost" && bone.r === r && bone.c === c;
          return (
            <button
              key={`${scores.length}-${key}`}
              type="button"
              disabled={phase !== "dig" || !!heat}
              onClick={() => dig(r, c)}
              aria-label={heat ? `Fila ${r + 1}, columna ${c + 1}: ${HEAT_LABEL[heat]}` : `Cavar en fila ${r + 1}, columna ${c + 1}`}
              className={cn("flex aspect-square min-h-11 items-center justify-center rounded-xl text-[10px] font-bold leading-tight transition-[background-color] duration-150 active:scale-[0.97] sm:text-xs", heat ? HEAT_CLASS[heat] : reveal ? "bg-[var(--gold)]" : "bg-emerald-400/70 hover:bg-emerald-500/70 dark:bg-emerald-700")}
            >
              {heat === "aqui" || reveal ? <Bone className="size-6" aria-hidden /> : heat ? HEAT_LABEL[heat].replace("¡", "").replace("!", "") : null}
            </button>
          );
        })}
      </div>
      {over ? (
        <Result game="hueso" play={play} score={avg(scores)} onAgain={again} onExit={onExit} detail={`Encontraste ${scores.filter((x) => x > 0).length} de ${BONE_ROUNDS} huesos. Mochito dice: «¡Tienes olfato de perrito!»`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}

// ---------- Ritmo de Mochito ----------

const DANCE = ["translateY(0px) rotate(-8deg)", "translateY(-12px) rotate(0deg)", "translateY(0px) rotate(8deg)"];

/** Las patitas bajan al ritmo: toca cuando lleguen a la línea y Mochito baila. */
export function RhythmGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const { profile } = useProfile();
  const reduce = useReducedMotion();
  const [round, setRound] = useState(0);
  const [song, setSong] = useState(() => rhythmSong(rngFor(play, true), play.level));
  const [t, setT] = useState(0);
  const [hits, setHits] = useState<Record<number, Judge>>({});
  const [last, setLast] = useState<{ j: Judge; n: number } | null>(null);
  const [over, setOver] = useState(false);
  const startAt = useRef(0);
  const hitsRef = useRef<Record<number, Judge>>({});

  useEffect(() => {
    startAt.current = performance.now();
    hitsRef.current = {};
    let raf = 0;
    const end = song[song.length - 1] + RHYTHM_GOOD + 600;
    const loop = () => {
      const now = performance.now() - startAt.current;
      let changed = false;
      song.forEach((at, i) => { if (!hitsRef.current[i] && now - at > RHYTHM_GOOD) { hitsRef.current[i] = "miss"; changed = true; } });
      if (changed) setHits({ ...hitsRef.current });
      setT(now);
      if (now >= end) { setOver(true); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [round, song]);

  useEffect(() => { if (over) void mochitoDo("game", { game: "Ritmo de Mochito" }); }, [over]);

  function tap() {
    if (over) return;
    const now = performance.now() - startAt.current;
    let best = -1, bestD = Infinity;
    song.forEach((at, i) => { const d = Math.abs(now - at); if (!hitsRef.current[i] && d < bestD) { best = i; bestD = d; } });
    if (best < 0 || bestD > RHYTHM_GOOD) { sfx("click"); return; }
    const j = judge(now - song[best]);
    hitsRef.current[best] = j;
    setHits({ ...hitsRef.current });
    setLast((l) => ({ j, n: (l?.n ?? 0) + 1 }));
    sfx(j === "perfect" ? "coin" : "click");
  }
  function again() {
    setSong(rhythmSong(rngFor(play, false), play.level));
    setHits({}); setLast(null); setOver(false); setRound((r) => r + 1);
  }

  const vals = Object.values(hits);
  const perfect = vals.filter((v) => v === "perfect").length;
  const good = vals.filter((v) => v === "good").length;
  const miss = vals.filter((v) => v === "miss").length;
  const dancing = last && last.j !== "miss" && !reduce;

  return (
    <section aria-labelledby="g-ritmo" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-ritmo" className="text-3xl">Ritmo de Mochito</h2>
      <p className="text-muted-foreground">Las patitas bajan al ritmo. Toca la pista (o la barra espaciadora) justo cuando lleguen a la línea dorada y Mochito baila.</p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-live="polite">
        <span>¡Perfecto!: <span className="tabular-nums">{perfect}</span></span>
        <span>Bien: <span className="tabular-nums">{good}</span></span>
        <span className="text-destructive">Fallos: <span className="tabular-nums">{miss}</span></span>
        {last && <span className={cn(last.j === "perfect" ? "text-primary" : "text-muted-foreground")}>{last.j === "perfect" ? "¡Perfecto!" : last.j === "good" ? "¡Bien!" : ""}</span>}
      </div>
      <div className="flex items-stretch gap-3">
        <div
          tabIndex={0}
          role="application"
          aria-label="Pista de ritmo. Toca o presiona la barra espaciadora cuando la patita llegue a la línea."
          className="relative h-80 flex-1 touch-none select-none overflow-hidden rounded-[2rem] bg-gradient-to-b from-card to-secondary outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          onPointerDown={tap}
          onKeyDown={(e) => { if (e.key === " " && !e.repeat) { e.preventDefault(); tap(); } }}
        >
          <div className="absolute inset-x-4 bottom-16 h-1.5 rounded-full bg-[var(--gold)]" aria-hidden />
          {song.map((at, i) => {
            const p = 1 - (at - t) / RHYTHM_TRAVEL;
            if (p < -0.05 || p > 1.25 || hits[i] === "perfect" || hits[i] === "good") return null;
            return (
              <span key={i} aria-hidden className={cn("absolute left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full", hits[i] === "miss" ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground")} style={{ top: `calc(${p * 100}% * (1 - 4rem / 20rem))` }}>
                <PawPrint className="size-6" />
              </span>
            );
          })}
        </div>
        <div className="flex w-28 items-end justify-center rounded-[2rem] bg-secondary/60 pb-3 sm:w-36">
          <motion.span
            key={last?.n ?? 0}
            className="block h-28"
            style={{ transformOrigin: "50% 100%" }}
            initial={false}
            animate={dancing ? { transform: [...DANCE, "translateY(0px) rotate(0deg)"] } : undefined}
            transition={{ duration: 0.45, ease: EASE_OUT }}
          >
            <MochitoFigure outfit={profile.mochito_outfit} />
          </motion.span>
        </div>
      </div>
      {over ? (
        <Result game="ritmo" play={play} score={rhythmScore(perfect, good, song.length)} onAgain={again} onExit={onExit} detail={`${perfect} perfectas, ${good} bien y ${miss} fallos de ${song.length} patitas. Mochito dice: «¡Qué buen ritmo tienes!»`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}
