"use client";

import { useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { resetLocal, syncNow } from "@/lib/db/sync";
import { db } from "@/lib/db/db";

// Login con usuario + contraseña. Supabase pide un correo, así que el usuario se
// convierte en un correo interno (no se envía nada; la confirmación por correo debe
// estar desactivada en Supabase).
const EMAIL_DOMAIN = "bluey-world.app";

type AuthSnapshot = { ready: boolean; user: User | null; configured: boolean };

const SERVER_SNAPSHOT: AuthSnapshot = { ready: false, user: null, configured: false };
let snap: AuthSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();
let started = false;

function publish(next: Partial<AuthSnapshot>) {
  snap = { ...snap, ...next };
  listeners.forEach((l) => l());
}

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

const toEmail = (username: string) => `${normalizeUsername(username)}@${EMAIL_DOMAIN}`;

export function usernameOf(user: User | null) {
  return user?.email?.endsWith(`@${EMAIL_DOMAIN}`) ? user.email.split("@")[0] : (user?.email ?? "");
}

/** Arranca el seguimiento de la sesión (una sola vez). */
export function initAuth() {
  if (started || typeof window === "undefined") return;
  started = true;
  const supabase = getSupabase();
  if (!supabase) {
    publish({ ready: true, configured: false });
    return;
  }
  publish({ configured: true });
  supabase.auth.getSession().then(({ data }) => {
    publish({ ready: true, user: data.session?.user ?? null });
  });
  supabase.auth.onAuthStateChange((event, session) => {
    publish({ ready: true, user: session?.user ?? null });
    if (event === "SIGNED_IN") void syncNow();
  });
}

export function useAuth() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => snap,
    () => SERVER_SNAPSHOT,
  );
}

const MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Usuario o contraseña incorrectos.",
  "User already registered": "Ese usuario ya existe. Prueba entrar con él.",
  "Email not confirmed": "La cuenta requiere confirmación. Hay que desactivarla en Supabase.",
  "Signup is disabled": "Ya no se pueden crear cuentas nuevas.",
};

function friendly(message: string) {
  if (!navigator.onLine || /fetch|network/i.test(message)) return "Sin conexión. Necesitas internet para entrar.";
  if (/at least 6/i.test(message)) return "La contraseña debe tener al menos 6 caracteres.";
  return MESSAGES[message] ?? "No se pudo completar. Intenta de nuevo.";
}

export async function signIn(username: string, password: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return "Falta configurar Supabase.";
  const { error } = await supabase.auth.signInWithPassword({ email: toEmail(username), password });
  return error ? friendly(error.message) : null;
}

export async function signUp(username: string, password: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return "Falta configurar Supabase.";
  const { data, error } = await supabase.auth.signUp({ email: toEmail(username), password });
  if (error) return friendly(error.message);
  if (!data.session) return "La cuenta se creó, pero Supabase pide confirmar el correo. Hay que desactivarlo.";
  return null;
}

export async function signOut() {
  await getSupabase()?.auth.signOut();
}

/**
 * Salir de la cuenta: primero sube lo pendiente y luego borra los datos de este dispositivo,
 * así la siguiente persona que entre empieza limpia. Devuelve cuántos cambios quedaron sin subir
 * (si hay, no sale salvo que `force` sea true).
 */
export async function logout(force = false): Promise<number> {
  await syncNow();
  const pending = await db.outbox.count();
  if (pending > 0 && !force) return pending;
  await resetLocal();
  await signOut();
  return 0;
}
