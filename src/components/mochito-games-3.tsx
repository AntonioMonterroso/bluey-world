"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUp, Hand, MoveVertical, RotateCw, Armchair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DressedImage } from "@/components/dressed-image";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import { useProfile } from "@/lib/db/profile";
import { mochitoDo } from "@/lib/mochito-actions";
import { TRICK_MOVES } from "@/lib/mochito-moves";
import {
  JUMP_MS, OBSTACLES, RUN_MS, RUN_X, SIMON_MOVES, SIMON_ROUNDS, collides, jumpHeight, runScore, runSpec, simonScore, simonSeq, simonStart, simonStepMs, type SimonMove,
} from "@/lib/mochito-play";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const MOVE_INFO: Record<SimonMove, { name: string; icon: typeof Hand }> = {
  sentarse: { name: "Sentarse", icon: Armchair },
  pata: { name: "Dar la pata", icon: Hand },
  girar: { name: "Girar", icon: RotateCw },
  saltar: { name: "Saltar", icon: ArrowUp },
};

// ---------- Simón dice ----------

type SimonPhase = "show" | "input" | "ok" | "fail" | "done";

/** Mochito hace una serie de trucos y tú la repites en el mismo orden. Cada ronda suma uno. */
export function SimonGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const { profile } = useProfile();
  const reduce = useReducedMotion();
  const start = simonStart(play.level);
  const [rnd0] = useState(() => rngFor(play, true));
  const rnd = useRef(rnd0);
  const [seq, setSeq] = useState<SimonMove[]>(() => simonSeq(rnd0, start + SIMON_ROUNDS - 1));
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<SimonPhase>("show");
  const [lit, setLit] = useState<{ move: SimonMove; n: number } | null>(null);
  const [typed, setTyped] = useState(0);
  const len = start + round;

  useEffect(() => {
    if (phase !== "show") return;
    const ms = simonStepMs(play.level);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < len; i++) {
      timers.push(setTimeout(() => { setLit({ move: seq[i], n: i }); sfx("click"); }, 600 + i * ms));
      timers.push(setTimeout(() => setLit(null), 600 + i * ms + ms * 0.7));
    }
    timers.push(setTimeout(() => { setPhase("input"); setTyped(0); }, 600 + len * ms));
    return () => timers.forEach(clearTimeout);
  }, [phase, len, seq, play.level]);

  const over = phase === "fail" || phase === "done";
  useEffect(() => { if (over) void mochitoDo("game"); }, [over]);

  function tap(m: SimonMove) {
    if (phase !== "input") return;
    setLit({ move: m, n: 100 + typed });
    setTimeout(() => setLit((l) => (l && l.n === 100 + typed ? null : l)), 250);
    if (seq[typed] !== m) { sfx("sad"); setPhase("fail"); return; }
    const n = typed + 1;
    if (n < len) { setTyped(n); sfx("click"); return; }
    sfx("coin");
    if (round + 1 >= SIMON_ROUNDS) { setRound(round + 1); setPhase("done"); return; }
    setPhase("ok");
    setTimeout(() => { setLit(null); setRound((r) => r + 1); setPhase("show"); }, 900);
  }
  function again() {
    rnd.current = rngFor(play, false);
    setSeq(simonSeq(rnd.current, start + SIMON_ROUNDS - 1));
    setRound(0); setTyped(0); setLit(null); setPhase("show");
  }

  const roundsDone = phase === "done" ? SIMON_ROUNDS : round;
  const moving = lit && !reduce ? TRICK_MOVES[lit.move] : null;

  return (
    <section aria-labelledby="g-simon" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-simon" className="text-3xl">Simón dice con Mochito</h2>
      <p className="text-muted-foreground">Mira los trucos que hace Mochito y luego tócalos en el mismo orden. Cada ronda hace uno más.</p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-live="polite">
        <span>Ronda: <span className="tabular-nums">{Math.min(round + 1, SIMON_ROUNDS)} de {SIMON_ROUNDS}</span></span>
        <span>Trucos: <span className="tabular-nums">{len}</span></span>
        <span className={cn(phase === "fail" && "text-destructive", phase === "ok" && "text-primary")}>
          {phase === "show" ? "Mira bien…" : phase === "input" ? `Tu turno: ${typed} de ${len}` : phase === "ok" ? "¡Bien! Uno más…" : phase === "fail" ? "¡Ups! Ese no era." : "¡Lo hiciste todo!"}
        </span>
      </div>
      <div className="flex h-48 items-end justify-center rounded-[2rem] bg-gradient-to-b from-card to-secondary pb-3">
        <motion.span
          key={lit ? `${lit.move}-${lit.n}` : "quieto"}
          className="block h-40"
          style={{ transformOrigin: "50% 100%" }}
          initial={false}
          animate={moving ? { transform: moving } : undefined}
          transition={{ duration: Math.min(0.9, simonStepMs(play.level) / 1000), ease: EASE_OUT }}
        >
          <DressedImage char="mochito" outfit={profile.mochito_outfit} alt="" className="h-full" />
        </motion.span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SIMON_MOVES.map((m) => {
          const Info = MOVE_INFO[m];
          const on = lit?.move === m;
          return (
            <button
              key={m}
              type="button"
              disabled={phase !== "input"}
              onClick={() => tap(m)}
              className={cn("flex min-h-20 flex-col items-center justify-center gap-1 rounded-3xl border-2 p-3 text-sm font-semibold transition-[background-color,border-color,color] duration-150 active:scale-[0.97]", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card", phase !== "input" && !on && "opacity-70")}
            >
              <Info.icon className="size-6" aria-hidden /> {Info.name}
            </button>
          );
        })}
      </div>
      {over ? (
        <Result game="simon" play={play} score={simonScore(roundsDone)} onAgain={again} onExit={onExit} detail={`Llegaste a ${roundsDone} de ${SIMON_ROUNDS} rondas. ${roundsDone >= SIMON_ROUNDS ? "¡Mochito dice que tienes memoria de elefante!" : "Mochito dice: la próxima la sacamos completa."}`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}

// ---------- Carrera al parque ----------

interface Obstacle { id: number; kind: (typeof OBSTACLES)[number]; x: number; done: boolean }

/** Mochito corre al parque; toca la pantalla (o la barra espaciadora) para saltar charcos, piedras y ramas. */
export function RunGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const { profile } = useProfile();
  const reduce = useReducedMotion();
  const spec = runSpec(play.level);
  const [round, setRound] = useState(0);
  const [items, setItems] = useState<Obstacle[]>([]);
  const [jump, setJump] = useState(0);
  const [stats, setStats] = useState({ cleared: 0, hits: 0 });
  const [left, setLeft] = useState(RUN_MS);
  const [bump, setBump] = useState(0);
  const [over, setOver] = useState(false);
  const jumpAt = useRef(-99_999);
  const clock = useRef(0);

  useEffect(() => {
    let rnd = rngFor(play, round === 0);
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let spawnIn = 1200;
    let nextId = 1;
    let local: Obstacle[] = [];
    const s = { cleared: 0, hits: 0 };
    const loop = (t: number) => {
      const dt = Math.min(64, t - last);
      last = t;
      elapsed += dt;
      clock.current = elapsed;
      spawnIn -= dt;
      if (spawnIn <= 0 && elapsed < RUN_MS - 1500) {
        spawnIn = spec.every * (0.75 + rnd() * 0.6);
        local.push({ id: nextId++, kind: OBSTACLES[Math.floor(rnd() * OBSTACLES.length)], x: 1.08, done: false });
      }
      const h = jumpHeight(elapsed - jumpAt.current);
      const next: Obstacle[] = [];
      for (const o of local) {
        const x = o.x - (spec.speed * dt) / 1000;
        if (!o.done && collides(x, o.kind.h, h)) { s.hits++; sfx("sad"); setBump((b) => b + 1); continue; }
        let done = o.done;
        if (!done && x < RUN_X - 0.05) { done = true; s.cleared++; sfx("coin"); }
        if (x > -0.1) next.push({ ...o, x, done });
      }
      local = next;
      setItems(local);
      setJump(h);
      setStats({ ...s });
      setLeft(Math.max(0, RUN_MS - elapsed));
      if (elapsed >= RUN_MS) { setOver(true); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); rnd = () => 0; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  useEffect(() => { if (over) void mochitoDo("game"); }, [over]);

  function hop() {
    if (over) return;
    if (clock.current - jumpAt.current < JUMP_MS) return;
    jumpAt.current = clock.current;
    sfx("click");
  }
  function again() { setOver(false); setItems([]); setStats({ cleared: 0, hits: 0 }); setLeft(RUN_MS); jumpAt.current = -99_999; setRound((n) => n + 1); }

  return (
    <section aria-labelledby="g-carrera" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-carrera" className="text-3xl">Carrera al parque</h2>
      <p className="text-muted-foreground">Mochito va corriendo al parque. Toca la cancha (o la barra espaciadora) para que salte los charcos, las piedras y las ramas.</p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-live="polite">
        <span>Tiempo: <span className="tabular-nums">{Math.ceil(left / 1000)} s</span></span>
        <span>Saltados: <span className="tabular-nums">{stats.cleared}</span></span>
        <span className="text-destructive">Tropezones: <span className="tabular-nums">{stats.hits}</span></span>
      </div>
      <div
        tabIndex={0}
        role="application"
        aria-label="Carrera. Toca o presiona la barra espaciadora para saltar."
        className="relative h-64 touch-none select-none overflow-hidden rounded-[2rem] bg-gradient-to-b from-sky-100 to-sky-50 outline-none focus-visible:ring-4 focus-visible:ring-ring/40 dark:from-sky-950 dark:to-sky-900"
        onPointerDown={hop}
        onKeyDown={(e) => { if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); hop(); } }}
      >
        <div className="absolute inset-x-0 bottom-0 h-12 bg-emerald-200 dark:bg-emerald-900" />
        {items.map((o) => (
          <span key={o.id} aria-hidden className="absolute bottom-10 -translate-x-1/2" style={{ left: `${o.x * 100}%` }}>
            {o.kind.id === "charco" && <span className="block h-3 w-16 rounded-[50%] bg-sky-400/80" />}
            {o.kind.id === "piedra" && <span className="block h-8 w-10 rounded-t-[60%] rounded-b-md bg-stone-400" />}
            {o.kind.id === "rama" && <span className="block h-4 w-16 rotate-[-8deg] rounded-full bg-amber-800" />}
          </span>
        ))}
        <motion.span
          key={bump}
          className="absolute bottom-10 block h-24 -translate-x-1/2"
          style={{ left: `${RUN_X * 100}%`, transform: `translate(-50%, ${-jump * 256}px)` }}
          initial={bump && !reduce ? { opacity: 0.4 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          <DressedImage char="mochito" outfit={profile.mochito_outfit} alt="" className="h-full" />
        </motion.span>
        <MoveVertical className="absolute right-3 top-3 size-5 text-muted-foreground" aria-hidden />
      </div>
      {over ? (
        <Result game="carrera" play={play} score={runScore(stats.cleared, stats.hits)} onAgain={again} onExit={onExit} detail={`Mochito saltó ${stats.cleared} ${stats.cleared === 1 ? "obstáculo" : "obstáculos"} y se tropezó ${stats.hits} ${stats.hits === 1 ? "vez" : "veces"}. ¡Llegó al parque con la lengua afuera!`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}
