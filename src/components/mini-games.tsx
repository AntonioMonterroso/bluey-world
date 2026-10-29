"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/stars";
import { rng } from "@/lib/game/engine";
import {
  guessRound, levelLabel, memoryDeck, pairsFor, scoreGuess, scoreMemory, scoreSteps, starsOf, stepsRound,
  type Level, type MiniGame, type MiniRecipe,
} from "@/lib/game/minigames";
import { awardMini, type MiniResult } from "@/lib/minigames";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const seed = () => rng(`${Date.now()}:${Math.random()}`);

/** Cómo se juega esta partida: dificultad y, si es el reto del día, la semilla fija del día. */
export interface Play { level: Level; seedKey?: string; challenge?: boolean }
export const DEFAULT_PLAY: Play = { level: "normal" };
/** La primera partida del reto usa la semilla del día (todos ven lo mismo); "otra vez" ya es al azar. */
export const rngFor = (play: Play, first: boolean) => (play.seedKey && first ? rng(play.seedKey) : seed());

/** Cierra una partida: guarda el premio una sola vez y lo muestra. */
export function Result({ game, score, onAgain, onExit, detail, play = DEFAULT_PLAY }: { game: MiniGame; score: number; onAgain: () => void; onExit: () => void; detail?: string; play?: Play }) {
  const [reward, setReward] = useState<MiniResult | null>(null);
  const saved = useRef(false);
  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    sfx(score >= 0.6 ? "success" : "sad");
    void awardMini(game, score, { level: play.level, challenge: play.challenge }).then(setReward);
  }, [game, score, play.level, play.challenge]);
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-secondary p-6 text-center">
      <p className="font-heading text-3xl">{score >= 0.99 ? "¡Perfecto!" : score >= 0.6 ? "¡Muy bien!" : score > 0 ? "Buen intento" : "Otra vez será"}</p>
      <Stars value={score > 0 ? starsOf(score) : 0} />
      <p className="text-xs font-semibold text-muted-foreground">{levelLabel(play.level)}{play.challenge ? " · Reto del día" : ""}</p>
      {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
      {reward?.record && <p className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">¡Nuevo récord!</p>}
      {reward?.challengeBonus && <p className="rounded-full bg-[var(--gold)] px-4 py-1 text-sm font-semibold text-foreground">¡Reto del día cumplido! +10 monedas extra</p>}
      <p role="status" className="min-h-6 font-semibold">
        {reward === null ? "" : reward.coins === 0 && reward.xp === 0 ? "Hoy ya llegaste al tope de premios de la sala. Sigue jugando por diversión." : `+${reward.coins} monedas · +${reward.xp} XP${reward.capped ? " (casi al tope de hoy)" : ""}`}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button className="h-12 rounded-2xl px-6 text-base" onClick={onAgain}>Jugar otra vez</Button>
        <Button variant="outline" className="h-12 rounded-2xl px-6 text-base" onClick={onExit}>Volver a la sala</Button>
      </div>
    </div>
  );
}

// ---------- Ordena los pasos ----------

export function StepsGame({ recipes, onExit, play = DEFAULT_PLAY }: { recipes: MiniRecipe[]; onExit: () => void; play?: Play }) {
  const [round, setRound] = useState(() => stepsRound(recipes, rngFor(play, true), play.level));
  const [order, setOrder] = useState(round.order);
  const [checked, setChecked] = useState(false);
  const [key, setKey] = useState(0);

  function move(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= order.length || checked) return;
    sfx("click");
    setOrder((o) => { const a = [...o]; [a[i], a[j]] = [a[j], a[i]]; return a; });
  }
  function again() { const r = stepsRound(recipes, seed(), play.level); setRound(r); setOrder(r.order); setChecked(false); setKey((k) => k + 1); }
  const score = scoreSteps(order);

  return (
    <section aria-labelledby="g-pasos" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-pasos" className="text-3xl">Ordena los pasos</h2>
      <p className="text-muted-foreground">Receta: <span className="font-semibold text-foreground">{round.title}</span>. Mueve los pasos con las flechas hasta dejarlos en el orden correcto.</p>
      <ol className="flex flex-col gap-2">
        {order.map((v, i) => (
          <li key={`${key}-${v}`} className={cn("flex items-center gap-3 rounded-2xl border-2 bg-card p-3", checked && (v === i ? "border-primary" : "border-destructive"))}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">{i + 1}</span>
            <span className="min-w-0 flex-1 text-sm sm:text-base">{round.steps[v]}</span>
            {checked ? (v === i ? <Check className="size-5 text-primary" aria-label="Bien" /> : <X className="size-5 text-destructive" aria-label="Mal" />) : (
              <span className="flex gap-1">
                <button type="button" aria-label={`Subir el paso ${i + 1}`} disabled={i === 0} onClick={() => move(i, -1)} className="flex size-11 items-center justify-center rounded-full bg-secondary disabled:opacity-30"><ArrowUp className="size-5" aria-hidden /></button>
                <button type="button" aria-label={`Bajar el paso ${i + 1}`} disabled={i === order.length - 1} onClick={() => move(i, 1)} className="flex size-11 items-center justify-center rounded-full bg-secondary disabled:opacity-30"><ArrowDown className="size-5" aria-hidden /></button>
              </span>
            )}
          </li>
        ))}
      </ol>
      {checked ? (
        <Result game="pasos" play={play} score={score} onAgain={again} onExit={onExit} detail={`${Math.round(score * order.length)} de ${order.length} pasos en su lugar.`} />
      ) : (
        <div className="flex gap-3">
          <Button className="h-12 rounded-2xl px-6 text-base" onClick={() => setChecked(true)}>Revisar</Button>
          <Button variant="outline" className="h-12 rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Memoria de ingredientes ----------

export function MemoryGame({ recipes, onExit, play = DEFAULT_PLAY }: { recipes: MiniRecipe[]; onExit: () => void; play?: Play }) {
  const pairs = pairsFor(play.level);
  const [deck, setDeck] = useState(() => memoryDeck(recipes, rngFor(play, true), pairs));
  const [open, setOpen] = useState<number[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [tries, setTries] = useState(0);
  const [locked, setLocked] = useState(false);
  const finished = done.size === pairs;

  function flip(id: number) {
    if (locked || open.includes(id) || done.has(deck[id].pair)) return;
    sfx("click");
    const next = [...open, id];
    setOpen(next);
    if (next.length === 2) {
      setTries((t) => t + 1);
      if (deck[next[0]].pair === deck[next[1]].pair) {
        sfx("coin");
        setDone((d) => new Set(d).add(deck[id].pair));
        setOpen([]);
      } else {
        setLocked(true);
        setTimeout(() => { setOpen([]); setLocked(false); }, 900);
      }
    }
  }
  function again() { setDeck(memoryDeck(recipes, seed(), pairs)); setOpen([]); setDone(new Set()); setTries(0); setLocked(false); }

  return (
    <section aria-labelledby="g-mem" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-mem" className="text-3xl">Memoria de ingredientes</h2>
      <p className="text-muted-foreground">Encuentra las parejas. Intentos: <span className="font-semibold text-foreground tabular-nums">{tries}</span></p>
      <ul className={cn("grid gap-2", pairs > 6 ? "grid-cols-4" : "grid-cols-3 sm:grid-cols-4")}>
        {deck.map((c) => {
          const shown = open.includes(c.id) || done.has(c.pair);
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => flip(c.id)}
                aria-label={shown ? c.pair : "Carta boca abajo"}
                aria-pressed={shown}
                className={cn("flex h-20 w-full items-center justify-center rounded-2xl border-2 px-1 text-center text-sm font-semibold", done.has(c.pair) ? "border-primary bg-primary/10" : shown ? "border-primary bg-card" : "border-transparent bg-primary text-primary-foreground")}
                style={{ transition: "background-color 200ms cubic-bezier(0.23, 1, 0.32, 1)" }}
              >
                {shown ? c.pair : "?"}
              </button>
            </li>
          );
        })}
      </ul>
      {finished ? (
        <Result game="memoria" play={play} score={scoreMemory(tries, pairs)} onAgain={again} onExit={onExit} detail={`Lo lograste en ${tries} intentos.`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}

// ---------- Adivina el postre ----------

export function GuessGame({ recipes, onExit, play = DEFAULT_PLAY }: { recipes: MiniRecipe[]; onExit: () => void; play?: Play }) {
  const [round, setRound] = useState(() => guessRound(recipes, rngFor(play, true), play.level));
  const [shown, setShown] = useState(1);
  const [picked, setPicked] = useState<string | null>(null);
  const correct = picked === round.answer;
  const score = useMemo(() => (picked === null ? 0 : scoreGuess(correct, shown)), [picked, correct, shown]);

  function again() { setRound(guessRound(recipes, seed(), play.level)); setShown(1); setPicked(null); }

  return (
    <section aria-labelledby="g-adv" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-adv" className="text-3xl">Adivina el postre</h2>
      <p className="text-muted-foreground">Cuantas menos pistas pidas, más ganas.</p>
      <ul className="flex flex-col gap-2" aria-live="polite">
        {round.clues.slice(0, shown).map((c, i) => <li key={i} className="rounded-2xl bg-secondary px-4 py-3 font-semibold">{c}</li>)}
      </ul>
      {picked === null && shown < round.clues.length && (
        <Button variant="outline" className="h-11 w-fit rounded-2xl px-5" onClick={() => { sfx("click"); setShown((s) => s + 1); }}>Otra pista</Button>
      )}
      <ul className="grid gap-2 sm:grid-cols-2">
        {round.options.map((o) => (
          <li key={o}>
            <button
              type="button"
              disabled={picked !== null}
              onClick={() => setPicked(o)}
              className={cn("min-h-14 w-full rounded-2xl border-2 px-4 text-left font-semibold", picked === null ? "border-transparent bg-card hover:border-border" : o === round.answer ? "border-primary bg-primary/10" : o === picked ? "border-destructive" : "border-transparent bg-card opacity-60")}
            >
              {o}
            </button>
          </li>
        ))}
      </ul>
      {picked !== null ? (
        <Result game="adivina" play={play} score={score} onAgain={again} onExit={onExit} detail={correct ? `Era ${round.answer}, con ${shown} ${shown === 1 ? "pista" : "pistas"}.` : `Era ${round.answer}.`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}
