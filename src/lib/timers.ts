"use client";

import { useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Timer } from "@/lib/db/db";
import { askNotificationPermission, unlockAudio } from "@/lib/alarm";

const newId = () => crypto.randomUUID();

export function remainingMs(t: Timer, now: number) {
  if (t.status === "running") return Math.max(0, (t.end_at ?? now) - now);
  if (t.status === "paused") return t.left_ms ?? 0;
  return 0;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function formatClock(ms: number) {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

export function useTimers() {
  return useLiveQuery(async () => (await db.timers.toArray()).sort((a, b) => a.created_at - b.created_at), []);
}

// Reloj compartido: un solo intervalo mientras haya componentes mirando temporizadores en marcha.
let nowValue = 0;
const tickers = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | undefined;

function subscribeTick(cb: () => void) {
  tickers.add(cb);
  if (!interval) {
    nowValue = Date.now();
    interval = setInterval(() => {
      nowValue = Date.now();
      tickers.forEach((f) => f());
    }, 500);
  }
  return () => {
    tickers.delete(cb);
    if (!tickers.size) {
      clearInterval(interval);
      interval = undefined;
    }
  };
}

const subscribeNever = () => () => {};

/** Reloj que avanza solo mientras haya temporizadores corriendo. */
export function useNow(active: boolean) {
  return useSyncExternalStore(
    active ? subscribeTick : subscribeNever,
    () => nowValue || (nowValue = Date.now()),
    () => 0,
  );
}

export async function createTimer(opts: { label: string; ms: number; recipe_id?: string | null }) {
  unlockAudio();
  void askNotificationPermission();
  const now = Date.now();
  await db.timers.add({
    id: newId(),
    label: opts.label.trim() || "Temporizador",
    duration_ms: opts.ms,
    status: "running",
    end_at: now + opts.ms,
    left_ms: null,
    recipe_id: opts.recipe_id ?? null,
    created_at: now,
  });
}

export function pauseTimer(t: Timer) {
  return db.timers.update(t.id, { status: "paused", left_ms: remainingMs(t, Date.now()), end_at: null });
}

export function resumeTimer(t: Timer) {
  return db.timers.update(t.id, { status: "running", end_at: Date.now() + (t.left_ms ?? 0), left_ms: null });
}

/** Suma tiempo; si estaba sonando, lo vuelve a poner en marcha (posponer). */
export function addTime(t: Timer, ms: number) {
  if (t.status === "running") return db.timers.update(t.id, { end_at: (t.end_at ?? Date.now()) + ms });
  if (t.status === "paused") return db.timers.update(t.id, { left_ms: (t.left_ms ?? 0) + ms });
  return db.timers.update(t.id, { status: "running", end_at: Date.now() + ms, left_ms: null });
}

export const removeTimer = (id: string) => db.timers.delete(id);

/** true solo para quien logró pasarlo a "sonando" (evita avisos dobles). */
export function markRinging(id: string) {
  return db.transaction("rw", db.timers, async () => {
    const t = await db.timers.get(id);
    if (!t || t.status !== "running") return false;
    await db.timers.update(id, { status: "ringing", end_at: null, left_ms: 0 });
    return true;
  });
}
