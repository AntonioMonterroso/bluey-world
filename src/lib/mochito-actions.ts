"use client";

import { db, type OwnedItem } from "@/lib/db/db";
import { DEFAULT_PROFILE, PROFILE_ID, updateProfile } from "@/lib/db/profile";
import { upsertRow } from "@/lib/db/repo";
import { dayKey } from "@/lib/game/engine";
import { writeAwards } from "@/lib/game/use-game";
import { WEAR_ITEMS } from "@/lib/game/wardrobe";
import { EMPTY_STATS, applyCare, earnedMedals, medalEventId, mochitoLevel, walkFind, type CareKind, type WalkFind } from "@/lib/mochito-play";

const thingsOf = (home: { bed?: string; bowl?: string; toy?: string } | undefined) => [home?.bed, home?.bowl, home?.toy].filter(Boolean).length;

/** Paga las medallas nuevas (los ids son fijos, así que nunca se cobran dos veces). */
async function payMedals() {
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const stats = { ...EMPTY_STATS, ...p.mochito_stats };
  const medals = earnedMedals({ stats, tricks: p.mochito_tricks ?? [], level: mochitoLevel(stats.xp).level, things: thingsOf(p.mochito_home) });
  if (!medals.length) return [];
  const existing = await db.game_events.toArray();
  const had = new Set(existing.filter((e) => !e.deleted_at).map((e) => e.id));
  const now = Date.now();
  await writeAwards(medals.map((m) => ({ id: medalEventId(m.id), kind: "mochito", label: `Medalla de Mochito: ${m.name}`, xp: 0, coins: m.coins, at: now })), existing);
  return medals.filter((m) => !had.has(medalEventId(m.id))).map((m) => m.name);
}

/** Lo que haces con Mochito: suma a su nivel, a sus barras y revisa si ganó una medalla. Devuelve el nivel antes y después. */
export async function mochitoDo(kind: CareKind, extra: { trick?: string } = {}) {
  const now = Date.now();
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const care = p.mochito_care ?? {};
  const before = mochitoLevel(p.mochito_stats?.xp ?? 0).level;
  const stats = applyCare(p.mochito_stats, kind, now, care.petted);
  const patch: Parameters<typeof updateProfile>[0] = { mochito_stats: stats };
  if (kind === "pet") patch.mochito_care = { ...care, petted: now };
  if (kind === "treat") patch.mochito_care = { ...care, fed: now };
  if (kind === "game" || kind === "walk") patch.mochito_care = { ...care, played: now };
  if (kind === "trick" && extra.trick) patch.mochito_tricks = [...new Set([...(p.mochito_tricks ?? []), extra.trick])];
  await updateProfile(patch);
  const medals = await payMedals();
  return { before, after: mochitoLevel(stats.xp).level, medals };
}

/** El paseo del día: una vez al día, encuentra algo y queda feliz. */
export async function mochitoWalk(): Promise<WalkFind & { medals: string[]; levelUp: number }> {
  const now = Date.now();
  const owned = new Set((await db.owned_items.toArray()).filter((o) => !o.deleted_at).map((o) => o.id));
  const cheap = WEAR_ITEMS.filter((w) => !w.event && w.price > 0 && w.price <= 40 && !owned.has(w.id)).map((w) => ({ id: w.id, name: w.name }));
  const find = walkFind(now, cheap);
  const day = dayKey(now);
  if (find.kind === "coins") {
    await writeAwards([{ id: `mochito-paseo:${day}`, kind: "mochito", label: "Paseo con Mochito", xp: 0, coins: find.coins, at: now }], await db.game_events.toArray());
  }
  if (find.kind === "wear") await upsertRow<OwnedItem>("owned_items", { id: find.itemId, bought_at: now });
  const r = await mochitoDo("walk");
  return { ...find, medals: r.medals, levelUp: r.after > r.before ? r.after : 0 };
}

/** Pone (o quita) una de sus cosas: cama, platito o juguete. */
export async function setMochitoThing(slot: "bed" | "bowl" | "toy", id: string | undefined) {
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  await updateProfile({ mochito_home: { ...p.mochito_home, [slot]: id } });
  return payMedals();
}
