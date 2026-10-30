// Atractivo del local y adornos del día. Lógica pura.

export type Spot = "colgante" | "mostrador" | "entrada" | "mesas";

export const SPOTS: { id: Spot; label: string }[] = [
  { id: "colgante", label: "Techo" },
  { id: "mostrador", label: "Mostrador" },
  { id: "entrada", label: "Entrada" },
  { id: "mesas", label: "Mesas" },
];

export interface Prop {
  id: string;
  name: string;
  icon: string; // nombre del dibujito (se resuelve en la pantalla)
  spot: Spot;
  cost: number; // monedas; el adorno dura un día
  appeal: number;
}

export const PROPS: Prop[] = [
  { id: "globos", name: "Globos", icon: "party", spot: "colgante", cost: 8, appeal: 8 },
  { id: "banderines", name: "Banderines", icon: "flag", spot: "colgante", cost: 8, appeal: 8 },
  { id: "foco", name: "Foco de colores", icon: "bulb", spot: "colgante", cost: 6, appeal: 6 },
  { id: "florero", name: "Florero", icon: "flower", spot: "mostrador", cost: 6, appeal: 6 },
  { id: "campana", name: "Campanita", icon: "bell", spot: "mostrador", cost: 7, appeal: 7 },
  { id: "pizarra", name: "Pizarra del día", icon: "note", spot: "mostrador", cost: 5, appeal: 5 },
  { id: "oferta", name: "Letrero de oferta", icon: "tag", spot: "entrada", cost: 6, appeal: 6 },
  { id: "brote", name: "Planta de entrada", icon: "sprout", spot: "entrada", cost: 5, appeal: 5 },
  { id: "paraguas", name: "Paragüero", icon: "umbrella", spot: "entrada", cost: 5, appeal: 5 },
  { id: "vela", name: "Velitas", icon: "flame", spot: "mesas", cost: 5, appeal: 5 },
  { id: "cubiertos", name: "Mantel y cubiertos", icon: "utensils", spot: "mesas", cost: 6, appeal: 6 },
  { id: "jarra", name: "Jarra de agua", icon: "cup", spot: "mesas", cost: 5, appeal: 5 },
];

export const propById = (id: string) => PROPS.find((p) => p.id === id);

const WEIGHTS: Record<string, number> = { wall: 4, floor: 4, lights: 5, counter: 5, plant: 4, art: 4, tables: 6 };
const tierOf = (price: number) => (price <= 0 ? 0 : price <= 40 ? 1 : price <= 70 ? 2 : 3);
const MAX_PERMANENT = 60;
const MAX_TIERS = Object.values(WEIGHTS).reduce((a, b) => a + b, 0) * 3;

export interface AppealInput {
  prices: Record<string, number>; // precio de lo que tienes puesto en cada ranura (0 = lo básico)
  props: Record<string, string>; // adornos de hoy: lugar → adorno
  shown: number; // postres en la vitrina
  stickers?: number; // puntos de las pegatinas pegadas en el local
}

export interface Appeal {
  total: number;
  permanent: number;
  props: number;
  vitrina: number;
  stickers: number;
}

export function appealOf({ prices, props, shown, stickers = 0 }: AppealInput): Appeal {
  let tiers = 0;
  for (const [slot, w] of Object.entries(WEIGHTS)) tiers += tierOf(prices[slot] ?? 0) * w;
  const permanent = Math.round((tiers / MAX_TIERS) * MAX_PERMANENT);
  const placed = Object.entries(props).reduce((n, [spot, id]) => {
    const p = propById(id);
    return n + (p && p.spot === spot ? p.appeal : 0);
  }, 0);
  const propsPts = Math.min(31, placed);
  const vitrina = Math.min(9, Math.round(Math.min(6, shown) * 1.5));
  return { total: Math.min(100, permanent + propsPts + vitrina + stickers), permanent, props: propsPts, vitrina, stickers };
}

export const appealLabel = (t: number) => (t >= 80 ? "Irresistible" : t >= 60 ? "Hermoso" : t >= 35 ? "Bonito" : t >= 15 ? "Acogedor" : "Sencillo");

/** Un local más atractivo recibe más clientes y mejores propinas. */
export const appealEffects = (t: number) => ({ arrivalMult: 1 - 0.3 * (t / 100), tipBonus: 0.1 * (t / 100) });
