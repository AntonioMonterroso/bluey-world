"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUp, Heart, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import { mochitoDo } from "@/lib/mochito-actions";
import {
  FLOW_COLORS, discsOf, flowAdj, flowDone, flowMake, flowScore, flowSpec, hanoiDone, hanoiInit, hanoiMin, hanoiMove, hanoiScore, hiloDeck, hiloRight, hiloScore, hiloSpec,
  sticksMove, sticksStart,
} from "@/lib/mochito-extra-9";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// ---------- Toma palitos ----------

/** Por turnos se quitan 1, 2 o 3 palitos. Quien se lleve el último, pierde. */
export function SticksGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const start = sticksStart(play.level);
  const [rnd, setRnd] = useState(() => rngFor(play, true));
  const [n, setN] = useState(start);
  const [turn, setTurn] = useState<"y" | "m">("y");
  const [msg, setMsg] = useState("Te toca. ¿Cuántos tomas?");
  const [loser, setLoser] = useState<"y" | "m" | null>(null);

  useEffect(() => { if (loser) void mochitoDo("game", { game: "Toma palitos" }); }, [loser]);
  useEffect(() => {
    if (loser || turn !== "m") return;
    const id = setTimeout(() => {
      const k = sticksMove(rnd, n, play.level);
      const left = n - k;
      setN(left); sfx("click");
      if (left <= 0) { setLoser("m"); return; }
      setMsg(`Mochito tomó ${k}. Te toca.`); setTurn("y");
    }, 800);
    return () => clearTimeout(id);
  }, [turn, loser, rnd, n, play.level]);

  function take(k: number) {
    if (turn !== "y" || loser || k > n) return;
    const left = n - k;
    setN(left); sfx("click");
    if (left <= 0) { setLoser("y"); return; }
    setMsg("Le toca a Mochito…"); setTurn("m");
  }
  function again() { const r = rngFor(play, false); setRnd(() => r); setN(start); setTurn("y"); setLoser(null); setMsg("Te toca."); }

  return (
    <section aria-labelledby="g-palitos" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-palitos" className="text-3xl">Toma palitos</h2>
      <p className="text-muted-foreground">Hay {start} palitos. Por turnos, cada quien toma 1, 2 o 3. Quien tenga que tomar el último palito, pierde. Pista: trata de dejarle a Mochito 1, 5 o 9 palitos.</p>
      <p className="text-sm font-semibold" aria-live="polite">Quedan {n} · {loser ? "" : msg}</p>
      <div className="flex min-h-24 flex-wrap items-end gap-1.5 rounded-3xl bg-[#e8cf9d] p-4 dark:bg-[#5a4526]" aria-hidden>
        <AnimatePresence initial={false}>
          {Array.from({ length: n }, (_, i) => (
            <motion.span key={i} exit={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(-12px)" }} transition={{ duration: 0.2, ease: EASE_OUT }} className="block h-16 w-2.5 rounded-full bg-[#8a5a2e]">
              <span className="block h-2.5 w-2.5 rounded-full bg-[#d6453d]" />
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      {loser ? (
        <Result game="palitos" play={play} score={loser === "m" ? 1 : 0.2} onAgain={again} onExit={onExit} detail={loser === "m" ? "¡A Mochito le tocó el último palito! Ganaste." : "Te tocó el último palito. «¡Otra! Esta vez te dejo pensar.»"} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((k) => <Button key={k} disabled={turn !== "y" || k > n} className="h-12 min-w-24 rounded-2xl text-base" onClick={() => take(k)}>Tomar {k}</Button>)}
          <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Une los colores ----------

/** Une cada par de puntos del mismo color con un camino, sin cruzarse, y llena todo el tablero. */
export function FlowGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const spec = flowSpec(play.level);
  const n = spec.n;
  const [puz, setPuz] = useState(() => flowMake(rngFor(play, true), n, spec.pairs));
  const [paths, setPaths] = useState<number[][]>(() => puz.dots.map(() => []));
  const [active, setActive] = useState<number | null>(null);
  const [resets, setResets] = useState(0);
  const board = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const won = flowDone(paths, puz.dots, n);

  useEffect(() => { if (won) void mochitoDo("game", { game: "Une los colores" }); }, [won]);

  const dotAt = (i: number) => puz.dots.findIndex((d) => d.a === i || d.b === i);
  const owner = (i: number) => paths.findIndex((p) => p.includes(i));
  const complete = (k: number) => { const p = paths[k]; const d = puz.dots[k]; return p.length > 1 && [p[0], p[p.length - 1]].includes(d.a) && [p[0], p[p.length - 1]].includes(d.b); };

  function begin(i: number) {
    if (won) return;
    const d = dotAt(i);
    if (d >= 0) { setActive(d); setPaths(paths.map((p, k) => (k === d ? [i] : p))); sfx("click"); return; }
    const o = owner(i);
    if (o >= 0) { setActive(o); setPaths(paths.map((p, k) => (k === o ? p.slice(0, p.indexOf(i) + 1) : p))); }
  }
  function extend(i: number) {
    if (active === null || won) return;
    const p = paths[active];
    const end = p[p.length - 1];
    if (end === undefined || i === end) return;
    if (p.length > 1 && i === p[p.length - 2]) { setPaths(paths.map((q, k) => (k === active ? q.slice(0, -1) : q))); return; }
    if (!flowAdj(end, i, n) || p.includes(i) || complete(active)) return;
    const d = dotAt(i);
    if (d >= 0 && d !== active) return;
    const next = paths.map((q, k) => {
      if (k === active) return [...q, i];
      const at = q.indexOf(i);
      return at >= 0 ? q.slice(0, at) : q;
    });
    setPaths(next);
    if (d === active) sfx("coin");
  }
  function tapCell(i: number) {
    const p = active === null ? [] : paths[active];
    const end = p[p.length - 1];
    const d = dotAt(i);
    if (active !== null && end !== undefined && !complete(active) && flowAdj(end, i, n) && (d === active || (d < 0 && owner(i) !== active))) { extend(i); return; }
    if (d >= 0 || owner(i) >= 0) begin(i); else extend(i);
  }
  function cellFrom(e: React.PointerEvent) {
    const r = board.current?.getBoundingClientRect();
    if (!r) return -1;
    const c = Math.floor(((e.clientX - r.left) / r.width) * n), row = Math.floor(((e.clientY - r.top) / r.height) * n);
    return c < 0 || row < 0 || c >= n || row >= n ? -1 : row * n + c;
  }
  function again() { const np = flowMake(rngFor(play, false), n, spec.pairs); setPuz(np); setPaths(np.dots.map(() => [])); setActive(null); setResets(0); }
  const filled = new Set(paths.flat()).size;

  return (
    <section aria-labelledby="g-unecolores" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-unecolores" className="text-3xl">Une los colores</h2>
      <p className="text-muted-foreground">Arrastra desde un punto hasta el otro del mismo color (o toca un punto y luego las casillas de al lado, una por una). Los caminos no se pueden cruzar y al final no debe quedar ninguna casilla vacía.</p>
      <p className="text-sm font-semibold" aria-live="polite">Unidos: {puz.dots.filter((_, k) => complete(k)).length} de {puz.dots.length} · Casillas llenas: {filled} de {n * n}</p>
      <div
        ref={board}
        className="mx-auto grid w-full max-w-sm touch-none gap-0.5 rounded-2xl bg-[#2b2238] p-1"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
        role="group"
        aria-label="Tablero"
        onPointerDown={(e) => { const i = cellFrom(e); if (i < 0) return; dragging.current = true; tapCell(i); }}
        onPointerMove={(e) => { if (!dragging.current) return; const i = cellFrom(e); if (i >= 0) extend(i); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}
      >
        {Array.from({ length: n * n }, (_, i) => {
          const d = dotAt(i), o = owner(i);
          const col = o >= 0 ? FLOW_COLORS[o] : d >= 0 ? FLOW_COLORS[d] : undefined;
          const p = o >= 0 ? paths[o] : [];
          const at = p.indexOf(i);
          const link = (j: number | undefined) => j !== undefined && j >= 0 ? (j === i - n ? "t" : j === i + n ? "b" : j === i - 1 ? "l" : "r") : null;
          const sides = o >= 0 ? [link(p[at - 1]), link(p[at + 1])].filter(Boolean) : [];
          return (
            <button key={i} type="button" onClick={(e) => { if (e.detail !== 0) return; tapCell(i); }} aria-label={`Casilla ${i + 1}${d >= 0 ? `: punto ${d + 1}` : o >= 0 ? `: camino ${o + 1}` : ""}`} className="relative flex aspect-square items-center justify-center rounded-md bg-[#3b3150]">
              {sides.map((s) => <span key={s} className="absolute block" style={{ background: col, ...(s === "t" ? { top: 0, height: "50%", width: "34%" } : s === "b" ? { bottom: 0, height: "50%", width: "34%" } : s === "l" ? { left: 0, width: "50%", height: "34%" } : { right: 0, width: "50%", height: "34%" }) }} aria-hidden />)}
              {o >= 0 && d < 0 && <span className="absolute block size-[34%] rounded-sm" style={{ background: col }} aria-hidden />}
              {d >= 0 && <span className={cn("relative block size-[66%] rounded-full", active === d && "ring-2 ring-white")} style={{ background: FLOW_COLORS[d] }} aria-hidden />}
            </button>
          );
        })}
      </div>
      {won ? (
        <Result game="unecolores" play={play} score={flowScore(resets)} onAgain={again} onExit={onExit} detail="¡Todos los colores unidos y el tablero lleno!" />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={() => { setPaths(puz.dots.map(() => [])); setActive(null); setResets((r) => r + 1); }}><RotateCcw className="mr-1.5 size-4" aria-hidden />Borrar todo</Button>
          <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- ¿Mayor o menor? ----------

const SUITS = [{ c: "#d6453d", n: "corazones" }, { c: "#2b2622", n: "huesos" }, { c: "#3f74c4", n: "gotas" }, { c: "#4a9a5b", n: "hojas" }];
const face = (v: number) => (v === 1 ? "A" : v === 11 ? "J" : v === 12 ? "Q" : v === 13 ? "K" : String(v));

function CardArt({ v, suit }: { v: number; suit: number }) {
  return (
    <span className="flex h-36 w-24 flex-col justify-between rounded-2xl border-2 border-black/10 bg-[#fffaf0] p-2 shadow-sm" style={{ color: SUITS[suit].c }}>
      <span className="text-lg font-bold leading-none">{face(v)}</span>
      <span className="self-center text-4xl font-bold">{face(v)}</span>
      <span className="self-end text-[10px] font-semibold uppercase">{SUITS[suit].n}</span>
    </span>
  );
}

/** Sale una carta: ¿la siguiente será mayor o menor? Si salen iguales, cuenta como acierto. */
export function HiLoGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const spec = hiloSpec(play.level);
  const [deck, setDeck] = useState(() => hiloDeck(rngFor(play, true), play.level));
  const [k, setK] = useState(0);
  const [hits, setHits] = useState(0);
  const [lives, setLives] = useState(spec.lives);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [msg, setMsg] = useState("¿La siguiente carta será mayor o menor?");
  const over = lives <= 0 || k >= spec.cards;

  useEffect(() => { if (over) void mochitoDo("game", { game: "¿Mayor o menor?" }); }, [over]);

  function guess(g: "mayor" | "menor") {
    if (over) return;
    const a = deck[k].v, b = deck[k + 1].v;
    const ok = hiloRight(a, b, g);
    setK(k + 1);
    if (ok) { const s = streak + 1; setHits(hits + 1); setStreak(s); setBest(Math.max(best, s)); setMsg(a === b ? "¡Iguales! Cuenta como acierto." : "¡Le atinaste!"); sfx("coin"); }
    else { setLives(lives - 1); setStreak(0); setMsg(`No: salió ${face(b)}.`); sfx("sad"); }
  }
  function again() { setDeck(hiloDeck(rngFor(play, false), play.level)); setK(0); setHits(0); setLives(spec.lives); setStreak(0); setBest(0); setMsg("¿Mayor o menor?"); }
  const c = deck[Math.min(k, deck.length - 1)];

  return (
    <section aria-labelledby="g-mayormenor" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-mayormenor" className="text-3xl">¿Mayor o menor?</h2>
      <p className="text-muted-foreground">Las cartas van del A (que vale 1) al {spec.top === 10 ? "10" : "K (que vale 13)"}. Mira la carta y adivina si la siguiente será mayor o menor. Si salen iguales, cuenta como acierto. Tienes {spec.lives} {spec.lives === 1 ? "vida" : "vidas"} y {spec.cards} cartas.</p>
      <p className="flex items-center gap-2 text-sm font-semibold" aria-live="polite">
        <span className="flex gap-0.5" aria-label={`${lives} vidas`}>{Array.from({ length: spec.lives }, (_, i) => <Heart key={i} className={cn("size-4", i < lives ? "text-[#d6453d]" : "text-muted-foreground/40")} fill={i < lives ? "#d6453d" : "none"} aria-hidden />)}</span>
        Aciertos: {hits} · Racha: {streak} · Carta {Math.min(k + 1, spec.cards)} de {spec.cards} · {over ? "" : msg}
      </p>
      <div className="flex justify-center" aria-label={`Carta: ${face(c.v)} de ${SUITS[c.suit].n}`} role="img">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={k} initial={reduce ? false : { opacity: 0, transform: "translateX(24px) rotate(4deg)" }} animate={{ opacity: 1, transform: "translateX(0px) rotate(0deg)" }} exit={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateX(-24px) rotate(-4deg)" }} transition={{ duration: 0.25, ease: EASE_OUT }}>
            <CardArt v={c.v} suit={c.suit} />
          </motion.span>
        </AnimatePresence>
      </div>
      {over ? (
        <Result game="mayormenor" play={play} score={hiloScore(hits, spec.cards)} onAgain={again} onExit={onExit} detail={`${hits} aciertos. Tu racha más larga fue de ${best}.`} />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button className="h-12 rounded-2xl px-6 text-base" onClick={() => guess("mayor")}><ArrowUp className="mr-1.5 size-4" aria-hidden />Mayor</Button>
          <Button className="h-12 rounded-2xl px-6 text-base" onClick={() => guess("menor")}><ArrowDown className="mr-1.5 size-4" aria-hidden />Menor</Button>
          <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Torre de discos ----------

const DISC_COLORS = ["#d6453d", "#f08a24", "#f6c744", "#4a9a5b", "#3f74c4"];
const PEG_NAMES = ["izquierda", "centro", "derecha"];

/** Pasa toda la torre al palo de la derecha: un disco a la vez y nunca uno grande sobre uno chico. */
export function HanoiGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const n = discsOf(play.level);
  const [s, setS] = useState(() => hanoiInit(n));
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [msg, setMsg] = useState("Toca un palo para tomar su disco de arriba.");
  const won = hanoiDone(s, n);

  useEffect(() => { if (won) void mochitoDo("game", { game: "Torre de discos" }); }, [won]);

  function tap(p: number) {
    if (won) return;
    if (sel === null) { if (!s[p].length) { sfx("sad"); return; } setSel(p); setMsg(`Tomaste el disco ${s[p][s[p].length - 1]}. ¿A qué palo va?`); sfx("click"); return; }
    if (p === sel) { setSel(null); setMsg("Lo dejaste donde estaba."); return; }
    const ns = hanoiMove(s, sel, p);
    if (!ns) { setMsg("Ahí no: no se puede poner un disco grande sobre uno chico."); sfx("sad"); return; }
    setS(ns); setSel(null); setMoves(moves + 1); setMsg("Toca un palo para tomar otro disco."); sfx(hanoiDone(ns, n) ? "success" : "coin");
  }
  function again() { setS(hanoiInit(n)); setSel(null); setMoves(0); setMsg("Toca un palo."); }

  return (
    <section aria-labelledby="g-discos" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-discos" className="text-3xl">Torre de discos</h2>
      <p className="text-muted-foreground">Pasa los {n} discos al palo de la derecha. Solo puedes mover el de arriba, de uno en uno, y nunca poner un disco grande sobre uno más chico. Se puede en {hanoiMin(n)} movimientos.</p>
      <p className="text-sm font-semibold" aria-live="polite">Movimientos: {moves} · {won ? "" : msg}</p>
      <div className="grid grid-cols-3 gap-2 rounded-3xl bg-secondary/60 p-3">
        {s.map((peg, p) => (
          <button key={p} type="button" onClick={() => tap(p)} aria-label={`Palo de la ${PEG_NAMES[p]}: ${peg.length ? `discos ${peg.join(", ")}` : "vacío"}${sel === p ? ", elegido" : ""}`} className={cn("relative flex h-48 flex-col-reverse items-center justify-start gap-1 rounded-2xl pb-2 active:scale-[0.97]", sel === p ? "bg-primary/15 ring-2 ring-primary" : "bg-card")}>
            <span className="absolute bottom-2 top-4 left-1/2 block w-2 -translate-x-1/2 rounded-full bg-[#8a5a2e]" aria-hidden />
            {peg.map((d, j) => (
              <motion.span key={d} layout transition={{ duration: 0.2, ease: EASE_OUT }} className="relative flex w-full justify-center" aria-hidden>
                <span className="block h-6 rounded-full border border-black/15 transition-transform duration-150" style={{ width: `${30 + (d / n) * 65}%`, background: DISC_COLORS[d - 1], transform: sel === p && j === peg.length - 1 ? "translateY(-10px)" : "translateY(0px)" }} />
              </motion.span>
            ))}
          </button>
        ))}
      </div>
      {won ? (
        <Result game="discos" play={play} score={hanoiScore(moves, n)} onAgain={again} onExit={onExit} detail={moves === hanoiMin(n) ? `¡Perfecto! En el mínimo: ${moves} movimientos.` : `¡Torre pasada en ${moves} movimientos! El mínimo es ${hanoiMin(n)}.`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}
