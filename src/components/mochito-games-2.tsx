"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Armchair, Blinds, CookingPot, Flag, Package, ShoppingBasket, ShoppingCart, Sprout, Store, Table2, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DressedImage } from "@/components/dressed-image";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import { useProfile } from "@/lib/db/profile";
import { mochitoDo } from "@/lib/mochito-actions";
import {
  FETCH_THROWS, HIDE_ROUNDS, chargeAt, fetchPeriod, fetchPoints, fetchTarget, hideMs, hideRound, hideRoundScore, landingOf,
} from "@/lib/mochito-play";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

// ---------- Atrapa la pelota ----------

type FetchPhase = "aim" | "flying" | "fetching" | "done";

/** Mantén presionado para cargar la fuerza y suelta para lanzar. Mochito corre por la pelota. */
export function FetchGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const { profile } = useProfile();
  const reduce = useReducedMotion();
  const [start] = useState(() => { const r = rngFor(play, true); return { r, target: fetchTarget(r, play.level) }; });
  const rnd = useRef(start.r);
  const [target, setTarget] = useState(start.target);
  const [phase, setPhase] = useState<FetchPhase>("aim");
  const [power, setPower] = useState(0);
  const [holding, setHolding] = useState(false);
  const [landing, setLanding] = useState(0);
  const [points, setPoints] = useState<number[]>([]);
  const [lastPts, setLastPts] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const holdAt = useRef(0);
  const powerRef = useRef(0);

  useEffect(() => {
    if (!holding) return;
    let raf = 0;
    const tick = (t: number) => {
      powerRef.current = chargeAt(t - holdAt.current, fetchPeriod(play.level));
      setPower(powerRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [holding, play.level]);

  const over = points.length >= FETCH_THROWS;
  useEffect(() => { if (over) void mochitoDo("game"); }, [over]);

  function press() {
    if (phase !== "aim" || holding || over) return;
    holdAt.current = performance.now();
    powerRef.current = 0;
    setHolding(true);
  }
  function release() {
    if (!holding) return;
    setHolding(false);
    const at = landingOf(powerRef.current);
    setLanding(at);
    setLastPts(null);
    setPhase("flying");
    sfx("click");
  }
  function landed() {
    setPhase("fetching");
  }
  function back() {
    const pts = fetchPoints(landing, target, play.level);
    sfx(pts >= 0.6 ? "coin" : "sad");
    setLastPts(pts);
    setPoints((p) => [...p, pts]);
    setTarget(fetchTarget(rnd.current, play.level));
    setPhase("aim");
  }
  function again() {
    rnd.current = rngFor(play, false);
    setTarget(fetchTarget(rnd.current, play.level));
    setPoints([]); setLastPts(null); setPhase("aim"); setRound((r) => r + 1);
  }

  const fly = phase === "flying" && !reduce;
  const ballX = phase === "aim" ? 0.17 : landing;
  const dogX = phase === "fetching" ? landing : 0.09;

  return (
    <section aria-labelledby="g-pelota" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-pelota" className="text-3xl">Atrapa la pelota</h2>
      <p className="text-muted-foreground">
        Mantén presionada la cancha (o la barra espaciadora) y suelta para lanzar. La fuerza sube y baja: suelta cuando la pelota vaya a caer en la banderita.
      </p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-live="polite">
        <span>Tiro: <span className="tabular-nums">{Math.min(points.length + 1, FETCH_THROWS)} de {FETCH_THROWS}</span></span>
        <span>Puntos: <span className="tabular-nums">{Math.round(points.reduce((s, x) => s + x, 0) * 100)}</span></span>
        {lastPts !== null && <span className="text-primary">{lastPts >= 0.85 ? "¡Justo en la bandera!" : lastPts >= 0.5 ? "¡Cerca!" : "Lejitos…"} +{Math.round(lastPts * 100)}</span>}
      </div>
      <div
        key={round}
        tabIndex={0}
        role="application"
        aria-label="Cancha. Mantén presionada la barra espaciadora y suelta para lanzar la pelota."
        className="relative h-[20rem] touch-none select-none overflow-hidden rounded-[2rem] bg-gradient-to-b from-sky-100 to-sky-50 outline-none focus-visible:ring-4 focus-visible:ring-ring/40 dark:from-sky-950 dark:to-sky-900"
        onPointerDown={(e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} press(); }}
        onPointerUp={release}
        onPointerCancel={release}
        onKeyDown={(e) => { if (e.key === " " && !e.repeat) { e.preventDefault(); press(); } }}
        onKeyUp={(e) => { if (e.key === " ") { e.preventDefault(); release(); } }}
      >
        <div className="absolute inset-x-0 bottom-0 h-16 bg-emerald-200 dark:bg-emerald-900" />
        <div className="absolute bottom-14 flex -translate-x-1/2 flex-col items-center" style={{ left: `${target * 100}%` }} aria-hidden>
          <Flag className="size-9 fill-primary text-primary" />
          <span className="h-2 w-16 rounded-full bg-primary/25" />
        </div>

        <div className="absolute bottom-20 right-3 top-6 w-3 overflow-hidden rounded-full bg-card/80" aria-hidden>
          <div className="absolute inset-x-0 bottom-0 rounded-full bg-primary" style={{ height: `${Math.round(power * 100)}%` }} />
        </div>

        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-4"
          initial={false}
          animate={{ transform: `translateX(${dogX * 100}%)` }}
          transition={{ duration: phase === "fetching" && !reduce ? 0.7 : 0.5, ease: EASE_OUT }}
          onAnimationComplete={() => { if (phase === "fetching") back(); }}
        >
          <span className="block h-24 w-fit -translate-x-1/2">
            <DressedImage char="mochito" outfit={profile.mochito_outfit} alt="" className="h-full" />
          </span>
        </motion.div>

        {phase !== "fetching" && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-16"
            initial={false}
            animate={{ transform: `translateX(${ballX * 100}%)` }}
            transition={{ duration: fly ? 0.9 : 0, ease: [0.33, 0.6, 0.5, 1] }}
            onAnimationComplete={() => { if (phase === "flying") landed(); }}
          >
            <motion.span
              className="block size-7 -translate-x-1/2 rounded-full border-2 border-amber-600 bg-amber-300 shadow"
              initial={false}
              animate={fly ? { transform: ["translateY(0px)", "translateY(-150px)", "translateY(0px)"] } : { transform: "translateY(0px)" }}
              transition={{ duration: fly ? 0.9 : 0, ease: "easeOut", times: [0, 0.45, 1] }}
            />
          </motion.div>
        )}
        {phase === "flying" && reduce && <ReducedLand onDone={landed} />}
      </div>
      {over ? (
        <Result game="pelota" play={play} score={avg(points)} onAgain={again} onExit={onExit} detail={`Mochito trajo la pelota ${FETCH_THROWS} veces. Tu mejor tiro: ${Math.round(Math.max(...points) * 100)} puntos.`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}

/** Sin animación: la pelota cae al instante y seguimos. */
function ReducedLand({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 300); return () => clearTimeout(t); }, [onDone]);
  return null;
}

// ---------- Escondidas ----------

const SPOT_ICON: Record<string, typeof Store> = {
  Vitrina: Store, Maceta: Sprout, Caja: Package, Horno: CookingPot, "Costal de harina": Wheat,
  Cortina: Blinds, Mesa: Table2, Banco: Armchair, Carrito: ShoppingCart, Canasta: ShoppingBasket,
};

type HidePhase = "hiding" | "seek" | "found" | "lost";

/** Mochito se esconde detrás de algo del local. Encuéntralo antes de que se acabe el tiempo. */
export function HideGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const { profile } = useProfile();
  const reduce = useReducedMotion();
  const [start] = useState(() => { const r = rngFor(play, true); return { r, round: hideRound(r, play.level) }; });
  const rnd = useRef(start.r);
  const total = hideMs(play.level);
  const [round, setRound] = useState(start.round);
  const [phase, setPhase] = useState<HidePhase>("hiding");
  const [left, setLeft] = useState(total);
  const [misses, setMisses] = useState<number[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [wiggle, setWiggle] = useState(0);
  const [shake, setShake] = useState<{ i: number; n: number } | null>(null);
  const leftRef = useRef(total);

  useEffect(() => {
    if (phase !== "hiding") return;
    const t = setTimeout(() => { setPhase("seek"); sfx("click"); }, 1400);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "seek") return;
    const start = performance.now();
    let raf = 0;
    let lastWiggle = 0;
    const every = play.level === "facil" ? 1800 : play.level === "dificil" ? 99_999 : 2600;
    const tick = (t: number) => {
      const passed = t - start;
      leftRef.current = Math.max(0, total - passed);
      setLeft(leftRef.current);
      const due = play.level === "dificil" ? passed > 2000 && lastWiggle === 0 : passed - lastWiggle > every;
      if (due) { lastWiggle = passed; setWiggle((w) => w + 1); }
      if (leftRef.current <= 0) { setPhase("lost"); setScores((s) => [...s, 0]); sfx("sad"); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, total, play.level]);

  const done = scores.length >= HIDE_ROUNDS;
  useEffect(() => { if (done) void mochitoDo("game"); }, [done]);

  useEffect(() => {
    if ((phase !== "found" && phase !== "lost") || done) return;
    const t = setTimeout(() => {
      setRound(hideRound(rnd.current, play.level));
      setLeft(total); leftRef.current = total; setWiggle(0); setShake(null);
      setPhase("hiding");
    }, 1300);
    return () => clearTimeout(t);
  }, [phase, done, play.level, total]);

  const missNow = misses[scores.length] ?? 0;
  function tap(i: number) {
    if (phase !== "seek") return;
    if (i === round.at) {
      sfx("success");
      setScores((s) => [...s, hideRoundScore(true, leftRef.current, total, missNow)]);
      setPhase("found");
      return;
    }
    sfx("click");
    setShake({ i, n: (shake?.n ?? 0) + 1 });
    setMisses((m) => { const a = [...m]; a[scores.length] = (a[scores.length] ?? 0) + 1; return a; });
  }
  function again() {
    rnd.current = rngFor(play, false);
    setRound(hideRound(rnd.current, play.level));
    setScores([]); setMisses([]); setLeft(total); leftRef.current = total; setWiggle(0); setShake(null); setPhase("hiding");
  }

  const cols = round.spots.length <= 4 ? "grid-cols-2" : "grid-cols-3";
  const reveal = phase === "found" || phase === "lost";

  return (
    <section aria-labelledby="g-escondidas" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-escondidas" className="text-3xl">Escondidas con Mochito</h2>
      <p className="text-muted-foreground">
        Mochito se esconde detrás de algo del local. Fíjate bien: {play.level === "facil" ? "se le asoma la colita, y lo que se mueve un poquito puede ser él." : play.level === "dificil" ? "solo se mueve una vez, así que no parpadees." : "lo que se mueve un poquito puede ser él."} Encuéntralo antes de que se acabe el tiempo.
      </p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-live="polite">
        <span>Ronda: <span className="tabular-nums">{Math.min(scores.length + 1, HIDE_ROUNDS)} de {HIDE_ROUNDS}</span></span>
        <span>Tiempo: <span className="tabular-nums">{Math.ceil(left / 1000)} s</span></span>
        <span>Encontrado: <span className="tabular-nums">{scores.filter((s) => s > 0).length}</span></span>
      </div>
      <p className="min-h-6 font-semibold" aria-live="polite">
        {phase === "hiding" ? "Tapa tus ojos… Mochito se está escondiendo. 1, 2, 3…" : phase === "seek" ? (missNow ? "Aquí no está. ¡Sigue buscando!" : "¿Dónde está Mochito?") : phase === "found" ? "¡Lo encontraste! ¡Guau!" : `¡Se acabó el tiempo! Estaba en: ${round.spots[round.at].toLowerCase()}.`}
      </p>
      <ul className={cn("grid gap-3", cols)}>
        {round.spots.map((name, i) => {
          const Icon = SPOT_ICON[name] ?? Package;
          const here = i === round.at;
          const wig = here && phase === "seek" && wiggle > 0 && !reduce;
          const shook = shake?.i === i && !reduce;
          return (
            <li key={`${scores.length}-${name}`}>
              <motion.button
                type="button"
                disabled={phase !== "seek"}
                onClick={() => tap(i)}
                aria-label={`Buscar en ${name.toLowerCase()}`}
                key={wig ? `w${wiggle}` : shook ? `s${shake!.n}` : "quieto"}
                initial={false}
                animate={wig ? { transform: ["rotate(0deg)", "rotate(-4deg)", "rotate(4deg)", "rotate(0deg)"] } : shook ? { transform: ["translateX(0px)", "translateX(-6px)", "translateX(6px)", "translateX(0px)"] } : undefined}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className={cn("relative flex min-h-28 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl border-2 bg-card p-3 text-sm font-semibold disabled:cursor-default", reveal && here ? "border-primary" : "border-border", phase === "seek" && "hover:border-primary active:scale-[0.97]")}
              >
                {reveal && here ? (
                  <motion.span className="block h-16" initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.95) translateY(8px)" }} animate={{ opacity: 1, transform: "scale(1) translateY(0px)" }} transition={{ duration: 0.3, ease: EASE_OUT }}>
                    <DressedImage char="mochito" outfit={profile.mochito_outfit} alt="" className="h-full" />
                  </motion.span>
                ) : (
                  <Icon className="size-10 text-primary" aria-hidden />
                )}
                {name}
                {here && phase === "seek" && play.level === "facil" && (
                  <span aria-hidden className="absolute right-2 top-3 h-6 w-2 origin-bottom rotate-[28deg] rounded-full bg-[#b8875a]" />
                )}
              </motion.button>
            </li>
          );
        })}
      </ul>
      {done ? (
        <Result game="escondidas" play={play} score={avg(scores)} onAgain={again} onExit={onExit} detail={`Encontraste a Mochito ${scores.filter((s) => s > 0).length} de ${HIDE_ROUNDS} veces.`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}
