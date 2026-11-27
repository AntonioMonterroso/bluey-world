"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Bone, Check, Droplets, Eraser, Paintbrush, Sprout, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import { mochitoDo } from "@/lib/mochito-actions";
import {
  E_, N_, S_, W_, codeCheck, codeMake, codeScore, codeSpec, picClues, picCol, picMake, picRow, picScore, pipeSize, pipesDone, pipesFlow, pipesMake, pipesScore, rotCw,
  rvApply, rvCount, rvFlips, rvInit, rvMove, rvMoves, rvScore, rvSize, type Rv,
} from "@/lib/mochito-extra-7";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// ---------- Voltea fichas ----------

/** Encierra las pelotas de Mochito entre dos huesos tuyos y se voltean. Gana quien tenga más al final. */
export function FlipGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const n = rvSize(play.level);
  const [rnd, setRnd] = useState(() => rngFor(play, true));
  const [b, setB] = useState<Rv>(() => rvInit(n));
  const [turn, setTurn] = useState<"y" | "m">("y");
  const [msg, setMsg] = useState("Te toca. Los puntitos muestran dónde puedes poner.");
  const [last, setLast] = useState<number | null>(null);
  const mine = rvMoves(b, n, "y");
  const his = rvMoves(b, n, "m");
  const over = !mine.length && !his.length;
  const y = rvCount(b, "y"), m = rvCount(b, "m");

  useEffect(() => { if (over) void mochitoDo("game", { game: "Voltea fichas" }); }, [over]);
  useEffect(() => {
    if (over) return;
    if (turn === "y" && !mine.length) { const id = setTimeout(() => { setMsg("No tienes dónde poner. Pasa el turno a Mochito."); setTurn("m"); }, 600); return () => clearTimeout(id); }
    if (turn !== "m") return;
    const id = setTimeout(() => {
      const i = rvMove(rnd, b, n, play.level);
      if (i === null) { setMsg("Mochito no tiene dónde poner. ¡Te toca otra vez!"); setTurn("y"); return; }
      const f = rvFlips(b, n, i, "m").length;
      setB(rvApply(b, n, i, "m")); setLast(i); sfx("click");
      setMsg(`Mochito volteó ${f} ${f === 1 ? "ficha" : "fichas"}. Te toca.`);
      setTurn("y");
    }, 650);
    return () => clearTimeout(id);
  }, [turn, over, mine.length, rnd, b, n, play.level]);

  function put(i: number) {
    if (turn !== "y" || !mine.includes(i)) return;
    const f = rvFlips(b, n, i, "y").length;
    setB(rvApply(b, n, i, "y")); setLast(i); sfx("coin");
    setMsg(`¡Volteaste ${f}! Le toca a Mochito…`);
    setTurn("m");
  }
  function again() { const r = rngFor(play, false); setRnd(() => r); setB(rvInit(n)); setTurn("y"); setLast(null); setMsg("Te toca."); }

  return (
    <section aria-labelledby="g-voltea" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-voltea" className="text-3xl">Voltea fichas</h2>
      <p className="text-muted-foreground">Tú tienes los huesos y Mochito las pelotas. Pon un hueso de modo que una o más pelotas queden encerradas en línea (derecho o en diagonal) entre tu hueso nuevo y otro tuyo: todas se voltean a hueso. Si no puedes poner, pasa el turno. Al final gana quien tenga más.</p>
      <p className="text-sm font-semibold" aria-live="polite">Huesos: {y} · Pelotas: {m} · {over ? "" : msg}</p>
      <div className="mx-auto grid w-full max-w-sm gap-0.5 rounded-2xl bg-[#3d6b3a] p-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} role="grid" aria-label="Tablero">
        {b.map((x, i) => {
          const can = turn === "y" && mine.includes(i);
          return (
            <button key={i} type="button" role="gridcell" disabled={!can} onClick={() => put(i)} aria-label={`${String.fromCharCode(65 + (i % n))}${Math.floor(i / n) + 1}: ${x === "y" ? "hueso" : x === "m" ? "pelota" : can ? "puedes poner" : "vacía"}`} className={cn("relative flex aspect-square items-center justify-center rounded-[4px] bg-[#5ea65a]", can && "active:scale-[0.97]", last === i && "ring-2 ring-inset ring-amber-300")}>
              {x && (
                <motion.span key={x} className="flex h-[80%] w-[80%] items-center justify-center rounded-full" style={{ background: x === "y" ? "#fffaf0" : "#e3893a" }} initial={reduce ? false : { opacity: 0.4, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ duration: 0.18, ease: EASE_OUT }} aria-hidden>
                  {x === "y" ? <Bone className="size-[65%] text-[#8a5a2e]" /> : <span className="block h-[15%] w-[70%] rounded-full bg-white/70" />}
                </motion.span>
              )}
              {!x && can && <span className="block size-[22%] rounded-full bg-white/60" aria-hidden />}
            </button>
          );
        })}
      </div>
      {over ? (
        <Result game="voltea" play={play} score={rvScore(y, m)} onAgain={again} onExit={onExit} detail={y > m ? `¡Ganaste ${y} a ${m}!` : y === m ? `¡Empate a ${y}!` : `Mochito ganó ${m} a ${y}. «¡Otra, otra!»`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}

// ---------- Adivina los colores ----------

const PEGS = [
  { c: "#d6453d", n: "Rojo" }, { c: "#3f74c4", n: "Azul" }, { c: "#f6c744", n: "Amarillo" },
  { c: "#4a9a5b", n: "Verde" }, { c: "#8a63c9", n: "Morado" }, { c: "#f08a24", n: "Naranja" },
];

function Peg({ k, size = "size-9" }: { k: number | undefined; size?: string }) {
  return <span className={cn("block rounded-full border-2", size, k === undefined ? "border-dashed border-border bg-transparent" : "border-black/20")} style={k === undefined ? undefined : { background: PEGS[k].c }} aria-hidden />;
}

/** Mochito esconde una fila de colores. Adivínala con sus pistas. */
export function CodeGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const spec = codeSpec(play.level);
  const [secret, setSecret] = useState(() => codeMake(rngFor(play, true), play.level));
  const [rows, setRows] = useState<{ g: number[]; exact: number; near: number }[]>([]);
  const [cur, setCur] = useState<number[]>([]);
  const won = rows.some((r) => r.exact === spec.len);
  const over = won || rows.length >= spec.tries;

  useEffect(() => { if (over) void mochitoDo("game", { game: "Adivina los colores" }); }, [over]);

  function add(k: number) {
    if (over || cur.length >= spec.len) return;
    if (!spec.repeat && cur.includes(k)) { sfx("sad"); return; }
    setCur([...cur, k]); sfx("click");
  }
  function send() {
    if (cur.length < spec.len) return;
    const r = codeCheck(secret, cur);
    setRows([...rows, { g: cur, ...r }]); setCur([]);
    sfx(r.exact === spec.len ? "success" : r.exact || r.near ? "coin" : "click");
  }
  function again() { setSecret(codeMake(rngFor(play, false), play.level)); setRows([]); setCur([]); }
  const pegs = PEGS.slice(0, spec.colors);

  return (
    <section aria-labelledby="g-colores" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-colores" className="text-3xl">Adivina los colores</h2>
      <p className="text-muted-foreground">Mochito escondió {spec.len} colores en orden{spec.repeat ? " (se pueden repetir)" : " (sin repetir)"}. Arma tu intento y Mochito te dice: <b>✔</b> cuántos están en su lugar y <b>●</b> cuántos son del color correcto pero en otro lugar. Tienes {spec.tries} intentos.</p>
      <ol className="flex flex-col gap-1.5" aria-label="Tus intentos">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center gap-2 rounded-2xl bg-card px-3 py-1.5">
            <span className="w-5 text-sm text-muted-foreground">{i + 1}</span>
            <span className="flex gap-1.5">{r.g.map((k, j) => <Peg key={j} k={k} size="size-7" />)}</span>
            <span className="ml-auto text-sm font-semibold" aria-label={`${r.exact} en su lugar, ${r.near} en otro lugar`}><Check className="inline size-4 text-emerald-600" aria-hidden /> {r.exact} · <span className="inline-block size-2.5 rounded-full bg-foreground/70 align-middle" aria-hidden /> {r.near}</span>
          </li>
        ))}
      </ol>
      {over ? (
        <>
          <p className="flex items-center gap-2 text-sm font-semibold">La fila era: <span className="flex gap-1.5">{secret.map((k, j) => <Peg key={j} k={k} size="size-7" />)}</span></p>
          <Result game="colores" play={play} score={codeScore(won, rows.length, spec.tries)} onAgain={again} onExit={onExit} detail={won ? `¡Lo adivinaste en ${rows.length} ${rows.length === 1 ? "intento" : "intentos"}!` : "Se acabaron los intentos. Mochito te enseña su fila."} />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2" aria-live="polite">
            <span className="text-sm font-semibold">Intento {rows.length + 1}:</span>
            {Array.from({ length: spec.len }, (_, j) => <Peg key={j} k={cur[j]} />)}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Colores">
            {pegs.map((p, k) => <button key={p.n} type="button" aria-label={p.n} disabled={!spec.repeat && cur.includes(k)} onClick={() => add(k)} className="size-12 rounded-full border-4 border-black/10 active:scale-[0.97] disabled:opacity-30" style={{ background: p.c }} />)}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="h-12 rounded-2xl px-6 text-base" disabled={cur.length < spec.len} onClick={send}>Probar</Button>
            <Button variant="outline" className="h-12 rounded-2xl px-4 text-base" disabled={!cur.length} onClick={() => setCur(cur.slice(0, -1))}><Eraser className="size-5" aria-hidden /> Borrar</Button>
            <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
          </div>
        </>
      )}
    </section>
  );
}

// ---------- Tuberías de agua ----------

function PipeArt({ m, wet }: { m: number; wet: boolean }) {
  const col = wet ? "#3f8fd6" : "#9aa3ab";
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
      {m & N_ ? <rect x="15" y="0" width="10" height="25" fill={col} /> : null}
      {m & S_ ? <rect x="15" y="15" width="10" height="25" fill={col} /> : null}
      {m & E_ ? <rect x="15" y="15" width="25" height="10" fill={col} /> : null}
      {m & W_ ? <rect x="0" y="15" width="25" height="10" fill={col} /> : null}
      <circle cx="20" cy="20" r="6" fill={col} />
    </svg>
  );
}

/** Gira los tubos para que el agua llegue de la llave a la plantita. */
export function PipesGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const n = pipeSize(play.level);
  const [p, setP] = useState(() => pipesMake(rngFor(play, true), n));
  const [g, setG] = useState<number[]>(() => p.start);
  const [moves, setMoves] = useState(0);
  const flow = pipesFlow(g, n);
  const done = pipesDone(g, n);

  useEffect(() => { if (done) void mochitoDo("game", { game: "Tuberías de agua" }); }, [done]);

  function turn(i: number) {
    if (done) return;
    const ng = g.map((m, k) => (k === i ? rotCw(m) : m));
    setG(ng); setMoves((x) => x + 1);
    sfx(pipesDone(ng, n) ? "success" : "click");
  }
  function again() { const np = pipesMake(rngFor(play, false), n); setP(np); setG(np.start); setMoves(0); }

  return (
    <section aria-labelledby="g-tubos" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-tubos" className="text-3xl">Tuberías de agua</h2>
      <p className="text-muted-foreground">Toca un tubo para girarlo. Los tubos se pintan de azul cuando les llega agua. Conecta la llave (arriba a la izquierda) con la plantita (abajo a la derecha).</p>
      <p className="text-sm font-semibold" aria-live="polite">Giros: {moves}{done ? " · ¡El agua llegó!" : ""}</p>
      <div className="mx-auto flex w-full max-w-sm items-start gap-1">
        <span className="mt-[2%] flex shrink-0 flex-col items-center text-[#3f8fd6]" style={{ height: `${100 / n}%` }} aria-hidden><Droplets className="size-7" /></span>
        <div className="grid flex-1 gap-0.5 rounded-2xl bg-[#e7e0d4] p-1 dark:bg-[#3a3346]" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} role="grid" aria-label="Tubos">
          {g.map((m, i) => (
            <button key={i} type="button" role="gridcell" onClick={() => turn(i)} aria-label={`Tubo ${i + 1}${flow.has(i) ? ", con agua" : ""}`} className="aspect-square rounded-md bg-card active:scale-[0.97]">
              <PipeArt m={m} wet={flow.has(i)} />
            </button>
          ))}
        </div>
        <span className="flex shrink-0 flex-col justify-end self-end pb-[2%]" aria-hidden>
          <motion.span animate={done ? { transform: "scale(1.15)" } : { transform: "scale(1)" }} transition={{ duration: 0.3, ease: EASE_OUT }}><Sprout className={cn("size-8", done ? "text-emerald-600" : "text-[#9aa3ab]")} /></motion.span>
        </span>
      </div>
      {done ? (
        <Result game="tubos" play={play} score={pipesScore(moves, p.min)} onAgain={again} onExit={onExit} detail={`¡La plantita tiene agua! Lo hiciste en ${moves} giros.`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}

// ---------- Dibujo escondido ----------

/** Pinta las casillas que dicen los números hasta que aparezca el dibujo. */
export function PicGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const [pic, setPic] = useState(() => picMake(rngFor(play, true), play.level));
  const { n, cells } = pic;
  const [paint, setPaint] = useState<boolean[]>(() => Array(n * n).fill(false));
  const [marks, setMarks] = useState<boolean[]>(() => Array(n * n).fill(false));
  const [tool, setTool] = useState<"pintar" | "marcar">("pintar");
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const done = cells.every((v, i) => !v || paint[i]);

  useEffect(() => { if (done) void mochitoDo("game", { game: "Dibujo escondido" }); }, [done]);

  function tap(i: number) {
    if (done || paint[i]) return;
    if (tool === "marcar") { setMarks(marks.map((v, k) => (k === i ? !v : v))); sfx("click"); return; }
    if (!cells[i]) { setMistakes((m) => m + 1); setMarks(marks.map((v, k) => (k === i ? true : v))); setWrong(i); sfx("sad"); return; }
    const p = paint.map((v, k) => (k === i ? true : v));
    setPaint(p); setWrong(null);
    sfx(cells.every((v, k) => !v || p[k]) ? "success" : "coin");
  }
  function again() { const np = picMake(rngFor(play, false), play.level); setPic(np); setPaint(Array(np.n * np.n).fill(false)); setMarks(Array(np.n * np.n).fill(false)); setMistakes(0); setWrong(null); }
  const rowsC = Array.from({ length: n }, (_, r) => picClues(picRow(cells, n, r)));
  const colsC = Array.from({ length: n }, (_, c) => picClues(picCol(cells, n, c)));
  const rowDone = (r: number) => picRow(cells, n, r).every((v, c) => !v || paint[r * n + c]);
  const colDone = (c: number) => picCol(cells, n, c).every((v, r) => !v || paint[r * n + c]);
  const small = n >= 10;

  return (
    <section aria-labelledby="g-dibujo" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-dibujo" className="text-3xl">Dibujo escondido</h2>
      <p className="text-muted-foreground">Los números dicen cuántas casillas seguidas se pintan en esa fila (a la izquierda) o columna (arriba), en ese orden y con al menos un hueco entre cada grupo. Usa la X para marcar las que seguro van vacías. Si pintas una que no va, se marca con X y cuenta como equivocación.</p>
      <p className="text-sm font-semibold" aria-live="polite">Equivocaciones: {mistakes}{wrong !== null ? " · Esa casilla iba vacía." : ""}</p>
      <div className="mx-auto w-full max-w-md overflow-hidden">
        <div className="grid gap-px" style={{ gridTemplateColumns: `minmax(2.2rem, auto) repeat(${n}, minmax(0, 1fr))` }}>
          <span />
          {colsC.map((c, k) => <span key={k} className={cn("flex flex-col items-center justify-end pb-1 font-semibold leading-tight", small ? "text-[10px]" : "text-xs", colDone(k) && "text-muted-foreground/60")}>{c.map((x, j) => <span key={j}>{x}</span>)}</span>)}
          {Array.from({ length: n }, (_, r) => [
            <span key={`r${r}`} className={cn("flex items-center justify-end gap-1 pr-1.5 font-semibold", small ? "text-[10px]" : "text-xs", rowDone(r) && "text-muted-foreground/60")}>{rowsC[r].map((x, j) => <span key={j}>{x}</span>)}</span>,
            ...Array.from({ length: n }, (_, c) => {
              const i = r * n + c;
              return (
                <button key={i} type="button" onClick={() => tap(i)} aria-label={`Fila ${r + 1}, columna ${c + 1}${paint[i] ? ": pintada" : marks[i] ? ": marcada vacía" : ""}`} className={cn("flex aspect-square items-center justify-center border border-foreground/15 active:scale-[0.97]", paint[i] ? "bg-[#5a3b2e]" : "bg-card", small && c === 4 && "border-r-foreground/50", small && r === 4 && "border-b-foreground/50", wrong === i && "bg-destructive/20")}>
                  {!paint[i] && marks[i] && <X className="size-3/4 text-muted-foreground" aria-hidden />}
                </button>
              );
            }),
          ])}
        </div>
      </div>
      {done ? (
        <Result game="dibujo" play={play} score={picScore(mistakes)} onAgain={again} onExit={onExit} detail={`¡Apareció ${pic.name}!${mistakes ? ` Te equivocaste ${mistakes} ${mistakes === 1 ? "vez" : "veces"}.` : " Sin una sola equivocación."}`} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2" role="group" aria-label="Herramienta">
            <button type="button" aria-pressed={tool === "pintar"} onClick={() => setTool("pintar")} className={cn("flex min-h-12 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-semibold active:scale-[0.97]", tool === "pintar" ? "border-primary bg-primary/10" : "border-border")}><Paintbrush className="size-4" aria-hidden /> Pintar</button>
            <button type="button" aria-pressed={tool === "marcar"} onClick={() => setTool("marcar")} className={cn("flex min-h-12 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-semibold active:scale-[0.97]", tool === "marcar" ? "border-primary bg-primary/10" : "border-border")}><X className="size-4" aria-hidden /> Marcar vacía</button>
          </div>
          <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}
