"use client";

import { db, type OwnedItem } from "@/lib/db/db";
import { DEFAULT_PROFILE, PROFILE_ID, updateProfile } from "@/lib/db/profile";
import { upsertRow } from "@/lib/db/repo";
import { dayKey } from "@/lib/game/engine";
import { pushToast, writeAwards } from "@/lib/game/use-game";
import { STICKER_CHANCE, pickSticker, stickerCount, type Sticker } from "@/lib/mochito-stickers";
import { HARVEST_COINS, PARTY_COINS, PLACES, PLOTS, SEEDS, TRIP_COINS, partyId, plant, tripKey, waterPlot, type Groom, type Place, type Plot, type Seed } from "@/lib/mochito-extra";
import { RIBBONS, WEATHER, weatherOf, type Ribbon, type Story, type Weather } from "@/lib/mochito-more";
import { MOCHITO_WEAR, WEAR_ITEMS, mochitoWearUnlocked } from "@/lib/game/wardrobe";
import { PET_ITEMS } from "@/lib/game/shop";
import { BIRTHDAY_GIFT, appendLog, giftFor, giftOpened, logLine, mochitoBirthday, nextStreak, type LogEvent } from "@/lib/mochito-life";
import { type MedalInput, MISSIONS_REWARD, EMPTY_STATS, FRIENDS, FRIEND_AT, TRICKS, applyCare, earnedMedals, friendsOf, medalEventId, mochitoLevel, walkFind, walkMeet, type CareKind, type Friend, type WalkFind } from "@/lib/mochito-play";

const thingsOf = (home: { bed?: string; bowl?: string; toy?: string } | undefined) => [home?.bed, home?.bowl, home?.toy].filter(Boolean).length;

/** Lo que cuentan las medallas, sacado del perfil. */
export function medalInputOf(p: Partial<typeof DEFAULT_PROFILE>): MedalInput {
  const stats = { ...EMPTY_STATS, ...p.mochito_stats };
  return {
    stats, tricks: p.mochito_tricks ?? [], level: mochitoLevel(stats.xp).level, things: thingsOf(p.mochito_home),
    friends: friendsOf(p.mochito_friends).length, stickers: stickerCount(p.mochito_stickers),
    weathers: new Set(p.mochito_weathers ?? []).size, storiesRead: new Set(p.mochito_stories ?? []).size, blue: p.mochito_ribbons?.azul ?? 0,
    harvests: Object.values(p.mochito_harvest ?? {}).reduce((a, n) => a + n, 0), seedKinds: Object.values(p.mochito_harvest ?? {}).filter((n) => n > 0).length,
    places: Object.values(p.mochito_trips?.places ?? {}).filter((n) => n > 0).length,
  };
}

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
  const medals = earnedMedals(medalInputOf(p));
  if (!medals.length) return [];
  const existing = await db.game_events.toArray();
  const had = new Set(existing.filter((e) => !e.deleted_at).map((e) => e.id));
  const now = Date.now();
  await writeAwards(medals.map((m) => ({ id: medalEventId(m.id), kind: "mochito", label: `Medalla de Mochito: ${m.name}`, xp: 0, coins: m.coins, at: now })), existing);
  return medals.filter((m) => !had.has(medalEventId(m.id))).map((m) => m.name);
}

/** A veces gana una pegatina (según lo que hicieron). Avisa con un mensajito y la anota en su diario. */
export async function maybeSticker(kind: string, force = false): Promise<Sticker | null> {
  const chance = STICKER_CHANCE[kind] ?? 0;
  if (!force && Math.random() >= chance) return null;
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const st = pickSticker(Math.random, p.mochito_stickers);
  const had = p.mochito_stickers?.[st.id] ?? 0;
  await updateProfile({ mochito_stickers: { ...p.mochito_stickers, [st.id]: had + 1 }, mochito_log: appendLog(p.mochito_log, Date.now(), logLine({ kind: "sticker", name: st.name })) });
  pushToast({ title: had ? "Pegatina repetida" : "¡Pegatina nueva!", lines: [`${st.name}${had ? ` (ya tienes ${had + 1})` : ""}`], levelUp: false });
  return st;
}

/** Le da la ropa exclusiva que ya ganó (por nivel o medallas). Devuelve los nombres de lo nuevo. */
export async function unlockMochitoWear() {
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const input = medalInputOf(p);
  const level = input.level;
  const medals = new Set(earnedMedals(input).map((m) => m.id));
  const owned = new Set((await db.owned_items.toArray()).filter((o) => !o.deleted_at).map((o) => o.id));
  const fresh = MOCHITO_WEAR.filter((w) => !owned.has(w.id) && mochitoWearUnlocked(w, level, medals));
  const now = Date.now();
  for (const w of fresh) await upsertRow<OwnedItem>("owned_items", { id: w.id, bought_at: now });
  if (fresh.length) await mochitoLog(...fresh.map((w): LogEvent => ({ kind: "thing", name: `ropa nueva: ${w.name}` })));
  return fresh.map((w) => w.name);
}

/** Lo que haces con Mochito: suma a su nivel, a sus barras y revisa si ganó una medalla. Devuelve el nivel antes y después. */
export async function mochitoDo(kind: CareKind, extra: { trick?: string; friend?: string; game?: string; weather?: string; ailment?: string; story?: Story; show?: { ribbon: Ribbon; total: number; week: string } } = {}) {
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
  if (kind === "vet") patch.mochito_care = { ...care, vet: now };
  if (kind === "walk" && extra.weather) patch.mochito_weathers = [...new Set([...(p.mochito_weathers ?? []), extra.weather])];
  if (kind === "story" && extra.story) patch.mochito_stories = [...new Set([...(p.mochito_stories ?? []), extra.story.id])];
  if (kind === "show" && extra.show) {
    patch.mochito_show = { week: extra.show.week, ribbon: extra.show.ribbon, total: extra.show.total };
    patch.mochito_ribbons = { ...p.mochito_ribbons, [extra.show.ribbon]: (p.mochito_ribbons?.[extra.show.ribbon] ?? 0) + 1 };
  }
  if (kind === "walk" && extra.friend) patch.mochito_friends = { ...p.mochito_friends, [extra.friend]: (p.mochito_friends?.[extra.friend] ?? 0) + 1 };
  if (kind === "trick" && extra.trick) patch.mochito_tricks = [...new Set([...(p.mochito_tricks ?? []), extra.trick])];
  const friend = extra.friend ? FRIENDS.find((f) => f.id === extra.friend) : undefined;
  const ev: LogEvent | null =
    kind === "pet" ? { kind: "pet" } : kind === "treat" ? { kind: "treat" } : kind === "bath" ? { kind: "bath" } : kind === "photo" ? { kind: "photo" }
    : kind === "game" ? { kind: "game", game: extra.game }
    : kind === "walk" ? { kind: "walk", friend: friend?.name, newFriend: !!friend && (p.mochito_friends?.[friend.id] ?? 0) + 1 === FRIEND_AT, weather: extra.weather ? WEATHER[extra.weather as Weather]?.walk : undefined }
    : kind === "vet" ? { kind: "vet", ailment: extra.ailment }
    : kind === "story" && extra.story ? { kind: "story", title: extra.story.title }
    : kind === "show" && extra.show ? { kind: "show", ribbon: RIBBONS[extra.show.ribbon].name, place: RIBBONS[extra.show.ribbon].place }
    : kind === "trick" && extra.trick ? { kind: "trick", name: TRICKS.find((t) => t.id === extra.trick)?.name ?? extra.trick } : null;
  if (ev) patch.mochito_log = appendLog(p.mochito_log, now, logLine(ev));
  await updateProfile(patch);
  const medals = await payMedals();
  const after = mochitoLevel(stats.xp).level;
  await mochitoLog(...medals.map((name): LogEvent => ({ kind: "medal", name })), ...(after > before ? [{ kind: "level", level: after } as LogEvent] : []));
  const sticker = await maybeSticker(kind);
  const more = sticker ? await payMedals() : [];
  const wear = await unlockMochitoWear();
  return { before, after, medals: [...medals, ...more], wear, sticker };
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
  const r = await mochitoDo("walk", { friend: friend?.id, weather: weatherOf(now) });
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
  await maybeSticker("missions");
  await payMedals();
  await unlockMochitoWear();
  return true;
}

/** Se curó (o pasó su chequeo) con la doctora Pimienta. Siempre gana una pegatina. */
export const mochitoVet = (ailment?: string) => mochitoDo("vet", { ailment });

/** Le leíste un cuento y se durmió. */
export const readStory = (story: Story) => mochitoDo("story", { story });

/** El concurso de la semana: una vez por semana da su listón y sus monedas. */
export async function enterShow(week: string, ribbon: Ribbon, total: number) {
  const id = `mochito-concurso:${week}`;
  if (await db.game_events.get(id)) return null;
  const now = Date.now();
  await writeAwards([{ id, kind: "mochito", label: `Concurso de perritos: ${RIBBONS[ribbon].name}`, xp: 0, coins: RIBBONS[ribbon].coins, at: now }], await db.game_events.toArray());
  return mochitoDo("show", { show: { week, ribbon, total } });
}

/** Guarda un dibujo pintado en su álbum de fotos. */
export async function savePainting(data: string) {
  const now = Date.now();
  await db.mochito_photos.put({ id: `pintura-${now}`, at: now, data, scene: "pintura" });
  await mochitoLog({ kind: "painting" });
}

// ── Jardín ──────────────────────────────────────────────────────────

const gardenOf = (g: (Plot | null)[] | undefined) => Array.from({ length: PLOTS }, (_, i) => g?.[i] ?? null);

/** Siembra una semilla en una parcela vacía. */
export async function plantSeed(i: number, seed: Seed) {
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const garden = gardenOf(p.mochito_garden);
  if (garden[i]) return;
  garden[i] = plant(seed, Date.now());
  await updateProfile({ mochito_garden: garden });
}

/** Riega una parcela (cuenta una vez al día). */
export async function waterSeed(i: number) {
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const garden = gardenOf(p.mochito_garden);
  const plot = garden[i];
  if (!plot) return;
  garden[i] = waterPlot(plot, Date.now());
  await updateProfile({ mochito_garden: garden });
}

/** Cosecha lo que ya creció: va a la canasta y da unas monedas. */
export async function harvestSeed(i: number) {
  const now = Date.now();
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const garden = gardenOf(p.mochito_garden);
  const plot = garden[i];
  if (!plot) return null;
  garden[i] = null;
  const seed = plot.seed;
  await updateProfile({
    mochito_garden: garden,
    mochito_basket: { ...p.mochito_basket, [seed]: (p.mochito_basket?.[seed] ?? 0) + 1 },
    mochito_harvest: { ...p.mochito_harvest, [seed]: (p.mochito_harvest?.[seed] ?? 0) + 1 },
    mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "harvest", what: SEEDS[seed].one })),
  });
  await writeAwards([{ id: `mochito-cosecha:${dayKey(now)}:${i}:${plot.planted}`, kind: "mochito", label: `Cosecha del jardín: ${SEEDS[seed].name.toLowerCase()}`, xp: 0, coins: HARVEST_COINS, at: now }], await db.game_events.toArray());
  return mochitoDo("garden");
}

/** Usa algo de la canasta: la comida se la come Mochito; las flores se las regalas a un amigo (o a él). */
export async function spendBasket(seed: Seed, friendId?: string) {
  const now = Date.now();
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const have = p.mochito_basket?.[seed] ?? 0;
  if (have <= 0) return null;
  const friend = friendId ? FRIENDS.find((f) => f.id === friendId) : undefined;
  await updateProfile({
    mochito_basket: { ...p.mochito_basket, [seed]: have - 1 },
    ...(friend ? { mochito_friends: { ...p.mochito_friends, [friend.id]: (p.mochito_friends?.[friend.id] ?? 0) + 1 } } : {}),
    mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "gave", what: SEEDS[seed].one, to: friend?.name })),
  });
  return mochitoDo(SEEDS[seed].kind === "comida" ? "treat" : "pet");
}

// ── Peluquería ──────────────────────────────────────────────────────

/** Termina en la peluquería: el peinado le dura unos días. */
export async function saveGroom(g: Groom, styleName: string) {
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  await updateProfile({ mochito_groom: g, mochito_log: appendLog(p.mochito_log, Date.now(), logLine({ kind: "groom", style: styleName })) });
  return mochitoDo("groom");
}

// ── Viajes ──────────────────────────────────────────────────────────

/** El viaje del fin de semana: una vez por fin de semana, trae un recuerdo y unas monedas. */
export async function takeTrip(place: Place) {
  const now = Date.now();
  const key = tripKey(now);
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  if (p.mochito_trips?.last === key) return null;
  const info = PLACES[place];
  const places = { ...p.mochito_trips?.places, [place]: (p.mochito_trips?.places?.[place] ?? 0) + 1 };
  await updateProfile({ mochito_trips: { last: key, places }, mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "trip", place: info.to, souvenir: info.souvenir })) });
  await writeAwards([{ id: `mochito-viaje:${key}`, kind: "mochito", label: `Viaje con Mochito ${info.to}`, xp: 0, coins: TRIP_COINS, at: now }], await db.game_events.toArray());
  return mochitoDo("trip");
}

// ── Fiesta ──────────────────────────────────────────────────────────

/** Su fiesta (una por día de fiesta): monedas, una pegatina y, si hay, una prenda nueva. */
export async function throwParty(what: string, friends: string[]) {
  const now = Date.now();
  const id = partyId(now);
  if (await db.game_events.get(id)) return null;
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const owned = new Set((await db.owned_items.toArray()).filter((o) => !o.deleted_at).map((o) => o.id));
  const cheap = WEAR_ITEMS.filter((w) => !w.event && w.price > 0 && w.price <= 60 && !owned.has(w.id));
  const wear = cheap.length ? cheap[Math.floor(Math.random() * cheap.length)] : null;
  if (wear) await upsertRow<OwnedItem>("owned_items", { id: wear.id, bought_at: now });
  await updateProfile({ mochito_parties: [...(p.mochito_parties ?? []), dayKey(now)].slice(-60), mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "party", what, friends })) });
  await writeAwards([{ id, kind: "mochito", label: `Fiesta de Mochito (${what})`, xp: 0, coins: PARTY_COINS + (wear ? 0 : 10), at: now }], await db.game_events.toArray());
  const r = await mochitoDo("party");
  return { ...r, wear: wear?.name ?? null, coins: PARTY_COINS + (wear ? 0 : 10) };
}
