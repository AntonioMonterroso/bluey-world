import type { ShopItem } from "@/lib/game/shop";

export type WearSlot = "back" | "head" | "face" | "neck" | "body" | "hand" | "feet";

export interface WearItem extends ShopItem {
  kind: "wear";
  slot: WearSlot;
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

export const wearById = (id: string) => WEAR_ITEMS.find((i) => i.id === id);
