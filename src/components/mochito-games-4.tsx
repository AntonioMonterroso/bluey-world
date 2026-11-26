"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, ChefHat, CircleAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DressedImage } from "@/components/dressed-image";
import { MochitoFigure } from "@/components/mochito-figure";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import { PuppyArt } from "@/components/puppy-art";
import { useProfile } from "@/lib/db/profile";
import { mochitoDo } from "@/lib/mochito-actions";
import { COOK_ROUNDS, DOG_UNSAFE, cookMs, cookRound, cookScore, memoDeck, memoPairs, memoScore, type MemoCard } from "@/lib/mochito-life";
import { FRIENDS } from "@/lib/mochito-play";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

const WHY: Record<string, string> = {
  Chocolate: "El chocolate es tóxico para los perros.",
  Uvas: "Las uvas les pueden dañar los riñones.",
  Pasas: "Las pasas son uvas secas: tampoco.",
  Cebolla: "La cebolla les hace daño a la sangre.",
  Ajo: "El ajo, igual que la cebolla, les hace daño.",
  Sal: "Mucha sal les hace mal. Sus galletas van sin sal.",
};

// ---------- Cocina para Mochito ----------

type CookPhase = "cook" | "done" | "late";

/** Arma galletas de perro: toca los ingredientes en el orden de la receta, sin usar lo que les hace daño. */
export function CookGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const { profile } = useProfile();
  const total = cookMs(play.level);
  const [start] = useState(() => { const r = rngFor(play, true); return { r, round: cookRound(r, play.level) }; });
  const rnd = useRef(start.r);
  const [round, setRound] = useState(start.round);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<CookPhase>("cook");
  const [misses, setMisses] = useState(0);
  const [unsafe, setUnsafe] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [left, setLeft] = useState(total);
  const [note, setNote] = useState<{ text: string; bad: boolean } | null>(null);
  const leftRef = useRef(total);

  useEffect(() => {
    if (phase !== "cook") return;
    const begin = Date.now();
    const id = setInterval(() => {
      leftRef.current = Math.max(0, total - (Date.now() - begin));
      setLeft(leftRef.current);
      if (leftRef.current <= 0) { setPhase("late"); setScores((s) => [...s, 0]); sfx("sad"); }
    }, 100);
    return () => clearInterval(id);
  }, [phase, total]);

  const over = scores.length >= COOK_ROUNDS;
  useEffect(() => { if (over) void mochitoDo("game", { game: "Cocina para Mochito" }); }, [over]);

  useEffect(() => {
    if (phase === "cook" || over) return;
    const t = setTimeout(() => {
      setRound(cookRound(rnd.current, play.level));
      setStep(0); setMisses(0); setUnsafe(0); setNote(null);
      leftRef.current = total; setLeft(total);
      setPhase("cook");
    }, 1600);
    return () => clearTimeout(t);
  }, [phase, over, play.level, total]);

  function pick(name: string) {
    if (phase !== "cook") return;
    if (DOG_UNSAFE.includes(name)) {
      sfx("sad"); setUnsafe((n) => n + 1);
      setNote({ text: `¡Eso no! ${WHY[name] ?? "Eso no es para perros."}`, bad: true });
      return;
    }
    if (name !== round.recipe.steps[step]) {
      sfx("click"); setMisses((n) => n + 1);
      setNote({ text: round.recipe.steps.includes(name) ? "Ese va, pero todavía no. Sigue el orden." : "Ese no va en esta receta.", bad: false });
      return;
    }
    const n = step + 1;
    setNote(null);
    if (n < round.recipe.steps.length) { setStep(n); sfx("coin"); return; }
    sfx("success");
    setStep(n);
    setScores((s) => [...s, cookScore(true, leftRef.current, total, misses, unsafe)]);
    setPhase("done");
  }
  function again() {
    rnd.current = rngFor(play, false);
    setRound(cookRound(rnd.current, play.level));
    setStep(0); setMisses(0); setUnsafe(0); setNote(null); setScores([]); leftRef.current = total; setLeft(total); setPhase("cook");
  }

  return (
    <section aria-labelledby="g-cocina" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-cocina" className="text-3xl">Cocina para Mochito</h2>
      <p className="text-muted-foreground">Sigue la receta y toca los ingredientes en orden. Ojo: en la mesa hay cosas que a los perros les hacen daño.</p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-live="polite">
        <span>Receta: <span className="tabular-nums">{Math.min(scores.length + 1, COOK_ROUNDS)} de {COOK_ROUNDS}</span></span>
        <span>Tiempo: <span className="tabular-nums">{Math.ceil(left / 1000)} s</span></span>
        {phase === "done" && <span className="text-primary">¡Galletas listas!</span>}
        {phase === "late" && <span className="text-destructive">Se acabó el tiempo.</span>}
      </div>
      <div className="flex items-end gap-4 rounded-[2rem] bg-gradient-to-b from-card to-secondary p-4">
        <span className="h-28 shrink-0"><MochitoFigure outfit={profile.mochito_outfit} /></span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-heading text-xl"><ChefHat className="size-5 text-primary" aria-hidden /> {round.recipe.name}</p>
          <ol className="mt-2 flex flex-col gap-1">
            {round.recipe.steps.map((st, i) => (
              <li key={`${scores.length}-${st}`} className={cn("flex items-center gap-2 text-sm", i < step ? "text-muted-foreground line-through" : i === step && phase === "cook" ? "font-semibold" : "")}>
                <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", i < step ? "bg-primary text-primary-foreground" : "bg-card")}>{i < step ? <Check className="size-3" aria-hidden /> : i + 1}</span>
                {st}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <p role="status" className={cn("min-h-6 text-sm font-semibold", note?.bad ? "text-destructive" : "text-muted-foreground")}>
        {note && (note.bad ? <CircleAlert className="mr-1 inline size-4 align-[-3px]" aria-hidden /> : null)}{note?.text}
      </p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {round.table.map((name) => (
          <li key={`${scores.length}-${name}`}>
            <button type="button" disabled={phase !== "cook"} onClick={() => pick(name)} className="min-h-14 w-full rounded-2xl border-2 border-border bg-card px-3 text-sm font-semibold transition-[border-color] duration-150 hover:border-primary active:scale-[0.97] disabled:opacity-60">
              {name}
            </button>
          </li>
        ))}
      </ul>
      {over ? (
        <Result game="cocinam" play={play} score={avg(scores)} onAgain={again} onExit={onExit} detail={`Hiciste ${scores.filter((x) => x > 0).length} de ${COOK_ROUNDS} recetas. Mochito dice: «¡Huelen riquísimo y son seguras para mí!»`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}

// ---------- Memoria de Mochito ----------

const POSE_STYLE: Record<string, { transform?: string; festive?: "cumple"; sleeping?: boolean }> = {
  feliz: {},
  girado: { transform: "scaleX(-1)" },
  sentado: { transform: "translateY(6%) scaleY(0.88)" },
  saltando: { transform: "translateY(-8%) rotate(-6deg)" },
  dormido: { sleeping: true },
  fiesta: { festive: "cumple" },
};

function Face({ face, outfit }: { face: string; outfit?: Record<string, string> }) {
  if (face.startsWith("amigo:")) {
    const f = FRIENDS.find((x) => x.id === face.slice(6))!;
    return <span className="block h-[70%] w-[70%]"><PuppyArt friend={f} /></span>;
  }
  const pose = POSE_STYLE[face.slice(5)] ?? {};
  return (
    <span className="block h-[80%]" style={{ transform: pose.transform, transformOrigin: "50% 100%" }}>
      {pose.festive || pose.sleeping ? <MochitoFigure outfit={outfit} festive={pose.festive} sleeping={pose.sleeping} /> : <DressedImage char="mochito" outfit={outfit} alt="" className="h-full" />}
    </span>
  );
}

const faceName = (face: string) => (face.startsWith("amigo:") ? FRIENDS.find((x) => x.id === face.slice(6))?.name ?? "Amigo" : `Mochito ${face.slice(5)}`);

/** Parejas de cartas: Mochito en distintas poses y sus amigos del parque. */
export function MemoGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const { profile } = useProfile();
  const reduce = useReducedMotion();
  const pairs = memoPairs(play.level);
  const [deck, setDeck] = useState<MemoCard[]>(() => memoDeck(rngFor(play, true), pairs, FRIENDS.map((f) => f.id)));
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [tries, setTries] = useState(0);
  const busy = useRef(false);

  const over = found.size >= pairs;
  useEffect(() => { if (over) void mochitoDo("game", { game: "Memoria de Mochito" }); }, [over]);

  function flip(c: MemoCard) {
    if (busy.current || open.includes(c.id) || found.has(c.face)) return;
    sfx("click");
    const next = [...open, c.id];
    setOpen(next);
    if (next.length < 2) return;
    setTries((t) => t + 1);
    const [a, b] = next.map((id) => deck.find((x) => x.id === id)!);
    if (a.face === b.face) {
      sfx("coin");
      setFound((f) => new Set([...f, a.face]));
      setOpen([]);
      return;
    }
    busy.current = true;
    setTimeout(() => { setOpen([]); busy.current = false; }, 900);
  }
  function again() {
    setDeck(memoDeck(rngFor(play, false), pairs, FRIENDS.map((f) => f.id)));
    setOpen([]); setFound(new Set()); setTries(0);
  }

  const cols = pairs <= 4 ? "grid-cols-4" : pairs <= 6 ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-4";

  return (
    <section aria-labelledby="g-memo" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-memo" className="text-3xl">Memoria de Mochito</h2>
      <p className="text-muted-foreground">Voltea dos cartas a la vez y encuentra las parejas: Mochito en distintas poses y sus amigos del parque.</p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-live="polite">
        <span>Parejas: <span className="tabular-nums">{found.size} de {pairs}</span></span>
        <span>Intentos: <span className="tabular-nums">{tries}</span></span>
      </div>
      <ul className={cn("grid gap-2", cols)}>
        {deck.map((c) => {
          const shown = open.includes(c.id) || found.has(c.face);
          return (
            <li key={c.id}>
              <motion.button
                type="button"
                onClick={() => flip(c)}
                aria-label={shown ? faceName(c.face) : "Carta boca abajo"}
                className={cn("relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl border-2 active:scale-[0.97]", found.has(c.face) ? "border-primary bg-card" : shown ? "border-border bg-card" : "border-transparent bg-primary")}
                initial={false}
                animate={reduce ? { opacity: 1 } : { transform: shown ? "rotateY(0deg)" : "rotateY(180deg)" }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
              >
                {shown ? <Face face={c.face} outfit={profile.mochito_outfit} /> : <Sparkles className="size-6 text-primary-foreground" aria-hidden />}
              </motion.button>
            </li>
          );
        })}
      </ul>
      {over ? (
        <Result game="memoriam" play={play} score={memoScore(pairs, tries)} onAgain={again} onExit={onExit} detail={`Encontraste las ${pairs} parejas en ${tries} intentos. Mochito dice: «¡Tienes memoria de perrito detective!»`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}
