"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type JournalEntry } from "@/lib/db/db";
import { deleteRow, upsertRow } from "@/lib/db/repo";
import { journalStreak, replyFor } from "@/lib/journal-core";
import { newId } from "@/lib/recipes";

const alive = <T extends { deleted_at?: number | null }>(rows: T[]) => rows.filter((r) => !r.deleted_at);

/** Entradas del diario, de la más nueva a la más vieja. */
export function useJournal() {
  return useLiveQuery(async () => alive(await db.journal.orderBy("at").reverse().toArray()), []);
}

/** Guarda lo que escribió y le pide al personaje su respuesta (recordando los días anteriores). */
export async function writeEntry(input: { text: string; mood: string; char: string; who: string }, editing?: JournalEntry) {
  const now = editing?.at ?? Date.now();
  const all = alive(await db.journal.orderBy("at").reverse().toArray()).filter((e) => e.id !== editing?.id);
  const past = all.filter((e) => e.at < now);
  const streak = journalStreak([...all.map((e) => e.at), now], now);
  const { reply, topics } = replyFor({ text: input.text, mood: input.mood, who: input.who, past, now, streak });
  return upsertRow<JournalEntry>("journal", {
    id: editing?.id ?? newId(),
    at: now,
    text: input.text.trim(),
    mood: input.mood,
    char: input.char,
    reply,
    topics,
  });
}

export const removeEntry = (id: string) => deleteRow("journal", id);

// ── Voz ─────────────────────────────────────────────────────────────

type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const spanish = () => (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("es") ? navigator.language : "es-MX");

/** Dictar: va escribiendo lo que dice. `onText` recibe el texto ya confirmado de cada frase. */
export function useDictation(onText: (text: string) => void) {
  const [supported] = useState(() => recognitionCtor() !== null); // la página solo se pinta en el navegador
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const cb = useRef(onText);
  useEffect(() => { cb.current = onText; });
  useEffect(() => () => rec.current?.abort(), []);

  function start() {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    setError(null);
    const r = new Ctor();
    r.lang = spanish();
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let partial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) cb.current(res[0].transcript.trim());
        else partial += res[0].transcript;
      }
      setInterim(partial);
    };
    r.onerror = (e) => {
      setError(e.error === "not-allowed" || e.error === "service-not-allowed"
        ? "No tengo permiso para usar el micrófono. Actívalo en los ajustes del navegador."
        : e.error === "network" ? "Para dictar se necesita internet." : e.error === "no-speech" ? "No te escuché. Intenta de nuevo, más cerca." : null);
    };
    r.onend = () => { setListening(false); setInterim(""); };
    rec.current = r;
    try { r.start(); setListening(true); } catch { setListening(false); }
  }

  function stop() { rec.current?.stop(); }

  return { supported, listening, interim, error, start, stop };
}

/** Leer en voz alta con la voz del dispositivo (en español si hay). */
export function speak(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voices = synth.getVoices();
  const lang = spanish().toLowerCase();
  u.voice = voices.find((v) => v.lang.toLowerCase() === lang) ?? voices.find((v) => v.lang.toLowerCase().startsWith("es")) ?? null;
  u.lang = u.voice?.lang ?? spanish();
  u.rate = 1;
  u.pitch = 1.15;
  if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
  synth.speak(u);
  return true;
}

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;
export const stopSpeaking = () => { if (canSpeak()) window.speechSynthesis.cancel(); };
