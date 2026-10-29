import type { ShopItem } from "@/lib/game/shop";

export type DecorSlot = "wall" | "floor" | "lights" | "counter" | "plant" | "art" | "tables";

export interface DecorItem extends ShopItem {
  kind: "decor";
  slot: DecorSlot;
  /** Fondo CSS (paredes, pisos, mostrador). */
  style?: string;
  /** Color de apoyo (borde, luces...). */
  accent?: string;
}

export const SLOTS: { id: DecorSlot; label: string }[] = [
  { id: "wall", label: "Paredes" },
  { id: "floor", label: "Piso" },
  { id: "lights", label: "Luces" },
  { id: "counter", label: "Mostrador" },
  { id: "plant", label: "Plantas" },
  { id: "art", label: "Cuadros" },
  { id: "tables", label: "Mesas" },
];

const stripes = (a: string, b: string) => `repeating-linear-gradient(90deg, ${a} 0 18px, ${b} 18px 36px)`;
const dots = (bg: string, dot: string) => `radial-gradient(${dot} 22%, transparent 24%) 0 0/28px 28px, ${bg}`;
const checker = (a: string, b: string) => `conic-gradient(${a} 25%, ${b} 0 50%, ${a} 0 75%, ${b} 0) 0 0/48px 48px`;

const d = (slot: DecorSlot, id: string, name: string, price: number, extra: Partial<DecorItem> = {}): DecorItem => ({
  id: `decor:${id}`, kind: "decor", slot, name, price, ...extra,
});

export const DECOR_ITEMS: DecorItem[] = [
  d("wall", "w-crema", "Crema", 0, { style: "#fff3e4" }),
  d("wall", "w-rosa", "Rosa algodón", 30, { style: "#ffd9e6" }),
  d("wall", "w-menta", "Menta", 30, { style: "#d3f2e3" }),
  d("wall", "w-cielo", "Cielo", 30, { style: "#d4ebfb" }),
  d("wall", "w-lavanda", "Lavanda", 30, { style: "#e6dcfa" }),
  d("wall", "w-rayas", "Rayas rosa", 60, { style: stripes("#ffe3ec", "#fff6f9") }),
  d("wall", "w-lunares", "Lunares", 60, { style: dots("#fff3e4", "#ffc9d9") }),

  d("floor", "f-madera", "Madera", 0, { style: "repeating-linear-gradient(90deg, #e2b98a 0 46px, #d8ac7a 46px 48px)", accent: "#b98b5c" }),
  d("floor", "f-ajedrez", "Ajedrez", 50, { style: checker("#ffffff", "#f6b8cd"), accent: "#e79db6" }),
  d("floor", "f-rosa", "Baldosa rosa", 40, { style: "repeating-linear-gradient(90deg, #fbcfdc 0 58px, #f4b9cb 58px 60px)", accent: "#e79db6" }),
  d("floor", "f-menta", "Baldosa menta", 40, { style: "repeating-linear-gradient(90deg, #bfe9d4 0 58px, #a7dcc1 58px 60px)", accent: "#86c6a5" }),

  d("lights", "l-none", "Sin luces", 0),
  d("lights", "l-focos", "Focos", 40, { accent: "#ffd166" }),
  d("lights", "l-estrellas", "Estrellitas", 60, { accent: "#ffc2d6" }),
  d("lights", "l-farolitos", "Farolitos", 80, { accent: "#ff9ab8" }),

  d("counter", "c-clasico", "Clásico", 0, { style: "#f3d9b8", accent: "#d9b78a" }),
  d("counter", "c-rosa", "Rosa", 50, { style: "#f9c0d3", accent: "#e79db6" }),
  d("counter", "c-madera", "Madera", 60, { style: "#d9a574", accent: "#b9824f" }),
  d("counter", "c-marmol", "Mármol", 90, { style: "linear-gradient(135deg, #ffffff, #e9edf3 50%, #ffffff)", accent: "#c7cfdb" }),

  d("plant", "p-none", "Sin plantas", 0),
  d("plant", "p-maceta", "Brote", 30, { accent: "#4caf7a" }),
  d("plant", "p-flor", "Flores", 40, { accent: "#ec6f9c" }),
  d("plant", "p-palma", "Palmera", 50, { accent: "#3f9d6b" }),

  d("art", "a-none", "Sin cuadros", 0),
  d("art", "a-corazon", "Corazón", 30, { accent: "#ec6f9c" }),
  d("art", "a-pastel", "Pastel", 40, { accent: "#e58fb0" }),
  d("art", "a-estrella", "Estrella", 50, { accent: "#f2b134" }),

  d("tables", "t-none", "Sin mesas", 0),
  d("tables", "t-una", "Una mesa", 70, { accent: "#f3d9b8" }),
  d("tables", "t-dos", "Dos mesas", 120, { accent: "#f3d9b8" }),
];

export const decorById = (id: string) => DECOR_ITEMS.find((i) => i.id === id);

/** Artículo equipado en cada ranura; si no hay, el gratis de esa ranura. */
export function equipped(decor: Record<string, string> | undefined, slot: DecorSlot): DecorItem {
  const chosen = decor?.[slot] ? decorById(decor[slot]) : undefined;
  return chosen && chosen.slot === slot ? chosen : DECOR_ITEMS.find((i) => i.slot === slot && i.price === 0)!;
}
