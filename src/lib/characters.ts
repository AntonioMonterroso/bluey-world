import { BASE } from "@/lib/base";
export const CHARACTERS = [
  { id: "bluey", name: "Bluey", src: BASE + "/personajes/bluey.webp", w: 438, h: 640 },
  { id: "bingo", name: "Bingo", src: BASE + "/personajes/bingo.webp", w: 410, h: 640 },
  { id: "chilli", name: "Chilli", src: BASE + "/personajes/chilli.webp", w: 348, h: 640 },
  { id: "muffin", name: "Muffin", src: BASE + "/personajes/muffin.webp", w: 513, h: 640 },
  { id: "socks", name: "Socks", src: BASE + "/personajes/socks.webp", w: 476, h: 640 },
  { id: "lucky", name: "Lucky", src: BASE + "/personajes/lucky.webp", w: 352, h: 640 },
  { id: "mackenzie", name: "Mackenzie", src: BASE + "/personajes/mackenzie.webp", w: 417, h: 640 },
  { id: "trixie", name: "Trixie", src: BASE + "/personajes/trixie.webp", w: 368, h: 640 },
  { id: "bandit", name: "Bandit chef", src: BASE + "/personajes/bandit.webp", w: 451, h: 640 },
  { id: "judo", name: "Judo", src: BASE + "/personajes/judo.webp", w: 446, h: 640 },
  { id: "honey", name: "Honey", src: BASE + "/personajes/honey.webp", w: 320, h: 508 },
  { id: "buddy", name: "Buddy", src: BASE + "/personajes/buddy.webp", w: 444, h: 640 },
  { id: "indy", name: "Indy", src: BASE + "/personajes/indy.webp", w: 266, h: 360 },
  { id: "jean-luc", name: "Jean-Luc", src: BASE + "/personajes/jean-luc.webp", w: 482, h: 640 },
  { id: "missy", name: "Missy", src: BASE + "/personajes/missy.webp", w: 474, h: 640 },
  { id: "snickers", name: "Snickers", src: BASE + "/personajes/snickers.webp", w: 313, h: 640 },
  { id: "chloe", name: "Chloe", src: BASE + "/personajes/chloe.webp", w: 399, h: 640 },
  { id: "coco", name: "Coco", src: BASE + "/personajes/coco.webp", w: 349, h: 640 },
  { id: "winton", name: "Winton", src: BASE + "/personajes/winton.webp", w: 330, h: 395 },
  { id: "rusty", name: "Rusty caballero", src: BASE + "/personajes/rusty.webp", w: 135, h: 177 },
  { id: "terriers", name: "Los Terriers", src: BASE + "/personajes/terriers.webp", w: 640, h: 499 },
  { id: "bluey-bebe", name: "Bluey bebé", src: BASE + "/personajes/bluey-bebe.webp", w: 334, h: 426 },
  { id: "bluey-chica", name: "Bluey pequeña", src: BASE + "/personajes/bluey-chica.webp", w: 310, h: 507 },
] as const;

export type CharacterId = (typeof CHARACTERS)[number]["id"];
export const DEFAULT_CHARACTER: CharacterId = "bluey";
export const CHARACTER_STORAGE_KEY = "bw-character";

export function getCharacter(id: string) {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

// Imágenes de apoyo para secciones
export const ART = {
  elenco: { src: BASE + "/personajes/elenco.webp", w: 736, h: 1330 },
  familia: { src: BASE + "/personajes/familia.webp", w: 900, h: 883 },
  bingoBailando: { src: BASE + "/personajes/bingo-bailando.webp", w: 900, h: 506 },
} as const;
