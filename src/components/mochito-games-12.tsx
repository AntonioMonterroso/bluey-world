"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bone, CircleDot, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MochitoFigure } from "@/components/mochito-figure";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import { useProfile } from "@/lib/db/profile";
import { mochitoDo } from "@/lib/mochito-actions";
import { groomActive } from "@/lib/mochito-extra";
import {
  BONE_GOAL, MOLES_MS, bonesAdd, bonesCanMove, bonesScore, bonesSlide, bonesStart, dmApply, dmCount, dmInit, dmMoreJumps, dmMove, dmPieceMoves, dmScore, dmWinner,
  domDeal, domEnds, domMove, domPips, domPlace, domSides, molePoints, molesPlan, molesScore, molesSpec,
  type Dir, type Dm, type DmMove, type Grid, type Tile,
} from "@/lib/mochito-extra-5";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function useLook() {
  const { profile } = useProfile();
  const [now] = useState(() => Date.now());
  return { outfit: profile.mochito_outfit, groom: groomActive(profile.mochito_groom, now) ? profile.mochito_groom : null };
}

// ---------- Topos del jardín ----------

/** Los topos salen de sus hoyos: tócalos antes de que se escondan. Los dorados valen más; a Mochito no lo toques. */
export function MolesGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const look = useLook();
  const reduce = useReducedMotion();
  const spec = molesSpec(play.level);
  const [plan, setPlan] = useState(() => molesPlan(rngFor(play, true), play.level));
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const [hit, setHit] = useState<number[]>([]);
  const [points, setPoints] = useState(0);
  const [oops, setOops] = useState(0);
  const t0 = useRef(0);
  const over = t >= MOLES_MS;

  useEffect(() => {
    if (!running) return;
    t0.current = Date.now();
    const id = setInterval(() => {
      const v = Date.now() - t0.current;
      setT(v);
      if (v >= MOLES_MS) { clearInterval(id); setRunning(false); }
    }, 40);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => { if (over) void mochitoDo("game", { game: "Topos del jardín" }); }, [over]);

  const up = new Map(plan.map((p, i) => [p, i] as const).filter(([p, i]) => !hit.includes(i) && t >= p.at && t < p.at + p.stay).map(([p, i]) => [p.hole, i]));
  function whack(hole: number) {
    if (!running) return;
    const i = up.get(hole);
    if (i === undefined) return;
    const p = plan[i];
    setHit((h) => [...h, i]);
    setPoints((x) => x + molePoints(p.kind));
    if (p.kind === "mochito") { setOops((o) => o + 1); sfx("sad"); } else sfx(p.kind === "dorado" ? "cash" : "coin");
  }
  function again() { setPlan(molesPlan(rngFor(play, false), play.level)); setT(0); setHit([]); setPoints(0); setOops(0); setRunning(false); }
  const cols = 3;

  return (
    <section aria-labelledby="g-topos" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-topos" className="text-3xl">Topos del jardín</h2>
      <p className="text-muted-foreground">Los topos se asoman y se esconden. Tócalos rápido: cada uno vale 1 y los dorados valen 3. Si sale Mochito, ¡no lo toques! Te quita 2.</p>
      <p className="text-sm font-semibold" aria-live="polite">Tiempo: {Math.max(0, Math.ceil((MOLES_MS - t) / 1000))} s · Puntos: {points}{oops ? ` · A Mochito le diste ${oops} ${oops === 1 ? "vez" : "veces"}` : ""}</p>
      <div className="mx-auto grid w-full max-w-sm gap-3 rounded-[2rem] bg-[#7cc576] p-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} role="group" aria-label="Hoyos">
        {Array.from({ length: spec.holes }, (_, h) => {
          const i = up.get(h);
          const p = i !== undefined ? plan[i] : null;
          return (
            <button key={h} type="button" onPointerDown={(e) => { e.preventDefault(); whack(h); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); whack(h); } }} aria-label={`Hoyo ${h + 1}${p ? (p.kind === "mochito" ? ": está Mochito" : ": hay un topo") : ""}`} className="relative aspect-square touch-none overflow-hidden rounded-full bg-[#6b4422] active:scale-[0.97]">
              {p && (
                <motion.span className="absolute inset-x-[12%] bottom-0 block h-[85%]" initial={reduce ? false : { transform: "translateY(70%)" }} animate={{ transform: "translateY(0%)" }} transition={{ duration: 0.15, ease: EASE_OUT }} aria-hidden>
                  {p.kind === "mochito" ? <MochitoFigure outfit={look.outfit} groom={look.groom} /> : (
                    <svg viewBox="0 0 60 60" className="h-full w-full"><ellipse cx="30" cy="40" rx="22" ry="22" fill={p.kind === "dorado" ? "#f6c744" : "#8a6a55"} /><circle cx="22" cy="32" r="3" fill="#1f1f24" /><circle cx="38" cy="32" r="3" fill="#1f1f24" /><ellipse cx="30" cy="40" rx="5" ry="4" fill="#e2627a" /><path d="M24 48 h12" stroke="#fff" strokeWidth="3" /></svg>
                  )}
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
      {over ? (
        <Result game="topos" play={play} score={molesScore(points, plan)} onAgain={again} onExit={onExit} detail={`Hiciste ${points} puntos.${oops ? ` Y a Mochito le diste ${oops} ${oops === 1 ? "golpecito" : "golpecitos"}: «¡Oye, yo no soy topo!»` : " Mochito dice: «¡Qué reflejos!»"}`} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {!running && <Button className="h-14 rounded-2xl px-8 text-base" onClick={() => setRunning(true)}>¡Empezar!</Button>}
          <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Dominó ----------

const PIP_AT: Record<number, [number, number][]> = {
  0: [], 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[25, 25], [50, 50], [75, 75]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]], 6: [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]],
};
function Half({ n }: { n: number }) {
  return <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>{PIP_AT[n].map(([x, y], k) => <circle key={k} cx={x} cy={y} r="10" fill="#3a2a22" />)}</svg>;
}
function TileArt({ t, small, className }: { t: Tile; small?: boolean; className?: string }) {
  return (
    <span className={cn("flex shrink-0 rounded-lg border-2 border-[#3a2a22]/40 bg-[#fffaf0] shadow-sm", small ? "h-7 w-14" : "h-10 w-20", className)}>
      <span className="block h-full w-1/2 border-r-2 border-[#3a2a22]/30 p-0.5"><Half n={t[0]} /></span>
      <span className="block h-full w-1/2 p-0.5"><Half n={t[1]} /></span>
    </span>
  );
}

/** Dominó contra Mochito: pon fichas que coincidan con las puntas; si no tienes, roba. Gana quien se quede sin fichas. */
export function DominoGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const look = useLook();
  const [deal, setDeal] = useState(() => domDeal(rngFor(play, true), play.level));
  const [me, setMe] = useState<Tile[]>(deal.me);
  const [him, setHim] = useState<Tile[]>(deal.him);
  const [pile, setPile] = useState<Tile[]>(deal.pile);
  const [line, setLine] = useState<Tile[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [turn, setTurn] = useState<"tu" | "mochito">("tu");
  const [msg, setMsg] = useState("Empiezas tú: pon cualquier ficha.");
  const [end, setEnd] = useState<"gana" | "pierde" | null>(null);
  const [passes, setPasses] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { if (end) void mochitoDo("game", { game: "Dominó" }); }, [end]);

  const playable = me.map((t) => domSides(t, line).length > 0);
  const canPlay = playable.some(Boolean);

  function blocked(myHand: Tile[], hisHand: Tile[]) {
    const a = domPips(myHand), b = domPips(hisHand);
    setEnd(a <= b ? "gana" : "pierde");
    setMsg(`Nadie puede poner más. Tú sumas ${a} puntitos y Mochito ${b}: ${a <= b ? "¡ganas tú!" : "gana Mochito."}`);
  }
  function mochitoTurn(l: Tile[], h: Tile[], p: Tile[], myHand: Tile[], passCount: number) {
    setTurn("mochito");
    timer.current = setTimeout(() => {
      let hand = [...h], pl = [...p];
      let mv = domMove(hand, l, play.level);
      let drew = 0;
      while (!mv && pl.length) { hand = [...hand, pl[0]]; pl = pl.slice(1); drew++; mv = domMove(hand, l, play.level); }
      setPile(pl);
      if (!mv) {
        setHim(hand);
        setMsg(`Mochito robó ${drew} y no pudo poner. Te toca.`);
        if (passCount + 1 >= 2 && !myHand.some((t) => domSides(t, l).length)) { blocked(myHand, hand); return; }
        setPasses(passCount + 1);
        setTurn("tu");
        return;
      }
      const t = hand[mv.i];
      const nl = domPlace(l, t, mv.side);
      hand = hand.filter((_, k) => k !== mv!.i);
      setLine(nl); setHim(hand); setPasses(0);
      sfx("click");
      setMsg(`Mochito ${drew ? `robó ${drew} y ` : ""}puso [${t[0]}|${t[1]}]. Te toca.`);
      if (!hand.length) { setEnd("pierde"); setMsg("¡Mochito se quedó sin fichas! Ganó él."); sfx("sad"); return; }
      setTurn("tu");
    }, 800);
  }
  function put(i: number, side: "izq" | "der") {
    const t = me[i];
    const nl = domPlace(line, t, side);
    const hand = me.filter((_, k) => k !== i);
    setLine(nl); setMe(hand); setSel(null); setPasses(0);
    sfx("coin");
    if (!hand.length) { setEnd("gana"); setMsg("¡Te quedaste sin fichas! Ganaste."); sfx("success"); return; }
    mochitoTurn(nl, him, pile, hand, 0);
  }
  function tapTile(i: number) {
    if (turn !== "tu" || end) return;
    const sides = domSides(me[i], line);
    if (!sides.length) { setMsg("Esa no tiene ningún número de las puntas."); sfx("sad"); return; }
    if (sides.length === 1) { put(i, sides[0]); return; }
    setSel(i);
    setMsg("Va en las dos puntas: ¿de qué lado la pones?");
  }
  function draw() {
    if (!pile.length) {
      setMsg("Ya no hay fichas para robar: pasas.");
      if (passes + 1 >= 2 && !him.some((t) => domSides(t, line).length)) { blocked(me, him); return; }
      mochitoTurn(line, him, pile, me, passes + 1);
      return;
    }
    setMe([...me, pile[0]]); setPile(pile.slice(1));
    sfx("click");
    setMsg("Robaste una ficha.");
  }
  function again() {
    const d = domDeal(rngFor(play, false), play.level);
    setDeal(d); setMe(d.me); setHim(d.him); setPile(d.pile); setLine([]); setSel(null); setTurn("tu"); setEnd(null); setPasses(0); setMsg("Empiezas tú: pon cualquier ficha.");
  }
  const ends = domEnds(line);

  return (
    <section aria-labelledby="g-domino" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-domino" className="text-3xl">Dominó</h2>
      <p className="text-muted-foreground">Pon una ficha que tenga el mismo número que una de las puntas. Si no tienes, roba del montón. Gana quien se quede primero sin fichas.</p>
      <p className="text-sm font-semibold" aria-live="polite">{msg}{ends ? ` Puntas: ${ends[0]} y ${ends[1]}.` : ""} · Mochito tiene {him.length} · Montón: {pile.length}</p>
      <div className="flex items-end gap-3">
        <span className="block h-20 shrink-0" aria-hidden><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
        <div className="flex flex-wrap gap-1" aria-label={`Fichas de Mochito: ${him.length}`}>{him.map((_, k) => <span key={k} className="block h-7 w-4 rounded bg-[#3a2a22]/80" aria-hidden />)}</div>
      </div>
      <div className="flex min-h-16 flex-wrap items-center gap-1 rounded-3xl bg-[#4a9a5b] p-3" aria-label="Fila de fichas">
        {line.length === 0 ? <span className="text-sm font-semibold text-white">Aquí va la primera ficha.</span> : line.map((t, k) => <TileArt key={k} t={t} small />)}
      </div>
      {sel !== null && (
        <div className="flex flex-wrap gap-2">
          <Button className="h-12 rounded-2xl px-5 text-base" onClick={() => put(sel, "izq")}><ArrowLeft className="size-4" aria-hidden /> A la izquierda</Button>
          <Button className="h-12 rounded-2xl px-5 text-base" onClick={() => put(sel, "der")}>A la derecha <ArrowRight className="size-4" aria-hidden /></Button>
        </div>
      )}
      {!end && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold">Tus fichas (toca una para ponerla):</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Tus fichas">
            {me.map((t, i) => (
              <button key={`${t[0]}-${t[1]}`} type="button" disabled={turn !== "tu"} aria-label={`Ficha ${t[0]} y ${t[1]}${playable[i] ? "" : ", no se puede poner"}`} onClick={() => tapTile(i)} className={cn("rounded-xl p-0.5 active:scale-[0.97]", sel === i && "ring-4 ring-primary", !playable[i] && line.length > 0 && "opacity-50")}>
                <TileArt t={t} />
              </button>
            ))}
          </div>
        </div>
      )}
      {end ? (
        <Result game="domino" play={play} score={end === "gana" ? 1 : 0.3} onAgain={again} onExit={onExit} detail={end === "gana" ? "¡Le ganaste a Mochito en el dominó!" : "Esta vez ganó Mochito. «¡La próxima te dejo las fichas buenas!»"} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {turn === "tu" && line.length > 0 && !canPlay && <Button className="h-12 rounded-2xl px-6 text-base" onClick={draw}>{pile.length ? "Robar una ficha" : "Pasar"}</Button>}
          <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Damas ----------

/** Damas contra Mochito: tú eres los huesos (abajo). Se avanza en diagonal y se come saltando. */
export function CheckersGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const [rnd, setRnd] = useState(() => rngFor(play, true));
  const [b, setB] = useState<Dm>(dmInit);
  const [sel, setSel] = useState<number | null>(null);
  const [chain, setChain] = useState<number | null>(null);
  const [turn, setTurn] = useState<"h" | "p">("h");
  const [msg, setMsg] = useState("Tu turno: toca un hueso y luego a dónde va.");
  const [win, setWin] = useState<"h" | "p" | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { if (win) void mochitoDo("game", { game: "Damas" }); }, [win]);

  const targets: DmMove[] = sel === null ? [] : chain !== null ? dmMoreJumps(b, chain) : dmPieceMoves(b, sel);
  function mochito(board: Dm) {
    setTurn("p");
    timer.current = setTimeout(() => {
      let nb = board;
      let m = dmMove(rnd, nb, play.level);
      if (!m) { setWin("h"); setMsg("Mochito ya no puede moverse. ¡Ganaste!"); sfx("success"); return; }
      let ate = 0;
      nb = dmApply(nb, m);
      if (m.cap !== undefined) ate++;
      while (m && m.cap !== undefined) {
        const more = dmMoreJumps(nb, m.to);
        if (!more.length) break;
        m = more[0]; nb = dmApply(nb, m); ate++;
      }
      setB(nb);
      sfx(ate ? "sad" : "click");
      const w = dmWinner(nb, "h");
      if (w) { setWin(w); setMsg(w === "h" ? "¡Ganaste!" : "Ganó Mochito."); sfx(w === "h" ? "success" : "sad"); return; }
      setMsg(ate ? `Mochito se comió ${ate === 1 ? "un hueso" : `${ate} huesos`}. Tu turno.` : "Mochito movió. Tu turno.");
      setTurn("h");
    }, reduce ? 200 : 700);
  }
  function tap(i: number) {
    if (turn !== "h" || win) return;
    const mv = targets.find((m) => m.to === i);
    if (mv && sel !== null) {
      const nb = dmApply(b, mv);
      setB(nb);
      sfx(mv.cap !== undefined ? "coin" : "click");
      if (mv.cap !== undefined && dmMoreJumps(nb, mv.to).length) { setSel(mv.to); setChain(mv.to); setMsg("¡Puedes seguir comiendo! Salta otra vez."); return; }
      setSel(null); setChain(null);
      const w = dmWinner(nb, "p");
      if (w) { setWin(w); setMsg(w === "h" ? "¡Ganaste!" : "Ganó Mochito."); sfx(w === "h" ? "success" : "sad"); return; }
      mochito(nb);
      return;
    }
    if (chain !== null) return;
    if (b[i] && b[i].toLowerCase() === "h") {
      setSel(i);
      setMsg(dmPieceMoves(b, i).length ? "Ahora toca la casilla a donde va." : "Ese hueso no se puede mover ahora.");
    }
  }
  function again() { const r = rngFor(play, false); setRnd(() => r); setB(dmInit()); setSel(null); setChain(null); setTurn("h"); setWin(null); setMsg("Tu turno: toca un hueso y luego a dónde va."); }
  const captured = 12 - dmCount(b, "p");

  return (
    <section aria-labelledby="g-damas" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-damas" className="text-3xl">Damas</h2>
      <p className="text-muted-foreground">Tus huesos avanzan en diagonal hacia arriba. Si una pelota de Mochito está junto a ti y atrás hay lugar, sáltala para comértela (y si puedes, sigue saltando). Al llegar al otro lado, tu pieza se corona y puede ir para atrás.</p>
      <p className="text-sm font-semibold" aria-live="polite">{msg} · Te comiste {captured} · Te quedan {dmCount(b, "h")}</p>
      <div className="mx-auto grid aspect-square w-full max-w-md grid-cols-8 overflow-hidden rounded-2xl border-4 border-[#6b4422]" role="grid" aria-label="Tablero de damas">
        {b.map((p, i) => {
          const r = Math.floor(i / 8), c = i % 8;
          const dark = (r + c) % 2 === 1;
          const can = targets.some((m) => m.to === i);
          return (
            <button key={i} type="button" disabled={!dark} onClick={() => tap(i)} aria-label={`Casilla ${r + 1}-${c + 1}${p ? (p.toLowerCase() === "h" ? ": tu hueso" : ": pelota de Mochito") : can ? ": puedes ir aquí" : ""}`} className={cn("relative flex items-center justify-center", dark ? "bg-[#a8703f]" : "bg-[#f6ead2]", sel === i && "bg-[#d9a066]")}>
              {can && <span className="absolute size-3 rounded-full bg-[var(--gold)]" aria-hidden />}
              {p && (
                <motion.span className={cn("flex size-[80%] items-center justify-center rounded-full shadow", p.toLowerCase() === "h" ? "bg-[#fffaf0]" : "bg-[#d6453d]")} transition={{ duration: 0.2, ease: EASE_OUT }} aria-hidden>
                  {p.toLowerCase() === "h" ? <Bone className="size-[65%] text-[#8a5a2e]" /> : <CircleDot className="size-[65%] text-white" />}
                  {p === p.toUpperCase() && <Crown className="absolute size-[35%] -translate-y-[60%] text-[var(--gold)]" />}
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
      {win ? (
        <Result game="damas" play={play} score={dmScore(win === "h", captured)} onAgain={again} onExit={onExit} detail={win === "h" ? `¡Le ganaste a Mochito! Te comiste ${captured} pelotas.` : `Ganó Mochito, pero te comiste ${captured} pelotas. «¡Juguemos otra!»`} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {chain !== null && <Button variant="outline" className="h-12 rounded-2xl px-5 text-base" onClick={() => { setSel(null); setChain(null); mochito(b); }}>Ya no seguir comiendo</Button>}
          <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Junta los huesos ----------

const BONE_TONES: Record<number, string> = { 2: "#f6ead2", 4: "#f2dcb4", 8: "#f3c98f", 16: "#f0ad6a", 32: "#e98d55", 64: "#e06d45", 128: "#e3c04a", 256: "#e5b52f", 512: "#f6c744", 1024: "#9b7fd1" };
const KEY_DIR: Record<string, Dir> = { ArrowUp: "arriba", ArrowDown: "abajo", ArrowLeft: "izq", ArrowRight: "der" };

/** Desliza los huesos: los iguales que chocan se juntan en uno más grande. Llega al hueso dorado. */
export function BonesGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const goal = BONE_GOAL(play.level);
  const [rnd, setRnd] = useState(() => rngFor(play, true));
  const [g, setG] = useState<Grid>(() => bonesStart(rnd));
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [moves, setMoves] = useState(0);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const max = Math.max(...g);
  const won = max >= goal;

  useEffect(() => { if (over) void mochitoDo("game", { game: "Junta los huesos" }); }, [over]);

  function move(d: Dir) {
    if (over) return;
    const r = bonesSlide(g, d);
    if (!r.moved) return;
    const n = bonesAdd(rnd, r.grid);
    setG(n); setScore((s) => s + r.gained); setMoves((m) => m + 1);
    sfx(r.gained ? "coin" : "click");
    if (Math.max(...n) >= goal) { setOver(true); sfx("success"); return; }
    if (!bonesCanMove(n)) { setOver(true); sfx("sad"); }
  }
  function again() { const r = rngFor(play, false); setRnd(() => r); setG(bonesStart(r)); setScore(0); setMoves(0); setOver(false); }

  return (
    <section aria-labelledby="g-huesos" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-huesos" className="text-3xl">Junta los huesos</h2>
      <p className="text-muted-foreground">Desliza el dedo (o usa las flechas) y todos los huesos se mueven hacia ese lado. Cuando dos iguales chocan, se juntan en uno del doble. Llega al hueso dorado de {goal}. Si se llena el tablero y no se puede mover nada, se acaba.</p>
      <p className="text-sm font-semibold" aria-live="polite">Puntos: {score} · El más grande: {max} · Movimientos: {moves}</p>
      <div
        tabIndex={0}
        role="application"
        aria-label="Tablero de huesos. Usa las flechas para deslizar."
        onKeyDown={(e) => { const d = KEY_DIR[e.key]; if (d) { e.preventDefault(); move(d); } }}
        onPointerDown={(e) => { swipe.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={(e) => {
          const s0 = swipe.current; swipe.current = null;
          if (!s0) return;
          const dx = e.clientX - s0.x, dy = e.clientY - s0.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
          move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "der" : "izq") : dy > 0 ? "abajo" : "arriba");
        }}
        className="mx-auto grid aspect-square w-full max-w-sm touch-none select-none grid-cols-4 gap-2 rounded-3xl bg-[#c9a27a] p-2 outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
      >
        {g.map((v, i) => (
          <span key={i} className="relative flex items-center justify-center rounded-2xl bg-[#e8d5bc]" aria-hidden>
            {v > 0 && (
              <motion.span key={`${i}-${v}`} className="flex h-full w-full flex-col items-center justify-center rounded-2xl" style={{ background: BONE_TONES[v] ?? "#9b7fd1" }} initial={reduce ? false : { opacity: 0.6, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ duration: 0.15, ease: EASE_OUT }}>
                <Bone className="size-[45%] text-[#5a3b2e]" strokeWidth={1.6} fill="#fffaf0" />
                <span className="font-heading text-lg leading-none text-[#3a2a22]">{v}</span>
              </motion.span>
            )}
          </span>
        ))}
      </div>
      {over ? (
        <Result game="huesos" play={play} score={bonesScore(max, goal)} onAgain={again} onExit={onExit} detail={won ? `¡Llegaste al hueso dorado de ${goal}! Mochito lo va a enterrar en el jardín.` : `Tu hueso más grande fue de ${max}. Mochito dice: «¡Ese ya es un huesote!»`} />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Flechas">
            <span />
            <button type="button" aria-label="Arriba" onClick={() => move("arriba")} className="flex size-12 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><ArrowUp className="size-5" aria-hidden /></button>
            <span />
            <button type="button" aria-label="Izquierda" onClick={() => move("izq")} className="flex size-12 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><ArrowLeft className="size-5" aria-hidden /></button>
            <button type="button" aria-label="Abajo" onClick={() => move("abajo")} className="flex size-12 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><ArrowDown className="size-5" aria-hidden /></button>
            <button type="button" aria-label="Derecha" onClick={() => move("der")} className="flex size-12 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><ArrowRight className="size-5" aria-hidden /></button>
          </div>
          <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}
