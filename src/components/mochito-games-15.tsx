"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Lightbulb, RotateCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import { mochitoDo } from "@/lib/mochito-actions";
import {
  MK_HIS, MK_MINE, PEG_N, lightsMake, lightsOff, lightsPress, lightsScore, lightsSize, mkInit, mkMove, mkMoves, mkOver, mkScore, mkSeeds, mkSow, pegApply, pegHoles, pegJumps,
  pegLeft, pegMake, pegScore, slideDone, slideMake, slideMove, slideScore, slideSize, type Mk,
} from "@/lib/mochito-extra-8";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// ---------- Semillitas ----------

function Seeds({ n }: { n: number }) {
  const shown = Math.min(n, 12);
  return (
    <span className="hidden max-w-[3.2rem] flex-wrap justify-center gap-0.5 sm:flex" aria-hidden>
      {Array.from({ length: shown }, (_, i) => <span key={i} className="block size-2 rounded-full bg-[#f6e7c1]" />)}
    </span>
  );
}

/** Tomas las semillas de un hoyito tuyo y las repartes una por una. Gana quien guarde más en su granero. */
export function SeedsGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const seeds = mkSeeds(play.level);
  const [rnd, setRnd] = useState(() => rngFor(play, true));
  const [b, setB] = useState<Mk>(() => mkInit(seeds));
  const [turn, setTurn] = useState<"y" | "m">("y");
  const [msg, setMsg] = useState("Te toca. Toca uno de tus hoyitos (abajo).");
  const [last, setLast] = useState<number | null>(null);
  const over = mkOver(b);
  const y = b[MK_MINE], m = b[MK_HIS];

  useEffect(() => { if (over) void mochitoDo("game", { game: "Semillitas" }); }, [over]);
  useEffect(() => {
    if (over || turn !== "m") return;
    const id = setTimeout(() => {
      const i = mkMove(rnd, b, play.level);
      if (i === null) { setTurn("y"); return; }
      const r = mkSow(b, i, "m");
      setB(r.b); setLast(i); sfx("click");
      setMsg(r.took ? `Mochito se llevó ${r.took} semillas de enfrente.${r.again ? " ¡Y vuelve a jugar!" : " Te toca."}` : r.again ? "La última cayó en su granero: Mochito juega otra vez." : "Te toca.");
      setTurn(r.again ? "m" : "y");
    }, 800);
    return () => clearTimeout(id);
  }, [turn, over, rnd, b, play.level]);

  function sow(i: number) {
    if (turn !== "y" || over || !b[i]) return;
    const r = mkSow(b, i, "y");
    setB(r.b); setLast(i); sfx(r.took || r.again ? "coin" : "click");
    setMsg(r.took ? `¡Te llevaste ${r.took} semillas!${r.again ? " Juega otra vez." : " Le toca a Mochito…"}` : r.again ? "¡Cayó en tu granero! Juega otra vez." : "Le toca a Mochito…");
    setTurn(r.again ? "y" : "m");
  }
  function again() { const r = rngFor(play, false); setRnd(() => r); setB(mkInit(seeds)); setTurn("y"); setLast(null); setMsg("Te toca."); }

  const pit = (i: number, mine: boolean) => {
    const can = mine && turn === "y" && !over && b[i] > 0;
    return (
      <button key={i} type="button" disabled={!can} onClick={() => sow(i)} aria-label={`${mine ? "Tu hoyito" : "Hoyito de Mochito"} ${mine ? i + 1 : 13 - i}: ${b[i]} semillas`} className={cn("flex h-16 flex-col items-center justify-center gap-0.5 rounded-2xl bg-[#6b4423] text-base font-bold text-[#f6e7c1] sm:aspect-square sm:h-auto sm:rounded-full sm:text-xs", can && "ring-2 ring-[#f6c744] active:scale-[0.97]", last === i && "outline outline-2 outline-offset-1 outline-white/70")}>
        <Seeds n={b[i]} /><span>{b[i]}</span>
      </button>
    );
  };

  return (
    <section aria-labelledby="g-semillas" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-semillas" className="text-3xl">Semillitas</h2>
      <p className="text-muted-foreground">Tus hoyitos son los de abajo y tu granero el de la derecha. Toma todas las semillas de un hoyito y repártelas, una en cada hoyito, hacia la derecha y luego por arriba (al revés del reloj). Si la última cae en tu granero, juegas otra vez. Si cae en un hoyito tuyo vacío, te llevas las de enfrente. Cuando un lado se vacía, gana quien tenga más en su granero.</p>
      <p className="text-sm font-semibold" aria-live="polite">Tu granero: {y} · Granero de Mochito: {m} · {over ? "" : msg}</p>
      <div className="grid grid-cols-[2.25rem_1fr_2.25rem] items-stretch gap-1.5 rounded-3xl bg-[#a8703f] p-1.5 sm:grid-cols-[4rem_1fr_4rem] sm:gap-2 sm:p-2">
        <div className="flex flex-col items-center justify-center rounded-full bg-[#6b4423] text-sm font-bold text-[#f6e7c1]" aria-label={`Granero de Mochito: ${m}`}>{m}</div>
        <div className="grid grid-rows-2 gap-2">
          <div className="grid grid-cols-6 gap-1 sm:gap-1.5">{[12, 11, 10, 9, 8, 7].map((i) => pit(i, false))}</div>
          <div className="grid grid-cols-6 gap-1 sm:gap-1.5">{[0, 1, 2, 3, 4, 5].map((i) => pit(i, true))}</div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-full bg-[#6b4423] text-sm font-bold text-[#f6e7c1]" aria-label={`Tu granero: ${y}`}>{y}</div>
      </div>
      {!over && turn === "y" && !mkMoves(b, "y").length && <p className="text-sm">No tienes semillas.</p>}
      {over ? (
        <Result game="semillas" play={play} score={mkScore(y, m)} onAgain={again} onExit={onExit} detail={y > m ? `¡Ganaste ${y} a ${m}!` : y === m ? `¡Empate a ${y}!` : `Mochito ganó ${m} a ${y}. «¿La revancha?»`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}

// ---------- Cuadritos deslizantes ----------

/** Desliza los cuadritos al hueco hasta ordenarlos del 1 al último. */
export function SlideGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const n = slideSize(play.level);
  const [b, setB] = useState(() => slideMake(rngFor(play, true), n));
  const [moves, setMoves] = useState(0);
  const won = slideDone(b);

  useEffect(() => { if (won) void mochitoDo("game", { game: "Cuadritos deslizantes" }); }, [won]);

  function move(i: number) {
    if (won) return;
    const nb = slideMove(b, n, i);
    if (!nb) { sfx("sad"); return; }
    setB(nb); setMoves((m) => m + 1); sfx(slideDone(nb) ? "success" : "click");
  }
  function again() { setB(slideMake(rngFor(play, false), n)); setMoves(0); }

  return (
    <section aria-labelledby="g-deslizar" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-deslizar" className="text-3xl">Cuadritos deslizantes</h2>
      <p className="text-muted-foreground">Toca un cuadrito que esté junto al hueco para deslizarlo. Ordénalos del 1 al {n * n - 1}, de izquierda a derecha y de arriba abajo, con el hueco al final.</p>
      <p className="text-sm font-semibold" aria-live="polite">Movimientos: {moves}</p>
      <div className="mx-auto grid w-full max-w-xs gap-1.5 rounded-3xl bg-[#3f74c4]/20 p-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} role="group" aria-label="Tablero">
        {b.map((v, i) => v === 0 ? (
          <span key="hueco" className="block aspect-square rounded-2xl" aria-label="Hueco" />
        ) : (
          <motion.button key={v} layout={!reduce} transition={{ duration: 0.14, ease: EASE_OUT }} type="button" onClick={() => move(i)} aria-label={`Cuadrito ${v}`} className={cn("flex aspect-square items-center justify-center rounded-2xl text-xl font-bold shadow-sm active:scale-[0.97]", v === i + 1 ? "bg-[#f6c744] text-[#3a2a22]" : "bg-card")}>
            {v}
          </motion.button>
        ))}
      </div>
      {won ? (
        <Result game="deslizar" play={play} score={slideScore(moves, n)} onAgain={again} onExit={onExit} detail={`¡Todos en orden en ${moves} movimientos!`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}

// ---------- Apaga las luces ----------

/** Cada luz que tocas cambia junto con las de arriba, abajo y a los lados. Apágalas todas. */
export function LightsGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const n = lightsSize(play.level);
  const [g, setG] = useState(() => lightsMake(rngFor(play, true), n));
  const [b, setB] = useState(g.b);
  const [moves, setMoves] = useState(0);
  const won = lightsOff(b);

  useEffect(() => { if (won) void mochitoDo("game", { game: "Apaga las luces" }); }, [won]);

  function press(i: number) {
    if (won) return;
    const nb = lightsPress(b, n, i);
    setB(nb); setMoves((m) => m + 1); sfx(lightsOff(nb) ? "success" : "click");
  }
  function again() { const ng = lightsMake(rngFor(play, false), n); setG(ng); setB(ng.b); setMoves(0); }
  const on = b.filter(Boolean).length;

  return (
    <section aria-labelledby="g-luces" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-luces" className="text-3xl">Apaga las luces</h2>
      <p className="text-muted-foreground">Mochito quiere dormir y hay luces prendidas. Cuando tocas una, cambian ella y las que tiene arriba, abajo y a los lados: las prendidas se apagan y las apagadas se prenden. Apágalas todas. Se puede en {g.k} toques o menos.</p>
      <p className="text-sm font-semibold" aria-live="polite">Prendidas: {on} · Toques: {moves}</p>
      <div className="mx-auto grid w-full max-w-xs gap-1.5 rounded-3xl bg-[#1d2545] p-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} role="group" aria-label="Luces">
        {b.map((x, i) => (
          <button key={i} type="button" onClick={() => press(i)} aria-pressed={x} aria-label={`Luz ${i + 1}: ${x ? "prendida" : "apagada"}`} className={cn("flex aspect-square items-center justify-center rounded-2xl transition-[background-color] duration-150 active:scale-[0.97]", x ? "bg-[#f6d36b]" : "bg-[#2f3a66]")}>
            <Lightbulb className={cn("size-[45%]", x ? "text-[#8a5a10]" : "text-[#6f7bab]")} fill={x ? "#fff3c4" : "none"} aria-hidden />
          </button>
        ))}
      </div>
      {won ? (
        <Result game="luces" play={play} score={lightsScore(moves, g.k)} onAgain={again} onExit={onExit} detail={`¡Todo apagado en ${moves} toques! Mochito ya ronca.`} />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={() => { setB(g.b); setMoves(0); }}><RotateCcw className="mr-1.5 size-4" aria-hidden />Empezar de nuevo</Button>
          <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Salta fichas ----------

/** Brinca una ficha sobre otra pegada para quitarla. Trata de dejar solo una. */
export function PegGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const [holes] = useState(pegHoles);
  const [start, setStart] = useState(() => pegMake(rngFor(play, true), play.level));
  const [b, setB] = useState(start);
  const [hist, setHist] = useState<boolean[][]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const jumps = pegJumps(b);
  const left = pegLeft(b);
  const over = !jumps.length;
  const sent = useRef(false);

  useEffect(() => { if (over && !sent.current) { sent.current = true; void mochitoDo("game", { game: "Salta fichas" }); } }, [over]);

  const targets = sel === null ? [] : jumps.filter((j) => j.from === sel).map((j) => j.to);
  function tap(i: number) {
    if (over) return;
    if (b[i]) { setSel(jumps.some((j) => j.from === i) ? i : null); sfx(jumps.some((j) => j.from === i) ? "click" : "sad"); return; }
    const j = jumps.find((x) => x.from === sel && x.to === i);
    if (!j) { setSel(null); return; }
    setHist([...hist, b]); setB(pegApply(b, j)); setSel(null); sfx("coin");
  }
  function undo() { if (!hist.length) return; setB(hist[hist.length - 1]); setHist(hist.slice(0, -1)); setSel(null); sfx("click"); }
  function again() { const s = pegMake(rngFor(play, false), play.level); sent.current = false; setStart(s); setB(s); setHist([]); setSel(null); }

  return (
    <section aria-labelledby="g-saltafichas" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-saltafichas" className="text-3xl">Salta fichas</h2>
      <p className="text-muted-foreground">Toca una ficha y luego el hueco a donde va a caer: tiene que brincar sobre otra ficha pegada (derecho, no en diagonal) y caer en el hueco de atrás. La ficha brincada se quita. Este tablero siempre se puede terminar con una sola ficha.</p>
      <p className="text-sm font-semibold" aria-live="polite">Fichas: {left}{sel !== null && !over ? " · Ahora toca un hueco con puntito" : ""}</p>
      <div className="mx-auto grid w-full max-w-xs gap-1" style={{ gridTemplateColumns: `repeat(${PEG_N}, minmax(0, 1fr))` }} role="group" aria-label="Tablero">
        {holes.map((h, i) => {
          if (!h) return <span key={i} aria-hidden />;
          const t = targets.includes(i);
          return (
            <button key={i} type="button" onClick={() => tap(i)} aria-label={`${String.fromCharCode(65 + (i % PEG_N))}${Math.floor(i / PEG_N) + 1}: ${b[i] ? (sel === i ? "ficha elegida" : "ficha") : t ? "puede caer aquí" : "hueco"}`} className={cn("flex aspect-square items-center justify-center rounded-full bg-[#d9b98c] dark:bg-[#5a4526]", t && "ring-2 ring-[#4a9a5b]")}>
              {b[i] ? (
                <motion.span key={`f${i}`} initial={reduce ? false : { opacity: 0, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: sel === i ? "translateY(-2px)" : "translateY(0px)" }} transition={{ duration: 0.15, ease: EASE_OUT }} className={cn("block size-[78%] rounded-full shadow-sm", sel === i ? "bg-[#e3893a]" : "bg-[#8a5a2e]")} aria-hidden />
              ) : t ? <span className="block size-[28%] rounded-full bg-[#4a9a5b]" aria-hidden /> : <span className="block size-[30%] rounded-full bg-black/15" aria-hidden />}
            </button>
          );
        })}
      </div>
      {over ? (
        <Result game="saltafichas" play={play} score={pegScore(left)} onAgain={again} onExit={onExit} detail={left <= 1 ? "¡Quedó una sola ficha! Perfecto." : `Quedaron ${left} fichas sin saltos. ¡Casi!`} />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!hist.length} className="h-12 w-fit rounded-2xl px-6 text-base" onClick={undo}><Undo2 className="mr-1.5 size-4" aria-hidden />Deshacer</Button>
          <Button variant="outline" disabled={!hist.length} className="h-12 w-fit rounded-2xl px-6 text-base" onClick={() => { setB(start); setHist([]); setSel(null); }}><RotateCcw className="mr-1.5 size-4" aria-hidden />Empezar de nuevo</Button>
          <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}
