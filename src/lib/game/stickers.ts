// Pegatinas pegadas en el local: suman encanto, y más si completas una colección o pegas la favorita del día.
// Lógica pura.

export interface PlacedSticker { id: string; x: number; y: number; r: number } // x, y en % del dibujo; r en grados

export const MAX_STICKERS = 8;
export const MAX_STICKER_POINTS = 15;

export const STICKER_SETS: { id: string; name: string; items: string[]; perk: string }[] = [
  { id: "desayuno", name: "Desayuno", items: ["sticker:coffee", "sticker:croissant", "sticker:egg", "sticker:milk"], perk: "Huele a café recién hecho" },
  { id: "dulceria", name: "Dulcería", items: ["sticker:candy", "sticker:ice", "sticker:cherry"], perk: "Los niños se pegan al vidrio" },
  { id: "horno", name: "Del horno", items: ["sticker:cake", "sticker:slice", "sticker:cookie", "sticker:wheat"], perk: "Todo el barrio sabe que horneas" },
  { id: "fiestas", name: "Fiestas del año", items: ["sticker:corazon", "sticker:trofeo", "sticker:fantasma", "sticker:barrilete", "sticker:pino", "sticker:fiesta"], perk: "Tu local siempre está de fiesta" },
];
const SET_BONUS = 4;
const FIESTAS_NEEDED = 3; // de las fiestas basta con tres

const isEvent = (id: string) => STICKER_SETS[3].items.includes(id);

/** La pegatina que más les gusta hoy a los clientes (la misma todo el día). */
export function favoriteOfDay(all: string[], day: string): string | null {
  if (all.length === 0) return null;
  const n = Number(day.replace(/\D/g, ""));
  return all[n % all.length];
}

export function setsDone(placed: PlacedSticker[]) {
  const ids = new Set(placed.map((p) => p.id));
  return STICKER_SETS.map((s) => {
    const have = s.items.filter((i) => ids.has(i)).length;
    const need = s.id === "fiestas" ? FIESTAS_NEEDED : s.items.length;
    return { ...s, have: Math.min(have, need), need, done: have >= need };
  });
}

/** Puntos de encanto que dan las pegatinas pegadas. */
export function stickerPoints(placed: PlacedSticker[] | undefined, favorite: string | null) {
  const list = (placed ?? []).slice(0, MAX_STICKERS);
  const unique = [...new Map(list.map((p) => [p.id, p])).values()];
  const base = unique.reduce((n, p) => n + (isEvent(p.id) ? 2 : 1), 0);
  const sets = setsDone(unique).filter((s) => s.done).length * SET_BONUS;
  const fav = favorite && unique.some((p) => p.id === favorite) ? 3 : 0;
  return { base, sets, fav, total: Math.min(MAX_STICKER_POINTS, base + sets + fav) };
}
