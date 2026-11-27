// Pegatinas de Mochito: se ganan jugando, paseando, bañándolo y con las misiones. Lógica pura.

export type StickerTheme = "poses" | "comida" | "parque" | "fiestas";
export type Rarity = "comun" | "rara" | "brillante";
export interface Sticker { id: string; name: string; theme: StickerTheme; art: string; color: string; rarity: Rarity }

const s = (theme: StickerTheme, id: string, name: string, art: string, color: string, rarity: Rarity = "comun"): Sticker => ({ id: `st-${id}`, name, theme, art, color, rarity });

export const STICKER_THEMES: { id: StickerTheme; name: string }[] = [
  { id: "poses", name: "Mochito" },
  { id: "comida", name: "Comidita" },
  { id: "parque", name: "En el parque" },
  { id: "fiestas", name: "Fiestas" },
];

export const STICKERS: Sticker[] = [
  s("poses", "feliz", "Mochito feliz", "pose:feliz", "#f9e2b0"),
  s("poses", "girado", "Mochito curioso", "pose:girado", "#d9ecff"),
  s("poses", "sentado", "Mochito sentadito", "pose:sentado", "#e4f6dc"),
  s("poses", "saltando", "Mochito brincando", "pose:saltando", "#ffe0ea", "rara"),
  s("poses", "dormido", "Mochito dormilón", "pose:dormido", "#e3defa", "rara"),
  s("poses", "fiesta", "Mochito de fiesta", "pose:fiesta", "#fff1c9", "rara"),
  s("poses", "navidad", "Mochito navideño", "pose:navidad", "#ffd9d9", "brillante"),
  s("poses", "brujito", "Mochito brujito", "pose:halloween", "#e6d8f5", "brillante"),

  s("comida", "hueso", "Hueso", "icon:Bone", "#f5efe4"),
  s("comida", "galleta", "Galleta", "icon:Cookie", "#f3dcc0"),
  s("comida", "zanahoria", "Zanahoria", "icon:Carrot", "#ffe1c7"),
  s("comida", "manzana", "Manzana", "icon:Apple", "#ffd6d6"),
  s("comida", "pollo", "Pollito cocido", "icon:Drumstick", "#ffe9c2", "rara"),
  s("comida", "huevo", "Huevo", "icon:Egg", "#fff6dd"),
  s("comida", "avena", "Avena", "icon:Wheat", "#f2e6c4"),
  s("comida", "caldito", "Caldito", "icon:Soup", "#fde2cf", "rara"),

  s("parque", "arbol", "Árbol", "icon:TreePine", "#dcf2dc"),
  s("parque", "flor", "Flor", "icon:Flower2", "#ffe0f0"),
  s("parque", "sol", "Sol", "icon:Sun", "#fff3c4"),
  s("parque", "nube", "Nube", "icon:Cloud", "#e4f0fb"),
  s("parque", "pajarito", "Pajarito", "icon:Bird", "#d9f0ff", "rara"),
  s("parque", "ardilla", "Ardilla", "icon:Squirrel", "#f6e2cf", "rara"),
  s("parque", "huellas", "Huellitas", "icon:Footprints", "#efe6dc"),
  s("parque", "arcoiris", "Arcoíris", "icon:Rainbow", "#f1e7ff", "brillante"),

  s("fiestas", "pastel", "Pastel", "icon:Cake", "#ffe0ea"),
  s("fiestas", "confeti", "Confeti", "icon:PartyPopper", "#fff1c9"),
  s("fiestas", "regalo", "Regalo", "icon:Gift", "#e4f6dc"),
  s("fiestas", "estrella", "Estrella", "icon:Star", "#fff6cc"),
  s("fiestas", "corazon", "Corazón", "icon:Heart", "#ffdce4", "rara"),
  s("fiestas", "fantasmita", "Fantasmita", "icon:Ghost", "#eeeaf7", "rara"),
  s("fiestas", "copo", "Copo de nieve", "icon:Snowflake", "#e2f2ff", "rara"),
  s("fiestas", "corona", "Corona", "icon:Crown", "#fff0c2", "brillante"),
];

const WEIGHT: Record<Rarity, number> = { comun: 6, rara: 3, brillante: 1 };
export const RARITY_LABEL: Record<Rarity, string> = { comun: "Común", rara: "Rara", brillante: "¡Brillante!" };

/** Elige una pegatina: las comunes salen más; las que aún no tienes salen un poco más seguido. */
export function pickSticker(rnd: () => number, have: Record<string, number> | undefined): Sticker {
  const weights = STICKERS.map((st) => WEIGHT[st.rarity] * ((have?.[st.id] ?? 0) > 0 ? 1 : 2));
  let x = rnd() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < STICKERS.length; i++) { x -= weights[i]; if (x < 0) return STICKERS[i]; }
  return STICKERS[STICKERS.length - 1];
}

/** Qué tan seguido sale una pegatina según lo que hiciste. */
export const STICKER_CHANCE: Record<string, number> = { walk: 1, missions: 1, game: 0.4, bath: 0.3, trick: 0.5 };

export const stickerCount = (have: Record<string, number> | undefined) => STICKERS.filter((st) => (have?.[st.id] ?? 0) > 0).length;
