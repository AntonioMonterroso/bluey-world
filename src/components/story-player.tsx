"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Check, ChevronRight, Coins, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/fields";
import { Character } from "@/components/character";
import { saveBakery } from "@/lib/bakery";
import { getCharacter } from "@/lib/characters";
import { updateProfile } from "@/lib/db/profile";
import { interpolate, nextStop, taskDone, taskProgress, visibleNodes } from "@/lib/game/story/engine";
import type { Chapter, Node, StoryData, StoryState } from "@/lib/game/story/types";
import { sfx } from "@/lib/sfx";
import { completeChapter, saveStory } from "@/lib/story";
import { cn } from "@/lib/utils";

export type Speed = "normal" | "rapido" | "ya";
const MS: Record<Speed, number> = { normal: 28, rapido: 10, ya: 0 };
const SPEEDS: { id: Speed; label: string }[] = [{ id: "normal", label: "Normal" }, { id: "rapido", label: "Rápido" }, { id: "ya", label: "Todo de una" }];

/** El cuadro de diálogo: el texto aparece letra por letra; tocar una vez lo completa y la segunda avanza. */
function SayBox({ name, text, speed, onNext, last }: { name: string | null; text: string; speed: Speed; onNext: () => void; last: boolean }) {
  const reduce = useReducedMotion();
  const instant = reduce || speed === "ya";
  const [n, setN] = useState(instant ? text.length : 0);
  useEffect(() => {
    if (instant || n >= text.length) return;
    const id = setInterval(() => setN((v) => Math.min(text.length, v + 1)), MS[speed]);
    return () => clearInterval(id);
  }, [instant, n, text.length, speed]);
  const shown = instant ? text.length : n;
  const done = shown >= text.length;
  return (
    <div className="flex flex-col gap-3 rounded-3xl border bg-card p-5">
      {name && <p className="w-fit rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">{name}</p>}
      {/* El texto completo va para lector de pantalla; la versión que se escribe es solo visual. */}
      <p className="sr-only" aria-live="polite">{name ? `${name}: ` : ""}{text}</p>
      <p aria-hidden className="min-h-24 text-lg leading-relaxed sm:text-xl">{text.slice(0, shown)}<span className="opacity-0">{text.slice(shown)}</span></p>
      <Button className="h-12 w-fit self-end rounded-2xl px-6 text-base" onClick={() => (done ? onNext() : setN(text.length))}>
        {done ? (last ? "Terminar" : "Siguiente") : "Completar"} <ChevronRight aria-hidden />
      </Button>
    </div>
  );
}

function NameBox({ initialName, initialLocal, onDone }: { initialName: string; initialLocal: string; onDone: () => void }) {
  const [name, setName] = useState(initialName);
  const [local, setLocal] = useState(initialLocal);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !local.trim()) return;
    await updateProfile({ name: name.trim() });
    await saveBakery({ name: local.trim() });
    onDone();
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl border-2 border-primary bg-card p-5">
      <div className="flex flex-col gap-2"><label htmlFor="st-name" className={labelClass}>Tu nombre</label><input id="st-name" required maxLength={30} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="flex flex-col gap-2"><label htmlFor="st-local" className={labelClass}>Nombre de tu pastelería</label><input id="st-local" required maxLength={30} className={inputClass} value={local} onChange={(e) => setLocal(e.target.value)} /></div>
      <Button type="submit" className="h-12 w-fit self-end rounded-2xl px-6 text-base">Listo <ChevronRight aria-hidden /></Button>
    </form>
  );
}

function TaskBox({ node, done, progress, onNext }: { node: Extract<Node, { k: "task" }>; done: boolean; progress: { have: number; need: number } | null; onNext: () => void }) {
  const [skip, setSkip] = useState(false);
  const ok = done || skip;
  return (
    <div className={cn("flex flex-col gap-3 rounded-3xl border-2 bg-card p-5", ok ? "border-primary" : "border-dashed")}>
      <p className="flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="size-4" aria-hidden /> Tarea de la vida real</p>
      <p className="text-lg font-semibold">{node.text}</p>
      <p role="status" className="flex items-center gap-2 text-sm font-semibold">
        {done ? <><Check className="size-5 text-primary" aria-hidden /> ¡Hecho! La historia lo notó sola.</> : skip ? "Seguimos sin esta tarea." : progress ? `Llevas ${progress.have} de ${progress.need}. Se marca sola.` : "Cuando lo hagas, vuelve aquí: se marca sola."}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {!done && <Button asChild variant="outline" className="h-12 rounded-2xl px-5"><Link href={node.href}>{node.cta}</Link></Button>}
        <Button disabled={!ok} className="h-12 rounded-2xl px-6 text-base" onClick={onNext}>Seguir <ChevronRight aria-hidden /></Button>
      </div>
      {!done && !skip && node.skippable && (
        <button type="button" onClick={() => setSkip(true)} className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary underline underline-offset-4">{node.skippable}</button>
      )}
    </div>
  );
}

function Stage({ ids, speaker, playerChar }: { ids: string[]; speaker: string | null; playerChar: string }) {
  return (
    <div className="relative flex h-60 items-end justify-center gap-4 overflow-hidden rounded-[2rem] bg-gradient-to-b from-secondary to-card px-4 sm:h-80 sm:gap-10">
      <div className="absolute inset-x-0 bottom-0 h-8 bg-primary/10" aria-hidden />
      {ids.map((id) => {
        const real = id === "yo" ? playerChar : id;
        const on = speaker === null || speaker === id;
        return (
          <div key={id} className="relative z-10 h-48 motion-reduce:!transition-none sm:h-72" style={{ opacity: on ? 1 : 0.55, transform: on ? "scale(1)" : "scale(0.93)", transformOrigin: "bottom center", transition: "opacity 250ms cubic-bezier(0.23, 1, 0.32, 1), transform 250ms cubic-bezier(0.23, 1, 0.32, 1)" }}>
            <Character id={real} interactive={false} className="h-full" />
          </div>
        );
      })}
    </div>
  );
}

export function StoryPlayer({
  chapter, state, data, vars, playerChar, onExit,
}: {
  chapter: Chapter; state: StoryState; data: StoryData; vars: Record<string, string>; playerChar: string; onExit: () => void;
}) {
  const [idx, setIdx] = useState(Math.min(state.pos, visibleNodes(chapter.nodes, state.flags).length));
  const [inject, setInject] = useState<{ nodes: Node[]; i: number } | null>(null);
  const [speed, setSpeed] = useState<Speed>(() => {
    try { const v = localStorage.getItem("bw-story-speed"); return v === "rapido" || v === "ya" ? v : "normal"; } catch { return "normal"; }
  });
  const stateRef = useRef(state);
  stateRef.current = state;
  const lastStage = useRef<{ ids: string[]; speaker: string | null }>({ ids: [], speaker: null });
  const completed = useRef(false);

  const nodes = visibleNodes(chapter.nodes, state.flags);
  const finished = idx >= nodes.length;
  const node: Node | undefined = inject ? inject.nodes[inject.i] : nodes[idx];
  const since = state.started[String(chapter.n)] ?? 0;
  const t = (s: string) => interpolate(s, vars);

  function go(next: number) {
    setIdx(next);
    void saveStory({ ...stateRef.current, pos: next });
  }
  function advance() {
    sfx("click");
    if (inject) {
      if (inject.i + 1 < inject.nodes.length) setInject({ ...inject, i: inject.i + 1 });
      else { setInject(null); go(idx + 1); }
    } else go(idx + 1);
  }
  function choose(o: Extract<Node, { k: "choice" }>["options"][number]) {
    sfx("click");
    if (o.flag) void saveStory({ ...stateRef.current, pos: idx, flags: { ...stateRef.current.flags, [o.flag[0]]: o.flag[1] } });
    if (o.reply.length) setInject({ nodes: o.reply, i: 0 });
    else go(idx + 1);
  }
  function chooseSpeed(s: Speed) { setSpeed(s); try { localStorage.setItem("bw-story-speed", s); } catch {} }

  // Termina el capítulo una sola vez.
  useEffect(() => {
    if (!finished || completed.current) return;
    completed.current = true;
    sfx("success");
    void completeChapter(stateRef.current, chapter.n);
  }, [finished, chapter.n]);

  if (finished || !node) {
    return (
      <div className="flex max-w-2xl flex-col items-center gap-5 rounded-[2rem] bg-secondary p-8 text-center">
        <h2 className="text-3xl">{chapter.kind && chapter.kind !== "main" ? "Historia completa" : `Capítulo ${chapter.n} completo`}</h2>
        <p className="font-heading text-xl">{chapter.title}</p>
        <p className="flex items-center gap-2 font-semibold"><Coins className="size-5 text-primary" aria-hidden /> +{chapter.reward.coins} monedas · +{chapter.reward.xp} XP (la primera vez)</p>
        <Button className="h-12 rounded-2xl px-6 text-base" onClick={onExit}>Volver al mapa</Button>
      </div>
    );
  }

  let speaker: string | null = lastStage.current.speaker;
  let ids = lastStage.current.ids;
  const who = node.k === "say" ? node.who : node.k === "choice" ? node.who : undefined;
  if (node.k === "say") {
    if (node.who === "narrador") {
      // La voz del narrador no tiene cara: se quedan en escena los de antes, sin resaltar a nadie.
      ids = node.stage ?? (lastStage.current.ids.length ? lastStage.current.ids : ["yo"]);
      speaker = "__narrador__";
      lastStage.current = { ids, speaker: lastStage.current.speaker };
    } else {
      ids = node.stage ?? [node.who];
      speaker = node.who;
      lastStage.current = { ids, speaker };
    }
  } else if (node.k === "choice" && node.who) {
    speaker = node.who;
  }
  const speakerName = who && who !== "narrador" ? (who === "yo" ? vars.nombre : getCharacter(who).name) : null;
  const key = `${idx}-${inject?.i ?? "x"}`;
  const skipTo = nextStop(nodes, idx + 1);

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{chapter.kind === "barrio" ? "Historias del barrio" : chapter.kind === "temporada" ? "Historia de temporada" : `Acto ${chapter.act} · Capítulo ${chapter.n}`}</p>
          <h2 className="text-2xl">{chapter.title}</h2>
        </div>
        <Button variant="outline" className="h-11 rounded-2xl px-4" onClick={onExit}>Salir</Button>
      </div>

      <Stage ids={ids} speaker={speaker} playerChar={playerChar} />

      {node.k === "say" && <SayBox key={key} name={speakerName} text={t(node.text)} speed={speed} onNext={advance} last={idx === nodes.length - 1 && !inject} />}
      {node.k === "name" && <NameBox key={key} initialName={vars.nombre === "amiga" ? "" : vars.nombre} initialLocal={vars.local} onDone={advance} />}
      {node.k === "choice" && (
        <div key={key} className="flex flex-col gap-3 rounded-3xl border bg-card p-5">
          {speakerName && <p className="w-fit rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">{speakerName}</p>}
          <p className="text-lg font-semibold">{t(node.prompt)}</p>
          <ul className="flex flex-col gap-2">
            {node.options.map((o) => <li key={o.label}><button type="button" onClick={() => choose(o)} className="min-h-12 w-full rounded-2xl border-2 border-transparent bg-secondary px-4 text-left font-semibold hover:border-primary">{t(o.label)}</button></li>)}
          </ul>
        </div>
      )}
      {node.k === "task" && <TaskBox key={key} node={{ ...node, text: t(node.text) }} done={taskDone(node.id, data, since)} progress={taskProgress(node.id, data, since)} onNext={advance} />}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Velocidad del texto">
          <span className="font-semibold">Texto:</span>
          {SPEEDS.map((s) => (
            <button key={s.id} type="button" aria-pressed={speed === s.id} onClick={() => chooseSpeed(s.id)} className={cn("min-h-11 rounded-full border-2 px-4 font-semibold", speed === s.id ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-card")}>{s.label}</button>
          ))}
        </div>
        {node.k === "say" && !inject && skipTo > idx + 1 && (
          <button type="button" onClick={() => go(skipTo)} className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">Saltar hasta lo siguiente</button>
        )}
      </div>
    </div>
  );
}
