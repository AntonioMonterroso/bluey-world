"use client";

import { useMemo, useState } from "react";
import {
  BatteryLow, CloudRain, Flame, Leaf, Lightbulb, Mic, MicOff, Pencil, PartyPopper, Search, Smile, Trash2, Volume2, VolumeX, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mochito } from "@/components/mochito";
import { DressedImage } from "@/components/dressed-image";
import { EntryForm } from "@/components/diary-page";
import { Stars } from "@/components/stars";
import { inputClass, labelClass, textareaClass } from "@/components/ui/fields";
import { CHARACTERS, getCharacter } from "@/lib/characters";
import type { CookLog, JournalEntry } from "@/lib/db/db";
import { updateProfile, useProfile } from "@/lib/db/profile";
import { MOODS, PROMPTS, cookComment, journalStreak, moodOf, normalize } from "@/lib/journal-core";
import { canSpeak, removeEntry, speak, stopSpeaking, useDictation, useJournal, writeEntry } from "@/lib/journal";
import { useDiary } from "@/lib/kitchen";
import { anchorsFor } from "@/lib/game/anchors";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

const MOOD_ICON: Record<string, typeof Smile> = {
  feliz: Smile, emocionada: PartyPopper, tranquila: Leaf, cansada: BatteryLow, estresada: Zap, triste: CloudRain, enojada: Flame,
};

type Filter = "todo" | "dia" | "postres";
type Item = { kind: "dia"; at: number; e: JournalEntry } | { kind: "postre"; at: number; l: CookLog };

const dayTitle = (ms: number) => new Date(ms).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
const timeOf = (ms: number) => new Date(ms).toLocaleTimeString("es", { hour: "numeric", minute: "2-digit" });
// Personajes que se pueden elegir para escuchar (los que son uno solo).
const LISTENERS = CHARACTERS.filter((c) => anchorsFor(c.id) !== null || c.id === "rusty");

function Bubble({ char, text, onListen, speaking, className }: { char: string; text: string; onListen?: () => void; speaking?: boolean; className?: string }) {
  const ch = getCharacter(char);
  return (
    <div className={cn("flex items-end gap-2", className)}>
      <span className="flex size-10 shrink-0 items-end justify-center overflow-hidden rounded-full bg-secondary">
        <img src={ch.src} alt="" className="h-9 w-auto" />
      </span>
      <div className="min-w-0 rounded-3xl rounded-bl-md bg-secondary px-4 py-2.5 text-sm text-pretty">
        <span className="block text-xs font-semibold text-primary">{ch.name}</span>
        {text}
        {onListen && canSpeak() && (
          <button type="button" onClick={onListen} className="mt-1 flex min-h-9 items-center gap-1 text-xs font-semibold text-primary" aria-label={speaking ? "Dejar de escuchar" : `Escuchar lo que dijo ${ch.name}`}>
            {speaking ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />} {speaking ? "Parar" : "Escuchar"}
          </button>
        )}
      </div>
    </div>
  );
}

function Inner() {
  const { ready, profile } = useProfile();
  const journal = useJournal();
  const cooks = useDiary();
  const [text, setText] = useState("");
  const [mood, setMood] = useState<string>("");
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [editingCook, setEditingCook] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(PROMPTS[new Date().getDate() % PROMPTS.length]);
  const [filter, setFilter] = useState<Filter>("todo");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<{ char: string; text: string } | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const dictation = useDictation((t) => setText((cur) => (cur ? `${cur.trimEnd()} ${t}` : t)));
  const listener = profile.journal_char && LISTENERS.some((c) => c.id === profile.journal_char) ? profile.journal_char : profile.character;
  const voice = profile.journal_voice ?? false;
  const who = profile.nickname?.trim() || profile.name.trim();

  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];
    if (filter !== "postres") for (const e of journal ?? []) list.push({ kind: "dia", at: e.at, e });
    if (filter !== "dia") for (const l of cooks ?? []) list.push({ kind: "postre", at: l.cooked_at, l });
    const q = normalize(query.trim());
    const found = q ? list.filter((i) => normalize(i.kind === "dia" ? `${i.e.text} ${i.e.reply}` : `${i.l.title} ${i.l.notes} ${i.l.change ?? ""}`).includes(q)) : list;
    return found.sort((a, b) => b.at - a.at);
  }, [journal, cooks, filter, query]);

  const groups = useMemo(() => {
    const out: { day: string; items: Item[] }[] = [];
    for (const i of items) {
      const d = dayTitle(i.at);
      if (out.at(-1)?.day === d) out.at(-1)!.items.push(i);
      else out.push({ day: d, items: [i] });
    }
    return out;
  }, [items]);

  if (!ready || journal === undefined || cooks === undefined) return null;

  const streak = journalStreak(journal.map((e) => e.at), now);
  const week = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(now - (6 - k) * 86_400_000);
    const same = journal.filter((e) => new Date(e.at).toDateString() === d.toDateString());
    return { label: d.toLocaleDateString("es", { weekday: "narrow" }), full: d.toLocaleDateString("es", { weekday: "long" }), mood: same[0]?.mood };
  });

  function say(id: string, line: string) {
    if (speakingId === id) { stopSpeaking(); setSpeakingId(null); return; }
    if (speak(line, () => setSpeakingId((cur) => (cur === id ? null : cur)))) setSpeakingId(id);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return setProblem("Escribe o dicta algo primero.");
    if (!mood) return setProblem("Elige cómo te sientes.");
    setProblem(null);
    dictation.stop();
    const saved = await writeEntry({ text, mood, char: editing?.char ?? listener, who }, editing ?? undefined);
    setAnswer({ char: saved.char, text: saved.reply });
    if (voice) say("answer", saved.reply);
    setText("");
    setMood("");
    setEditing(null);
  }

  function edit(e: JournalEntry) {
    setEditing(e);
    setText(e.text);
    setMood(e.mood);
    setAnswer(null);
    document.getElementById("diario-texto")?.focus();
  }

  const greeting = dictation.listening
    ? "Te escucho… habla con calma."
    : answer?.text ?? (who ? `Hola, ${who}. ¿Cómo estuvo tu día? Aquí estoy para escucharte.` : "Hola. ¿Cómo estuvo tu día? Aquí estoy para escucharte.");
  const shownChar = answer?.char ?? listener;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl">Mi diario</h1>
        <p className="text-sm text-muted-foreground">Tu día y tus postres, en un solo lugar. Solo tú lo ves.</p>
      </div>

      <section aria-label="Quién te escucha" className="grid gap-5 rounded-[2rem] bg-card p-4 shadow-sm md:grid-cols-[12rem_1fr] md:p-6">
        <div className="flex flex-col items-center gap-2">
          <div className={cn("flex h-48 items-end justify-center", dictation.listening && "motion-safe:animate-pulse")}>
            <DressedImage char={shownChar} outfit={shownChar === profile.character ? profile.outfit : undefined} className="h-44" />
            <Mochito className="-ml-4 h-20 shrink-0" bubble="right" />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <div aria-live="polite" className="relative rounded-3xl rounded-tl-md bg-secondary px-5 py-4 text-pretty">
            <span className="mb-1 block text-xs font-semibold text-primary">{getCharacter(shownChar).name}</span>
            <p className="text-lg leading-snug">{greeting}</p>
            {answer && canSpeak() && (
              <button type="button" onClick={() => say("answer", answer.text)} className="mt-2 flex min-h-9 items-center gap-1 text-sm font-semibold text-primary">
                {speakingId === "answer" ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />} {speakingId === "answer" ? "Parar" : "Escuchar otra vez"}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">¿Quién te escucha hoy?</p>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label="Quién te escucha">
              {LISTENERS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={listener === c.id}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => { setAnswer(null); void updateProfile({ journal_char: c.id }); }}
                  className={cn("flex size-12 shrink-0 items-end justify-center overflow-hidden rounded-full border-2 bg-secondary", listener === c.id ? "border-primary ring-2 ring-primary/40" : "border-transparent")}
                >
                  <img src={c.src} alt="" className="h-11 w-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={submit} className="flex flex-col gap-4 rounded-[2rem] border-2 border-primary/40 bg-card p-4 md:p-6">
        <div className="flex flex-col gap-2">
          <p className={labelClass} id="animo">¿Cómo te sientes?</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="animo">
            {MOODS.map((m) => {
              const Icon = MOOD_ICON[m.id];
              return (
                <button key={m.id} type="button" role="radio" aria-checked={mood === m.id} onClick={() => setMood(m.id)} className={cn("flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-semibold transition-[background-color,border-color] duration-150 active:scale-[0.97]", mood === m.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
                  <Icon className="size-4" aria-hidden /> {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="diario-texto" className={labelClass}>{editing ? "Editar lo que escribiste" : "Cuéntale tu día"}</label>
          <textarea id="diario-texto" className={cn(textareaClass, "min-h-36 text-base")} value={dictation.listening && dictation.interim ? `${text} ${dictation.interim}`.trim() : text} onChange={(e) => setText(e.target.value)} placeholder={prompt} />
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <button type="button" onClick={() => setPrompt(PROMPTS[(PROMPTS.indexOf(prompt) + 1) % PROMPTS.length])} className="flex min-h-11 items-center gap-1.5 rounded-full bg-secondary px-4 font-semibold text-foreground active:scale-[0.97]">
              <Lightbulb className="size-4" aria-hidden /> Otra idea
            </button>
            <span className="text-pretty">{prompt}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {dictation.supported ? (
            <Button type="button" variant={dictation.listening ? "default" : "outline"} className="h-12 rounded-2xl px-5" onClick={() => (dictation.listening ? dictation.stop() : dictation.start())} aria-pressed={dictation.listening}>
              {dictation.listening ? <MicOff aria-hidden /> : <Mic aria-hidden />} {dictation.listening ? "Dejar de dictar" : "Dictar con mi voz"}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">Este navegador no permite dictar. Puedes usar el micrófono del teclado del celular.</p>
          )}
          <Button type="submit" className="h-12 rounded-2xl px-6">{editing ? "Guardar cambios" : `Contárselo a ${getCharacter(listener).name}`}</Button>
          {editing && <Button type="button" variant="ghost" className="h-12 rounded-2xl" onClick={() => { setEditing(null); setText(""); setMood(""); }}>Cancelar</Button>}
          {canSpeak() && (
            <label className="ml-auto flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
              <input type="checkbox" className="size-5 accent-[var(--primary)]" checked={voice} onChange={(e) => void updateProfile({ journal_voice: e.target.checked })} />
              Que me responda en voz alta
            </label>
          )}
        </div>
        {(problem || dictation.error) && <p role="alert" className="text-sm font-semibold text-destructive">{problem ?? dictation.error}</p>}
      </form>

      <section aria-label="Tu semana" className="grid gap-3 sm:grid-cols-[auto_1fr]">
        <div className="flex items-center gap-3 rounded-3xl bg-card px-5 py-4">
          <span className="font-heading text-3xl tabular-nums">{streak}</span>
          <span className="text-sm leading-tight">{streak === 1 ? "día seguido" : "días seguidos"}<br /><span className="text-muted-foreground">escribiendo</span></span>
        </div>
        <ol className="flex items-center justify-between gap-1 rounded-3xl bg-card px-4 py-3" aria-label="Tu ánimo de los últimos 7 días">
          {week.map((d, k) => {
            const Icon = d.mood ? MOOD_ICON[d.mood] : null;
            return (
              <li key={k} className="flex flex-col items-center gap-1 text-xs text-muted-foreground" aria-label={`${d.full}: ${d.mood ? moodOf(d.mood).label : "sin escribir"}`}>
                <span className={cn("flex size-9 items-center justify-center rounded-full", Icon ? "bg-primary text-primary-foreground" : "bg-secondary")}>{Icon && <Icon className="size-4" aria-hidden />}</span>
                {d.label}
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="historial" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="historial" className="text-2xl">Lo que has contado</h2>
          <div className="flex gap-2" role="group" aria-label="Qué mostrar">
            {([["todo", "Todo"], ["dia", "Mi día"], ["postres", "Postres"]] as const).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} className={cn("min-h-11 rounded-full border-2 px-4 text-sm font-semibold", filter === id ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-card")}>{label}</button>
            ))}
          </div>
        </div>
        <div className="relative">
          <label htmlFor="diario-buscar" className="sr-only">Buscar en el diario</label>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input id="diario-buscar" type="search" className={cn(inputClass, "pl-10")} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar una palabra…" />
        </div>

        {groups.length === 0 ? (
          <p className="rounded-3xl border border-dashed bg-card p-6 text-center text-muted-foreground">
            {query ? "No encontré nada con esa palabra." : filter === "postres" ? "Cuando termines una receta en el Modo Cocinar, aparece aquí con su foto y su nota." : "Todavía no has escrito nada. Cuéntale a tu personaje cómo te fue hoy."}
          </p>
        ) : (
          groups.map((g) => (
            <div key={g.day} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-muted-foreground first-letter:uppercase">{g.day}</h3>
              <ol className="flex flex-col gap-3">
                {g.items.map((i) => i.kind === "dia" ? (
                  <li key={i.e.id}>
                    <article className="flex flex-col gap-3 rounded-3xl border bg-card p-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                        {(() => { const Icon = MOOD_ICON[i.e.mood] ?? Leaf; return <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-foreground"><Icon className="size-3.5" aria-hidden /> {moodOf(i.e.mood).label}</span>; })()}
                        <span>{timeOf(i.e.at)}</span>
                        <span className="ml-auto flex gap-1">
                          <button type="button" aria-label="Editar lo que escribiste" onClick={() => edit(i.e)} className="flex size-11 items-center justify-center rounded-full hover:bg-accent/60"><Pencil className="size-4" aria-hidden /></button>
                          <button type="button" aria-label="Borrar esta entrada" onClick={() => { if (confirm("¿Borrar esta entrada del diario?")) void removeEntry(i.e.id); }} className="flex size-11 items-center justify-center rounded-full hover:bg-accent/60"><Trash2 className="size-4" aria-hidden /></button>
                        </span>
                      </div>
                      <p className="whitespace-pre-line text-pretty">{i.e.text}</p>
                      <Bubble char={i.e.char} text={i.e.reply} speaking={speakingId === i.e.id} onListen={() => say(i.e.id, i.e.reply)} />
                    </article>
                  </li>
                ) : (
                  <li key={i.l.id}>
                    {editingCook === i.l.id ? <EntryForm log={i.l} onClose={() => setEditingCook(null)} /> : (
                      <article className="flex flex-col gap-3 rounded-3xl border bg-card p-4">
                        <div className="flex gap-4">
                          {i.l.photo ? <img src={i.l.photo} alt={`Foto de ${i.l.title}`} className="size-20 shrink-0 rounded-2xl object-cover" /> : <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-secondary text-xs text-muted-foreground">Sin foto</span>}
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <p className="text-xs font-semibold text-muted-foreground">Postre · {timeOf(i.l.cooked_at)}</p>
                            <h4 className="truncate font-heading text-xl">{i.l.title}</h4>
                            {i.l.rating ? <Stars value={i.l.rating} /> : null}
                            {i.l.notes && <p className="text-sm">{i.l.notes}</p>}
                            {i.l.change && <p className="text-sm text-muted-foreground"><span className="font-semibold">Cambiaría:</span> {i.l.change}</p>}
                          </div>
                          <button type="button" aria-label={`Editar ${i.l.title}`} onClick={() => setEditingCook(i.l.id)} className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-accent/60"><Pencil className="size-4" aria-hidden /></button>
                        </div>
                        <Bubble char={listener} text={cookComment(i.l.rating, i.l.notes, i.l.change, i.l.id)} />
                      </article>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export function JournalPage() {
  return useIsClient() ? <Inner /> : null;
}
