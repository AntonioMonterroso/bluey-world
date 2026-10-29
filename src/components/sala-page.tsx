"use client";

import { useState } from "react";
import { Brain, Cake, Coins, ListOrdered, Search, ShoppingBasket, Timer, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CakeGame } from "@/components/cake-game";
import { GuessGame, MemoryGame, Result, StepsGame, type Play } from "@/components/mini-games";
import { CatchGame, ChangeGame } from "@/components/mini-games-2";
import { OvenGame } from "@/components/oven-game";
import { Stars } from "@/components/stars";
import { requestFor, type CakeRequest } from "@/lib/game/cake";
import { dayKey, rng } from "@/lib/game/engine";
import { CHALLENGE_BONUS, DAILY_COIN_CAP, LEVELS, dailyChallenge, levelLabel, ovenPeriod, starsOf, type Level, type MiniGame } from "@/lib/game/minigames";
import { gameName, useChallengeDone, useMiniRecipes, useMiniScores, useMiniToday } from "@/lib/minigames";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

const LIST: { id: MiniGame; text: string; icon: typeof Brain }[] = [
  { id: "pasos", text: "Pon en orden los pasos de tus recetas.", icon: ListOrdered },
  { id: "memoria", text: "Encuentra las parejas de ingredientes.", icon: Brain },
  { id: "adivina", text: "Pistas de ingredientes y a adivinar.", icon: Search },
  { id: "atrapa", text: "Atrapa lo que va en un pastel y esquiva lo que no.", icon: ShoppingBasket },
  { id: "cambio", text: "Da el vuelto exacto a cada cliente.", icon: Coins },
  { id: "torta", text: "Crema y adornos como los pidió el cliente.", icon: Cake },
  { id: "horno", text: "Saca la tanda en el punto dorado.", icon: Timer },
];

const LEVEL_KEY = "bw-sala-level";
function initialLevel(): Level {
  try { const v = localStorage.getItem(LEVEL_KEY); return v === "facil" || v === "dificil" ? v : "normal"; } catch { return "normal"; }
}

function Inner() {
  const recipes = useMiniRecipes();
  const today = useMiniToday();
  const scores = useMiniScores();
  const challengeDone = useChallengeDone();
  const [level, setLevel] = useState<Level>(initialLevel);
  const [game, setGame] = useState<MiniGame | null>(null);
  const [play, setPlay] = useState<Play>({ level: "normal" });
  const [score, setScore] = useState<number | null>(null);
  const [req, setReq] = useState<CakeRequest | null>(null);
  const day = dayKey(Date.now());
  const challenge = dailyChallenge(day);

  const exit = () => { setGame(null); setScore(null); setReq(null); };
  function start(g: MiniGame, p: Play) {
    setScore(null);
    setPlay(p);
    setReq(g === "torta" ? requestFor(rng(`${Date.now()}`)) : null);
    setGame(g);
  }
  function chooseLevel(l: Level) { setLevel(l); try { localStorage.setItem(LEVEL_KEY, l); } catch {} }
  if (recipes === undefined || scores === undefined) return null;

  const k = `${game}-${play.level}-${play.challenge ? "r" : "n"}`;
  if (game === "pasos") return <StepsGame key={k} recipes={recipes} play={play} onExit={exit} />;
  if (game === "memoria") return <MemoryGame key={k} recipes={recipes} play={play} onExit={exit} />;
  if (game === "adivina") return <GuessGame key={k} recipes={recipes} play={play} onExit={exit} />;
  if (game === "atrapa") return <CatchGame key={k} play={play} onExit={exit} />;
  if (game === "cambio") return <ChangeGame key={k} play={play} onExit={exit} />;

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <h1 className="text-4xl">Sala de juegos</h1>

      <section aria-labelledby="reto" className="flex flex-wrap items-center gap-4 rounded-[2rem] border bg-card p-5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-foreground"><Trophy className="size-7" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <h2 id="reto" className="text-xl">Reto del día</h2>
          <p className="text-sm text-muted-foreground">
            {gameName(challenge.game)} en {levelLabel(challenge.level).toLowerCase()}. Saca 3 estrellas o más y ganas +{CHALLENGE_BONUS.coins} monedas extra (aparte del tope).
          </p>
        </div>
        {challengeDone ? (
          <p className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold">¡Cumplido hoy!</p>
        ) : (
          <Button className="h-12 rounded-2xl px-6" onClick={() => start(challenge.game, { level: challenge.level, seedKey: `reto:${day}`, challenge: true })}>Jugar el reto</Button>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Dificultad">
          <span className="text-sm font-semibold">Dificultad:</span>
          {LEVELS.map((l) => (
            <button key={l.id} type="button" role="radio" aria-checked={level === l.id} onClick={() => chooseLevel(l.id)} className={cn("min-h-11 rounded-full border-2 px-4 text-sm font-semibold", level === l.id ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-card")}>
              {l.label}{l.mult !== 1 ? ` · ×${l.mult}` : ""}
            </button>
          ))}
        </div>
        <p className="text-sm font-semibold text-muted-foreground">Hoy: {Math.min(today.coins, DAILY_COIN_CAP)} de {DAILY_COIN_CAP} monedas de la sala</p>
      </div>

      {score !== null && game && <Result game={game} play={play} score={score} onAgain={() => start(game, play)} onExit={exit} />}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LIST.map((g) => {
          const Icon = g.icon;
          const rec = scores[g.id];
          return (
            <li key={g.id}>
              <button type="button" onClick={() => start(g.id, { level })} className="flex h-full min-h-44 w-full flex-col items-start gap-3 rounded-[2rem] border bg-card p-6 text-left hover:bg-accent/40">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><Icon className="size-6" aria-hidden /></span>
                <span className="font-heading text-2xl">{gameName(g.id)}</span>
                <span className="text-sm text-muted-foreground">{g.text}</span>
                <span className="mt-auto flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                  {rec ? (<><span>Récord</span><Stars value={starsOf(rec.best)} className="[&_span]:size-3.5 [&_svg]:size-3.5" /><span>({levelLabel(rec.best_level as Level).toLowerCase()}) · {rec.plays} {rec.plays === 1 ? "partida" : "partidas"}</span></>) : "Sin jugar todavía"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">En difícil se gana más por partida. El tope del día sigue igual: lo que más rinde es cocinar de verdad.</p>

      {game === "torta" && req && score === null && (
        <CakeGame request={req} who="una clienta de práctica" onCancel={exit} onDone={(s) => setScore(s.quality)} />
      )}
      {game === "horno" && score === null && <OvenGame name="una tanda de práctica" period={ovenPeriod(play.level)} onCancel={exit} onDone={(q) => setScore(q)} />}
    </div>
  );
}

export function SalaPage() {
  return useIsClient() ? <Inner /> : null;
}
