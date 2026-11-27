import type { ShopItem } from "@/lib/game/shop";

export type WearSlot = "back" | "head" | "face" | "neck" | "body" | "hand" | "feet";

export interface WearItem extends ShopItem {
  kind: "wear";
  slot: WearSlot;
  mochito?: { level?: number; medal?: string }; // ropa exclusiva de Mochito: cómo se gana
}

const ev = (slot: WearSlot, key: string, name: string, event: string): WearItem => ({ id: `wear:${key}`, kind: "wear", slot, name, price: 9999, event });

export const WEAR_SLOTS: { id: WearSlot; label: string }[] = [
  { id: "head", label: "Cabeza" },
  { id: "face", label: "Cara" },
  { id: "neck", label: "Cuello" },
  { id: "body", label: "Cuerpo" },
  { id: "hand", label: "Manos" },
  { id: "feet", label: "Pies" },
  { id: "back", label: "Fondo" },
];

const w = (slot: WearSlot, key: string, name: string, price: number): WearItem => ({ id: `wear:${key}`, kind: "wear", slot, name, price });

export const WEAR_ITEMS: WearItem[] = [
  w("head", "lazo", "Lazo", 30),
  w("head", "fiesta", "Gorro de fiesta", 30),
  w("head", "mono", "Moño grande", 35),
  w("head", "boina", "Boina", 40),
  w("head", "chef", "Gorro de chef", 40),
  w("head", "flores", "Corona de flores", 50),
  w("head", "corona", "Corona dorada", 60),

  ev("head", "santa", "Gorro navideño", "Navidad"),
  ev("head", "bruja", "Sombrero de bruja", "Halloween"),
  ev("head", "diadema", "Diadema de corazones", "Día del Cariño"),
  ev("head", "flor", "Flor en el pelo", "Día de la Madre"),
  ev("body", "banda", "Banda de la patria", "Independencia"),

  w("face", "rubor", "Rubor", 20),
  w("face", "pecas", "Pecas", 25),
  w("face", "lentes", "Lentes redondos", 40),
  w("face", "sol", "Lentes de sol", 50),

  w("neck", "corbatin", "Corbatín", 30),
  w("neck", "bufanda", "Bufanda", 40),
  w("neck", "perlas", "Collar de perlas", 50),

  w("body", "rayas", "Camiseta de rayas", 35),
  w("body", "delantal", "Delantal", 40),
  w("body", "tutu", "Tutú", 50),
  w("body", "capa", "Capa", 60),
  w("body", "vestido", "Vestido", 70),

  w("head", "gorra", "Gorra", 35),
  w("head", "copa", "Sombrero de copa", 55),
  w("head", "orejas", "Orejas de gato", 40),
  w("head", "antenas", "Antenas brillantes", 45),

  w("face", "bigote", "Bigote", 25),
  w("face", "antifaz", "Antifaz", 35),
  w("face", "nariz", "Nariz de payaso", 30),

  w("neck", "lazocuello", "Lazo al cuello", 30),
  w("neck", "collar", "Collar dorado", 55),

  w("body", "pijama", "Pijama", 45),
  w("body", "uniforme", "Uniforme de chef", 55),
  w("body", "sueter", "Suéter", 50),

  w("hand", "cucharon", "Cucharón", 25),
  w("hand", "varita", "Varita mágica", 45),
  w("hand", "globo", "Globo", 30),
  w("hand", "piruleta", "Piruleta", 30),

  w("feet", "zapatos", "Zapatos", 30),
  w("feet", "botas", "Botas", 45),
  w("feet", "pantuflas", "Pantuflas", 35),

  w("back", "noche", "Noche estrellada", 50),
  w("back", "atardecer", "Atardecer", 50),
  w("back", "cielo", "Cielo pastel", 30),
  w("back", "estrellas", "Lluvia de estrellas", 45),
  w("back", "corazones", "Corazones", 45),
  w("back", "arcoiris", "Arcoíris", 60),
];

const m = (slot: WearSlot, key: string, name: string, unlock: { level?: number; medal?: string }, how: string): WearItem =>
  ({ id: `wear:m-${key}`, kind: "wear", slot, name, price: 9999, event: `Solo Mochito · ${how}`, mochito: unlock });

/** Ropa que solo usa Mochito. Se gana subiendo de nivel o con sus medallas. */
export const MOCHITO_WEAR: WearItem[] = [
  m("neck", "huesito", "Collar con huesito", { level: 2 }, "nivel 2"),
  m("neck", "panoleta", "Pañoleta roja", { level: 4 }, "nivel 4"),
  m("neck", "gala", "Corbatín de gala", { medal: "truco-1" }, "medalla Primer truco"),
  m("head", "chef", "Gorrito de chef perruno", { medal: "galleta-25" }, "medalla Panza contenta"),
  m("feet", "botitas", "Botitas de lluvia", { medal: "paseo-10" }, "medalla Explorador"),
  m("back", "capa", "Capa de superhéroe", { level: 8 }, "nivel 8"),
  m("face", "aviador", "Lentes de aviador", { level: 12 }, "nivel 12"),
  m("body", "rescate", "Chaleco de rescatista", { medal: "amigos-todos" }, "medalla Amigo de todos"),
];
WEAR_ITEMS.push(...MOCHITO_WEAR);

/** ¿Ya ganó esta prenda? */
export const mochitoWearUnlocked = (item: WearItem, level: number, medals: Set<string>) =>
  !!item.mochito && (item.mochito.level ? level >= item.mochito.level : true) && (item.mochito.medal ? medals.has(item.mochito.medal) : true);

export const wearById = (id: string) => WEAR_ITEMS.find((i) => i.id === id);
