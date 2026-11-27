"use client";

import { db, type OwnedItem } from "@/lib/db/db";
import { DEFAULT_PROFILE, PROFILE_ID, updateProfile } from "@/lib/db/profile";
import { upsertRow } from "@/lib/db/repo";
import { dayKey } from "@/lib/game/engine";
import { writeAwards } from "@/lib/game/use-game";
import { MOCHITO_WEAR, WEAR_ITEMS, mochitoWearUnlocked } from "@/lib/game/wardrobe";
import { PET_ITEMS } from "@/lib/game/shop";
import { BIRTHDAY_GIFT, appendLog, giftFor, giftOpened, logLine, mochitoBirthday, nextStreak, type LogEvent } from "@/lib/mochito-life";
import { MISSIONS_REWARD, EMPTY_STATS, FRIENDS, FRIEND_AT, TRICKS, applyCare, earnedMedals, friendsOf, medalEventId, mochitoLevel, walkFind, walkMeet, type CareKind, type Friend, type WalkFind } from "@/lib/mochito-play";

const thingsOf = (home: { bed?: string; bowl?: string; toy?: string } | undefined) => [home?.bed, home?.bowl, home?.toy].filter(Boolean).length;

/** Anota recuerdos en el diario de Mochito. */
export async function mochitoLog(...events: LogEvent[]) {
  if (!events.length) return;
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  let log = p.mochito_log;
  const now = Date.now();
  for (const ev of events) log = appendLog(log, now, logLine(ev));
  await updateProfile({ mochito_log: log });
}

/** Paga las medallas nuevas (los ids son fijos, así que nunca se cobran dos veces). */
async function payMedals() {
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const stats = { ...EMPTY_STATS, ...p.mochito_stats };
  const medals = earnedMedals({ stats, tricks: p.mochito_tricks ?? [], level: mochitoLevel(stats.xp).level, things: thingsOf(p.mochito_home), friends: friendsOf(p.mochito_friends).length });
  if (!medals.length) return [];
  const existing = await db.game_events.toArray();
  const had = new Set(existing.filter((e) => !e.deleted_at).map((e) => e.id));
  const now = Date.now();
  await writeAwards(medals.map((m) => ({ id: medalEventId(m.id), kind: "mochito", label: `Medalla de Mochito: ${m.name}`, xp: 0, coins: m.coins, at: now })), existing);
  return medals.filter((m) => !had.has(medalEventId(m.id))).map((m) => m.name);
}

/** Le da la ropa exclusiva que ya ganó (por nivel o medallas). Devuelve los nombres de lo nuevo. */
export async function unlockMochitoWear() {
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const stats = { ...EMPTY_STATS, ...p.mochito_stats };
  const level = mochitoLevel(stats.xp).level;
  const medals = new Set(earnedMedals({ stats, tricks: p.mochito_tricks ?? [], level, things: thingsOf(p.mochito_home), friends: friendsOf(p.mochito_friends).length }).map((m) => m.id));
  const owned = new Set((await db.owned_items.toArray()).filter((o) => !o.deleted_at).map((o) => o.id));
  const fresh = MOCHITO_WEAR.filter((w) => !owned.has(w.id) && mochitoWearUnlocked(w, level, medals));
  const now = Date.now();
  for (const w of fresh) await upsertRow<OwnedItem>("owned_items", { id: w.id, bought_at: now });
  if (fresh.length) await mochitoLog(...fresh.map((w): LogEvent => ({ kind: "thing", name: `ropa nueva: ${w.name}` })));
  return fresh.map((w) => w.name);
}

/** Lo que haces con Mochito: suma a su nivel, a sus barras y revisa si ganó una medalla. Devuelve el nivel antes y después. */
export async function mochitoDo(kind: CareKind, extra: { trick?: string; friend?: string; game?: string } = {}) {
  const now = Date.now();
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const care = p.mochito_care ?? {};
  const before = mochitoLevel(p.mochito_stats?.xp ?? 0).level;
  const stats = applyCare(p.mochito_stats, kind, now, care.petted);
  const patch: Parameters<typeof updateProfile>[0] = { mochito_stats: stats };
  if (kind === "pet") patch.mochito_care = { ...care, petted: now };
  if (kind === "treat") patch.mochito_care = { ...care, fed: now };
  if (kind === "game") patch.mochito_care = { ...care, played: now };
  if (kind === "walk") patch.mochito_care = { ...care, played: now, muddy: true };
  if (kind === "bath") patch.mochito_care = { ...care, washed: now, muddy: false };
  if (kind === "walk" && extra.friend) patch.mochito_friends = { ...p.mochito_friends, [extra.friend]: (p.mochito_friends?.[extra.friend] ?? 0) + 1 };
  if (kind === "trick" && extra.trick) patch.mochito_tricks = [...new Set([...(p.mochito_tricks ?? []), extra.trick])];
  const friend = extra.friend ? FRIENDS.find((f) => f.id === extra.friend) : undefined;
  const ev: LogEvent | null =
    kind === "pet" ? { kind: "pet" } : kind === "treat" ? { kind: "treat" } : kind === "bath" ? { kind: "bath" } : kind === "photo" ? { kind: "photo" }
    : kind === "game" ? { kind: "game", game: extra.game }
    : kind === "walk" ? { kind: "walk", friend: friend?.name, newFriend: !!friend && (p.mochito_friends?.[friend.id] ?? 0) + 1 === FRIEND_AT }
    : kind === "trick" && extra.trick ? { kind: "trick", name: TRICKS.find((t) => t.id === extra.trick)?.name ?? extra.trick } : null;
  if (ev) patch.mochito_log = appendLog(p.mochito_log, now, logLine(ev));
  await updateProfile(patch);
  const medals = await payMedals();
  const after = mochitoLevel(stats.xp).level;
  await mochitoLog(...medals.map((name): LogEvent => ({ kind: "medal", name })), ...(after > before ? [{ kind: "level", level: after } as LogEvent] : []));
  const wear = await unlockMochitoWear();
  return { before, after, medals, wear };
}

/** El paseo del día: una vez al día, encuentra algo, a veces un amiguito, y regresa con lodo. */
export async function mochitoWalk(): Promise<WalkFind & { medals: string[]; levelUp: number; friend: Friend | null; met: number }> {
  const now = Date.now();
  const owned = new Set((await db.owned_items.toArray()).filter((o) => !o.deleted_at).map((o) => o.id));
  const cheap = WEAR_ITEMS.filter((w) => !w.event && w.price > 0 && w.price <= 40 && !owned.has(w.id)).map((w) => ({ id: w.id, name: w.name }));
  const find = walkFind(now, cheap);
  const day = dayKey(now);
  if (find.kind === "coins") {
    await writeAwards([{ id: `mochito-paseo:${day}`, kind: "mochito", label: "Paseo con Mochito", xp: 0, coins: find.coins, at: now }], await db.game_events.toArray());
  }
  if (find.kind === "wear") await upsertRow<OwnedItem>("owned_items", { id: find.itemId, bought_at: now });
  const friend = walkMeet(now);
  const r = await mochitoDo("walk", { friend: friend?.id });
  const p = await db.profile.get(PROFILE_ID);
  const met = friend ? (p?.mochito_friends?.[friend.id] ?? 0) : 0;
  return { ...find, medals: r.medals, levelUp: r.after > r.before ? r.after : 0, friend, met };
}

/** Guarda una foto de Mochito en este dispositivo. */
export async function saveMochitoPhoto(data: string, scene: string) {
  const now = Date.now();
  await db.mochito_photos.put({ id: `foto-${now}`, at: now, data, scene });
  return mochitoDo("photo");
}
export const deleteMochitoPhoto = (id: string) => db.mochito_photos.delete(id);

export { FRIEND_AT };

/** Pone (o quita) una de sus cosas: cama, platito o juguete. */
export async function setMochitoThing(slot: "bed" | "bowl" | "toy", id: string | undefined) {
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const item = id ? PET_ITEMS.find((i) => i.id === id) : undefined;
  await updateProfile({ mochito_home: { ...p.mochito_home, [slot]: id }, ...(item ? { mochito_log: appendLog(p.mochito_log, Date.now(), logLine({ kind: "thing", name: item.name })) } : {}) });
  const medals = await payMedals();
  await mochitoLog(...medals.map((name): LogEvent => ({ kind: "medal", name })));
  return medals;
}

/** Abre el regalo del día: monedas según la racha (con bonos a los 7 y 30 días). */
export async function openDailyGift() {
  const now = Date.now();
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  if (giftOpened(p.mochito_gift, now)) return null;
  const streak = nextStreak(p.mochito_gift, now);
  const gift = giftFor(streak);
  const day = dayKey(now);
  await updateProfile({ mochito_gift: { day, streak }, mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "gift", coins: gift.coins })) });
  await writeAwards([{ id: `mochito-regalo:${day}`, kind: "mochito", label: `Regalo de Mochito (racha de ${streak})`, xp: 0, coins: gift.coins, at: now }], await db.game_events.toArray());
  return { ...gift, streak };
}

/** Si hoy es su cumpleaños, da su regalo una sola vez al año. */
export async function claimBirthday() {
  const now = Date.now();
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const b = mochitoBirthday(p.mochito_stats?.days, now);
  if (!b?.isToday) return null;
  const id = `mochito-cumple:${new Date(now).getFullYear()}`;
  if (await db.game_events.get(id)) return null;
  await writeAwards([{ id, kind: "mochito", label: `Cumpleaños de Mochito (${b.age} ${b.age === 1 ? "año" : "años"})`, xp: BIRTHDAY_GIFT.xp, coins: BIRTHDAY_GIFT.coins, at: now }], await db.game_events.toArray());
  await mochitoLog({ kind: "birthday", age: b.age });
  return b.age;
}

/** Marca que ya te dio los buenos días hoy. */
export const markGreeted = () => updateProfile({ mochito_greet: dayKey(Date.now()) });

export const missionsEventId = (now: number) => `mochito-misiones:${dayKey(now)}`;

/** Cobra el premio de las misiones del día (una vez al día). */
export async function claimMissions() {
  const now = Date.now();
  const id = missionsEventId(now);
  if (await db.game_events.get(id)) return false;
  await writeAwards([{ id, kind: "mochito", label: "Misiones del día con Mochito", xp: MISSIONS_REWARD.xp, coins: MISSIONS_REWARD.coins, at: now }], await db.game_events.toArray());
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const stats = { ...EMPTY_STATS, ...p.mochito_stats };
  await updateProfile({ mochito_stats: { ...stats, xp: stats.xp + MISSIONS_REWARD.dogXp }, mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "missions" })) });
  await unlockMochitoWear();
  return true;
}
