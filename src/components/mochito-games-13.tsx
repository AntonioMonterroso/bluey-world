"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bone, Cookie, Eraser, Fish, Flower2, Heart, Ship, Star, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import { mochitoDo } from "@/lib/mochito-actions";
import {
  WORM_SIZE, boxesClosed, boxesEdges, boxesMove, boxesScore, boxesSize, shipsAim, shipsAllSunk, shipsPlace, shipsScore, shipsShot, shipsSpec, shipsSunk,
  sudokuClash, sudokuMake, sudokuScore, sudokuSolved, wormScore, wormSpec, wormCanTurn, wormStart, wormStep, type Way, type Worm,
} from "@/lib/mochito-extra-6";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const ME = "#3f74c4";
const HIM = "#e3893a";

// ---------- Sudoku de huellitas ----------

const SYMS = [
  { I: Bone, c: "#8a5a2e", n: "Hueso" }, { I: Heart, c: "#d6453d", n: "Corazón" }, { I: Star, c: "#e3a72f", n: "Estrella" },
  { I: Fish, c: "#3f74c4", n: "Pescado" }, { I: Flower2, c: "#c2569a", n: "Flor" }, { I: Sun, c: "#4a9a5b", n: "Sol" },
];

/** Sudoku con dibujos: llena la cuadrícula sin repetir en fila, columna ni cuadro. */
export function SudokuGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const [s, setS] = useState(() => sudokuMake(rngFor(play, true), play.level));
  const [g, setG] = useState<number[]>(() => s.puzzle);
  const [sel, setSel] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [bad, setBad] = useState<number[]>([]);
  const solved = sudokuSolved(g, s);

  useEffect(() => { if (solved) void mochitoDo("game", { game: "Sudoku de huellitas" }); }, [solved]);

  function put(v: number) {
    if (sel === null || s.puzzle[sel] || solved) return;
    const clash = v ? sudokuClash(g, s, sel, v) : [];
    const n = g.map((x, i) => (i === sel ? v : x));
    setG(n);
    if (clash.length) { setMistakes((m) => m + 1); setBad([sel, ...clash]); sfx("sad"); } else { setBad([]); sfx(v ? "coin" : "click"); }
    if (sudokuSolved(n, s)) sfx("success");
  }
  function again() { const n = sudokuMake(rngFor(play, false), play.level); setS(n); setG(n.puzzle); setSel(null); setMistakes(0); setBad([]); }
  const syms = SYMS.slice(0, s.size);

  return (
    <section aria-labelledby="g-sudoku" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-sudoku" className="text-3xl">Sudoku de huellitas</h2>
      <p className="text-muted-foreground">Toca una casilla vacía y elige un dibujo. En cada fila, cada columna y cada cuadro de borde grueso tiene que estar cada dibujo una sola vez. Si alguno se repite, se pone rojo.</p>
      <p className="text-sm font-semibold" aria-live="polite">Faltan {g.filter((v) => !v).length} · Equivocaciones: {mistakes}</p>
      <div className="mx-auto grid w-full max-w-sm overflow-hidden rounded-2xl border-4 border-foreground/70 bg-card" style={{ gridTemplateColumns: `repeat(${s.size}, minmax(0, 1fr))` }} role="grid" aria-label="Sudoku">
        {g.map((v, i) => {
          const r = Math.floor(i / s.size), c = i % s.size;
          const sym = v ? syms[v - 1] : null;
          const fixed = !!s.puzzle[i];
          return (
            <button
              key={i}
              type="button"
              role="gridcell"
              aria-label={`Fila ${r + 1}, columna ${c + 1}: ${sym ? sym.n : "vacía"}${fixed ? " (ya venía)" : ""}`}
              aria-selected={sel === i}
              onClick={() => { if (!fixed) { setSel(i); sfx("click"); } }}
              className={cn(
                "flex aspect-square items-center justify-center border-foreground/20",
                c % s.bw === s.bw - 1 && c < s.size - 1 ? "border-r-4 border-r-foreground/70" : c < s.size - 1 && "border-r",
                r % s.bh === s.bh - 1 && r < s.size - 1 ? "border-b-4 border-b-foreground/70" : r < s.size - 1 && "border-b",
                fixed ? "bg-secondary/70" : "bg-card",
                sel === i && "bg-primary/15 ring-4 ring-inset ring-primary",
                bad.includes(i) && "bg-destructive/20",
              )}
            >
              {sym && <sym.I className="size-[55%]" style={{ color: sym.c }} fill={fixed ? sym.c : "none"} strokeWidth={2} aria-hidden />}
            </button>
          );
        })}
      </div>
      {solved ? (
        <Result game="sudoku" play={play} score={sudokuScore(mistakes)} onAgain={again} onExit={onExit} detail={mistakes ? `¡Lo terminaste! Te equivocaste ${mistakes} ${mistakes === 1 ? "vez" : "veces"}.` : "¡Perfecto, sin una sola equivocación! Mochito te da la pata."} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Dibujos">
            {syms.map((x, k) => <button key={x.n} type="button" disabled={sel === null} aria-label={x.n} onClick={() => put(k + 1)} className="flex size-12 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97] disabled:opacity-50"><x.I className="size-6" style={{ color: x.c }} aria-hidden /></button>)}
            <button type="button" disabled={sel === null} aria-label="Borrar" onClick={() => put(0)} className="flex size-12 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97] disabled:opacity-50"><Eraser className="size-5" aria-hidden /></button>
          </div>
          <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Puntos y cajitas ----------

/** Por turnos trazan rayas entre los puntos. Quien cierra una cajita se la queda y vuelve a tirar. */
export function BoxesGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const n = boxesSize(play.level);
  const total = n * n;
  const [rnd, setRnd] = useState(() => rngFor(play, true));
  const [taken, setTaken] = useState<Map<string, "yo" | "el">>(() => new Map());
  const [owner, setOwner] = useState<Map<number, "yo" | "el">>(() => new Map());
  const [turn, setTurn] = useState<"yo" | "el">("yo");
  const [msg, setMsg] = useState("Te toca. Toca entre dos puntos para trazar una raya.");
  const all = boxesEdges(n);
  const over = taken.size >= all.length;
  const mine = [...owner.values()].filter((o) => o === "yo").length;
  const his = owner.size - mine;

  useEffect(() => { if (over) void mochitoDo("game", { game: "Puntos y cajitas" }); }, [over]);

  function draw(e: string, who: "yo" | "el") {
    const set = new Set(taken.keys());
    const closed = boxesClosed(n, set, e);
    const t = new Map(taken); t.set(e, who);
    const o = new Map(owner); closed.forEach((b) => o.set(b, who));
    setTaken(t); setOwner(o);
    if (closed.length) { sfx(who === "yo" ? "coin" : "click"); setMsg(who === "yo" ? `¡Cerraste ${closed.length === 1 ? "una cajita" : `${closed.length} cajitas`}! Vuelves a tirar.` : "Mochito cerró una cajita y vuelve a tirar."); }
    else { sfx("click"); setTurn(who === "yo" ? "el" : "yo"); setMsg(who === "yo" ? "Le toca a Mochito…" : "Te toca."); }
  }
  useEffect(() => {
    if (turn !== "el" || over) return;
    const id = setTimeout(() => { const e = boxesMove(rnd, n, new Set(taken.keys()), play.level); if (e) draw(e, "el"); }, 550);
    return () => clearTimeout(id);
  });
  function again() { const r = rngFor(play, false); setRnd(() => r); setTaken(new Map()); setOwner(new Map()); setTurn("yo"); setMsg("Te toca."); }

  const cell = 100 / n;
  return (
    <section aria-labelledby="g-cajitas" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-cajitas" className="text-3xl">Puntos y cajitas</h2>
      <p className="text-muted-foreground">Por turnos, tú y Mochito trazan una raya entre dos puntos vecinos. Quien pone la cuarta raya de una cajita se la queda y vuelve a tirar. Gana quien tenga más cajitas. Cuidado con dejar tres rayas en una cajita…</p>
      <p className="text-sm font-semibold" aria-live="polite"><span style={{ color: ME }}>Tú: {mine}</span> · <span style={{ color: HIM }}>Mochito: {his}</span> · {over ? "" : msg}</p>
      <div className="relative mx-auto aspect-square w-full max-w-sm rounded-3xl bg-[#fbf3e4] p-6 dark:bg-[#3a3346]">
        <div className="relative h-full w-full">
          {[...owner.entries()].map(([b, who]) => (
            <motion.span key={`b${b}`} className="absolute flex items-center justify-center rounded-md" style={{ left: `${(b % n) * cell}%`, top: `${Math.floor(b / n) * cell}%`, width: `${cell}%`, height: `${cell}%`, background: who === "yo" ? `${ME}33` : `${HIM}33` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, ease: EASE_OUT }} aria-hidden>
              {who === "yo" ? <Bone className="size-1/3" style={{ color: ME }} /> : <span className="block size-1/4 rounded-full" style={{ background: HIM }} />}
            </motion.span>
          ))}
          {all.map((e) => {
            const [t, rs, cs] = e.split(":");
            const r = +rs, c = +cs;
            const who = taken.get(e);
            const h = t === "h";
            return (
              <button
                key={e}
                type="button"
                disabled={!!who || turn !== "yo" || over}
                aria-label={`Raya ${h ? "acostada" : "parada"} ${r + 1}-${c + 1}${who ? (who === "yo" ? ", tuya" : ", de Mochito") : ""}`}
                onClick={() => draw(e, "yo")}
                className="group absolute flex items-center justify-center"
                style={h ? { left: `${c * cell}%`, top: `${r * cell}%`, width: `${cell}%`, height: 28, transform: "translateY(-50%)" } : { left: `${c * cell}%`, top: `${r * cell}%`, width: 28, height: `${cell}%`, transform: "translateX(-50%)" }}
              >
                <span className={cn("block rounded-full transition-[background-color,opacity] duration-150", h ? "h-1.5 w-[86%]" : "h-[86%] w-1.5", !who && "bg-foreground/10 [@media(hover:hover)_and_(pointer:fine)]:group-hover:bg-foreground/35")} style={who ? { background: who === "yo" ? ME : HIM } : undefined} />
              </button>
            );
          })}
          {Array.from({ length: (n + 1) * (n + 1) }, (_, i) => <span key={`d${i}`} className="pointer-events-none absolute block size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/70" style={{ left: `${(i % (n + 1)) * cell}%`, top: `${Math.floor(i / (n + 1)) * cell}%` }} aria-hidden />)}
        </div>
      </div>
      {over ? (
        <Result game="cajitas" play={play} score={boxesScore(mine, total)} onAgain={again} onExit={onExit} detail={mine > his ? `¡Ganaste ${mine} a ${his}!` : mine === his ? `¡Empate a ${mine}!` : `Mochito ganó ${his} a ${mine}. «¿La revancha?»`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}

// ---------- Barquitos escondidos ----------

function Sea({ size, ships, shots, show, onShot, label, small }: { size: number; ships: number[][]; shots: ReadonlySet<number>; show: boolean; onShot?: (i: number) => void; label: string; small?: boolean }) {
  const shipAt = new Set(ships.flat());
  const sunk = new Set(ships.filter((s) => s.every((x) => shots.has(x))).flat());
  return (
    <div className={cn("mx-auto grid w-full gap-0.5 rounded-2xl bg-sky-700 p-1", small ? "max-w-48" : "max-w-sm")} style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }} role="grid" aria-label={label}>
      {Array.from({ length: size * size }, (_, i) => {
        const shot = shots.has(i), ship = shipAt.has(i);
        const state = shot ? (ship ? (sunk.has(i) ? "hundido" : "tocado") : "agua") : "";
        return (
          <button key={i} type="button" role="gridcell" disabled={!onShot || shot} onClick={() => onShot?.(i)} aria-label={`${String.fromCharCode(65 + (i % size))}${Math.floor(i / size) + 1}${state ? `: ${state}` : ""}`} className={cn("flex aspect-square items-center justify-center rounded-[4px]", onShot && !shot && "active:scale-[0.97]", ship && (show || sunk.has(i)) ? "bg-[#8d9aa6]" : "bg-sky-400", shot && !ship && "bg-sky-300", sunk.has(i) && "bg-[#5b6670]")}>
            {shot && (ship ? <motion.span initial={{ opacity: 0, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ duration: 0.15, ease: EASE_OUT }} className="block size-1/2 rounded-full bg-[#d6453d]" aria-hidden /> : <X className="size-1/2 text-white/80" aria-hidden />)}
            {!shot && ship && show && !small && <Ship className="size-1/2 text-white/80" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

/** Cada uno esconde sus barquitos. Por turnos disparan para encontrar los del otro. */
export function ShipsGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const spec = shipsSpec(play.level);
  const [rnd, setRnd] = useState(() => rngFor(play, true));
  const [mine, setMine] = useState(() => shipsPlace(rnd, spec.size, spec.ships));
  const [his, setHis] = useState(() => shipsPlace(rnd, spec.size, spec.ships));
  const [phase, setPhase] = useState<"acomodar" | "jugar" | "fin">("acomodar");
  const [myShots, setMyShots] = useState<Set<number>>(() => new Set());
  const [hisShots, setHisShots] = useState<Set<number>>(() => new Set());
  const [turn, setTurn] = useState<"yo" | "el">("yo");
  const [msg, setMsg] = useState("");
  const won = shipsAllSunk(his, myShots);

  useEffect(() => { if (phase === "fin") void mochitoDo("game", { game: "Barquitos escondidos" }); }, [phase]);
  useEffect(() => {
    if (phase !== "jugar" || turn !== "el") return;
    const id = setTimeout(() => {
      const c = shipsAim(rnd, spec.size, mine, hisShots, play.level);
      const res = shipsShot(mine, hisShots, c);
      const s = new Set(hisShots); s.add(c);
      setHisShots(s);
      setMsg(`Mochito disparó a ${String.fromCharCode(65 + (c % spec.size))}${Math.floor(c / spec.size) + 1}: ${res === "agua" ? "¡agua!" : res === "tocado" ? "¡tocó uno de tus barquitos!" : "¡hundió uno de tus barquitos!"}`);
      sfx(res === "agua" ? "click" : "sad");
      if (shipsAllSunk(mine, s)) { setPhase("fin"); return; }
      setTurn("yo");
    }, 700);
    return () => clearTimeout(id);
  }, [phase, turn, rnd, spec.size, mine, hisShots, play.level]);

  function shoot(c: number) {
    if (turn !== "yo" || phase !== "jugar") return;
    const res = shipsShot(his, myShots, c);
    const s = new Set(myShots); s.add(c);
    setMyShots(s);
    setMsg(res === "agua" ? "¡Agua! Le toca a Mochito…" : res === "tocado" ? "¡Tocado! Le toca a Mochito…" : "¡Hundido! Le toca a Mochito…");
    sfx(res === "agua" ? "click" : res === "tocado" ? "coin" : "cash");
    if (shipsAllSunk(his, s)) { setPhase("fin"); return; }
    setTurn("el");
  }
  function shuffleMine() { setMine(shipsPlace(rnd, spec.size, spec.ships)); sfx("click"); }
  function again() { const r = rngFor(play, false); setRnd(() => r); setMine(shipsPlace(r, spec.size, spec.ships)); setHis(shipsPlace(r, spec.size, spec.ships)); setMyShots(new Set()); setHisShots(new Set()); setTurn("yo"); setMsg(""); setPhase("acomodar"); }
  const sunkHis = shipsSunk(his, myShots);

  return (
    <section aria-labelledby="g-barquitos" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-barquitos" className="text-3xl">Barquitos escondidos</h2>
      <p className="text-muted-foreground">Mochito escondió {spec.ships.length} barquitos en su mar ({spec.ships.join(", ")} casillas) y tú escondes los tuyos. Por turnos disparan a una casilla: «agua» si no hay nada, «tocado» si le diste y «hundido» si ya le diste a todo el barquito. Gana quien hunda primero todos los del otro.</p>
      {phase === "acomodar" ? (
        <>
          <p className="text-sm font-semibold">Así quedaron tus barquitos. ¿Te gustan?</p>
          <Sea size={spec.size} ships={mine} shots={new Set()} show label="Tu mar" />
          <div className="flex flex-wrap gap-2">
            <Button className="h-12 rounded-2xl px-6 text-base" onClick={() => { setPhase("jugar"); setMsg("Dispara al mar de Mochito."); sfx("success"); }}>¡A jugar!</Button>
            <Button variant="outline" className="h-12 rounded-2xl px-6 text-base" onClick={shuffleMine}>Acomodarlos otra vez</Button>
            <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold" aria-live="polite">Hundiste {sunkHis} de {his.length} · {msg}</p>
          <p className="text-sm font-semibold">Mar de Mochito</p>
          <Sea size={spec.size} ships={his} shots={myShots} show={phase === "fin"} onShot={phase === "jugar" && turn === "yo" ? shoot : undefined} label="Mar de Mochito: toca una casilla para disparar" />
          <p className="text-sm font-semibold">Tu mar</p>
          <Sea size={spec.size} ships={mine} shots={hisShots} show small label="Tu mar" />
          {phase === "fin" ? (
            <Result game="barquitos" play={play} score={shipsScore(won, sunkHis, his.length)} onAgain={again} onExit={onExit} detail={won ? `¡Hundiste todos los barquitos de Mochito en ${myShots.size} disparos!` : `Mochito encontró todos tus barquitos. Tú hundiste ${sunkHis} de ${his.length}.`} />
          ) : (
            <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
          )}
        </>
      )}
    </section>
  );
}

// ---------- Gusanito comelón ----------

const KEY_WAY: Record<string, Way> = { ArrowUp: "arriba", ArrowDown: "abajo", ArrowLeft: "izq", ArrowRight: "der" };

/** Guía al gusanito: come galletas para crecer sin chocar con la pared ni consigo mismo. */
export function WormGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const spec = wormSpec(play.level);
  const [rnd, setRnd] = useState(() => rngFor(play, true));
  const [w, setW] = useState<Worm>(() => wormStart(rnd));
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [eaten, setEaten] = useState(0);
  const queue = useRef<Way[]>([]);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const wr = useRef<Worm>(w);

  useEffect(() => { if (over) void mochitoDo("game", { game: "Gusanito comelón" }); }, [over]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const s = wormStep(rnd, wr.current, queue.current.shift() ?? wr.current.way);
      wr.current = s.worm;
      setW(s.worm);
      if (s.dead) { setRunning(false); setOver(true); sfx("sad"); return; }
      if (s.ate) {
        const n = (wr.current.body.length - 3);
        setEaten(n);
        if (n >= spec.goal) { setRunning(false); setOver(true); sfx("success"); } else sfx("coin");
      }
    }, spec.tick);
    return () => clearInterval(id);
  }, [running, rnd, spec.tick, spec.goal]);

  function turn(d: Way) {
    const last = queue.current.at(-1) ?? wr.current.way;
    if (d !== last && wormCanTurn(last, d) && queue.current.length < 3) queue.current.push(d);
    if (!running && !over) setRunning(true); }
  function again() { const r = rngFor(play, false); const st = wormStart(r); setRnd(() => r); setW(st); wr.current = st; queue.current = []; setEaten(0); setOver(false); setRunning(false); }
  const body = new Map(w.body.map((x, i) => [x, i] as const));

  return (
    <section aria-labelledby="g-gusanito" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-gusanito" className="text-3xl">Gusanito comelón</h2>
      <p className="text-muted-foreground">Guía al gusanito con las flechas o deslizando el dedo. Cada galleta lo hace crecer. Si choca con la orilla o con su propia cola, se acaba. Come {spec.goal} galletas para ganar.</p>
      <p className="text-sm font-semibold" aria-live="polite">Galletas: {eaten} de {spec.goal}{!running && !over ? " · Toca una flecha para empezar" : ""}</p>
      <div
        tabIndex={0}
        role="application"
        aria-label="Jardín del gusanito. Usa las flechas para moverlo."
        onKeyDown={(e) => { const d = KEY_WAY[e.key]; if (d) { e.preventDefault(); turn(d); } }}
        onPointerDown={(e) => { swipe.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={(e) => {
          const s0 = swipe.current; swipe.current = null;
          if (!s0) return;
          const dx = e.clientX - s0.x, dy = e.clientY - s0.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
          turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "der" : "izq") : dy > 0 ? "abajo" : "arriba");
        }}
        className="mx-auto grid aspect-square w-full max-w-sm touch-none select-none gap-px overflow-hidden rounded-3xl border-4 border-[#5a8a3a] bg-[#a8d98a] outline-none focus-visible:ring-4 focus-visible:ring-ring/40 dark:bg-[#3f6b33]"
        style={{ gridTemplateColumns: `repeat(${WORM_SIZE}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: WORM_SIZE * WORM_SIZE }, (_, i) => {
          const k = body.get(i);
          return (
            <span key={i} className="relative flex aspect-square items-center justify-center" aria-hidden>
              {i === w.food && <motion.span key={`f${i}`} initial={reduce ? false : { opacity: 0, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ duration: 0.2, ease: EASE_OUT }}><Cookie className="size-full text-[#a8642a]" fill="#e9b26a" /></motion.span>}
              {k !== undefined && (
                <span className={cn("absolute inset-[6%] block", k === 0 ? "rounded-[40%]" : "rounded-full")} style={{ background: k === 0 ? "#e2457a" : k % 2 ? "#f07aa0" : "#f396b4" }}>
                  {k === 0 && <span className="absolute inset-0 flex items-center justify-center gap-[12%]"><span className="block size-[22%] rounded-full bg-white"><span className="block size-1/2 translate-x-1/2 translate-y-1/2 rounded-full bg-black" /></span><span className="block size-[22%] rounded-full bg-white"><span className="block size-1/2 translate-x-1/2 translate-y-1/2 rounded-full bg-black" /></span></span>}
                </span>
              )}
            </span>
          );
        })}
      </div>
      {over ? (
        <Result game="gusanito" play={play} score={wormScore(eaten, spec.goal)} onAgain={again} onExit={onExit} detail={eaten >= spec.goal ? `¡Se comió las ${spec.goal} galletas y quedó larguísimo!` : `Se comió ${eaten} ${eaten === 1 ? "galleta" : "galletas"} antes de chocar.`} />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Flechas">
            <span />
            <button type="button" aria-label="Arriba" onClick={() => turn("arriba")} className="flex size-14 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><ArrowUp className="size-6" aria-hidden /></button>
            <span />
            <button type="button" aria-label="Izquierda" onClick={() => turn("izq")} className="flex size-14 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><ArrowLeft className="size-6" aria-hidden /></button>
            <button type="button" aria-label="Abajo" onClick={() => turn("abajo")} className="flex size-14 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><ArrowDown className="size-6" aria-hidden /></button>
            <button type="button" aria-label="Derecha" onClick={() => turn("der")} className="flex size-14 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><ArrowRight className="size-6" aria-hidden /></button>
          </div>
          {running && <Button variant="outline" className="h-12 rounded-2xl px-5 text-base" onClick={() => setRunning(false)}>Pausa</Button>}
          <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}
