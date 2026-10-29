import { Cake, CakeSlice, Candy, Cherry, Coffee, Cookie, Croissant, Egg, Ghost, Heart, IceCreamCone, Milk, PartyPopper, Sparkles, TreePine, Trophy, Wheat, Wind, type LucideIcon } from "lucide-react";
import { CHARACTERS } from "@/lib/characters";
import { DECOR_ITEMS } from "@/lib/game/decor";
import { WEAR_ITEMS } from "@/lib/game/wardrobe";

export type ShopKind = "character" | "sound" | "frame" | "sticker" | "decor" | "wear";

export interface ShopItem {
  id: string; // con prefijo: char:, sound:, frame:, sticker:
  kind: ShopKind;
  name: string;
  price: number; // 0 = viene gratis
  icon?: LucideIcon;
  src?: string;
  w?: number;
  h?: number;
  event?: string; // solo se consigue cumpliendo este evento
}

const CHAR_PRICE: Record<string, number> = {
  bluey: 0, bingo: 0,
  bandit: 60, chilli: 60, muffin: 60, socks: 60,
  "bluey-chica": 80, lucky: 80, mackenzie: 80, trixie: 80,
  judo: 100, honey: 100, buddy: 100, indy: 100, "jean-luc": 100, missy: 100,
  snickers: 120, chloe: 120, coco: 120, winton: 120,
  rusty: 150, terriers: 150, "bluey-bebe": 150,
};

export const CHARACTER_ITEMS: ShopItem[] = CHARACTERS.map((c) => ({
  id: `char:${c.id}`, kind: "character", name: c.name, price: CHAR_PRICE[c.id] ?? 100, src: c.src, w: c.w, h: c.h,
}));

export const SOUND_ITEMS: ShopItem[] = [
  { id: "sound:campana", kind: "sound", name: "Campanita", price: 0 },
  { id: "sound:arpa", kind: "sound", name: "Arpa", price: 30 },
  { id: "sound:pitido", kind: "sound", name: "Pitido suave", price: 30 },
];

export const FRAME_ITEMS: ShopItem[] = [
  { id: "frame:doble", kind: "frame", name: "Doble borde", price: 40 },
  { id: "frame:lunares", kind: "frame", name: "Punteado", price: 40 },
  { id: "frame:dorado", kind: "frame", name: "Dorado", price: 60 },
  { id: "frame:nube", kind: "frame", name: "Nube", price: 50 },
];

export const STICKER_ITEMS: ShopItem[] = [
  { id: "sticker:cake", name: "Pastel", icon: Cake, price: 20 },
  { id: "sticker:slice", name: "Rebanada", icon: CakeSlice, price: 20 },
  { id: "sticker:cookie", name: "Galleta", icon: Cookie, price: 20 },
  { id: "sticker:ice", name: "Helado", icon: IceCreamCone, price: 25 },
  { id: "sticker:croissant", name: "Cuernito", icon: Croissant, price: 25 },
  { id: "sticker:candy", name: "Caramelo", icon: Candy, price: 25 },
  { id: "sticker:coffee", name: "Café", icon: Coffee, price: 30 },
  { id: "sticker:wheat", name: "Trigo", icon: Wheat, price: 30 },
  { id: "sticker:cherry", name: "Cereza", icon: Cherry, price: 30 },
  { id: "sticker:egg", name: "Huevito", icon: Egg, price: 35 },
  { id: "sticker:milk", name: "Leche", icon: Milk, price: 35 },
  { id: "sticker:sparkle", name: "Brillo", icon: Sparkles, price: 50 },
  // Solo se ganan cumpliendo el evento de temporada
  { id: "sticker:corazon", name: "Corazón", icon: Heart, price: 9999, event: "Día del Cariño" },
  { id: "sticker:trofeo", name: "Trofeo", icon: Trophy, price: 9999, event: "Día del Padre" },
  { id: "sticker:fantasma", name: "Fantasmita", icon: Ghost, price: 9999, event: "Halloween" },
  { id: "sticker:barrilete", name: "Barrilete", icon: Wind, price: 9999, event: "Fiambre y barriletes" },
  { id: "sticker:pino", name: "Pino", icon: TreePine, price: 9999, event: "Navidad" },
  { id: "sticker:fiesta", name: "Fiesta", icon: PartyPopper, price: 9999, event: "Año Nuevo" },
].map((s) => ({ ...s, kind: "sticker" as const }));

export const ALL_ITEMS: ShopItem[] = [...CHARACTER_ITEMS, ...SOUND_ITEMS, ...FRAME_ITEMS, ...STICKER_ITEMS, ...DECOR_ITEMS, ...WEAR_ITEMS];

export const isFree = (item: ShopItem) => item.price === 0;
export const owns = (item: ShopItem, ownedIds: Set<string>) => isFree(item) || ownedIds.has(item.id);
export const itemById = (id: string) => ALL_ITEMS.find((i) => i.id === id);

/** Clases de borde para las fotos de recetas según el marco elegido. */
export function frameClass(frame: string | undefined) {
  switch (frame) {
    case "doble": return "border-4 border-primary outline outline-2 outline-offset-2 outline-primary/40";
    case "lunares": return "border-4 border-dashed border-primary/60";
    case "dorado": return "border-4 border-amber-400 shadow-[inset_0_0_0_2px_rgb(180_83_9/0.5)]";
    case "nube": return "border-[6px] border-white shadow-lg";
    default: return "";
  }
}
