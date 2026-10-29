"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Profile } from "./db";
import { upsertRow } from "./repo";
import { DEFAULT_CHARACTER } from "@/lib/characters";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/themes";

export const PROFILE_ID = "me";

export const DEFAULT_PROFILE: Omit<Profile, "updated_at"> = {
  id: PROFILE_ID,
  name: "",
  character: DEFAULT_CHARACTER,
  theme: DEFAULT_THEME,
  sound: "campana",
};

const NONE = Symbol("none");

/** `ready` es false mientras se lee la base local (evita parpadeos). */
export function useProfile() {
  const row = useLiveQuery(async () => (await db.profile.get(PROFILE_ID)) ?? NONE, []);
  const profile = row && row !== NONE ? (row as Profile) : null;
  return {
    ready: row !== undefined,
    profile: { ...DEFAULT_PROFILE, ...profile } as Profile,
  };
}

export async function updateProfile(patch: Partial<Omit<Profile, "id" | "updated_at">>) {
  const current = (await db.profile.get(PROFILE_ID)) ?? DEFAULT_PROFILE;
  await upsertRow<Profile>("profile", { ...current, ...patch, id: PROFILE_ID });
}

/** Primera vez: trae lo que ya había en localStorage (de antes de la base local). */
export async function ensureProfile() {
  if (await db.profile.get(PROFILE_ID)) return;
  let name = "";
  let character: string = DEFAULT_CHARACTER;
  let theme: string = DEFAULT_THEME;
  try {
    name = localStorage.getItem("bw-name") ?? "";
    character = localStorage.getItem("bw-character") ?? character;
    theme = localStorage.getItem(THEME_STORAGE_KEY) ?? theme;
  } catch {}
  // Solo se guarda si había algo personalizado; así un dispositivo nuevo no pisa el perfil de la nube.
  if (!name && character === DEFAULT_CHARACTER && theme === DEFAULT_THEME) return;
  await upsertRow<Profile>("profile", { id: PROFILE_ID, name, character, theme });
}
