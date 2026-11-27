"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bone, Cookie, Eraser, Heart, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MochitoFigure } from "@/components/mochito-figure";
import { HouseArt } from "@/components/mochito-house";
import { ThingArt } from "@/components/mochito-things";
import { PuppyArt } from "@/components/puppy-art";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import { db } from "@/lib/db/db";
import { useProfile } from "@/lib/db/profile";
import { rng } from "@/lib/game/engine";
import { mochitoDo, savePainting } from "@/lib/mochito-actions";
import {
  PAINT_COLORS, RAIN_LIVES, RAIN_MS, RAIN_POINTS, mazeMove, mazeOf, mazeScore, mazeSeed, mazeShortest, mazeSize, minSwaps, paintScore,
  puzzleScore, puzzleShuffle, puzzleSize, puzzleSolved, rainScore, rainSpec, E, S, type Dir,
} from "@/lib/mochito-more";
import { FRIENDS } from "@/lib/mochito-play";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// ---------- Rompecabezas ----------

type Pic = { kind: "casita" } | { kind: "parque" } | { kind: "foto"; id: string; data: string };

/** La imagen del rompecabezas a tamaño completo (cada pieza muestra un pedazo). */
function Picture({ pic, outfit, house }: { pic: Pic; outfit?: Record<string, string>; house?: Parameters<typeof HouseArt>[0]["house"] }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (pic.kind === "foto") return <img src={pic.data} alt="" draggable={false} className="h-full w-full select-none object-cover" />;
  const park = pic.kind === "parque";
  return (
    <div className="relative h-full w-full" style={{ background: park ? "linear-gradient(#cfe8fb 0 66%, #9fdcb4 66% 100%)" : "linear-gradient(#d6ecfb 0 64%, #a5dcae 64% 100%)" }}>
      {park ? (
        <>
          <span className="absolute left-[6%] top-[10%] h-[10%] w-[24%] rounded-full bg-white" />
          <span className="absolute right-[8%] top-[6%] size-[16%] rounded-full bg-[#f6c744]" />
          <span className="absolute bottom-[8%] left-[4%] block h-[30%] w-[30%]"><PuppyArt friend={FRIENDS[0]} /></span>
          <span className="absolute bottom-[8%] right-[4%] block h-[30%] w-[30%]"><PuppyArt friend={FRIENDS[1]} /></span>
        </>
      ) : (
        <span className="absolute bottom-[10%] left-[3%] block h-[52%] w-[56%]"><HouseArt house={house} /></span>
      )}
      <span className={cn("absolute bottom-[4%] block h-[62%]", park ? "left-1/2 -translate-x-1/2" : "right-[6%]")}><MochitoFigure outfit={outfit} /></span>
    </div>
  );
}

/** Arma la foto: toca dos piezas para cambiarlas de lugar. */
export function PuzzleGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const { profile } = useProfile();
  const reduce = useReducedMotion();
  const photos = useLiveQuery(() => db.mochito_photos.orderBy("at").reverse().limit(6).toArray(), []);
  const n = puzzleSize(play.level);
  const [pic, setPic] = useState<Pic | null>(null);
  const [perm, setPerm] = useState<number[]>([]);
  const [min, setMin] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [swaps, setSwaps] = useState(0);
  const [round, setRound] = useState(0);
  const done = perm.length > 0 && puzzleSolved(perm);

  useEffect(() => { if (done) { sfx("success"); void mochitoDo("game", { game: "Rompecabezas de Mochito" }); } }, [done]);

  function start(p: Pic) {
    const sh = puzzleShuffle(rngFor(play, round === 0), n);
    setPic(p); setPerm(sh); setMin(minSwaps(sh)); setSwaps(0); setPick(null);
  }
  function tap(i: number) {
    if (done) return;
    if (pick === null) { setPick(i); sfx("click"); return; }
    if (pick === i) { setPick(null); return; }
    const next = [...perm];
    [next[pick], next[i]] = [next[i], next[pick]];
    setPerm(next); setSwaps((s) => s + 1); setPick(null);
    sfx(next[i] === i || next[pick] === pick ? "coin" : "click");
  }
  function again() { setRound((r) => r + 1); setPic(null); setPerm([]); }

  const options: Pic[] = [{ kind: "casita" }, { kind: "parque" }, ...(photos ?? []).map((p) => ({ kind: "foto" as const, id: p.id, data: p.data }))];

  return (
    <section aria-labelledby="g-rompe" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-rompe" className="text-3xl">Rompecabezas de Mochito</h2>
      {!pic ? (
        <>
          <p className="text-muted-foreground">Elige la foto que quieres armar. Puedes usar las que le tomaste en su álbum.</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {options.map((o, k) => (
              <li key={o.kind === "foto" ? o.id : o.kind}>
                <button type="button" onClick={() => start(o)} className="flex w-full flex-col items-center gap-1 rounded-3xl border-2 border-border bg-card p-2 text-sm font-semibold active:scale-[0.97]">
                  <span className="block aspect-square w-full overflow-hidden rounded-2xl"><Picture pic={o} outfit={profile.mochito_outfit} house={profile.mochito_house} /></span>
                  {o.kind === "casita" ? "Su casita" : o.kind === "parque" ? "En el parque" : `Foto ${k - 1}`}
                </button>
              </li>
            ))}
          </ul>
          <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </>
      ) : (
        <>
          <p className="text-muted-foreground">Toca una pieza y luego otra para cambiarlas de lugar. Se arma con {min} cambios como mínimo.</p>
          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
            <span>Cambios: <span className="tabular-nums">{swaps}</span></span>
            <span>En su lugar: <span className="tabular-nums">{perm.filter((x, i) => x === i).length} de {n * n}</span></span>
            <span className="ml-auto block size-14 overflow-hidden rounded-xl border-2 border-border" aria-label="Así se ve armada"><Picture pic={pic} outfit={profile.mochito_outfit} house={profile.mochito_house} /></span>
          </div>
          <div className={cn("grid aspect-square w-full max-w-md overflow-hidden rounded-3xl border-4 border-[#f2e3c6]", done ? "gap-0" : "gap-0.5 bg-[#f2e3c6]")} style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
            {perm.map((tile, i) => {
              const r = Math.floor(tile / n), c = tile % n;
              return (
                <motion.button
                  key={tile}
                  layout={!reduce}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  type="button"
                  onClick={() => tap(i)}
                  aria-label={`Pieza ${tile + 1}${pick === i ? ", elegida" : ""}`}
                  aria-pressed={pick === i}
                  className={cn("relative aspect-square overflow-hidden", pick === i && "z-10 outline-4 -outline-offset-4 outline-primary")}
                >
                  <span className="pointer-events-none absolute block" style={{ width: `${n * 100}%`, height: `${n * 100}%`, left: `${-c * 100}%`, top: `${-r * 100}%` }}>
                    <Picture pic={pic} outfit={profile.mochito_outfit} house={profile.mochito_house} />
                  </span>
                </motion.button>
              );
            })}
          </div>
          {done ? (
            <Result game="rompecabezas" play={play} score={puzzleScore(swaps, min)} onAgain={again} onExit={onExit} detail={`¡Lo armaste con ${swaps} cambios (el mínimo era ${min})! Mochito dice: «¡Salí guapísimo!»`} />
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="h-12 rounded-2xl px-6 text-base" onClick={() => setPic(null)}>Otra foto</Button>
              <Button variant="outline" className="h-12 rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ---------- Lluvia de galletas ----------

interface Drop { id: number; x: number; y: number; kind: "galleta" | "dorada" | "rama"; spin: number }

/** Llueven galletas del cielo: Mochito las atrapa en su platito y esquiva las ramitas. Tiene 3 vidas. */
export function CookieRainGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const { profile } = useProfile();
  const reduce = useReducedMotion();
  const spec = rainSpec(play.level);
  const arena = useRef<HTMLDivElement>(null);
  const [round, setRound] = useState(0);
  const [items, setItems] = useState<Drop[]>([]);
  const [dog, setDog] = useState(0.5);
  const dogRef = useRef(0.5);
  const [st, setSt] = useState({ got: 0, possible: 0, lives: RAIN_LIVES, combo: 0, best: 0, ouch: 0 });
  const [left, setLeft] = useState(RAIN_MS);
  const [over, setOver] = useState(false);
  const hold = useRef(0);

  useEffect(() => { dogRef.current = dog; }, [dog]);

  useEffect(() => {
    let rnd = rngFor(play, round === 0);
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let spawnIn = 500;
    let nextId = 1;
    let local: Drop[] = [];
    const s = { got: 0, possible: 0, lives: RAIN_LIVES, combo: 0, best: 0, ouch: 0 };
    const loop = (t: number) => {
      const dt = Math.min(64, t - last);
      last = t;
      elapsed += dt;
      spawnIn -= dt;
      if (hold.current) setDog((d) => Math.min(0.9, Math.max(0.1, d + hold.current * dt * 0.0011)));
      if (spawnIn <= 0 && elapsed < RAIN_MS - 1200) {
        spawnIn = spec.every * (0.7 + rnd() * 0.6);
        const r = rnd();
        const kind = r < spec.branch ? "rama" : r < spec.branch + spec.gold ? "dorada" : "galleta";
        local.push({ id: nextId++, x: 0.08 + rnd() * 0.84, y: -0.08, kind, spin: rnd() * 360 });
        if (kind !== "rama") s.possible += RAIN_POINTS[kind];
      }
      const next: Drop[] = [];
      for (const it of local) {
        const y = it.y + (spec.speed * (it.kind === "dorada" ? 1.2 : 1) * dt) / 1000;
        if (y >= 0.7 && y < 0.86 && Math.abs(it.x - dogRef.current) < 0.11) {
          if (it.kind === "rama") { s.lives--; s.combo = 0; s.ouch++; sfx("sad"); }
          else { s.got += RAIN_POINTS[it.kind]; s.combo++; s.best = Math.max(s.best, s.combo); sfx(it.kind === "dorada" ? "cash" : "coin"); }
          continue;
        }
        if (y >= 1.02 && it.kind !== "rama") s.combo = 0;
        if (y < 1.05) next.push({ ...it, y });
      }
      local = next;
      setItems(local);
      setSt({ ...s });
      setLeft(Math.max(0, RAIN_MS - elapsed));
      if (elapsed >= RAIN_MS || s.lives <= 0) { setOver(true); setItems([]); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); rnd = () => 0; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  useEffect(() => { if (over) void mochitoDo("game", { game: "Lluvia de galletas" }); }, [over]);

  function moveTo(clientX: number) {
    const r = arena.current?.getBoundingClientRect();
    if (r) setDog(Math.min(0.9, Math.max(0.1, (clientX - r.left) / r.width)));
  }
  function again() { setOver(false); setItems([]); setLeft(RAIN_MS); setSt({ got: 0, possible: 0, lives: RAIN_LIVES, combo: 0, best: 0, ouch: 0 }); setRound((n) => n + 1); }
  const holdBtn = (dir: -1 | 1, label: string, Icon: typeof ArrowLeft) => (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => { e.preventDefault(); hold.current = dir; }}
      onPointerUp={() => { hold.current = 0; }}
      onPointerLeave={() => { hold.current = 0; }}
      onPointerCancel={() => { hold.current = 0; }}
      className="flex size-14 touch-none items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"
    >
      <Icon className="size-6" aria-hidden />
    </button>
  );

  return (
    <section aria-labelledby="g-lluvia" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-lluvia" className="text-3xl">Lluvia de galletas</h2>
      <p className="text-muted-foreground">Mueve a Mochito con el dedo, las flechas o los botones. Atrapa las galletas en su platito (las doradas valen {RAIN_POINTS.dorada}) y esquiva las ramitas: con tres golpes se acaba.</p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-live="polite">
        <span>Tiempo: <span className="tabular-nums">{Math.ceil(left / 1000)} s</span></span>
        <span>Galletas: <span className="tabular-nums">{st.got}</span></span>
        <span className="flex items-center gap-0.5" aria-label={`Vidas: ${st.lives}`}>
          {Array.from({ length: RAIN_LIVES }, (_, k) => <Heart key={k} className={cn("size-5", k < st.lives ? "fill-[#e2457a] text-[#e2457a]" : "text-muted-foreground/40")} aria-hidden />)}
        </span>
        {st.combo >= 5 && <span className="rounded-full bg-[var(--gold)] px-2.5 py-0.5 text-foreground">¡{st.combo} seguidas!</span>}
      </div>
      <div
        ref={arena}
        tabIndex={0}
        role="application"
        aria-label="Zona de juego. Usa las flechas izquierda y derecha para mover a Mochito."
        className="relative h-[26rem] touch-none select-none overflow-hidden rounded-[2rem] bg-gradient-to-b from-slate-200 to-sky-100 outline-none focus-visible:ring-4 focus-visible:ring-ring/40 dark:from-slate-800 dark:to-sky-950"
        onPointerMove={(e) => { if (e.buttons || e.pointerType !== "mouse") moveTo(e.clientX); }}
        onPointerDown={(e) => moveTo(e.clientX)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") { e.preventDefault(); setDog((b) => Math.max(0.1, b - 0.07)); }
          if (e.key === "ArrowRight") { e.preventDefault(); setDog((b) => Math.min(0.9, b + 0.07)); }
        }}
      >
        {[4, 30, 62].map((x) => <span key={x} aria-hidden className="absolute -top-3 h-10 w-28 rounded-full bg-white/90 dark:bg-slate-600" style={{ left: `${x}%` }} />)}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-emerald-200 dark:bg-emerald-900" aria-hidden />
        {items.map((it) => (
          <span key={it.id} aria-hidden className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%` }}>
            {it.kind === "rama" ? (
              <svg viewBox="0 0 40 20" className="h-6 w-12" style={{ transform: `rotate(${it.spin}deg)` }}><path d="M2 12 Q20 6 38 9 M18 9 L26 2 M26 9 L30 16" stroke="#6b4a2b" strokeWidth="3.5" fill="none" strokeLinecap="round" /><ellipse cx="28" cy="3" rx="4" ry="2.4" fill="#5bb06a" /></svg>
            ) : (
              <Cookie className={cn("size-9 drop-shadow", it.kind === "dorada" ? "fill-[#f6c744] text-[#c99a1e]" : "fill-[#e0b07a] text-[#8a5a2e]")} style={{ transform: `rotate(${it.spin}deg)` }} />
            )}
          </span>
        ))}
        <motion.span
          key={st.ouch}
          className="absolute bottom-3 block h-24 -translate-x-1/2"
          style={{ left: `${dog * 100}%` }}
          aria-hidden
          initial={false}
          animate={st.ouch && !reduce ? { transform: ["translateX(-50%) rotate(0deg)", "translateX(-50%) rotate(-10deg)", "translateX(-50%) rotate(8deg)", "translateX(-50%) rotate(0deg)"] } : { transform: "translateX(-50%)" }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
        >
          <span className="absolute -top-5 left-1/2 block h-8 w-16 -translate-x-1/2"><ThingArt id="pet:plato" /></span>
          <MochitoFigure outfit={profile.mochito_outfit} />
        </motion.span>
      </div>
      {over ? (
        <Result game="lluvia" play={play} score={rainScore(st.got, st.possible, st.lives)} onAgain={again} onExit={onExit} detail={`Atrapó ${st.got} puntos de galletas (racha más larga: ${st.best}).${st.lives <= 0 ? " Se le acabaron las vidas con las ramitas." : ""} Mochito dice: «¡Qué rica lluvia!»`} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {holdBtn(-1, "Mover a la izquierda", ArrowLeft)}
          {holdBtn(1, "Mover a la derecha", ArrowRight)}
          <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Laberinto del hueso ----------

/** Guía a Mochito hasta su hueso. El primer laberinto es el del día; «otra vez» da uno nuevo. */
export function MazeGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const { profile } = useProfile();
  const reduce = useReducedMotion();
  const size = mazeSize(play.level);
  const [round, setRound] = useState(0);
  const [maze, setMaze] = useState(() => mazeOf(play.seedKey ? rng(play.seedKey) : rng(mazeSeed(Date.now(), play.level)), size));
  const [at, setAt] = useState(0);
  const [steps, setSteps] = useState(0);
  const [trail, setTrail] = useState<Set<number>>(() => new Set([0]));
  const [bump, setBump] = useState(0);
  const [face, setFace] = useState(1);
  const shortest = mazeShortest(maze);
  const done = at === maze.goal;
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const atRef = useRef(at);
  useEffect(() => { atRef.current = at; }, [at]);

  function go(d: Dir) {
    if (atRef.current === maze.goal) return;
    const next = mazeMove(maze, atRef.current, d);
    if (d === "izquierda") setFace(-1);
    if (d === "derecha") setFace(1);
    if (next === atRef.current) { setBump((b) => b + 1); return; }
    atRef.current = next;
    setAt(next);
    setSteps((s) => s + 1);
    setTrail((t) => new Set([...t, next]));
    if (next === maze.goal) { sfx("success"); void mochitoDo("game", { game: "Laberinto del hueso" }); } else sfx("click");
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d: Dir | undefined = ({ ArrowUp: "arriba", ArrowDown: "abajo", ArrowLeft: "izquierda", ArrowRight: "derecha" } as Record<string, Dir>)[e.key];
      if (!d) return;
      e.preventDefault();
      go(d);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function again() {
    const m = mazeOf(rngFor(play, false), size);
    setMaze(m); setAt(0); atRef.current = 0; setSteps(0); setTrail(new Set([0])); setRound((r) => r + 1);
  }

  const cell = 100 / size;
  const pad = (d: Dir, Icon: typeof ArrowUp, label: string, cls: string) => (
    <button type="button" aria-label={label} onClick={() => go(d)} className={cn("flex size-14 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]", cls)}><Icon className="size-6" aria-hidden /></button>
  );

  return (
    <section aria-labelledby="g-laberinto" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-laberinto" className="text-3xl">Laberinto del hueso</h2>
      <p className="text-muted-foreground">Lleva a Mochito hasta su hueso con las flechas, deslizando el dedo sobre el laberinto o con los botones. {round === 0 && !play.seedKey ? "Este es el laberinto de hoy: mañana hay otro." : "Laberinto nuevo."}</p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-live="polite">
        <span>Pasos: <span className="tabular-nums">{steps}</span></span>
        <span className="text-muted-foreground">El camino más corto: {shortest}</span>
      </div>
      <div
        className="relative aspect-square w-full max-w-md touch-none select-none rounded-3xl bg-[#e9f5e1] p-2 dark:bg-emerald-950"
        onPointerDown={(e) => { swipe.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={(e) => {
          const s0 = swipe.current;
          swipe.current = null;
          if (!s0) return;
          const dx = e.clientX - s0.x, dy = e.clientY - s0.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
          go(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "derecha" : "izquierda") : dy > 0 ? "abajo" : "arriba");
        }}
        role="application"
        aria-label={`Laberinto de ${size} por ${size}. Mochito está en la fila ${Math.floor(at / size) + 1}, columna ${(at % size) + 1}.`}
      >
        <div className="relative h-full w-full">
          {[...trail].map((c) => <span key={c} aria-hidden className="absolute bg-[#cde8bf] dark:bg-emerald-800" style={{ left: `${(c % size) * cell}%`, top: `${Math.floor(c / size) * cell}%`, width: `${cell}%`, height: `${cell}%` }} />)}
          <svg viewBox={`0 0 ${size * 10} ${size * 10}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <rect x="0" y="0" width={size * 10} height={size * 10} fill="none" stroke="#5a8a4a" strokeWidth="1.6" rx="1" />
            {maze.open.map((o, c) => {
              const x = (c % size) * 10, y = Math.floor(c / size) * 10;
              return (
                <g key={c} stroke="#5a8a4a" strokeWidth="1.6" strokeLinecap="round">
                  {!(o & E) && c % size < size - 1 && <path d={`M${x + 10} ${y} V${y + 10}`} />}
                  {!(o & S) && Math.floor(c / size) < size - 1 && <path d={`M${x} ${y + 10} H${x + 10}`} />}
                </g>
              );
            })}
          </svg>
          <span className="absolute flex items-center justify-center" style={{ left: `${(maze.goal % size) * cell}%`, top: `${Math.floor(maze.goal / size) * cell}%`, width: `${cell}%`, height: `${cell}%` }} aria-hidden>
            <Bone className={cn("size-3/4 fill-[#f4e4c8] text-[#a8703f]", done && "opacity-0")} />
          </span>
          <span
            className="absolute left-0 top-0 flex items-end justify-center"
            style={{ width: `${cell}%`, height: `${cell}%`, transform: `translate(${(at % size) * 100}%, ${Math.floor(at / size) * 100}%)`, transition: reduce ? undefined : "transform 140ms cubic-bezier(0.23, 1, 0.32, 1)" }}
            aria-hidden
          >
            <span className="block h-[92%]" style={{ transform: `scaleX(${face})` }}>
              <motion.span key={bump} className="block h-full" initial={false} animate={bump && !reduce ? { transform: ["translateX(0px)", "translateX(-3px)", "translateX(3px)", "translateX(0px)"] } : undefined} transition={{ duration: 0.2, ease: EASE_OUT }}>
                <MochitoFigure outfit={profile.mochito_outfit} />
              </motion.span>
            </span>
          </span>
        </div>
      </div>
      {done ? (
        <Result game="laberinto" play={play} score={mazeScore(steps, shortest)} onAgain={again} onExit={onExit} detail={`¡Llegó a su hueso en ${steps} pasos (el camino más corto era de ${shortest})! Mochito dice: «¡Ñam! Gracias por guiarme.»`} />
      ) : (
        <div className="flex items-end justify-between gap-4">
          <div className="grid grid-cols-3 gap-1.5">
            {pad("arriba", ArrowUp, "Arriba", "col-start-2")}
            {pad("izquierda", ArrowLeft, "Izquierda", "col-start-1 row-start-2")}
            {pad("abajo", ArrowDown, "Abajo", "col-start-2 row-start-2")}
            {pad("derecha", ArrowRight, "Derecha", "col-start-3 row-start-2")}
          </div>
          <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Pinta a Mochito ----------

const INK = "#3a2a22";
type Region = { id: string; name: string; el: (fill: string) => React.ReactElement };
const R = (id: string, name: string, el: (fill: string) => React.ReactElement): Region => ({ id, name, el });
const sw = { stroke: INK, strokeWidth: 2.6, strokeLinejoin: "round" as const };
const REGIONS: Region[] = [
  R("cielo", "El cielo", (f) => <rect x="0" y="0" width="300" height="205" fill={f} />),
  R("sol", "El sol", (f) => <circle cx="248" cy="52" r="26" fill={f} {...sw} />),
  R("pasto", "El pasto", (f) => <path d="M0 200 Q150 182 300 200 V300 H0 Z" fill={f} {...sw} />),
  R("cola", "La cola", (f) => <path d="M80 205 Q38 178 50 138 Q62 146 64 162 Q72 186 96 194 Z" fill={f} {...sw} />),
  R("anca", "La pata de atrás", (f) => <ellipse cx="86" cy="238" rx="26" ry="20" fill={f} {...sw} />),
  R("cuerpo", "El cuerpo", (f) => <ellipse cx="122" cy="206" rx="56" ry="46" fill={f} {...sw} />),
  R("mancha", "La manchita", (f) => <ellipse cx="104" cy="196" rx="17" ry="12" fill={f} {...sw} />),
  R("pata-1", "Una patita", (f) => <rect x="112" y="214" width="22" height="54" rx="10" fill={f} {...sw} />),
  R("pata-2", "Otra patita", (f) => <rect x="142" y="212" width="22" height="56" rx="10" fill={f} {...sw} />),
  R("collar", "El collar", (f) => <path d="M126 158 Q162 176 196 158 L198 171 Q162 190 124 171 Z" fill={f} {...sw} />),
  R("cabeza", "La cabeza", (f) => <circle cx="164" cy="118" r="46" fill={f} {...sw} />),
  R("oreja-1", "Una oreja", (f) => <path d="M132 86 Q102 100 110 150 Q128 140 140 104 Z" fill={f} {...sw} />),
  R("oreja-2", "La otra oreja", (f) => <path d="M194 84 Q226 98 218 146 Q200 136 188 102 Z" fill={f} {...sw} />),
  R("hocico", "El hocico", (f) => <ellipse cx="170" cy="140" rx="25" ry="17" fill={f} {...sw} />),
  R("nariz", "La nariz", (f) => <ellipse cx="170" cy="129" rx="8.5" ry="6" fill={f} {...sw} />),
  R("placa", "La placa", (f) => <circle cx="161" cy="186" r="8" fill={f} {...sw} />),
  R("pelota", "La pelota", (f) => <circle cx="246" cy="250" r="22" fill={f} {...sw} />),
];
const BLANK = "#ffffff";
const ERASE = "borrar";

/** Colorea a Mochito: elige un color y toca cada parte. Al terminar se guarda en su álbum. */
export function PaintGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const [fills, setFills] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<Record<string, string>[]>([]);
  const [color, setColor] = useState(PAINT_COLORS[0].hex);
  const [saved, setSaved] = useState<"no" | "saving" | "yes">("no");
  const svg = useRef<SVGSVGElement>(null);
  const colored = REGIONS.filter((r) => fills[r.id]).length;

  function paint(id: string) {
    if (saved !== "no") return;
    setHistory((h) => [...h.slice(-30), fills]);
    setFills((f) => { const n = { ...f }; if (color === ERASE) delete n[id]; else n[id] = color; return n; });
    sfx("click");
  }
  function undo() { setHistory((h) => { if (h.length) setFills(h[h.length - 1]); return h.slice(0, -1); }); }

  async function finish() {
    if (!svg.current) return;
    setSaved("saving");
    try {
      const xml = new XMLSerializer().serializeToString(svg.current);
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
      await new Promise<void>((ok, bad) => { img.onload = () => ok(); img.onerror = () => bad(); setTimeout(ok, 3000); });
      const canvas = document.createElement("canvas");
      canvas.width = 600; canvas.height = 600;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 600, 600);
      ctx.drawImage(img, 0, 0, 600, 600);
      await savePainting(canvas.toDataURL("image/jpeg", 0.9));
    } catch {}
    setSaved("yes");
    sfx("success");
    void mochitoDo("game", { game: "Pinta a Mochito" });
  }
  function again() { setFills({}); setHistory([]); setSaved("no"); }

  return (
    <section aria-labelledby="g-pintar" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-pintar" className="text-3xl">Pinta a Mochito</h2>
      <p className="text-muted-foreground">Elige un color y toca cada parte del dibujo. Cuando termines, se guarda en el álbum de fotos de Mochito.</p>
      <p className="text-sm font-semibold">Pintaste {colored} de {REGIONS.length} partes.</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colores">
        {PAINT_COLORS.map((c) => (
          <button key={c.id} type="button" role="radio" aria-checked={color === c.hex} aria-label={c.name} onClick={() => setColor(c.hex)} className={cn("size-11 rounded-full border-4 active:scale-[0.97]", color === c.hex ? "border-primary" : "border-card shadow")} style={{ background: c.hex }} />
        ))}
        <button type="button" role="radio" aria-checked={color === ERASE} aria-label="Borrador" onClick={() => setColor(ERASE)} className={cn("flex size-11 items-center justify-center rounded-full border-4 bg-card active:scale-[0.97]", color === ERASE ? "border-primary" : "border-card shadow")}><Eraser className="size-5" aria-hidden /></button>
      </div>
      <svg ref={svg} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" className="aspect-square w-full max-w-md rounded-3xl border-4 border-[#f2e3c6] bg-white" role="group" aria-label="Dibujo para colorear">
        {REGIONS.map((r) => (
          <g key={r.id} role="button" tabIndex={0} aria-label={`${r.name}${fills[r.id] ? ", pintada" : ""}`} onClick={() => paint(r.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); paint(r.id); } }} className="cursor-pointer outline-none focus-visible:opacity-80">
            {r.el(fills[r.id] ?? BLANK)}
          </g>
        ))}
        <g pointerEvents="none">
          <path d="M226 240 Q246 252 268 244 M232 266 Q246 254 262 268" stroke={INK} strokeWidth="2" fill="none" />
          <circle cx="150" cy="110" r="5.5" fill={INK} />
          <circle cx="186" cy="110" r="5.5" fill={INK} />
          <circle cx="151.8" cy="108.2" r="1.8" fill="#fff" />
          <circle cx="187.8" cy="108.2" r="1.8" fill="#fff" />
          <path d="M170 135 V146 M160 147 Q170 156 180 147" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M116 262 H130 M146 262 H160" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
      {saved === "yes" ? (
        <Result game="pintar" play={play} score={paintScore(colored, REGIONS.length)} onAgain={again} onExit={onExit} detail={`¡Quedó precioso! Pintaste ${colored} de ${REGIONS.length} partes y el dibujo ya está en su álbum de fotos.`} />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button className="h-12 rounded-2xl px-6 text-base" disabled={colored === 0 || saved === "saving"} onClick={() => void finish()}>{saved === "saving" ? "Guardando…" : "Terminar y guardar"}</Button>
          <Button variant="outline" className="h-12 rounded-2xl px-6 text-base" disabled={!history.length} onClick={undo}><Undo2 className="size-4" aria-hidden /> Deshacer</Button>
          <Button variant="outline" className="h-12 rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}
