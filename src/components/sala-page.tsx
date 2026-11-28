"use client";

import { useState } from "react";
import { Spline, ArrowUpDown, Disc, Minus, Bean, Move, Lightbulb, CircleDashed, Contrast, Rainbow, Waypoints, Image as ImageIcon, Grid2x2, SquareDot, Ship, Worm, Shovel, RectangleHorizontal as Domino, Crown, Columns4, Calculator, Dices, Scissors, Grid3x3 as GridIcon, SpellCheck, Flag, Blocks, Hash, Layers, Cylinder, Target, TrainFront, Drum, Fish, Disc3, SearchCheck, Type, Palette, Puzzle, Route, CloudRain, Bone, Brain, ChefHat, Music, ScanSearch, CircleDot, Grid3x3, Dog, EyeOff, Footprints, LayoutGrid, Wand2, Cake, Coins, ListOrdered, Search, ShoppingBasket, Timer, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CakeGame } from "@/components/cake-game";
import { GuessGame, MemoryGame, Result, StepsGame, type Play } from "@/components/mini-games";
import { CatchGame, ChangeGame } from "@/components/mini-games-2";
import { MochitoGame } from "@/components/mochito-game";
import { FetchGame, HideGame } from "@/components/mochito-games-2";
import { RunGame, SimonGame } from "@/components/mochito-games-3";
import { CookGame, MemoGame } from "@/components/mochito-games-4";
import { BoneGame, RhythmGame } from "@/components/mochito-games-5";
import { BubbleGame, LoteriaGame } from "@/components/mochito-games-6";
import { CookieRainGame, MazeGame, PaintGame, PuzzleGame } from "@/components/mochito-games-7";
import { DiffGame, FishGame, FrisbeeGame, SoupGame } from "@/components/mochito-games-8";
import { CodeGame, FlipGame, PicGame, PipesGame } from "@/components/mochito-games-14";
import { LightsGame, PegGame, SeedsGame, SlideGame } from "@/components/mochito-games-15";
import { FlowGame, HanoiGame, HiLoGame, SticksGame } from "@/components/mochito-games-16";
import { BoxesGame, ShipsGame, SudokuGame, WormGame } from "@/components/mochito-games-13";
import { BonesGame, CheckersGame, DominoGame, MolesGame } from "@/components/mochito-games-12";
import { ConnectFourGame, LaddersGame, RpsGame, SumsGame } from "@/components/mochito-games-11";
import { GolfGame, HangmanGame, TicTacGame, TowerGame } from "@/components/mochito-games-10";
import { BowlingGame, CansGame, DrumGame, NumbersGame, ShadowGame, TrainGame } from "@/components/mochito-games-9";
import { mochitoGameGoto, useClearMochitoGoto } from "@/lib/mochito-goto";
import { OvenGame } from "@/components/oven-game";
import { Stars } from "@/components/stars";
import { requestFor, type CakeRequest } from "@/lib/game/cake";
import { dayKey, rng } from "@/lib/game/engine";
import { CHALLENGE_BONUS, DAILY_COIN_CAP, LEVELS, dailyChallenge, levelLabel, ovenPeriod, starsOf, type Level, type MiniGame } from "@/lib/game/minigames";
import { gameName, useChallengeDone, useMiniRecipes, useMiniScores, useMiniToday } from "@/lib/minigames";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

const LIST: { id: MiniGame; text: string; icon: typeof Brain }[] = [
  { id: "mochito", text: "Tres carriles: atrapa lo que Mochito pide y esquiva lo que le hace daño.", icon: Bone },
  { id: "pelota", text: "Lanza la pelota a la banderita y Mochito corre por ella.", icon: Dog },
  { id: "escondidas", text: "Mochito se esconde en el local. ¡Encuéntralo a tiempo!", icon: EyeOff },
  { id: "simon", text: "Repite los trucos de Mochito en el mismo orden.", icon: Wand2 },
  { id: "carrera", text: "Salta charcos y piedras camino al parque.", icon: Footprints },
  { id: "cocinam", text: "Galletas de perro con ingredientes seguros, en orden.", icon: ChefHat },
  { id: "memoriam", text: "Parejas de Mochito en poses y sus amigos del parque.", icon: LayoutGrid },
  { id: "hueso", text: "Cava en el parque: frío o caliente hasta hallar su hueso.", icon: ScanSearch },
  { id: "ritmo", text: "Toca al ritmo cuando las patitas lleguen a la línea.", icon: Music },
  { id: "burbujas", text: "Mochito brinca a reventar burbujas; las doradas valen más.", icon: CircleDot },
  { id: "loteria", text: "Mochito canta las cartas y tú llenas tu tabla.", icon: Grid3x3 },
  { id: "rompecabezas", text: "Arma una foto de Mochito pieza por pieza.", icon: Puzzle },
  { id: "lluvia", text: "Llueven galletas: atrápalas y esquiva las ramitas.", icon: CloudRain },
  { id: "laberinto", text: "Guía a Mochito hasta su hueso. Cada día hay uno nuevo.", icon: Route },
  { id: "pintar", text: "Colorea a Mochito y guarda tu dibujo en su álbum.", icon: Palette },
  { id: "pesca", text: "Cuando el corcho se hunda, ¡jala rápido!", icon: Fish },
  { id: "frisbee", text: "Lanza con la fuerza justa para que Mochito lo atrape.", icon: Disc3 },
  { id: "diferencias", text: "Dos dibujos del parque casi iguales: encuentra lo que cambió.", icon: SearchCheck },
  { id: "sopa", text: "Palabras de perritos escondidas entre letras.", icon: Type },
  { id: "numeros", text: "Cada número es un color: pinta el dibujo sin salirte del número.", icon: Hash },
  { id: "sombras", text: "Une cada cosa con su sombra.", icon: Layers },
  { id: "latas", text: "Apunta y lanza la pelota para tumbar la torre de latas.", icon: Cylinder },
  { id: "bolos", text: "Boliche en el parque: apunta, dale efecto y tumba los pinos.", icon: Target },
  { id: "tren", text: "Junta huesos y se te suman amiguitos atrás. ¡No choques!", icon: TrainFront },
  { id: "tambor", text: "Mochito toca una melodía y tú la repites.", icon: Drum },
  { id: "gato", text: "Tres en línea contra Mochito: huesos contra pelotas.", icon: GridIcon },
  { id: "ahorcado", text: "Adivina la palabra antes de que Mochito se coma la galleta.", icon: SpellCheck },
  { id: "golf", text: "Hoyos en el parque con obstáculos: apunta y elige la fuerza.", icon: Flag },
  { id: "torre", text: "Suelta cada bloque justo encima para hacer la torre más alta.", icon: Blocks },
  { id: "cuatro", text: "Contra Mochito: junta cuatro fichas en línea antes que él.", icon: Columns4 },
  { id: "sumas", text: "Junta exacto los huesos que pide Mochito, con los menos toques.", icon: Calculator },
  { id: "escaleras", text: "Juego de mesa con dado: escaleras que suben y resbaladillas que bajan.", icon: Dices },
  { id: "piedra", text: "Al mejor de cinco contra Mochito. Descubre sus mañas.", icon: Scissors },
  { id: "topos", text: "Toca los topos antes de que se escondan. ¡A Mochito no!", icon: Shovel },
  { id: "domino", text: "Dominó contra Mochito: el primero sin fichas gana.", icon: Domino },
  { id: "damas", text: "Huesos contra pelotas: avanza en diagonal y come saltando.", icon: Crown },
  { id: "huesos", text: "Desliza y junta huesos iguales hasta el hueso dorado.", icon: Bone },
  { id: "sudoku", text: "Llena la cuadrícula sin repetir dibujos en fila, columna ni cuadro.", icon: Grid2x2 },
  { id: "cajitas", text: "Traza rayas por turnos: quien cierra la cajita se la queda.", icon: SquareDot },
  { id: "barquitos", text: "Encuentra los barquitos de Mochito antes que él los tuyos.", icon: Ship },
  { id: "gusanito", text: "Come galletas para crecer sin chocar con la orilla ni tu cola.", icon: Worm },
  { id: "voltea", text: "Encierra las pelotas de Mochito y voltéalas a hueso.", icon: Contrast },
  { id: "colores", text: "Adivina la fila de colores de Mochito con sus pistas.", icon: Rainbow },
  { id: "tubos", text: "Gira los tubos para que el agua llegue a la plantita.", icon: Waypoints },
  { id: "dibujo", text: "Pinta lo que dicen los números y aparece un dibujo.", icon: ImageIcon },
  { id: "semillas", text: "Reparte semillas por los hoyitos y guarda más que Mochito.", icon: Bean },
  { id: "deslizar", text: "Desliza los cuadritos al hueco hasta ponerlos en orden.", icon: Move },
  { id: "luces", text: "Cada toque cambia una luz y sus vecinas: apágalas todas.", icon: Lightbulb },
  { id: "saltafichas", text: "Brinca fichas para quitarlas hasta dejar solo una.", icon: CircleDashed },
  { id: "palitos", text: "Toma 1, 2 o 3 palitos; a quien le toque el último, pierde.", icon: Minus },
  { id: "unecolores", text: "Une los puntos del mismo color sin cruzarte y llena el tablero.", icon: Spline },
  { id: "mayormenor", text: "Adivina si la siguiente carta será mayor o menor.", icon: ArrowUpDown },
  { id: "discos", text: "Pasa la torre de discos a otro palo sin poner grande sobre chico.", icon: Disc },
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
  const [game, setGame] = useState<MiniGame | null>(() => mochitoGameGoto());
  useClearMochitoGoto();
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
  if (game === "mochito") return <MochitoGame key={k} play={play} onExit={exit} />;
  if (game === "pelota") return <FetchGame key={k} play={play} onExit={exit} />;
  if (game === "escondidas") return <HideGame key={k} play={play} onExit={exit} />;
  if (game === "simon") return <SimonGame key={k} play={play} onExit={exit} />;
  if (game === "carrera") return <RunGame key={k} play={play} onExit={exit} />;
  if (game === "cocinam") return <CookGame key={k} play={play} onExit={exit} />;
  if (game === "memoriam") return <MemoGame key={k} play={play} onExit={exit} />;
  if (game === "hueso") return <BoneGame key={k} play={play} onExit={exit} />;
  if (game === "ritmo") return <RhythmGame key={k} play={play} onExit={exit} />;
  if (game === "burbujas") return <BubbleGame key={k} play={play} onExit={exit} />;
  if (game === "loteria") return <LoteriaGame key={k} play={play} onExit={exit} />;
  if (game === "rompecabezas") return <PuzzleGame key={k} play={play} onExit={exit} />;
  if (game === "lluvia") return <CookieRainGame key={k} play={play} onExit={exit} />;
  if (game === "laberinto") return <MazeGame key={k} play={play} onExit={exit} />;
  if (game === "pintar") return <PaintGame key={k} play={play} onExit={exit} />;
  if (game === "pesca") return <FishGame key={k} play={play} onExit={exit} />;
  if (game === "frisbee") return <FrisbeeGame key={k} play={play} onExit={exit} />;
  if (game === "diferencias") return <DiffGame key={k} play={play} onExit={exit} />;
  if (game === "sopa") return <SoupGame key={k} play={play} onExit={exit} />;
  if (game === "numeros") return <NumbersGame key={k} play={play} onExit={exit} />;
  if (game === "sombras") return <ShadowGame key={k} play={play} onExit={exit} />;
  if (game === "latas") return <CansGame key={k} play={play} onExit={exit} />;
  if (game === "bolos") return <BowlingGame key={k} play={play} onExit={exit} />;
  if (game === "tren") return <TrainGame key={k} play={play} onExit={exit} />;
  if (game === "tambor") return <DrumGame key={k} play={play} onExit={exit} />;
  if (game === "gato") return <TicTacGame key={k} play={play} onExit={exit} />;
  if (game === "ahorcado") return <HangmanGame key={k} play={play} onExit={exit} />;
  if (game === "golf") return <GolfGame key={k} play={play} onExit={exit} />;
  if (game === "torre") return <TowerGame key={k} play={play} onExit={exit} />;
  if (game === "cuatro") return <ConnectFourGame key={k} play={play} onExit={exit} />;
  if (game === "sumas") return <SumsGame key={k} play={play} onExit={exit} />;
  if (game === "escaleras") return <LaddersGame key={k} play={play} onExit={exit} />;
  if (game === "piedra") return <RpsGame key={k} play={play} onExit={exit} />;
  if (game === "topos") return <MolesGame key={k} play={play} onExit={exit} />;
  if (game === "domino") return <DominoGame key={k} play={play} onExit={exit} />;
  if (game === "damas") return <CheckersGame key={k} play={play} onExit={exit} />;
  if (game === "huesos") return <BonesGame key={k} play={play} onExit={exit} />;
  if (game === "sudoku") return <SudokuGame key={k} play={play} onExit={exit} />;
  if (game === "cajitas") return <BoxesGame key={k} play={play} onExit={exit} />;
  if (game === "barquitos") return <ShipsGame key={k} play={play} onExit={exit} />;
  if (game === "gusanito") return <WormGame key={k} play={play} onExit={exit} />;
  if (game === "voltea") return <FlipGame key={k} play={play} onExit={exit} />;
  if (game === "colores") return <CodeGame key={k} play={play} onExit={exit} />;
  if (game === "tubos") return <PipesGame key={k} play={play} onExit={exit} />;
  if (game === "dibujo") return <PicGame key={k} play={play} onExit={exit} />;
  if (game === "semillas") return <SeedsGame key={k} play={play} onExit={exit} />;
  if (game === "deslizar") return <SlideGame key={k} play={play} onExit={exit} />;
  if (game === "luces") return <LightsGame key={k} play={play} onExit={exit} />;
  if (game === "saltafichas") return <PegGame key={k} play={play} onExit={exit} />;
  if (game === "palitos") return <SticksGame key={k} play={play} onExit={exit} />;
  if (game === "unecolores") return <FlowGame key={k} play={play} onExit={exit} />;
  if (game === "mayormenor") return <HiLoGame key={k} play={play} onExit={exit} />;
  if (game === "discos") return <HanoiGame key={k} play={play} onExit={exit} />;

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
