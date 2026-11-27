"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Fish as FishIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MochitoFigure } from "@/components/mochito-figure";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import { useProfile } from "@/lib/db/profile";
import { mochitoDo } from "@/lib/mochito-actions";
import {
  DIFFS, FISH, diffHit, diffPick, diffScore, fishPlan, fishPossible, fishScore, fishWindow, frisbeeCatch, frisbeeLand, frisbeePlan, frisbeePower,
  frisbeeScore, frisbeeSpec, soupFind, soupLine, soupOf, soupScore, groomActive, type DiffId, type Fish,
} from "@/lib/mochito-extra";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function useMochitoLook() {
  const { profile } = useProfile();
  const [now] = useState(() => Date.now());
  return { outfit: profile.mochito_outfit, groom: groomActive(profile.mochito_groom, now) ? profile.mochito_groom : null };
}

// ---------- Pesca en el lago ----------

function FishArt({ fish, className }: { fish: Fish; className?: string }) {
  if (fish === "bota") {
    return (
      <svg viewBox="0 0 40 40" className={className} aria-hidden>
        <path d="M12 4 L24 4 L24 24 L36 28 Q38 36 30 36 L10 36 Z" fill="#7a5a3a" stroke="rgb(0 0 0 / 0.3)" strokeWidth="1" />
        <path d="M12 10 L24 10" stroke="#5a3f26" strokeWidth="1.5" />
      </svg>
    );
  }
  const c = FISH[fish].color;
  return (
    <svg viewBox="0 0 48 30" className={className} aria-hidden>
      <path d="M34 15 L46 5 L46 25 Z" fill={c} stroke="rgb(0 0 0 / 0.3)" strokeWidth="1" />
      <ellipse cx="20" cy="15" rx="18" ry="11" fill={c} stroke="rgb(0 0 0 / 0.3)" strokeWidth="1" />
      <circle cx="10" cy="12" r="2.2" fill="#1f1f24" />
      <path d="M22 8 Q26 15 22 22" stroke="rgb(255 255 255 / 0.5)" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

type FishPhase = "listo" | "esperando" | "pica" | "atrapado" | "escapo" | "pronto";

/** Mochito pesca en el lago: cuando el corcho se hunde, jala rápido. Muy pronto asusta al pez; muy tarde se escapa. */
export function FishGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const look = useMochitoLook();
  const reduce = useReducedMotion();
  const [round, setRound] = useState(0);
  const [plan, setPlan] = useState(() => fishPlan(rngFor(play, true), play.level));
  const [cast, setCast] = useState(0);
  const [phase, setPhase] = useState<FishPhase>("listo");
  const [got, setGot] = useState(0);
  const [bag, setBag] = useState<Fish[]>([]);
  const phaseRef = useRef<FishPhase>("listo");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const over = cast >= plan.length;
  const cur = plan[Math.min(cast, plan.length - 1)];

  const set = (p: FishPhase) => { phaseRef.current = p; setPhase(p); };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { if (over) void mochitoDo("game", { game: "Pesca en el lago" }); }, [over]);

  function throwLine() {
    if (phaseRef.current !== "listo" || over) return;
    sfx("click");
    set("esperando");
    timer.current = setTimeout(() => {
      set("pica");
      sfx("coin");
      timer.current = setTimeout(() => { if (phaseRef.current === "pica") { set("escapo"); sfx("sad"); } }, fishWindow(play.level, cur.fish));
    }, cur.wait);
  }
  function pull() {
    const p = phaseRef.current;
    if (p === "esperando") { if (timer.current) clearTimeout(timer.current); set("pronto"); sfx("sad"); return; }
    if (p === "pica") {
      if (timer.current) clearTimeout(timer.current);
      set("atrapado");
      setGot((g) => g + FISH[cur.fish].points);
      setBag((b) => [...b, cur.fish]);
      sfx(cur.fish === "bota" ? "click" : "cash");
    }
  }
  function next() { setCast((c) => c + 1); set("listo"); }
  function again() {
    if (timer.current) clearTimeout(timer.current);
    setPlan(fishPlan(rngFor(play, false), play.level)); setCast(0); setGot(0); setBag([]); set("listo"); setRound((r) => r + 1);
  }

  const msg: Record<FishPhase, string> = {
    listo: "Toca «Lanzar» para echar el anzuelo.",
    esperando: "Shhh… espera a que el corcho se hunda.",
    pica: "¡Está picando! ¡Jala ya!",
    atrapado: cur.fish === "bota" ? "¡Una bota vieja! Mochito se ríe." : `¡${FISH[cur.fish].name.replace("¡", "").replace("!", "")}! Vale ${FISH[cur.fish].points}.`,
    escapo: "Se escapó. Hay que jalar más rápido.",
    pronto: "¡Muy pronto! El pez se asustó.",
  };

  return (
    <section aria-labelledby="g-pesca" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-pesca" className="text-3xl">Pesca en el lago</h2>
      <p className="text-muted-foreground">Lanza el anzuelo y espera. Cuando el corcho se hunda, toca «¡Jalar!» rápido. Los peces grandes se escapan más rápido.</p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-live="polite">
        <span>Lanzada: <span className="tabular-nums">{Math.min(cast + 1, plan.length)} de {plan.length}</span></span>
        <span>Puntos: <span className="tabular-nums">{got}</span></span>
        <span className="flex items-center gap-0.5" aria-label={`${bag.length} cosas pescadas`}>{bag.map((f, k) => <FishArt key={k} fish={f} className="h-4 w-6" />)}</span>
      </div>
      <div className="relative h-72 select-none overflow-hidden rounded-[2rem] bg-gradient-to-b from-sky-200 to-sky-100 dark:from-sky-900 dark:to-sky-950" key={round}>
        <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="absolute inset-x-0 top-6 h-20 w-full" aria-hidden>
          <path d="M0 60 L30 20 L60 60 Z" fill="#8ca0b8" /><path d="M50 60 L95 8 L140 60 Z" fill="#7a8ea8" /><path d="M130 60 L165 25 L200 60 Z" fill="#8ca0b8" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 top-[42%] bg-[#4f93c9] dark:bg-[#2d5f8a]" aria-hidden />
        <div className="absolute bottom-0 left-0 h-[34%] w-[38%] bg-[#a0703f]" aria-hidden><div className="h-2 bg-[#8a5a2e]" /></div>
        <span className="absolute bottom-[32%] left-[6%] block h-32"><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <path d="M17 56 L36 24" stroke="#6b4a2b" strokeWidth="1.2" />
          {phase !== "listo" && <path d={`M36 24 Q53 30 66 ${phase === "pica" ? 66 : 60}`} stroke="#ffffff" strokeWidth="0.4" fill="none" />}
        </svg>
        {phase !== "listo" && (
          <motion.span
            className="absolute left-[66%] block size-6 -translate-x-1/2"
            style={{ top: "58%" }}
            initial={false}
            animate={reduce ? { transform: phase === "pica" ? "translateY(10px)" : "translateY(0px)" } : phase === "pica" ? { transform: ["translateY(0px)", "translateY(12px)", "translateY(6px)", "translateY(12px)"] } : { transform: ["translateY(0px)", "translateY(-2px)", "translateY(0px)"] }}
            transition={phase === "pica" ? { duration: 0.4, ease: EASE_OUT } : { duration: 1.6, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
            aria-hidden
          >
            <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" fill="#ffffff" /><path d="M3 10 A7 7 0 0 1 17 10 Z" fill="#d6453d" /></svg>
          </motion.span>
        )}
        {phase === "pica" && <span className="absolute left-[66%] top-[44%] -translate-x-1/2 rounded-full bg-card px-2 font-heading text-lg text-primary" aria-hidden>¡!</span>}
        {phase === "atrapado" && (
          <motion.span className="absolute left-[60%] top-[18%] block h-16 w-24" initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(30px) scale(0.95)" }} animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }} transition={{ duration: 0.4, ease: EASE_OUT }} aria-hidden>
            <FishArt fish={cur.fish} className="h-full w-full" />
          </motion.span>
        )}
        <p className="absolute right-3 top-3 max-w-[60%] rounded-3xl bg-card px-3 py-2 text-sm font-semibold shadow-sm" aria-live="polite">{over ? "¡Se acabaron las lanzadas!" : msg[phase]}</p>
      </div>
      {over ? (
        <Result game="pesca" play={play} score={fishScore(got, fishPossible(plan))} onAgain={again} onExit={onExit} detail={`Pescó ${bag.filter((f) => f !== "bota").length} ${bag.filter((f) => f !== "bota").length === 1 ? "pez" : "peces"} y sumó ${got} puntos${bag.includes("bota") ? " (y una bota vieja)" : ""}. Mochito dice: «¡Los regresamos al lago para que crezcan!»`} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {phase === "listo" ? (
            <Button className="h-14 rounded-2xl px-8 text-base" onClick={throwLine}>Lanzar</Button>
          ) : phase === "esperando" || phase === "pica" ? (
            <Button className="h-14 rounded-2xl px-8 text-base" onClick={pull}><FishIcon className="size-5" aria-hidden /> ¡Jalar!</Button>
          ) : (
            <Button className="h-14 rounded-2xl px-8 text-base" onClick={next}>{cast + 1 >= plan.length ? "Ver resultado" : "Otra lanzada"}</Button>
          )}
          <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Atrapa el frisbee ----------

/** Lanza el frisbee con la fuerza justa para que llegue a Mochito. Si cae muy cerca, lo atrapa de un brinco. */
export function FrisbeeGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const look = useMochitoLook();
  const reduce = useReducedMotion();
  const spec = frisbeeSpec(play.level);
  const [plan, setPlan] = useState(() => frisbeePlan(rngFor(play, true), play.level));
  const [i, setI] = useState(0);
  const [power, setPower] = useState(0);
  const [shot, setShot] = useState<{ land: number; res: "aire" | "atrapa" | "falla" } | null>(null);
  const [points, setPoints] = useState(0);
  const [log, setLog] = useState<("aire" | "atrapa" | "falla")[]>([]);
  const start = useRef(0);
  const over = i >= plan.length;
  const cur = plan[Math.min(i, plan.length - 1)];

  useEffect(() => {
    if (shot || over) return;
    start.current = performance.now();
    let raf = 0;
    const loop = (t: number) => { setPower(frisbeePower(t - start.current, spec.period)); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [shot, over, i, spec.period]);
  useEffect(() => { if (over) void mochitoDo("game", { game: "Atrapa el frisbee" }); }, [over]);

  function launch() {
    if (shot || over) return;
    const p = frisbeePower(performance.now() - start.current, spec.period);
    setPower(p);
    const land = frisbeeLand(p, cur.wind);
    const res = frisbeeCatch(land, cur.target, spec.tol);
    setShot({ land, res });
    sfx("click");
    setTimeout(() => {
      sfx(res === "falla" ? "sad" : res === "aire" ? "cash" : "coin");
      setPoints((x) => x + (res === "aire" ? 3 : res === "atrapa" ? 2 : 0));
      setLog((l) => [...l, res]);
    }, reduce ? 50 : 900);
  }
  function next() { setShot(null); setI((n) => n + 1); }
  function again() { setPlan(frisbeePlan(rngFor(play, false), play.level)); setI(0); setPoints(0); setLog([]); setShot(null); }

  const resolved = shot && log.length === i + 1;
  const dogX = shot && shot.res !== "falla" && resolved ? shot.land : cur.target;
  const say = !shot ? "¡Aquí! ¡Lánzamelo!" : !resolved ? "…" : shot.res === "aire" ? "¡Lo atrapé en el aire!" : shot.res === "atrapa" ? "¡Atrapado!" : shot.land < cur.target ? "Quedó cortito…" : "¡Se pasó de largo!";

  return (
    <section aria-labelledby="g-frisbee" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-frisbee" className="text-3xl">Atrapa el frisbee</h2>
      <p className="text-muted-foreground">La barrita de fuerza sube y baja. Toca «Lanzar» cuando tenga la fuerza justa para llegar hasta Mochito.{spec.wind ? " Fíjate en el viento: empuja el frisbee." : ""}</p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-live="polite">
        <span>Lanzamiento: <span className="tabular-nums">{Math.min(i + 1, plan.length)} de {plan.length}</span></span>
        <span>Puntos: <span className="tabular-nums">{points}</span></span>
        {!over && cur.wind !== 0 && <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5">Viento {cur.wind > 0 ? <ArrowRight className="size-4" aria-label="hacia adelante" /> : <ArrowLeft className="size-4" aria-label="hacia atrás" />} {Math.abs(Math.round(cur.wind * 100))}</span>}
      </div>
      <div className="relative h-64 select-none overflow-hidden rounded-[2rem] bg-gradient-to-b from-sky-100 to-sky-50 dark:from-sky-950 dark:to-slate-900">
        <div className="absolute inset-x-0 bottom-0 h-16 bg-[#8fd17f] dark:bg-emerald-900" aria-hidden />
        <span className="absolute bottom-16 block h-6 rounded-full bg-[var(--gold)]/50" style={{ left: `${(cur.target - spec.tol) * 100}%`, width: `${spec.tol * 200}%` }} aria-hidden />
        <span
          className="absolute bottom-3 block h-28 -translate-x-1/2"
          style={{ left: `${Math.min(0.95, dogX) * 100}%`, transition: reduce ? undefined : "left 500ms cubic-bezier(0.23, 1, 0.32, 1)" }}
          aria-hidden
        >
          <motion.span key={`${i}-${resolved ? shot?.res : "q"}`} className="block h-full" initial={false} animate={resolved && shot?.res === "aire" && !reduce ? { transform: ["translateY(0px)", "translateY(-30px)", "translateY(0px)"] } : undefined} transition={{ duration: 0.5, ease: EASE_OUT }}>
            <MochitoFigure outfit={look.outfit} groom={look.groom} />
          </motion.span>
        </span>
        {shot && (
          <motion.span
            key={`f${i}`}
            className="absolute block h-4 w-10 -translate-x-1/2 rounded-[50%] border-2 border-[#b5302a] bg-[#e2574c]"
            initial={{ left: "4%", top: "70%" }}
            animate={reduce ? { left: `${Math.min(1.02, shot.land) * 100}%`, top: "52%" } : { left: ["4%", `${((0.04 + Math.min(1.02, shot.land)) / 2) * 100}%`, `${Math.min(1.02, shot.land) * 100}%`], top: ["70%", "14%", shot.res === "aire" ? "40%" : "52%"] }}
            transition={{ duration: reduce ? 0 : 0.9, ease: "linear" }}
            aria-hidden
          />
        )}
        <p className="absolute left-3 top-3 rounded-3xl bg-card px-3 py-1.5 text-sm font-semibold shadow-sm">{over ? "¡Qué buen rato!" : say}</p>
      </div>
      {over ? (
        <Result game="frisbee" play={play} score={frisbeeScore(points, plan.length)} onAgain={again} onExit={onExit} detail={`Atrapó ${log.filter((r) => r !== "falla").length} de ${plan.length} (${log.filter((r) => r === "aire").length} en el aire). Mochito dice: «¡Otra vez, otra vez!»`} />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-44 flex-1 flex-col gap-1">
            <span className="text-xs font-semibold">Fuerza</span>
            <div className="relative h-4 overflow-hidden rounded-full bg-secondary" role="meter" aria-label="Fuerza" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(power * 100)}>
              <div className="h-full rounded-full bg-gradient-to-r from-[#8fd17f] via-[#f6c744] to-[#d6453d]" style={{ width: `${power * 100}%` }} />
            </div>
          </div>
          {!shot ? (
            <Button className="h-14 rounded-2xl px-8 text-base" onClick={launch}>Lanzar</Button>
          ) : (
            <Button className="h-14 rounded-2xl px-8 text-base" disabled={!resolved} onClick={next}>{i + 1 >= plan.length ? "Ver resultado" : "Otro"}</Button>
          )}
          <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Encuentra las diferencias ----------

/** El dibujo del parque. `changed` son las diferencias que tiene este lado. */
function ParkScene({ changed }: { changed: Set<DiffId> }) {
  const has = (id: DiffId) => changed.has(id);
  const line = "rgb(0 0 0 / 0.3)";
  return (
    <svg viewBox="0 0 100 75" className="absolute inset-0 h-full w-full" aria-hidden>
      <rect width="100" height="75" fill="#d9eefc" />
      <rect y="54" width="100" height="21" fill="#9fdcb4" />
      <circle cx="88" cy="11" r="6" fill={has("sol") ? "#f28ab2" : "#f6c744"} />
      {!has("nube") && <g fill="#ffffff"><ellipse cx="34" cy="10" rx="8" ry="4" /><ellipse cx="29" cy="12" rx="5" ry="3" /></g>}
      <g transform="translate(56 9)"><path d="M0 -6 L5 0 L0 6 L-5 0 Z" fill={has("cometa") ? "#8fd17f" : "#e2457a"} stroke={line} strokeWidth="0.4" /><path d="M0 6 Q-2 12 2 18" stroke="#7a7a7a" strokeWidth="0.4" fill="none" /></g>
      <rect x="11" y="30" width="5" height="26" fill="#8a5a2e" />
      <circle cx="14" cy="20" r="13" fill="#5bb06a" />
      {!has("manzana") && <circle cx="14" cy="26" r="2.4" fill="#d6453d" />}
      <circle cx="8" cy="16" r="2.2" fill="#d6453d" />
      <circle cx="20" cy="14" r="2.2" fill="#d6453d" />
      <g transform="translate(70 24)" fill={has("mariposa") ? "#7cc6f2" : "#f6a623"}><ellipse cx="-2.4" cy="0" rx="2.4" ry="3.2" /><ellipse cx="2.4" cy="0" rx="2.4" ry="3.2" /><rect x="-0.4" y="-2.5" width="0.8" height="5" fill="#333" /></g>
      <g fill="#ffffff" stroke={line} strokeWidth="0.4">
        <rect x="56" y="46" width="22" height="2" />
        <rect x="56" y="51" width="22" height="2" />
        {[57, 62, 67, 72, 77].map((x) => (has("valla") && x === 72 ? null : <rect key={x} x={x - 1} y="43" width="2" height="12" />))}
      </g>
      {!has("pajaro") && <g transform="translate(56 40)"><ellipse rx="3" ry="2.2" fill="#5e9fd0" /><circle cx="2.4" cy="-1.4" r="1.4" fill="#5e9fd0" /><path d="M3.6 -1.4 L5 -1 L3.6 -0.6 Z" fill="#f6a623" /></g>}
      <rect x="82" y="34" width="16" height="22" fill="#f2c94c" stroke={line} strokeWidth="0.4" />
      <path d="M80 35 L90 26 L100 35 Z" fill="#d6453d" />
      <rect x="87" y="39" width="6" height="6" fill={has("ventana") ? "#f6a623" : "#7cc6f2"} stroke={line} strokeWidth="0.4" />
      <g transform="translate(8 66)"><rect x="-0.8" y="0" width="1.6" height="3" fill="#f4efe4" /><path d="M-3.4 0.4 Q0 -4 3.4 0.4 Z" fill={has("hongo") ? "#a0703f" : "#d6453d"} /></g>
      <g transform="translate(64 64)"><path d="M0 0 L0 6" stroke="#5bb06a" strokeWidth="0.8" />{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-2" rx="1.4" ry="2" fill={has("flor") ? "#5e9fd0" : "#e2457a"} transform={`rotate(${a})`} />)}<circle r="1" fill="#f6c744" /></g>
      <circle cx="80" cy="66" r="3.4" fill={has("pelota") ? "#8fd17f" : "#d6453d"} stroke={line} strokeWidth="0.4" />
      {!has("hueso") && <path d="M51 70 L57 70" stroke="#f5efe4" strokeWidth="1.8" strokeLinecap="round" />}
    </svg>
  );
}

/** Dos dibujos casi iguales: encuentra lo que cambió. */
export function DiffGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const look = useMochitoLook();
  const reduce = useReducedMotion();
  const [diffs, setDiffs] = useState<DiffId[]>(() => diffPick(rngFor(play, true), play.level));
  const [found, setFound] = useState<DiffId[]>([]);
  const [miss, setMiss] = useState<{ x: number; y: number; side: number; n: number } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);
  const done = found.length === diffs.length || gaveUp;
  const changed = new Set(diffs);

  useEffect(() => { if (done) void mochitoDo("game", { game: "Encuentra las diferencias" }); }, [done]);

  function tap(e: React.PointerEvent<HTMLDivElement>, side: number) {
    if (done) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100, y = ((e.clientY - r.top) / r.height) * 75;
    const hit = diffHit(x, y, diffs.filter((d) => !found.includes(d)));
    if (hit) { setFound((f) => [...f, hit]); sfx("coin"); return; }
    setMistakes((m) => m + 1);
    setMiss({ x, y, side, n: (miss?.n ?? 0) + 1 });
    sfx("click");
  }
  function again() { setDiffs(diffPick(rngFor(play, false), play.level)); setFound([]); setMistakes(0); setGaveUp(false); setMiss(null); }

  const picture = (side: number) => (
    <div
      className="relative aspect-[4/3] w-full cursor-pointer touch-manipulation select-none overflow-hidden rounded-3xl border-4 border-[#f2e3c6]"
      onPointerDown={(e) => tap(e, side)}
      role="img"
      aria-label={side === 0 ? "Dibujo de la izquierda" : "Dibujo de la derecha"}
    >
      <ParkScene changed={side === 1 ? changed : new Set()} />
      <span className="pointer-events-none absolute bottom-[4%] left-[26%] block h-[40%]"><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
      <svg viewBox="0 0 100 75" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        {(gaveUp ? diffs : found).map((d) => <circle key={d} cx={DIFFS[d].x} cy={DIFFS[d].y} r={DIFFS[d].r} fill="none" stroke={found.includes(d) ? "#d6453d" : "#7a7a7a"} strokeWidth="1.2" strokeDasharray={found.includes(d) ? undefined : "2 1.5"} />)}
      </svg>
      {miss && miss.side === side && (
        <motion.span key={miss.n} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-heading text-xl text-destructive" style={{ left: `${miss.x}%`, top: `${(miss.y / 75) * 100}%` }} initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: reduce ? 0.3 : 0.7, ease: EASE_OUT }} aria-hidden>✕</motion.span>
      )}
    </div>
  );

  return (
    <section aria-labelledby="g-dif" className="flex max-w-3xl flex-col gap-4">
      <h2 id="g-dif" className="text-3xl">Encuentra las diferencias</h2>
      <p className="text-muted-foreground">Los dos dibujos tienen {diffs.length} diferencias. Toca donde veas una (en cualquiera de los dos).</p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-live="polite">
        <span>Encontradas: <span className="tabular-nums">{found.length} de {diffs.length}</span></span>
        <span className="text-muted-foreground">Toques de más: <span className="tabular-nums">{mistakes}</span></span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {picture(0)}
        {picture(1)}
      </div>
      {done ? (
        <Result game="diferencias" play={play} score={gaveUp ? diffScore(found.length, diffs.length, mistakes) * 0.8 : diffScore(found.length, diffs.length, mistakes)} onAgain={again} onExit={onExit} detail={gaveUp ? `Encontraste ${found.length} de ${diffs.length}. Las que faltaban quedaron marcadas en gris.` : `¡Las ${diffs.length} diferencias! Mochito dice: «¡Qué ojos tan buenos tienes!»`} />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-12 rounded-2xl px-6 text-base" onClick={() => setGaveUp(true)}>Me rindo</Button>
          <Button variant="outline" className="h-12 rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Sopa de letras ----------

const WORD_COLORS = ["#f6c744", "#8fd17f", "#7cc6f2", "#f28ab2", "#b99cf0", "#f39a2b", "#5ec4b6", "#e9a0a0"];

/** Palabras de perritos escondidas: toca la primera letra y luego la última. */
export function SoupGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const [soup, setSoup] = useState(() => soupOf(rngFor(play, true), play.level));
  const [found, setFound] = useState<string[]>([]);
  const [first, setFirst] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);
  const [flash, setFlash] = useState<number[]>([]);
  const done = found.length === soup.words.length || gaveUp;

  useEffect(() => { if (done) void mochitoDo("game", { game: "Sopa de letras" }); }, [done]);

  function tap(i: number) {
    if (done) return;
    if (first === null) { setFirst(i); sfx("click"); return; }
    if (first === i) { setFirst(null); return; }
    const w = soupFind(soup, first, i);
    if (w && !found.includes(w)) { setFound((f) => [...f, w]); sfx("coin"); }
    else { setMisses((m) => m + 1); setFlash(soupLine(soup.size, first, i) ?? [first, i]); sfx("sad"); setTimeout(() => setFlash([]), 500); }
    setFirst(null);
  }
  function again() { setSoup(soupOf(rngFor(play, false), play.level)); setFound([]); setFirst(null); setMisses(0); setGaveUp(false); }

  const colorOf = new Map<number, string>();
  soup.words.forEach((w, k) => { if (found.includes(w.word) || gaveUp) for (const c of w.cells) colorOf.set(c, found.includes(w.word) ? WORD_COLORS[k % WORD_COLORS.length] : "var(--muted)"); });

  return (
    <section aria-labelledby="g-sopa" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-sopa" className="text-3xl">Sopa de letras</h2>
      <p className="text-muted-foreground">Busca las palabras de perritos. Toca la primera letra y luego la última.{soup.size > 10 ? " Pueden estar al revés o en diagonal." : soup.size > 8 ? " Pueden ir en diagonal." : ""}</p>
      <ul className="flex flex-wrap gap-2" aria-label="Palabras">
        {soup.words.map((w, k) => {
          const ok = found.includes(w.word);
          return <li key={w.word} className={cn("rounded-full px-3 py-1 text-sm font-semibold", ok ? "line-through" : "bg-secondary")} style={ok ? { background: WORD_COLORS[k % WORD_COLORS.length] } : undefined}>{w.word}</li>;
        })}
      </ul>
      <div className="grid w-full max-w-md select-none gap-0.5 rounded-3xl bg-[#f2e3c6] p-1.5 dark:bg-[#5a4a32]" style={{ gridTemplateColumns: `repeat(${soup.size}, 1fr)` }} role="grid" aria-label="Sopa de letras">
        {soup.cells.map((ch, i) => (
          <button
            key={i}
            type="button"
            onClick={() => tap(i)}
            aria-label={`${ch}, fila ${Math.floor(i / soup.size) + 1}, columna ${(i % soup.size) + 1}`}
            aria-pressed={first === i}
            className={cn("flex aspect-square items-center justify-center rounded-md font-heading text-base font-semibold transition-[background-color] duration-150 sm:text-lg", first === i ? "bg-primary text-primary-foreground" : flash.includes(i) ? "bg-destructive/30" : "bg-card")}
            style={colorOf.has(i) && first !== i ? { background: colorOf.get(i) } : undefined}
          >
            {ch}
          </button>
        ))}
      </div>
      <p className="text-sm font-semibold" aria-live="polite">{found.length} de {soup.words.length} palabras{misses ? ` · ${misses} ${misses === 1 ? "intento fallido" : "intentos fallidos"}` : ""}</p>
      {done ? (
        <Result game="sopa" play={play} score={gaveUp ? soupScore(found.length, soup.words.length, misses) * 0.8 : soupScore(found.length, soup.words.length, misses)} onAgain={again} onExit={onExit} detail={gaveUp ? `Encontraste ${found.length} de ${soup.words.length}. Las demás quedaron en gris.` : "¡Todas las palabras! Mochito dice: «¡Sabes leer mejor que yo!»"} />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-12 rounded-2xl px-6 text-base" onClick={() => setGaveUp(true)}>Me rindo</Button>
          <Button variant="outline" className="h-12 rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}
