"use client";

import { db, type OwnedItem } from "@/lib/db/db";
import { DEFAULT_PROFILE, PROFILE_ID, updateProfile } from "@/lib/db/profile";
import { upsertRow } from "@/lib/db/repo";
import { dayKey } from "@/lib/game/engine";
import { pushToast, writeAwards } from "@/lib/game/use-game";
import { STICKER_CHANCE, pickSticker, stickerCount, type Sticker } from "@/lib/mochito-stickers";
import { HARVEST_COINS, PARTY_COINS, PLACES, PLOTS, SEEDS, TRIP_COINS, partyId, plant, tripKey, waterPlot, type Groom, type Place, type Plot, type Seed } from "@/lib/mochito-extra";
import {
  BAKE_COINS, CLASS_COINS, CLASSES_PER_COURSE, COURSES, DIPLOMA_COINS, NEIGHBORS, PET_RECIPES, STREET_COINS, TREASURES, courseClasses, diplomas, roomBuyId, roomCozy, roomItem,
  type CourseId, type RoomSlot, type Treasure, type Treat,
} from "@/lib/mochito-extra-2";
import type { GameEvent } from "@/lib/db/db";
import { CHORES, CHORES_ALL_COINS, CHORE_COIN, SHELLS, SLEEP_COINS, SLEEP_HEARTS, beachCoins, choresOf, kiteCoins, type ChoreId, type Shell } from "@/lib/mochito-extra-6";
import { DAYCARE_COINS, DAYCARE_PERFECT, PLAY_COINS, TOYS, WORKSHOP_COINS, type Toy } from "@/lib/mochito-extra-5";
import {
  BDAY_COINS, BDAY_FAV_COINS, FAIR_COINS, FRIEND_BDAYS, GIFTS, TEETH_COINS, TEETH_STREAK, TEETH_STREAK_COINS, TREE_DONE_COINS, TREE_PARTS, TREE_PART_COINS,
  addMats, canBuild, fairKey, gatherOf, teethNext, type Gift, type TreePart,
} from "@/lib/mochito-extra-4";
import { CAMP_COINS, CONSTELLATIONS, LETTER_COINS, PETS, STAND_COIN_PER, buddyName, campKey, type Constellation, type PetKind } from "@/lib/mochito-extra-3";
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
    cozy: roomCozy(p.mochito_room), treasures: Object.values(p.mochito_treasures ?? {}).filter((n) => n > 0).length,
    diplomas: diplomas(p.mochito_school), bakedKinds: Object.values(p.mochito_baked ?? {}).filter((n) => n > 0).length,
    recycled: p.mochito_clean?.total ?? 0, toyKinds: Object.values(p.mochito_workshop?.fixed ?? {}).filter((n) => n > 0).length, perfectDaycare: (p.mochito_daycare?.perfect ?? 0) > 0,
    kiteBest: p.mochito_kite?.best ?? 0, shellKinds: Object.values(p.mochito_beach?.shells ?? {}).filter((n) => (n ?? 0) > 0).length,
    sleepFriends: Object.keys(p.mochito_sleep?.friends ?? {}).length, choreStars: p.mochito_chores?.stars ?? 0,
    teethBest: p.mochito_teeth?.best ?? 0, treeParts: (p.mochito_tree?.built ?? []).length, bigPrizes: p.mochito_fair?.big ?? 0, fbdayFriends: Object.keys(p.mochito_fbdays ?? {}).length,
    buddyHearts: p.mochito_buddy?.hearts ?? 0, stars: new Set(p.mochito_camp?.stars ?? []).size, perfectStand: (p.mochito_stand?.perfect ?? 0) > 0,
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

// ── Su cuarto ───────────────────────────────────────────────────────

/** Pone algo en un rincón de su cuarto. Si no lo tiene, lo compra con monedas (una sola vez). */
export async function setRoomItem(slot: RoomSlot, id: string): Promise<string | null> {
  const item = roomItem(slot, id);
  const events = (await db.game_events.toArray()).filter((e) => !e.deleted_at);
  const owned = item.price === 0 || events.some((e) => e.id === roomBuyId(slot, id));
  if (!owned) {
    const coins = events.reduce((a, e) => a + e.coins, 0);
    if (coins < item.price) return `Te faltan ${item.price - coins} monedas.`;
    await upsertRow<GameEvent>("game_events", { id: roomBuyId(slot, id), kind: "buy", label: `Para el cuarto de Mochito: ${item.name}`, xp: 0, coins: -item.price, at: Date.now() });
  }
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  await updateProfile({ mochito_room: { ...p.mochito_room, [slot]: id }, ...(!owned ? { mochito_log: appendLog(p.mochito_log, Date.now(), logLine({ kind: "thing", name: `para mi cuarto: ${item.name}` })) } : {}) });
  const medals = await payMedals();
  await mochitoLog(...medals.map((name): LogEvent => ({ kind: "medal", name })));
  return null;
}

// ── Paseo por la colonia ────────────────────────────────────────────

/** Termina el paseo con correa (una vez al día): guarda los tesoros y da unas monedas. */
export async function finishStreet(found: Treasure[], neighbors: string[], cookies: number) {
  const now = Date.now();
  const day = dayKey(now);
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  if (p.mochito_street === day) return null;
  const treasures = { ...p.mochito_treasures };
  for (const t of found) treasures[t] = (treasures[t] ?? 0) + 1;
  const first = found[0] ? TREASURES.find((t) => t.id === found[0])?.name : undefined;
  const who = neighbors[0] ? NEIGHBORS[neighbors[0]]?.name : undefined;
  await updateProfile({ mochito_street: day, mochito_treasures: treasures, mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "street", treasure: first, neighbor: who })) });
  await writeAwards([{ id: `mochito-colonia:${day}`, kind: "mochito", label: "Paseo con correa por la colonia", xp: 0, coins: STREET_COINS, at: now }], await db.game_events.toArray());
  for (let k = 0; k < Math.min(cookies, 2); k++) await mochitoDo("treat");
  return mochitoDo("street");
}

// ── Escuela de perritos ─────────────────────────────────────────────

/** Aprobó una clase (una por día). Con tres clases del curso gana su diploma. */
export async function passClass(course: CourseId) {
  const now = Date.now();
  const day = dayKey(now);
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const school = p.mochito_school ?? {};
  if (school.last === day) return null;
  const n = courseClasses(school, course) + 1;
  const diploma = n >= CLASSES_PER_COURSE;
  const name = COURSES.find((c) => c.id === course)!.name;
  await updateProfile({ mochito_school: { last: day, done: { ...school.done, [course]: n } }, mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "school", course: name, diploma })) });
  const awards = [{ id: `mochito-clase:${day}`, kind: "mochito", label: `Escuela de perritos: ${name}`, xp: 0, coins: CLASS_COINS, at: now }];
  if (diploma) awards.push({ id: `mochito-diploma:${course}`, kind: "mochito", label: `Diploma de Mochito: ${name}`, xp: 0, coins: DIPLOMA_COINS, at: now });
  await writeAwards(awards, await db.game_events.toArray());
  const r = await mochitoDo("school");
  return { ...r, diploma, classNo: n };
}

// ── Cocina de premios ───────────────────────────────────────────────

/** Salió una tanda del horno: va al frasco. La primera tanda del día da unas monedas. */
export async function finishBake(t: Treat, count: number) {
  const now = Date.now();
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  await updateProfile({
    mochito_jar: { ...p.mochito_jar, [t]: (p.mochito_jar?.[t] ?? 0) + count },
    mochito_baked: { ...p.mochito_baked, [t]: (p.mochito_baked?.[t] ?? 0) + 1 },
    mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "bake", recipe: PET_RECIPES[t].name, count })),
  });
  await writeAwards([{ id: `mochito-horneado:${dayKey(now)}`, kind: "mochito", label: "Premios horneados para Mochito", xp: 0, coins: BAKE_COINS, at: now }], await db.game_events.toArray());
  return mochitoDo("bake");
}

/** Saca un premio del frasco: para Mochito o para un amigo del parque. */
export async function spendJar(t: Treat, friendId?: string) {
  const now = Date.now();
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const have = p.mochito_jar?.[t] ?? 0;
  if (have <= 0) return null;
  const friend = friendId ? FRIENDS.find((f) => f.id === friendId) : undefined;
  const what = `una ${PET_RECIPES[t].name.toLowerCase().replace(/^galletas/, "galleta").replace(/^bocaditos/, "bocadito")}`.replace("una bocadito", "un bocadito");
  await updateProfile({
    mochito_jar: { ...p.mochito_jar, [t]: have - 1 },
    ...(friend ? { mochito_friends: { ...p.mochito_friends, [friend.id]: (p.mochito_friends?.[friend.id] ?? 0) + 1 }, mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "gave", what, to: friend.name })) } : {}),
  });
  return mochitoDo(friend ? "pet" : "treat");
}

// ── Su mascota ──────────────────────────────────────────────────────

/** Adopta su mascota (una sola). */
export async function adoptBuddy(kind: PetKind, name: string) {
  const now = Date.now();
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  if (p.mochito_buddy) return null;
  const n = buddyName(name) || PETS[kind].name;
  await updateProfile({ mochito_buddy: { kind, name: n, since: dayKey(now), hearts: 0 }, mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "buddy", name: n, what: `un ${PETS[kind].name.toLowerCase()}`.replace("un tortuguita", "una tortuguita") })) });
  return mochitoDo("buddy");
}

/** Le da de comer o juegan con ella: cada cosa una vez al día suma un corazón. */
export async function buddyCare(what: "fed" | "played") {
  const now = Date.now();
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const b = p.mochito_buddy;
  const d = dayKey(now);
  if (!b || b[what] === d) return null;
  await updateProfile({ mochito_buddy: { ...b, [what]: d, hearts: b.hearts + 1 } });
  return mochitoDo("buddy");
}

// ── Cartas ──────────────────────────────────────────────────────────

/** Contesta la carta del día: el amigo queda más cerca y da unas monedas (una vez por carta). */
export async function replyLetter(id: string, from: string, letter: number, reply: number) {
  const now = Date.now();
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  if (p.mochito_mail?.[id]?.reply !== undefined) return null;
  const friend = FRIENDS.find((f) => f.id === from);
  const mail = { ...p.mochito_mail, [id]: { from, letter, reply } };
  const keep = Object.fromEntries(Object.entries(mail).sort(([a], [b]) => a.localeCompare(b)).slice(-40));
  await updateProfile({
    mochito_mail: keep,
    mochito_friends: { ...p.mochito_friends, [from]: (p.mochito_friends?.[from] ?? 0) + 1 },
    mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "letter", from: friend?.name ?? from })),
  });
  await writeAwards([{ id: `mochito-carta:${id}`, kind: "mochito", label: `Carta de ${friend?.name ?? from}`, xp: 0, coins: LETTER_COINS, at: now }], await db.game_events.toArray());
  return mochitoDo("letter");
}

// ── Campamento ──────────────────────────────────────────────────────

/** Terminó el campamento de la semana: guarda la constelación descubierta. */
export async function finishCamp(stars: Constellation) {
  const now = Date.now();
  const key = campKey(now);
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  if (p.mochito_camp?.last === key) return null;
  const name = CONSTELLATIONS.find((c) => c.id === stars)!.name;
  await updateProfile({ mochito_camp: { last: key, stars: [...new Set([...(p.mochito_camp?.stars ?? []), stars])] }, mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "camp", stars: name })) });
  await writeAwards([{ id: `mochito-campamento:${key}`, kind: "mochito", label: "Campamento con Mochito", xp: 0, coins: CAMP_COINS, at: now }], await db.game_events.toArray());
  return mochitoDo("camp");
}

// ── Puesto de limonada ──────────────────────────────────────────────

/** Cierra el puesto del día: cobra por cada pedido bien servido. */
export async function finishStand(ok: number, total: number) {
  const now = Date.now();
  const d = dayKey(now);
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  if (p.mochito_stand?.last === d) return null;
  await updateProfile({ mochito_stand: { last: d, perfect: (p.mochito_stand?.perfect ?? 0) + (ok === total ? 1 : 0) }, mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "stand", ok, total })) });
  if (ok > 0) await writeAwards([{ id: `mochito-limonada:${d}`, kind: "mochito", label: "Puesto de limonada de Mochito", xp: 0, coins: ok * STAND_COIN_PER, at: now }], await db.game_events.toArray());
  return mochitoDo("stand");
}

// ── Dientes ─────────────────────────────────────────────────────────

/** Le cepillaste los dientes (cuenta una vez al día). Cada 7 días seguidos, la doctora lo felicita con un premio. */
export async function brushTeeth() {
  const now = Date.now();
  const d = dayKey(now);
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  if (p.mochito_teeth?.last === d) return null;
  const t = teethNext(p.mochito_teeth, now);
  await updateProfile({ mochito_teeth: t, mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "teeth", streak: t.streak ?? 1 })) });
  const awards = [{ id: `mochito-dientes:${d}`, kind: "mochito", label: "Le cepillaste los dientes a Mochito", xp: 0, coins: TEETH_COINS, at: now }];
  const bonus = (t.streak ?? 0) % TEETH_STREAK === 0;
  if (bonus) awards.push({ id: `mochito-dientes-racha:${d}`, kind: "mochito", label: `Racha de ${t.streak} días de dientes limpios`, xp: 0, coins: TEETH_STREAK_COINS, at: now });
  await writeAwards(awards, await db.game_events.toArray());
  const r = await mochitoDo("teeth");
  return { ...r, streak: t.streak ?? 1, bonus };
}

// ── Casita del árbol ────────────────────────────────────────────────

/** Junta los materiales del día (una vez al día). */
export async function gatherTree() {
  const now = Date.now();
  const d = dayKey(now);
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const t = p.mochito_tree ?? {};
  if (t.gathered === d) return null;
  const got = gatherOf(d);
  await updateProfile({ mochito_tree: { ...t, gathered: d, mats: addMats(t.mats, got) } });
  return got;
}

/** Construye una parte (una por día) si alcanzan los materiales. */
export async function buildTree(part: TreePart) {
  const now = Date.now();
  const d = dayKey(now);
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const t = p.mochito_tree ?? {};
  const info = TREE_PARTS.find((x) => x.id === part)!;
  if (t.builtDay === d || (t.built ?? []).includes(part) || !canBuild(t, info)) return null;
  const built = [...(t.built ?? []), part];
  const done = built.length >= TREE_PARTS.length;
  await updateProfile({ mochito_tree: { ...t, built, builtDay: d, mats: addMats(t.mats, info.need, -1) }, mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "tree", part: info.name, done })) });
  const awards = [{ id: `mochito-arbol:${part}`, kind: "mochito", label: `Casita del árbol: ${info.name.toLowerCase()}`, xp: 0, coins: TREE_PART_COINS, at: now }];
  if (done) awards.push({ id: "mochito-arbol:terminada", kind: "mochito", label: "¡Casita del árbol terminada!", xp: 0, coins: TREE_DONE_COINS, at: now });
  await writeAwards(awards, await db.game_events.toArray());
  const r = await mochitoDo("tree");
  return { ...r, done };
}

// ── Feria ───────────────────────────────────────────────────────────

/** Terminó la feria del mes: guarda el premio de peluche. */
export async function finishFair(prize: string, big: boolean) {
  const now = Date.now();
  const key = fairKey(now);
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  if (p.mochito_fair?.last === key) return null;
  await updateProfile({ mochito_fair: { last: key, prizes: [...(p.mochito_fair?.prizes ?? []), prize].slice(-24), big: (p.mochito_fair?.big ?? 0) + (big ? 1 : 0) }, mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "fair", prize })) });
  await writeAwards([{ id: `mochito-feria:${key}`, kind: "mochito", label: "Feria con Mochito", xp: 0, coins: FAIR_COINS, at: now }], await db.game_events.toArray());
  return mochitoDo("fair");
}

// ── Cumpleaños de sus amigos ────────────────────────────────────────

/** Festeja el cumpleaños de un amigo: si le das su regalo favorito, se pone más contento. */
export async function celebrateFriend(id: string, year: number, gift: Gift) {
  const now = Date.now();
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  if (p.mochito_fbdays?.[id] === year) return null;
  const fav = FRIEND_BDAYS[id]?.likes === gift;
  const friend = FRIENDS.find((f) => f.id === id);
  await updateProfile({
    mochito_fbdays: { ...p.mochito_fbdays, [id]: year },
    mochito_friends: { ...p.mochito_friends, [id]: (p.mochito_friends?.[id] ?? 0) + (fav ? 2 : 1) },
    mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "fbday", friend: friend?.name ?? id, gift: GIFTS[gift] })),
  });
  await writeAwards([{ id: `mochito-cumple-amigo:${id}:${year}`, kind: "mochito", label: `Cumpleaños de ${friend?.name ?? id}`, xp: 0, coins: BDAY_COINS + (fav ? BDAY_FAV_COINS : 0), at: now }], await db.game_events.toArray());
  const r = await mochitoDo("fbday");
  return { ...r, fav };
}

// ── Guardería ───────────────────────────────────────────────────────

/** Regresaron las familias: paga por cada cachorrito y un extra si no hubo errores. */
export async function finishDaycare(names: string[], mistakes: number) {
  const now = Date.now();
  const d = dayKey(now);
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  if (p.mochito_daycare?.last === d) return null;
  await updateProfile({ mochito_daycare: { last: d, perfect: (p.mochito_daycare?.perfect ?? 0) + (mistakes ? 0 : 1) }, mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "daycare", names })) });
  const coins = names.length * DAYCARE_COINS + (mistakes ? 0 : DAYCARE_PERFECT);
  await writeAwards([{ id: `mochito-guarderia:${d}`, kind: "mochito", label: "Guardería de cachorritos", xp: 0, coins, at: now }], await db.game_events.toArray());
  const r = await mochitoDo("daycare");
  return { ...r, coins };
}

// ── Teatro ──────────────────────────────────────────────────────────

/** Presentaron una obra: se guarda en la lista. La primera del día da monedas. */
export async function presentPlay(title: string) {
  const now = Date.now();
  const d = dayKey(now);
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const first = p.mochito_theater?.last !== d;
  await updateProfile({ mochito_theater: { last: d, plays: [...(p.mochito_theater?.plays ?? []), { d, title }].slice(-20) }, mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "theater", title })) });
  if (first) await writeAwards([{ id: `mochito-teatro:${d}`, kind: "mochito", label: `Obra de títeres: ${title}`, xp: 0, coins: PLAY_COINS, at: now }], await db.game_events.toArray());
  const r = await mochitoDo("theater");
  return { ...r, first };
}

// ── Limpiar el parque ───────────────────────────────────────────────

/** Terminó de limpiar el parque (una vez al día): una moneda por cada cosa bien reciclada. */
export async function finishClean(ok: number) {
  const now = Date.now();
  const d = dayKey(now);
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  if (p.mochito_clean?.last === d) return null;
  await updateProfile({ mochito_clean: { last: d, total: (p.mochito_clean?.total ?? 0) + ok }, mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "clean", ok })) });
  if (ok > 0) await writeAwards([{ id: `mochito-parque:${d}`, kind: "mochito", label: "Limpiaron el parque", xp: 0, coins: ok, at: now }], await db.game_events.toArray());
  return mochitoDo("clean");
}

// ── Taller de juguetes ──────────────────────────────────────────────

/** Arreglaron el juguete del día: el amigo queda más contento. */
export async function finishRepair(toy: Toy, friendId: string) {
  const now = Date.now();
  const d = dayKey(now);
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  if (p.mochito_workshop?.last === d) return null;
  const friend = FRIENDS.find((f) => f.id === friendId);
  await updateProfile({
    mochito_workshop: { last: d, fixed: { ...p.mochito_workshop?.fixed, [toy]: (p.mochito_workshop?.fixed?.[toy] ?? 0) + 1 } },
    mochito_friends: { ...p.mochito_friends, [friendId]: (p.mochito_friends?.[friendId] ?? 0) + 1 },
    mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "repair", toy: `su ${TOYS[toy].name.toLowerCase()}`, friend: friend?.name ?? friendId })),
  });
  await writeAwards([{ id: `mochito-taller:${d}`, kind: "mochito", label: `Taller: ${TOYS[toy].name}`, xp: 0, coins: WORKSHOP_COINS, at: now }], await db.game_events.toArray());
  return mochitoDo("repair");
}

// ── Barrilete ───────────────────────────────────────────────────────

/** Bajaron el barrilete: se guarda la altura. El primer vuelo del día da monedas según lo alto que llegó. */
export async function finishKite(height: number) {
  const now = Date.now();
  const d = dayKey(now);
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const first = p.mochito_kite?.last !== d;
  const best = Math.max(p.mochito_kite?.best ?? 0, height);
  await updateProfile({ mochito_kite: { last: d, best, flights: (p.mochito_kite?.flights ?? 0) + 1 }, mochito_log: first ? appendLog(p.mochito_log, now, logLine({ kind: "kite", height })) : p.mochito_log });
  const coins = first ? kiteCoins(height) : 0;
  if (coins > 0) await writeAwards([{ id: `mochito-barrilete:${d}`, kind: "mochito", label: `Barrilete a ${height} m`, xp: 0, coins, at: now }], await db.game_events.toArray());
  const r = await mochitoDo("kite");
  return { ...r, coins, record: height > (p.mochito_kite?.best ?? 0) };
}

// ── Playa ───────────────────────────────────────────────────────────

/** Se acabó el día de playa (uno al día): guarda las conchas y paga una moneda por cada una, más por las raras. */
export async function finishBeach(found: Shell[]) {
  const now = Date.now();
  const d = dayKey(now);
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  if (p.mochito_beach?.last === d) return null;
  const shells = { ...p.mochito_beach?.shells };
  for (const s of found) shells[s] = (shells[s] ?? 0) + 1;
  const rare = [...new Set(found.filter((s) => SHELLS[s].rare))].map((s) => `una ${SHELLS[s].name}`);
  await updateProfile({ mochito_beach: { last: d, shells, castles: (p.mochito_beach?.castles ?? 0) + 1 }, mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "beach", shells: found.length, rare })) });
  const coins = beachCoins(found);
  if (coins > 0) await writeAwards([{ id: `mochito-playa:${d}`, kind: "mochito", label: "Día de playa", xp: 0, coins, at: now }], await db.game_events.toArray());
  const r = await mochitoDo("beach");
  return { ...r, coins };
}

// ── Pijamada ────────────────────────────────────────────────────────

/** Se durmieron: el amigo queda más amigo. Una pijamada al día. */
export async function finishSleepover(friendId: string, snack: string) {
  const now = Date.now();
  const d = dayKey(now);
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  if (p.mochito_sleep?.last === d) return null;
  const friend = FRIENDS.find((f) => f.id === friendId);
  await updateProfile({
    mochito_sleep: { last: d, friends: { ...p.mochito_sleep?.friends, [friendId]: (p.mochito_sleep?.friends?.[friendId] ?? 0) + 1 } },
    mochito_friends: { ...p.mochito_friends, [friendId]: (p.mochito_friends?.[friendId] ?? 0) + SLEEP_HEARTS },
    mochito_log: appendLog(p.mochito_log, now, logLine({ kind: "sleepover", friend: friend?.name ?? friendId, snack })),
  });
  await writeAwards([{ id: `mochito-pijamada:${d}`, kind: "mochito", label: `Pijamada con ${friend?.name ?? friendId}`, xp: 0, coins: SLEEP_COINS, at: now }], await db.game_events.toArray());
  return mochitoDo("sleepover");
}

// ── Ayudar en casa ──────────────────────────────────────────────────

/** Terminó una tarea de hoy: una estrella y una moneda. Si ya hizo las cuatro, un extra y queda en el diario. */
export async function finishChore(chore: ChoreId) {
  const now = Date.now();
  const d = dayKey(now);
  const p = { ...DEFAULT_PROFILE, ...(await db.profile.get(PROFILE_ID)) };
  const today = choresOf(d);
  const prev = p.mochito_chores?.day === d ? p.mochito_chores.done ?? [] : [];
  if (!today.includes(chore) || prev.includes(chore)) return null;
  const done = [...prev, chore];
  const all = today.every((c) => done.includes(c));
  await updateProfile({
    mochito_chores: { day: d, done, stars: (p.mochito_chores?.stars ?? 0) + 1 },
    mochito_log: all ? appendLog(p.mochito_log, now, logLine({ kind: "chores", did: today.map((c) => CHORES[c].did) })) : p.mochito_log,
  });
  await writeAwards([
    { id: `mochito-casa:${d}:${chore}`, kind: "mochito", label: CHORES[chore].name, xp: 0, coins: CHORE_COIN, at: now },
    ...(all ? [{ id: `mochito-casa:${d}:todas`, kind: "mochito" as const, label: "Ayudó en todo en casa", xp: 0, coins: CHORES_ALL_COINS, at: now }] : []),
  ], await db.game_events.toArray());
  const r = await mochitoDo("chores");
  return { ...r, all };
}
