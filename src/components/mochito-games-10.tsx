"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Bone, CircleDot, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MochitoFigure } from "@/components/mochito-figure";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import { useProfile } from "@/lib/db/profile";
import { mochitoDo } from "@/lib/mochito-actions";
import { groomActive } from "@/lib/mochito-extra";
import { sweep } from "@/lib/mochito-extra-2";
import {
  ALPHABET, GOLF_H, GOLF_W, HOLES, TOWER_GOAL, TOWER_W, TTT_GAMES, golfScore, golfShot, golfSpec, hangLives, hangMisses, hangPoints, hangShown, hangSolved, hangWords,
  towerDrop, towerScore, towerSpec, towerX, tttMove, tttPoints, tttWinner, type Cell,
} from "@/lib/mochito-extra-3";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function useLook() {
  const { profile } = useProfile();
  const [now] = useState(() => Date.now());
  return { outfit: profile.mochito_outfit, groom: groomActive(profile.mochito_groom, now) ? profile.mochito_groom : null };
}

// ---------- Gato ----------

type TttEnd = "gana" | "empate" | "pierde";

/** Gato contra Mochito: tú eres los huesos, él las pelotas. Tres partidas; empiezan por turnos. */
export function TicTacGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const look = useLook();
  const reduce = useReducedMotion();
  const [rnd, setRnd] = useState(() => rngFor(play, true));
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(""));
  const [game, setGame] = useState(0);
  const [ends, setEnds] = useState<TttEnd[]>([]);
  const [thinking, setThinking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const w = tttWinner(board);
  const over = ends.length >= TTT_GAMES;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { if (over) void mochitoDo("game", { game: "Gato con Mochito" }); }, [over]);

  function finish(b: Cell[]) {
    const r = tttWinner(b);
    if (!r) return false;
    const end: TttEnd = r === "empate" ? "empate" : r.who === "X" ? "gana" : "pierde";
    setEnds((e) => [...e, end]);
    sfx(end === "gana" ? "success" : end === "empate" ? "coin" : "sad");
    return true;
  }
  function mochitoTurn(b: Cell[]) {
    setThinking(true);
    timer.current = setTimeout(() => {
      const at = tttMove(rnd, b, "O", play.level);
      const n = [...b]; n[at] = "O";
      setBoard(n);
      setThinking(false);
      sfx("click");
      finish(n);
    }, reduce ? 150 : 600);
  }
  function tap(i: number) {
    if (board[i] || w || thinking || over) return;
    const n = [...board]; n[i] = "X";
    setBoard(n);
    sfx("click");
    if (!finish(n)) mochitoTurn(n);
  }
  function nextGame() {
    const g = game + 1;
    const empty: Cell[] = Array(9).fill("");
    setBoard(empty);
    setGame(g);
    if (g % 2 === 1) mochitoTurn(empty);
  }
  function again() { const r = rngFor(play, false); setRnd(() => r); setBoard(Array(9).fill("")); setGame(0); setEnds([]); setThinking(false); }
  const score = ends.reduce((a, e) => a + tttPoints(e), 0) / TTT_GAMES;
  const wins = ends.filter((e) => e === "gana").length;
  const line = w && w !== "empate" ? w.line : [];

  return (
    <section aria-labelledby="g-gato" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-gato" className="text-3xl">Gato con Mochito</h2>
      <p className="text-muted-foreground">Tú pones huesos y Mochito pelotas. Gana quien haga tres en línea. Son {TTT_GAMES} partidas y se turnan para empezar.{play.level === "dificil" ? " En difícil Mochito no se deja ganar." : ""}</p>
      <p className="text-sm font-semibold" aria-live="polite">Partida {Math.min(game + 1, TTT_GAMES)} de {TTT_GAMES} · Ganadas: {wins} · {w ? (w === "empate" ? "¡Empate!" : w.who === "X" ? "¡Ganaste esta!" : "Ganó Mochito.") : thinking ? "Mochito está pensando…" : "Tu turno."}</p>
      <div className="flex items-end gap-4">
        <motion.span className="hidden h-32 shrink-0 sm:block" initial={false} animate={thinking && !reduce ? { transform: ["rotate(0deg)", "rotate(-6deg)", "rotate(0deg)"] } : undefined} transition={{ duration: 0.6, ease: EASE_OUT }} aria-hidden>
          <MochitoFigure outfit={look.outfit} groom={look.groom} />
        </motion.span>
        <div className="grid aspect-square w-full max-w-xs grid-cols-3 gap-2 rounded-3xl bg-[#a8703f] p-2" role="grid" aria-label="Tablero">
          {board.map((c, i) => (
            <button key={i} type="button" onClick={() => tap(i)} disabled={!!c || !!w || thinking || over} aria-label={`Casilla ${i + 1}: ${c === "X" ? "hueso" : c === "O" ? "pelota" : "vacía"}`} className={cn("flex items-center justify-center rounded-2xl bg-[#f6ead2] active:scale-[0.97] dark:bg-stone-800", line.includes(i) && "bg-[var(--gold)] dark:bg-[var(--gold)]")}>
              {c === "X" && <motion.span initial={reduce ? false : { opacity: 0, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ duration: 0.2, ease: EASE_OUT }}><Bone className="size-12 fill-[#fffaf0] text-[#8a5a2e]" aria-hidden /></motion.span>}
              {c === "O" && <motion.span initial={reduce ? false : { opacity: 0, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ duration: 0.2, ease: EASE_OUT }}><CircleDot className="size-12 fill-[#e0533c] text-[#8a2a20]" aria-hidden /></motion.span>}
            </button>
          ))}
        </div>
      </div>
      {over ? (
        <Result game="gato" play={play} score={score} onAgain={again} onExit={onExit} detail={`Ganaste ${wins} de ${TTT_GAMES} partidas${ends.includes("empate") ? ` y empataron ${ends.filter((e) => e === "empate").length}` : ""}. Mochito dice: ${wins > ends.filter((e) => e === "pierde").length ? "«¡Eres muy bueno! Mañana te pido la revancha.»" : "«¡Otra! Esta vez te dejo ganar… tal vez.»"}`} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {w && <Button className="h-12 rounded-2xl px-6 text-base" onClick={nextGame}>{game + 1 >= TTT_GAMES ? "Ver resultado" : "Siguiente partida"}</Button>}
          <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Ahorcado (la galleta) ----------

/** La galleta: cada letra equivocada es una mordida. */
function CookieBites({ bites, lives }: { bites: number; lives: number }) {
  const left = Math.max(0, lives - bites);
  return (
    <svg viewBox="0 0 100 100" className="size-32" role="img" aria-label={`Quedan ${left} de ${lives} pedacitos de galleta`}>
      <defs>
        <mask id="mordidas">
          <rect width="100" height="100" fill="#fff" />
          {Array.from({ length: bites }, (_, k) => { const a = (k / lives) * Math.PI * 2 - Math.PI / 2; return <circle key={k} cx={50 + Math.cos(a) * 44} cy={50 + Math.sin(a) * 44} r="17" fill="#000" />; })}
        </mask>
      </defs>
      <g mask="url(#mordidas)">
        <circle cx="50" cy="50" r="44" fill="#e0b07a" stroke="#8a5a2e" strokeWidth="2" />
        {[[34, 36], [60, 30], [66, 58], [40, 64], [52, 48], [28, 52]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="4.5" fill="#6b4422" />)}
      </g>
    </svg>
  );
}

/** Adivina la palabra letra por letra antes de que Mochito se coma toda la galleta. */
export function HangmanGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const lives = hangLives(play.level);
  const [words, setWords] = useState(() => hangWords(rngFor(play, true), play.level));
  const [i, setI] = useState(0);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [points, setPoints] = useState<number[]>([]);
  const word = words[i];
  const misses = hangMisses(word, guessed);
  const solved = hangSolved(word, guessed);
  const lost = misses >= lives;
  const over = points.length >= words.length;

  useEffect(() => { if (over) void mochitoDo("game", { game: "Ahorcado de la galleta" }); }, [over]);

  function guess(ch: string) {
    if (guessed.includes(ch) || solved || lost) return;
    const g = [...guessed, ch];
    setGuessed(g);
    if (!word.includes(ch)) sfx("sad");
    else sfx(hangSolved(word, g) ? "success" : "coin");
  }
  function next() {
    setPoints((p) => [...p, hangPoints(solved, misses, lives)]);
    if (i + 1 < words.length) { setI((n) => n + 1); setGuessed([]); }
  }
  function again() { setWords(hangWords(rngFor(play, false), play.level)); setI(0); setGuessed([]); setPoints([]); }

  return (
    <section aria-labelledby="g-ahorcado" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-ahorcado" className="text-3xl">La galleta de Mochito</h2>
      <p className="text-muted-foreground">Adivina la palabra letra por letra. Cada letra que no está es una mordida de Mochito a la galleta. Tienes {lives} mordidas antes de que se la acabe. Son palabras de perritos y de sus aventuras.</p>
      <p className="text-sm font-semibold" aria-live="polite">Palabra {Math.min(i + 1, words.length)} de {words.length} · Mordidas: {misses} de {lives}</p>
      {!over && (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <CookieBites bites={Math.min(misses, lives)} lives={lives} />
            <p className="flex flex-wrap gap-1.5 font-heading text-3xl tracking-wider" aria-label={solved || lost ? `La palabra era ${word}` : `Palabra de ${word.length} letras`}>
              {(lost ? word.split("") : hangShown(word, guessed)).map((ch, k) => <span key={k} className={cn("flex h-12 w-9 items-end justify-center border-b-4", lost && !guessed.includes(ch) ? "border-destructive text-destructive" : "border-foreground/40")}>{ch === "_" ? "" : ch}</span>)}
            </p>
          </div>
          {solved || lost ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className={cn("rounded-2xl px-3 py-2 text-sm font-semibold", solved ? "bg-[#e3f3e6] text-[#1f5c2e] dark:bg-emerald-950 dark:text-emerald-200" : "bg-destructive/10 text-destructive")}>{solved ? "¡La adivinaste! Mochito te dejó un pedacito." : `Mochito se comió la galleta. Era «${word}».`}</p>
              <Button className="h-12 rounded-2xl px-6 text-base" onClick={next}>{i + 1 < words.length ? "Siguiente palabra" : "Ver resultado"}</Button>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9" role="group" aria-label="Letras">
              {ALPHABET.map((ch) => {
                const used = guessed.includes(ch);
                const good = used && word.includes(ch);
                return <button key={ch} type="button" disabled={used} onClick={() => guess(ch)} className={cn("h-12 rounded-xl text-lg font-semibold active:scale-[0.97]", !used ? "bg-secondary" : good ? "bg-[#5bb06a] text-white" : "bg-destructive/20 text-muted-foreground line-through")}>{ch}</button>;
              })}
            </div>
          )}
        </>
      )}
      {over ? (
        <Result game="ahorcado" play={play} score={points.reduce((a, b) => a + b, 0) / words.length} onAgain={again} onExit={onExit} detail={`Adivinaste ${points.filter((p) => p > 0.2).length} de ${words.length} palabras. Mochito dice: «Las galletas que quedaron, ¿me las das?»`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}

// ---------- Minigolf ----------

/** Minigolf en el parque: apunta tocando el campo (o con los botones), elige la fuerza y tira. */
export function GolfGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const spec = golfSpec(play.level);
  const holes = HOLES.slice(0, spec.holes);
  const svg = useRef<SVGSVGElement>(null);
  const [h, setH] = useState(0);
  const hole = holes[Math.min(h, holes.length - 1)];
  const [ball, setBall] = useState<[number, number]>(hole.start);
  const [angle, setAngle] = useState(-Math.PI / 2);
  const [power, setPower] = useState(0.5);
  const [shots, setShots] = useState(0);
  const [strokes, setStrokes] = useState<number[]>([]);
  const [anim, setAnim] = useState<[number, number][] | null>(null);
  const [frame, setFrame] = useState(0);
  const [sunk, setSunk] = useState(false);
  const over = strokes.length >= holes.length;

  useEffect(() => { if (over) void mochitoDo("game", { game: "Minigolf" }); }, [over]);
  useEffect(() => {
    if (!anim) return;
    const id = setInterval(() => setFrame((f) => f + 1), 16);
    return () => clearInterval(id);
  }, [anim]);
  const k = anim ? Math.min(frame * 3, anim.length - 1) : 0;
  const pos: [number, number] = anim ? anim[k] : ball;
  const rolling = !!anim && k < anim.length - 1;

  function aimAt(e: React.PointerEvent<SVGSVGElement>) {
    if (anim || sunk) return;
    const r = svg.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((e.clientX - r.left) / r.width) * GOLF_W;
    const y = ((e.clientY - r.top) / r.height) * GOLF_H;
    setAngle(Math.atan2(y - ball[1], x - ball[0]));
  }
  function shoot() {
    if (anim || sunk) return;
    const r = golfShot(hole, ball, angle, power, spec.cupR);
    sfx("click");
    setShots((s) => s + 1);
    setFrame(reduce ? 9999 : 0);
    setAnim(r.path);
    const ms = reduce ? 50 : Math.ceil(r.path.length / 3) * 16 + 80;
    setTimeout(() => {
      setAnim(null);
      setBall(r.end);
      if (r.inCup) { setSunk(true); sfx("success"); }
      else if (shots + 1 >= spec.maxShots) { setSunk(true); sfx("sad"); }
    }, ms);
  }
  function nextHole() {
    setStrokes((s) => [...s, sunk && Math.hypot(ball[0] - hole.cup[0], ball[1] - hole.cup[1]) < 0.01 ? shots : spec.maxShots + 1]);
    const n = h + 1;
    if (n < holes.length) { setH(n); setBall(holes[n].start); setShots(0); setSunk(false); setAngle(-Math.PI / 2); }
  }
  function again() { setH(0); setBall(holes[0].start); setShots(0); setStrokes([]); setSunk(false); setAngle(-Math.PI / 2); setPower(0.5); }
  const inCup = sunk && Math.hypot(ball[0] - hole.cup[0], ball[1] - hole.cup[1]) < 0.01;
  const aimLen = 10 + power * 28;

  return (
    <section aria-labelledby="g-golf" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-golf" className="text-3xl">Minigolf</h2>
      <p className="text-muted-foreground">Toca el campo para apuntar (o gira con los botones), elige la fuerza y tira. La pelota rebota en las orillas y en los obstáculos. Si va muy rápido, se pasa del hoyo.</p>
      <p className="text-sm font-semibold" aria-live="polite">Hoyo {Math.min(h + 1, holes.length)} de {holes.length}: {hole.name} · Par {hole.par} · Golpes: {shots}</p>
      {!over && (
        <div className="flex flex-wrap items-start gap-4">
          <svg ref={svg} viewBox={`0 0 ${GOLF_W} ${GOLF_H}`} onPointerDown={aimAt} onPointerMove={(e) => { if (e.buttons) aimAt(e); }} className="w-full max-w-[16rem] touch-none select-none rounded-3xl border-[6px] border-[#a8703f] bg-[#7cc576]" role="img" aria-label={`Campo del hoyo ${hole.name}`}>
            {[20, 60, 100, 140].map((y) => <rect key={y} x="0" y={y} width={GOLF_W} height="20" fill="rgb(255 255 255 / 0.07)" />)}
            {hole.walls.map((w, i) => <rect key={i} x={w.x} y={w.y} width={w.w} height={w.h} rx="1.5" fill="#a8703f" stroke="#6b4422" strokeWidth="0.6" />)}
            <circle cx={hole.cup[0]} cy={hole.cup[1]} r={spec.cupR} fill="#1f2a1f" />
            {!inCup && <><path d={`M${hole.cup[0]} ${hole.cup[1]} V${hole.cup[1] - 16}`} stroke="#f4f4f4" strokeWidth="0.8" /><path d={`M${hole.cup[0]} ${hole.cup[1] - 16} L${hole.cup[0] + 8} ${hole.cup[1] - 13} L${hole.cup[0]} ${hole.cup[1] - 10} Z`} fill="#d6453d" /></>}
            {!anim && !sunk && <path d={`M${ball[0]} ${ball[1]} L${ball[0] + Math.cos(angle) * aimLen} ${ball[1] + Math.sin(angle) * aimLen}`} stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" />}
            <circle cx={pos[0]} cy={pos[1]} r="2.4" fill="#ffffff" stroke="rgb(0 0 0 / 0.35)" strokeWidth="0.5" />
          </svg>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button type="button" aria-label="Girar a la izquierda" disabled={!!anim || sunk} onClick={() => setAngle((a) => a - 0.12)} className="flex size-12 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><RotateCcw className="size-5" aria-hidden /></button>
              <button type="button" aria-label="Girar a la derecha" disabled={!!anim || sunk} onClick={() => setAngle((a) => a + 0.12)} className="flex size-12 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><RotateCw className="size-5" aria-hidden /></button>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="golf-fuerza" className="text-xs font-semibold">Fuerza: {Math.round(power * 100)} %</label>
              <input id="golf-fuerza" type="range" min={5} max={100} value={Math.round(power * 100)} disabled={!!anim || sunk} onChange={(e) => setPower(+e.target.value / 100)} className="w-44 accent-[var(--primary)]" />
            </div>
            {sunk ? (
              <>
                <p className={cn("rounded-2xl px-3 py-2 text-sm font-semibold", inCup ? "bg-[#e3f3e6] text-[#1f5c2e] dark:bg-emerald-950 dark:text-emerald-200" : "bg-destructive/10 text-destructive")}>{inCup ? (shots === 1 ? "¡HOYO EN UNO!" : shots <= hole.par ? `¡Adentro en ${shots}! Bajo el par.` : `Adentro en ${shots} golpes.`) : "Se acabaron los golpes de este hoyo."}</p>
                <Button className="h-12 rounded-2xl px-6 text-base" onClick={nextHole}>{h + 1 < holes.length ? "Siguiente hoyo" : "Ver resultado"}</Button>
              </>
            ) : (
              <Button className="h-12 rounded-2xl px-6 text-base" disabled={rolling || !!anim} onClick={shoot}>¡Tirar!</Button>
            )}
          </div>
        </div>
      )}
      {over ? (
        <Result game="golf" play={play} score={golfScore(strokes, holes)} onAgain={again} onExit={onExit} detail={`Hiciste ${strokes.reduce((a, b) => a + b, 0)} golpes en ${holes.length} hoyos (el par era ${holes.reduce((a, x) => a + x.par, 0)}). Mochito trajo la pelota de regreso cada vez.`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}

// ---------- Torre de bloques ----------

const BLOCK_COLORS = ["#d6453d", "#f08a24", "#f6c744", "#5bb06a", "#3f74c4", "#9b7fd1", "#e27aa3"];
type Block = { x: number; w: number };

/** El bloque va y viene: suéltalo justo encima del de abajo. Lo que sobresale se cae. */
export function TowerGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const look = useLook();
  const spec = towerSpec(play.level);
  const base: Block = { x: (1 - TOWER_W) / 2, w: TOWER_W };
  const [stack, setStack] = useState<Block[]>([base]);
  const [period, setPeriod] = useState(spec.period);
  const [over, setOver] = useState(false);
  const [msg, setMsg] = useState("");
  const [t, setT] = useState(0);
  const t0 = useRef(0);
  const height = stack.length - 1;
  const top = stack[stack.length - 1];

  useEffect(() => {
    if (over) return;
    t0.current = Date.now();
    const id = setInterval(() => setT(Date.now() - t0.current), 30);
    return () => clearInterval(id);
  }, [over, height]);
  useEffect(() => { if (over) void mochitoDo("game", { game: "Torre de bloques" }); }, [over]);

  const x = towerX(sweep(t, period), top.w);
  function drop() {
    if (over) return;
    const at = towerX(sweep(Date.now() - t0.current, period), top.w);
    const r = towerDrop(top, at, spec.perfect);
    if (!r) { setOver(true); setMsg("¡Se cayó! El bloque no tocó la torre."); sfx("sad"); return; }
    const n = [...stack, { x: r.x, w: r.w }];
    setStack(n);
    setPeriod((p) => Math.max(700, p * spec.speedUp));
    setMsg(r.perfect ? "¡Perfecto!" : "");
    sfx(r.perfect ? "cash" : "click");
    if (n.length - 1 >= TOWER_GOAL) { setOver(true); setMsg("¡Llegaste hasta arriba!"); sfx("success"); }
  }
  function again() { setStack([base]); setPeriod(spec.period); setOver(false); setMsg(""); }
  const ROW = 100 / (TOWER_GOAL + 3);
  const shift = Math.max(0, height - 10);

  return (
    <section aria-labelledby="g-torre" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-torre" className="text-3xl">Torre de bloques</h2>
      <p className="text-muted-foreground">El bloque de arriba va y viene. Toca «Soltar» (o la pantalla) cuando esté justo encima: lo que sobresale se cae y el siguiente bloque sale más angosto. Llega a {TOWER_GOAL} pisos.</p>
      <p className="text-sm font-semibold" aria-live="polite">Pisos: {height} de {TOWER_GOAL}{msg ? ` · ${msg}` : ""}</p>
      <div
        role="button"
        tabIndex={0}
        aria-label="Soltar el bloque"
        onPointerDown={(e) => { e.preventDefault(); drop(); }}
        onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); drop(); } }}
        className="relative mx-auto aspect-[3/4] w-full max-w-sm touch-none select-none overflow-hidden rounded-[2rem] bg-gradient-to-b from-sky-200 to-sky-50 outline-none focus-visible:ring-4 focus-visible:ring-ring/40 dark:from-sky-900 dark:to-sky-950"
      >
        <div className="absolute inset-x-0 bottom-0 h-[4%] bg-[#7cc576]" aria-hidden />
        {stack.map((b, i) => {
          const y = 4 + (i - shift) * ROW;
          if (y < -ROW) return null;
          return (
            <motion.span
              key={i}
              className="absolute block rounded-md border-2 border-black/15"
              style={{ left: `${b.x * 100}%`, width: `${b.w * 100}%`, bottom: `${y}%`, height: `${ROW}%`, background: i === 0 ? "#a8703f" : BLOCK_COLORS[i % BLOCK_COLORS.length] }}
              initial={reduce || i === 0 ? false : { transform: "translateY(-8px)", opacity: 0.6 }}
              animate={{ transform: "translateY(0px)", opacity: 1 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              aria-hidden
            />
          );
        })}
        {!over && <span className="absolute block rounded-md border-2 border-black/15" style={{ left: `${x * 100}%`, width: `${top.w * 100}%`, bottom: `${4 + (height + 1 - shift) * ROW}%`, height: `${ROW}%`, background: BLOCK_COLORS[(height + 1) % BLOCK_COLORS.length] }} aria-hidden />}
        <span className="absolute bottom-[4%] left-[2%] block h-[22%]" aria-hidden><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
      </div>
      {over ? (
        <Result game="torre" play={play} score={towerScore(height)} onAgain={again} onExit={onExit} detail={`Tu torre llegó a ${height} ${height === 1 ? "piso" : "pisos"}. Mochito dice: «¡Desde arriba se ve mi casa!»`} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button className="h-14 rounded-2xl px-8 text-base" onClick={drop}>Soltar</Button>
          <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}
