"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Bone, Dices, Dog, Hand, HandFist, RotateCcw, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MochitoFigure } from "@/components/mochito-figure";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import { useProfile } from "@/lib/db/profile";
import { mochitoDo } from "@/lib/mochito-actions";
import { groomActive } from "@/lib/mochito-extra";
import {
  C4_COLS, C4_GAMES, C4_ROWS, RPS, RPS_TO, SUMS_ROUNDS, c4Drop, c4Empty, c4Move, c4Row, c4Winner, laddersBoard, laddersMove, laddersScore, rpsMochito, rpsScore, rpsWin,
  sumsBest, sumsPoints, sumsRound, type C4, type Rps, type SumsRound,
} from "@/lib/mochito-extra-4";
import { tttPoints } from "@/lib/mochito-extra-3";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function useLook() {
  const { profile } = useProfile();
  const [now] = useState(() => Date.now());
  return { outfit: profile.mochito_outfit, groom: groomActive(profile.mochito_groom, now) ? profile.mochito_groom : null };
}

// ---------- Cuatro en línea ----------

type End = "gana" | "empate" | "pierde";

/** Cuatro en línea contra Mochito: tus fichas son amarillas, las de él rojas. Tres partidas. */
export function ConnectFourGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const look = useLook();
  const [rnd, setRnd] = useState(() => rngFor(play, true));
  const [board, setBoard] = useState<C4>(c4Empty);
  const [game, setGame] = useState(0);
  const [ends, setEnds] = useState<End[]>([]);
  const [thinking, setThinking] = useState(false);
  const [last, setLast] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const w = c4Winner(board);
  const over = ends.length >= C4_GAMES;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { if (over) void mochitoDo("game", { game: "Cuatro en línea" }); }, [over]);

  function finish(b: C4) {
    const r = c4Winner(b);
    if (!r) return false;
    const end: End = r === "empate" ? "empate" : r.who === "Y" ? "gana" : "pierde";
    setEnds((e) => [...e, end]);
    sfx(end === "gana" ? "success" : end === "empate" ? "coin" : "sad");
    return true;
  }
  function mochitoTurn(b: C4) {
    setThinking(true);
    timer.current = setTimeout(() => {
      const col = c4Move(rnd, b, play.level);
      const n = c4Drop(b, col, "M")!;
      setLast(c4Row(b, col) * C4_COLS + col);
      setBoard(n);
      setThinking(false);
      sfx("click");
      finish(n);
    }, reduce ? 150 : 650);
  }
  function drop(col: number) {
    if (w || thinking || over) return;
    const n = c4Drop(board, col, "Y");
    if (!n) return;
    setLast(c4Row(board, col) * C4_COLS + col);
    setBoard(n);
    sfx("click");
    if (!finish(n)) mochitoTurn(n);
  }
  function nextGame() {
    const g = game + 1;
    const empty = c4Empty();
    setBoard(empty); setGame(g); setLast(-1);
    if (g % 2 === 1) mochitoTurn(empty);
  }
  function again() { const r = rngFor(play, false); setRnd(() => r); setBoard(c4Empty()); setGame(0); setEnds([]); setThinking(false); setLast(-1); }
  const wins = ends.filter((e) => e === "gana").length;
  const line = w && w !== "empate" ? w.cells : [];

  return (
    <section aria-labelledby="g-c4" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-c4" className="text-3xl">Cuatro en línea</h2>
      <p className="text-muted-foreground">Toca una columna para dejar caer tu ficha amarilla. Gana quien junte cuatro seguidas: de lado, hacia arriba o en diagonal. Son {C4_GAMES} partidas y se turnan para empezar.</p>
      <p className="text-sm font-semibold" aria-live="polite">Partida {Math.min(game + 1, C4_GAMES)} de {C4_GAMES} · Ganadas: {wins} · {w ? (w === "empate" ? "¡Empate!" : w.who === "Y" ? "¡Ganaste esta!" : "Ganó Mochito.") : thinking ? "Mochito está pensando…" : "Tu turno."}</p>
      <div className="flex items-end gap-3">
        <span className="hidden h-32 shrink-0 sm:block" aria-hidden><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
        <div className="grid w-full max-w-md gap-1.5 rounded-3xl bg-[#3f74c4] p-2" style={{ gridTemplateColumns: `repeat(${C4_COLS}, minmax(0, 1fr))` }} role="group" aria-label="Tablero">
          {Array.from({ length: C4_COLS }, (_, col) => (
            <button key={col} type="button" onClick={() => drop(col)} disabled={!!w || thinking || over || c4Row(board, col) < 0} aria-label={`Columna ${col + 1}`} className="flex flex-col gap-1.5 rounded-xl p-0.5 hover:bg-white/10 disabled:cursor-default">
              {Array.from({ length: C4_ROWS }, (_, row) => {
                const i = row * C4_COLS + col;
                const c = board[i];
                return (
                  <span key={row} className={cn("relative block aspect-square w-full overflow-hidden rounded-full bg-[#dfe9f7] dark:bg-slate-800", line.includes(i) && "ring-4 ring-white")}>
                    {c && (
                      <motion.span
                        className="absolute inset-0 block rounded-full"
                        style={{ background: c === "Y" ? "#f6c744" : "#d6453d" }}
                        initial={i === last && !reduce ? { transform: "translateY(-300%)" } : false}
                        animate={{ transform: "translateY(0%)" }}
                        transition={{ duration: 0.3, ease: EASE_OUT }}
                      />
                    )}
                  </span>
                );
              })}
            </button>
          ))}
        </div>
      </div>
      {over ? (
        <Result game="cuatro" play={play} score={ends.reduce((a, e) => a + tttPoints(e), 0) / C4_GAMES} onAgain={again} onExit={onExit} detail={`Ganaste ${wins} de ${C4_GAMES} partidas. Mochito dice: ${wins >= 2 ? "«¡Me ganaste! Qué buenas jugadas.»" : "«¡Otra! Ya casi me ganas.»"}`} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {w && <Button className="h-12 rounded-2xl px-6 text-base" onClick={nextGame}>{game + 1 >= C4_GAMES ? "Ver resultado" : "Siguiente partida"}</Button>}
          <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Sumas con huesos ----------

/** Mochito pide cierta cantidad de huesos: júntalos exacto con los botones. */
export function SumsGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const look = useLook();
  const [rnd, setRnd] = useState(() => rngFor(play, true));
  const [round, setRound] = useState<SumsRound>(() => sumsRound(rnd, play.level));
  const [i, setI] = useState(0);
  const [val, setVal] = useState(round.start);
  const [moves, setMoves] = useState(0);
  const [pts, setPts] = useState<number[]>([]);
  const [bump, setBump] = useState(0);
  const solved = val === round.target;
  const overshoot = !round.steps.some((s) => s < 0) && val > round.target;
  const over = pts.length >= SUMS_ROUNDS;

  useEffect(() => { if (over) void mochitoDo("game", { game: "Sumas con huesos" }); }, [over]);

  function step(s: number) {
    if (solved || overshoot) return;
    const n = val + s;
    if (n < 0) { sfx("sad"); return; }
    setVal(n); setMoves((m) => m + 1); setBump((b) => b + 1);
    sfx(n === round.target ? "success" : n > round.target && !round.steps.some((x) => x < 0) ? "sad" : "click");
  }
  function next(skip = false) {
    setPts((p) => [...p, skip ? 0 : sumsPoints(solved, moves, sumsBest(round))]);
    if (i + 1 >= SUMS_ROUNDS) return;
    const r = sumsRound(rnd, play.level);
    setRound(r); setVal(r.start); setMoves(0); setI((n) => n + 1);
  }
  function again() { const g = rngFor(play, false); setRnd(() => g); const r = sumsRound(g, play.level); setRound(r); setVal(r.start); setMoves(0); setI(0); setPts([]); }
  const sign = (s: number) => (s > 0 ? `+${s}` : `−${-s}`);

  return (
    <section aria-labelledby="g-sumas" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-sumas" className="text-3xl">Sumas con huesos</h2>
      <p className="text-muted-foreground">Mochito quiere una cantidad exacta de huesos en su plato. Usa los botones para juntarla{round.steps.some((s) => s < 0) ? ": unos suman y otros quitan" : ""}. Mientras menos toques, mejor.</p>
      <p className="text-sm font-semibold" aria-live="polite">Ronda {Math.min(i + 1, SUMS_ROUNDS)} de {SUMS_ROUNDS} · Toques: {moves}</p>
      {!over && (
        <>
          <div className="flex flex-wrap items-end gap-4 rounded-3xl bg-secondary/60 p-4">
            <span className="block h-28 shrink-0" aria-hidden><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
            <div className="flex flex-col gap-1">
              <p className="rounded-2xl bg-card px-3 py-2 text-base font-semibold shadow-sm">«Quiero {round.target} huesos, por favor.»</p>
              <motion.p key={bump} className="font-heading text-5xl tabular-nums" initial={false} animate={bump && !reduce ? { transform: ["scale(1)", "scale(1.08)", "scale(1)"] } : undefined} transition={{ duration: 0.2, ease: EASE_OUT }} aria-label={`En el plato hay ${val} huesos`}>{val}</motion.p>
              <div className="flex max-w-xs flex-wrap gap-0.5" aria-hidden>{Array.from({ length: Math.min(val, 40) }, (_, k) => <Bone key={k} className="size-4 fill-[#fffaf0] text-[#8a5a2e]" />)}</div>
            </div>
          </div>
          {solved ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="rounded-2xl bg-[#e3f3e6] px-3 py-2 text-sm font-semibold text-[#1f5c2e] dark:bg-emerald-950 dark:text-emerald-200">¡Justo {round.target}! {moves <= sumsBest(round) ? "Y con los menos toques posibles." : `Se podía en ${sumsBest(round)} toques.`}</p>
              <Button className="h-12 rounded-2xl px-6 text-base" onClick={() => next()}>{i + 1 < SUMS_ROUNDS ? "Siguiente" : "Ver resultado"}</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {overshoot && <p className="text-sm font-semibold text-destructive" role="alert">¡Te pasaste! Vacía el plato y vuelve a empezar.</p>}
              <div className="flex flex-wrap gap-2">
                {round.steps.map((s) => <button key={s} type="button" disabled={overshoot} onClick={() => step(s)} className={cn("flex h-14 min-w-16 items-center justify-center gap-1 rounded-2xl px-4 font-heading text-xl active:scale-[0.97] disabled:opacity-40", s > 0 ? "bg-primary text-primary-foreground" : "bg-secondary")}>{sign(s)} <Bone className="size-4" aria-hidden /></button>)}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="h-12 rounded-2xl px-5 text-base" onClick={() => { setVal(round.start); setBump((b) => b + 1); sfx("click"); }}><RotateCcw className="size-4" aria-hidden /> Vaciar el plato</Button>
                <Button variant="outline" className="h-12 rounded-2xl px-5 text-base" onClick={() => next(true)}>Saltar</Button>
              </div>
            </div>
          )}
        </>
      )}
      {over ? (
        <Result game="sumas" play={play} score={pts.reduce((a, b) => a + b, 0) / SUMS_ROUNDS} onAgain={again} onExit={onExit} detail={`Le diste a Mochito lo justo en ${pts.filter((p) => p > 0).length} de ${SUMS_ROUNDS} rondas. «¡Contar huesos es mi materia favorita!»`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}

// ---------- Escaleras y resbaladillas ----------

const DIE_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

/** Juego de mesa contra Mochito: tiras el dado, las escaleras suben y las resbaladillas bajan. */
export function LaddersGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const b = laddersBoard(play.level);
  const cols = b.size === 25 ? 5 : 6;
  const rows = b.size / cols;
  const [rnd, setRnd] = useState(() => rngFor(play, true));
  const [me, setMe] = useState(0);
  const [him, setHim] = useState(0);
  const himRef = useRef(0);
  const [turn, setTurn] = useState<"tu" | "mochito">("tu");
  const [die, setDie] = useState(0);
  const [msg, setMsg] = useState("Tira el dado para empezar.");
  const [winner, setWinner] = useState<"tu" | "mochito" | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { if (winner) void mochitoDo("game", { game: "Escaleras y resbaladillas" }); }, [winner]);

  const cell = (n: number) => {
    const k = n - 1;
    const r = Math.floor(k / cols);
    const c = r % 2 === 0 ? k % cols : cols - 1 - (k % cols);
    return { x: (c + 0.5) / cols, y: 1 - (r + 0.5) / rows };
  };
  function say(who: "tu" | "mochito", roll: number, res: ReturnType<typeof laddersMove>) {
    const name = who === "tu" ? "Sacaste" : "Mochito sacó";
    const extra = res.kind === "escalera" ? ` ¡Escalera! Sube a la ${res.to}.` : res.kind === "resbaladilla" ? ` ¡Resbaladilla! Baja a la ${res.to}.` : "";
    return `${name} ${roll}: va a la ${res.land}.${extra}`;
  }
  function roll() {
    if (turn !== "tu" || winner) return;
    const n = 1 + (Math.floor(rnd() * 6) % 6);
    const res = laddersMove(me, n, b);
    setDie(n); setMe(res.to); setMsg(say("tu", n, res));
    sfx(res.kind === "escalera" ? "coin" : res.kind === "resbaladilla" ? "sad" : "click");
    if (res.to >= b.size) { setWinner("tu"); sfx("success"); setMsg("¡Llegaste a la meta primero!"); return; }
    setTurn("mochito");
    timer.current = setTimeout(() => {
      const m = 1 + (Math.floor(rnd() * 6) % 6);
      const r2 = laddersMove(himRef.current, m, b);
      himRef.current = r2.to;
      setHim(r2.to); setDie(m); setMsg(say("mochito", m, r2));
      if (r2.to >= b.size) { setWinner("mochito"); sfx("sad"); setMsg("Mochito llegó primero a la meta. ¡Qué suerte tuvo!"); }
      else setTurn("tu");
    }, reduce ? 200 : 1100);
  }
  function again() { const r = rngFor(play, false); setRnd(() => r); setMe(0); setHim(0); himRef.current = 0; setTurn("tu"); setDie(0); setMsg("Tira el dado para empezar."); setWinner(null); }

  return (
    <section aria-labelledby="g-escaleras" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-escaleras" className="text-3xl">Escaleras y resbaladillas</h2>
      <p className="text-muted-foreground">Tú y Mochito se turnan para tirar el dado. Si caes al pie de una escalera, subes; si caes arriba de una resbaladilla, bajas. Gana quien llegue primero a la {b.size}. Si te pasas, rebotas.</p>
      <p className="text-sm font-semibold" aria-live="polite">{msg} Tú: {me || "salida"} · Mochito: {him || "salida"}</p>
      <div className="relative mx-auto w-full max-w-md select-none overflow-hidden rounded-3xl border-4 border-[#a8703f]" style={{ aspectRatio: `${cols} / ${rows}` }}>
        <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} aria-hidden>
          {Array.from({ length: b.size }, (_, k) => {
            const r = rows - 1 - Math.floor(k / cols);
            const c = r % 2 === 0 ? k % cols : cols - 1 - (k % cols);
            const n = r * cols + c + 1;
            return <span key={k} className={cn("flex items-start justify-start p-1 text-[11px] font-semibold text-[#5a3b2e]", (r + c) % 2 ? "bg-[#fbe3c2]" : "bg-[#fff4e0]", n === b.size && "bg-[var(--gold)]")}>{n}</span>;
          })}
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          {Object.entries(b.jumps).map(([a, z]) => {
            const p = cell(+a), q = cell(z);
            const up = z > +a;
            if (up) {
              const x1 = p.x * 100, y1 = p.y * 100, x2 = q.x * 100, y2 = q.y * 100;
              const len = Math.hypot(x2 - x1, y2 - y1) || 1;
              const nx = (-(y2 - y1) / len) * 2.6, ny = ((x2 - x1) / len) * 2.6;
              const rungs = Math.max(2, Math.floor(len / 7));
              return (
                <g key={a} stroke="#8a5a2e" strokeLinecap="round">
                  <path d={`M${x1 + nx} ${y1 + ny} L${x2 + nx} ${y2 + ny} M${x1 - nx} ${y1 - ny} L${x2 - nx} ${y2 - ny}`} strokeWidth="3" vectorEffect="non-scaling-stroke" fill="none" />
                  {Array.from({ length: rungs }, (_, k) => { const f = (k + 0.5) / rungs; const cx = x1 + (x2 - x1) * f, cy = y1 + (y2 - y1) * f; return <path key={k} d={`M${cx + nx} ${cy + ny} L${cx - nx} ${cy - ny}`} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />; })}
                </g>
              );
            }
            return (
              <path key={a} d={`M${p.x * 100} ${p.y * 100} Q${(p.x + q.x) * 50 + 10} ${(p.y + q.y) * 50} ${q.x * 100} ${q.y * 100}`} stroke="#4fb3a9" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.8" vectorEffect="non-scaling-stroke" />
            );
          })}
        </svg>
        {[{ who: "tu", at: me }, { who: "mochito", at: him }].filter((t) => t.at > 0).map((t) => {
          const p = cell(t.at);
          return (
            <span key={t.who} className={cn("absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white shadow", t.who === "tu" ? "bg-primary text-primary-foreground" : "bg-[#d9a066] text-[#3a2a22]")} style={{ left: `${p.x * 100 + (t.who === "tu" ? -6 : 6) / cols}%`, top: `${p.y * 100}%` }} aria-hidden>
              {t.who === "tu" ? <span className="text-xs font-bold">Tú</span> : <Dog className="size-4" />}
            </span>
          );
        })}
      </div>
      {winner ? (
        <Result game="escaleras" play={play} score={laddersScore(winner === "tu", me, b.size)} onAgain={again} onExit={onExit} detail={winner === "tu" ? "¡Le ganaste a Mochito! Dice que la próxima vez el dado le va a hacer caso." : `Mochito ganó esta vez. Tú llegaste a la ${me}.`} />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button className="h-14 rounded-2xl px-8 text-base" disabled={turn !== "tu"} onClick={roll}><Dices className="size-5" aria-hidden /> {turn === "tu" ? "Tirar el dado" : "Le toca a Mochito…"}</Button>
          {die > 0 && <span className="font-heading text-5xl leading-none" aria-label={`El dado cayó en ${die}`}>{DIE_FACES[die]}</span>}
          <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Piedra, papel o tijera ----------

const RPS_ICON: Record<Rps, typeof Hand> = { piedra: HandFist, papel: Hand, tijera: Scissors };
const RPS_NAME: Record<Rps, string> = { piedra: "Piedra", papel: "Papel", tijera: "Tijera" };

/** Piedra, papel o tijera contra Mochito: el primero en ganar 3. Él tiene sus mañas. */
export function RpsGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const look = useLook();
  const [rnd, setRnd] = useState(() => rngFor(play, true));
  const [fav, setFav] = useState<Rps>(() => RPS[Math.floor(rnd() * 3) % 3]);
  const [mine, setMine] = useState<Rps[]>([]);
  const [his, setHis] = useState<Rps[]>([]);
  const [res, setRes] = useState<(1 | 0 | -1)[]>([]);
  const won = res.filter((r) => r === 1).length;
  const lost = res.filter((r) => r === -1).length;
  const over = won >= RPS_TO || lost >= RPS_TO;

  useEffect(() => { if (over) void mochitoDo("game", { game: "Piedra, papel o tijera" }); }, [over]);

  function choose(r: Rps) {
    if (over) return;
    const m = rpsMochito(rnd, play.level, fav, mine, his, res.length ? res[res.length - 1] : null);
    const out = rpsWin(r, m);
    setMine((x) => [...x, r]); setHis((x) => [...x, m]); setRes((x) => [...x, out]);
    sfx(out === 1 ? "coin" : out === -1 ? "sad" : "click");
  }
  function again() { const g = rngFor(play, false); setRnd(() => g); setFav(RPS[Math.floor(g() * 3) % 3]); setMine([]); setHis([]); setRes([]); }
  const k = res.length - 1;
  const hint = play.level === "facil" ? "Fíjate qué saca más seguido." : play.level === "normal" ? "Cuando le gana a alguien, le gusta repetir." : "Ojo: él se fija en lo que tú sacas seguido.";

  return (
    <section aria-labelledby="g-rps" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-rps" className="text-3xl">Piedra, papel o tijera</h2>
      <p className="text-muted-foreground">La piedra rompe la tijera, la tijera corta el papel y el papel envuelve la piedra. Gana quien llegue primero a {RPS_TO}. {hint}</p>
      <p className="text-sm font-semibold" aria-live="polite">Tú {won} · Mochito {lost}{k >= 0 ? ` · ${res[k] === 1 ? "¡Ganaste la mano!" : res[k] === -1 ? "Esta la ganó Mochito." : "Empate."}` : ""}</p>
      <div className="flex items-center justify-around gap-4 rounded-3xl bg-secondary/60 p-4">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-semibold">Tú</span>
          {k >= 0 ? (() => { const I = RPS_ICON[mine[k]]; return <motion.span key={k} initial={reduce ? false : { opacity: 0, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ duration: 0.2, ease: EASE_OUT }}><I className="size-16 text-primary" aria-label={RPS_NAME[mine[k]]} /></motion.span>; })() : <span className="size-16" />}
        </div>
        <span className="font-heading text-2xl text-muted-foreground" aria-hidden>vs</span>
        <div className="flex items-end gap-2">
          <span className="block h-24" aria-hidden><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
          {k >= 0 ? (() => { const I = RPS_ICON[his[k]]; return <motion.span key={`m${k}`} initial={reduce ? false : { opacity: 0, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ duration: 0.2, ease: EASE_OUT, delay: 0.1 }}><I className="size-16 text-[#a8703f]" aria-label={`Mochito: ${RPS_NAME[his[k]]}`} /></motion.span>; })() : <span className="size-16" />}
        </div>
      </div>
      {his.length > 0 && <p className="text-xs text-muted-foreground">Mochito ha sacado: {his.map((h) => RPS_NAME[h].toLowerCase()).join(", ")}.</p>}
      {over ? (
        <Result game="piedra" play={play} score={rpsScore(won, lost)} onAgain={again} onExit={onExit} detail={won >= RPS_TO ? `¡Le ganaste ${won} a ${lost}! Mochito dice: «¿Cómo supiste lo que iba a sacar?»` : `Mochito ganó ${lost} a ${won}. «¡Tengo mis mañas!»`} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {RPS.map((r) => { const I = RPS_ICON[r]; return <button key={r} type="button" onClick={() => choose(r)} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground active:scale-[0.97]"><I className="size-7" aria-hidden />{RPS_NAME[r]}</button>; })}
          <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}
