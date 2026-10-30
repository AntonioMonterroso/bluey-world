"use client";

import { useState } from "react";
import Image from "next/image";
import { BookOpen, Check, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryPlayer } from "@/components/story-player";
import { useBakery } from "@/lib/bakery";
import { useProfile } from "@/lib/db/profile";
import { BARRIO, CHAPTERS, TEMPORADA, chapterByN } from "@/lib/game/story/chapters";
import { getCharacter } from "@/lib/characters";
import { CALENDAR_EVENTS, activeEvents } from "@/lib/game/events";
import type { Chapter } from "@/lib/game/story/types";
import { FINAL_REPUTATION, isDone, isUnlocked, sideUnlocked, startChapter } from "@/lib/game/story/engine";
import { saveStory, useStory, useStoryData } from "@/lib/story";
import { useIsClient } from "@/lib/use-is-client";

function Inner() {
  const { ready, state } = useStory();
  const data = useStoryData();
  const { profile } = useProfile();
  const { bakery } = useBakery();
  const [playing, setPlaying] = useState<number | null>(null);

  if (!ready || !data) return null;
  const vars = {
    nombre: profile.nickname?.trim() || profile.name?.trim() || "amiga", local: bakery.name || "tu pastelería",
    rep: String(FINAL_REPUTATION), recetas: String(data.cooks), turnos: String(data.shifts),
  };
  const chapter = playing ? chapterByN(playing) : undefined;

  if (chapter) {
    return <StoryPlayer key={chapter.n} chapter={chapter} state={state} data={data} vars={vars} playerChar={profile.character} onExit={() => setPlaying(null)} />;
  }

  async function play(n: number, restart: boolean) {
    const next = startChapter(state, n, Date.now(), restart);
    // Seguir donde ibas solo si el capítulo está empezado y sin terminar.
    const resume = !restart && !isDone(state, n) && !!state.started[String(n)];
    await saveStory({ ...next, pos: resume ? state.pos : 0 });
    setPlaying(n);
  }

  const lastDone = CHAPTERS.every((c) => state.done.includes(c.n));
  const eventIds = activeEvents(Date.now()).map((e) => e.def.id);
  const eventName = (id?: string) => CALENDAR_EVENTS.find((e) => e.id === id)?.name ?? id ?? "";
  const SideCard = ({ c, lockText }: { c: Chapter; lockText: string }) => {
    const open = sideUnlocked(c, state, eventIds);
    const done = isDone(state, c.n);
    const started = !!state.started[String(c.n)] && !done;
    const ch = getCharacter(c.who ?? "bluey");
    return (
      <li className="flex flex-wrap items-center gap-4 rounded-3xl border bg-card p-4">
        <span className="relative flex h-16 w-14 shrink-0 items-end justify-center overflow-hidden rounded-2xl bg-secondary">
          <Image src={ch.src} alt="" width={ch.w} height={ch.h} className={open ? "h-14 w-auto object-contain" : "h-14 w-auto object-contain opacity-40 grayscale"} />
          {done && <span className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-3.5" aria-label="Terminada" /></span>}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{c.title}</p>
          <p className="text-sm text-muted-foreground">{open ? c.blurb : lockText}</p>
        </div>
        {open ? (
          <Button className="h-12 rounded-2xl px-5" variant={done ? "outline" : "default"} onClick={() => void play(c.n, done)}>
            <BookOpen aria-hidden /> {done ? "Volver a leer" : started ? "Continuar" : "Leer"}
          </Button>
        ) : <Lock className="size-5 text-muted-foreground" aria-label="Bloqueada" />}
      </li>
    );
  };
  const ACTS = [{ n: 1, title: "Abrir la puerta" }, { n: 2, title: "Crecer" }, { n: 3, title: "La mejor del barrio" }];
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-4xl">La Esquina de Dulce Villa</h1>
        <p className="mt-2 text-muted-foreground">Heredaste una pastelería vieja y empolvada. Con tus recetas de verdad, vas a convertirla en la favorita del barrio.</p>
      </div>

      {ACTS.map((a) => (
        <section key={a.n} aria-labelledby={`acto${a.n}`} className="flex flex-col gap-3">
          <h2 id={`acto${a.n}`} className="text-2xl">Acto {a.n === 1 ? "I" : a.n === 2 ? "II" : "III"} · {a.title}</h2>
          <ol className="flex flex-col gap-3">
            {CHAPTERS.filter((c) => c.act === a.n).map((c) => {
              const open = isUnlocked(state, c.n);
              const done = isDone(state, c.n);
              const started = !!state.started[String(c.n)] && !done;
              return (
                <li key={c.n} className="flex flex-wrap items-center gap-4 rounded-3xl border bg-card p-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary font-heading text-xl">
                    {done ? <Check className="size-6 text-primary" aria-label="Terminado" /> : open ? c.n : <Lock className="size-5 text-muted-foreground" aria-label="Bloqueado" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{c.n}. {c.title}</p>
                    <p className="text-sm text-muted-foreground">{open ? c.blurb : "Termina el capítulo anterior para abrirlo."}</p>
                  </div>
                  {open && (
                    <Button className="h-12 rounded-2xl px-5" variant={done ? "outline" : "default"} onClick={() => void play(c.n, done)}>
                      <BookOpen aria-hidden /> {done ? "Volver a leer" : started ? "Continuar" : "Empezar"}
                    </Button>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <section aria-labelledby="barrio" className="flex flex-col gap-3">
        <h2 id="barrio" className="flex items-center gap-2 text-2xl"><Sparkles className="size-5 text-primary" aria-hidden /> Historias del barrio</h2>
        <p className="text-sm text-muted-foreground">Cuentos cortos con tus vecinos. Se abren mientras avanzas en la historia, y cada uno te enseña algo de la app.</p>
        <ul className="grid gap-3 lg:grid-cols-2">
          {BARRIO.map((c) => <SideCard key={c.n} c={c} lockText={`Se abre al terminar el capítulo ${c.after}.`} />)}
        </ul>
      </section>

      <section aria-labelledby="temporada" className="flex flex-col gap-3">
        <h2 id="temporada" className="text-2xl">De temporada</h2>
        <p className="text-sm text-muted-foreground">Aparecen durante cada fiesta del año. Si empezaste una, la puedes terminar después.</p>
        <ul className="grid gap-3 lg:grid-cols-2">
          {TEMPORADA.map((c) => <SideCard key={c.n} c={c} lockText={`Disponible durante ${eventName(c.event)}.`} />)}
        </ul>
      </section>

      {lastDone && <p className="rounded-2xl bg-secondary px-4 py-3 font-semibold">¡Terminaste toda la historia! Tu pastelería sigue abierta: puedes volver a leer cualquier capítulo cuando quieras.</p>}
      <p className="text-sm text-muted-foreground">Las tareas se marcan solas con lo que haces en la app: cocinar, vender, anotar gastos o contratar. Los premios de cada capítulo se dan una sola vez.</p>
    </div>
  );
}

export function StoryPage() {
  return useIsClient() ? <Inner /> : null;
}
