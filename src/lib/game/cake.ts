// Pedidos especiales y el minijuego "Decora la torta". Lógica pura.
import { rng, shuffle } from "./engine";

export const FROSTINGS = [
  { id: "rosa", name: "Rosa", color: "#f9a8c4" },
  { id: "celeste", name: "Celeste", color: "#9ed8f5" },
  { id: "vainilla", name: "Vainilla", color: "#fff0c9" },
  { id: "chocolate", name: "Chocolate", color: "#8a5a44" },
  { id: "menta", name: "Menta", color: "#a8e6c9" },
] as const;

export const TOPPINGS = [
  { id: "fresas", name: "Fresas" },
  { id: "chispas", name: "Chispas" },
  { id: "velas", name: "Velas" },
  { id: "cerezas", name: "Cerezas" },
  { id: "flores", name: "Flores" },
] as const;

export interface CakeRequest {
  frosting: string;
  toppings: string[];
}

export interface CakeChoice {
  frosting: string | null;
  toppings: string[];
}

export const frostingName = (id: string) => FROSTINGS.find((f) => f.id === id)?.name.toLowerCase() ?? id;
export const toppingName = (id: string) => TOPPINGS.find((t) => t.id === id)?.name.toLowerCase() ?? id;

const list = (items: string[]) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`);

export const describeRequest = (r: CakeRequest) => `Una torta ${frostingName(r.frosting)} con ${list(r.toppings.map(toppingName))}.`;

export function requestFor(rnd: () => number): CakeRequest {
  const frosting = FROSTINGS[Math.floor(rnd() * FROSTINGS.length)].id;
  const n = 1 + Math.floor(rnd() * 3);
  return { frosting, toppings: shuffle(TOPPINGS.map((t) => t.id), rnd).slice(0, n) };
}

export const specialPrice = (r: CakeRequest) => 30 + 10 * r.toppings.length;
export const MAX_TOPPINGS = 4;

export interface CakeScore {
  quality: number; // 0 a 1
  stars: number; // 1 a 5
  frostingOk: boolean;
  missing: string[];
  extras: string[];
}

/** La crema vale el 40 %, cada adorno pedido reparte el 60 %, y cada adorno de más resta un poco. */
export function scoreCake(req: CakeRequest, choice: CakeChoice): CakeScore {
  const frostingOk = choice.frosting === req.frosting;
  const missing = req.toppings.filter((t) => !choice.toppings.includes(t));
  const extras = choice.toppings.filter((t) => !req.toppings.includes(t));
  const got = req.toppings.length - missing.length;
  const raw = (frostingOk ? 0.4 : 0) + (req.toppings.length ? 0.6 * (got / req.toppings.length) : 0.6) - 0.08 * extras.length;
  const quality = Math.max(0, Math.min(1, Math.round(raw * 100) / 100));
  const stars = quality >= 0.95 ? 5 : quality >= 0.75 ? 4 : quality >= 0.5 ? 3 : quality >= 0.25 ? 2 : 1;
  return { quality, stars, frostingOk, missing, extras };
}

export interface SpecialDraft {
  id: string;
  char: string;
  request: CakeRequest;
  price: number;
}

/** Los pedidos especiales del día: iguales en todos tus dispositivos. Vienen de tus clientes frecuentes. */
export function specialsForDay(dayKey: string, loyalty: Record<string, number>, chars: string[], count: number): SpecialDraft[] {
  const rnd = rng(`special:${dayKey}`);
  const known = chars.filter((c) => (loyalty[c] ?? 0) > 0);
  const pool = shuffle(known.length >= count ? known : chars, rnd);
  return pool.slice(0, count).map((char, i) => {
    const request = requestFor(rnd);
    return { id: `${dayKey}:${i}`, char, request, price: specialPrice(request) };
  });
}

/** 1 pedido al día; 2 si ya tienes buena fama o un cliente de la casa. */
export const specialsCount = (reputation: number, maxLoyalty: number) => (reputation >= 4 || maxLoyalty >= 50 ? 2 : 1);
