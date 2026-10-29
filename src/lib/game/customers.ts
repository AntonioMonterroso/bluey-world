// Clientes de Dulce Co.: personalidades, frecuentes y reseñas. Lógica pura (sin React ni base de datos).

export interface Archetype {
  id: string;
  name: string;
  blurb: string; // cómo es este tipo de cliente
  patience: number; // multiplica la paciencia
  tip: number; // multiplica la propina
  appetite: number; // 0 o 1: a veces pide un postre más
  favs: string[]; // categorías de receta que más le gustan
  praiseFav: string[]; // {postre} se cambia por el nombre
  thanks: string[];
  grumble: string[];
  left: string[];
}

export const ARCHETYPES: Archetype[] = [
  {
    id: "pequenos", name: "Los pequeños", blurb: "Llegan saltando, piden galletas y se cansan rápido de esperar.",
    patience: 0.8, tip: 0.8, appetite: 0, favs: ["Galletas", "Cupcakes y muffins"],
    praiseFav: ["¡{postre}! ¡Lo mejor del mundo!", "¡Quiero más {postre}, por favor!"],
    thanks: ["Estuvo rico, gracias.", "¡Qué bonito está todo aquí!"],
    grumble: ["Tardó mucho y ya tenía hambre.", "Me aburrí esperando."],
    left: ["Me fui sin mi postre. Qué tristeza.", "Nadie me atendió."],
  },
  {
    id: "golosos", name: "Los golosos", blurb: "Aguantan bien la espera y a veces piden un postre de más.",
    patience: 1.0, tip: 1.0, appetite: 1, favs: ["Pasteles", "Postres fríos"],
    praiseFav: ["{postre}: de otro mundo.", "Volveré solo por {postre}."],
    thanks: ["Muy rico todo. Repito mañana.", "Cada día mejora este lugar."],
    grumble: ["Rico, pero esperé demasiado.", "Casi me como el mantel de la espera."],
    left: ["Me quedé con las ganas.", "Ni un bocado me dieron."],
  },
  {
    id: "elegantes", name: "Los elegantes", blurb: "Son pacientes, dejan buenas propinas y fijan su mirada en los detalles.",
    patience: 1.25, tip: 1.4, appetite: 0, favs: ["Tartas y pays", "Rellenos y cremas"],
    praiseFav: ["{postre}: una delicia muy fina.", "{postre} impecable. Felicidades."],
    thanks: ["Todo muy fino. Gracias.", "Un lugar encantador."],
    grumble: ["El postre, bien; el tiempo de espera, no tanto.", "Podrían ser más rápidos."],
    left: ["No esperé tanto. Una lástima.", "Me retiré sin atender."],
  },
  {
    id: "apurados", name: "Los apurados", blurb: "Siempre con prisa: poca paciencia, pero compran rápido.",
    patience: 0.7, tip: 1.0, appetite: 0, favs: ["Bebidas", "Panes"],
    praiseFav: ["¡{postre} al instante! Justo lo que necesitaba.", "Rápido y sin enredos: {postre}."],
    thanks: ["Gracias, voy corriendo.", "Justo a tiempo."],
    grumble: ["Voy tarde por la espera.", "Mucha fila para mi prisa."],
    left: ["No tengo tiempo, me voy.", "Se me hizo tarde."],
  },
  {
    id: "familia", name: "Las familias", blurb: "Piden de todo un poco y siempre vuelven.",
    patience: 1.1, tip: 1.1, appetite: 0, favs: ["Salado", "Panes"],
    praiseFav: ["A toda la mesa le gustó {postre}.", "Nos llevamos más {postre} para la casa."],
    thanks: ["Gracias por el cariño.", "Nos sentimos como en casa."],
    grumble: ["Bonito lugar; faltó un poco de agilidad.", "Esperamos más de lo esperado."],
    left: ["Tuvimos que irnos sin pedir.", "Será otro día."],
  },
  {
    id: "exigentes", name: "Los exigentes", blurb: "Paciencia justa. Si todo sale perfecto, la propina es enorme.",
    patience: 0.9, tip: 1.6, appetite: 0, favs: ["Pasteles", "Tartas y pays"],
    praiseFav: ["{postre}: a otro nivel.", "Cinco estrellas para {postre}."],
    thanks: ["Aprobado.", "Cumple con lo prometido."],
    grumble: ["Esperaba más puntualidad.", "El servicio puede mejorar."],
    left: ["Me voy. Así no se atiende.", "Pésima espera."],
  },
];

export const CHAR_ARCH: Record<string, string> = {
  muffin: "pequenos", socks: "pequenos", "bluey-chica": "pequenos", "bluey-bebe": "pequenos", bluey: "pequenos", bingo: "pequenos",
  buddy: "golosos", winton: "golosos", missy: "golosos", rusty: "golosos", terriers: "golosos",
  coco: "elegantes", trixie: "elegantes", honey: "elegantes", chloe: "elegantes",
  mackenzie: "apurados", snickers: "apurados", lucky: "apurados", indy: "apurados",
  chilli: "familia", bandit: "familia",
  judo: "exigentes", "jean-luc": "exigentes",
};

const DEFAULT_ARCH = ARCHETYPES.find((a) => a.id === "familia")!;
export const archetypeOf = (char: string): Archetype => ARCHETYPES.find((a) => a.id === CHAR_ARCH[char]) ?? DEFAULT_ARCH;

// ---------- Frecuentes ----------

export const LOYALTY_START = 10;

/** Qué tan seguido viene alguien: los fieles aparecen más. */
export const visitWeight = (loyalty: number) => 1 + loyalty / 25; // 1 a 5

export interface Visit {
  char: string;
  paid: boolean;
  ratio: number; // paciencia que le quedaba al pagar (0 si se fue)
  fav: boolean; // pidió algo de lo que más le gusta
  dish: string; // nombre del primer postre que pidió
}

/** Cómo cambia la fidelidad después de una visita. */
export function loyaltyAfter(prev: number, v: Pick<Visit, "paid" | "ratio" | "fav">): number {
  const d = !v.paid ? -10 : v.ratio >= 0.6 ? 12 : v.ratio >= 0.3 ? 6 : 2;
  return Math.max(0, Math.min(100, prev + d + (v.paid && v.fav ? 3 : 0)));
}

export const loyaltyLabel = (loyalty: number) =>
  loyalty >= 80 ? "De la casa" : loyalty >= 50 ? "Cliente fiel" : loyalty >= 25 ? "Conocido" : "Nuevo";

/** Elige quién llega, con más probabilidad para los fieles. */
export function pickChar(chars: string[], loyalty: Record<string, number>, rnd: () => number): string {
  const weights = chars.map((c) => visitWeight(loyalty[c] ?? 0));
  let r = rnd() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < chars.length; i++) {
    r -= weights[i];
    if (r <= 0) return chars[i];
  }
  return chars[chars.length - 1];
}

// ---------- Reseñas ----------

export interface Review {
  char: string;
  stars: number;
  text: string;
}

const pickFrom = (list: string[], seed: number) => list[Math.abs(seed) % list.length];

/** Una reseña por cliente, según cómo le fue. `seed` hace que sea estable. */
export function reviewFor(v: Visit, seed: number): Review {
  const a = archetypeOf(v.char);
  if (!v.paid) return { char: v.char, stars: 1, text: pickFrom(a.left, seed) };
  if (v.ratio >= 0.6) {
    return { char: v.char, stars: 5, text: v.fav ? pickFrom(a.praiseFav, seed).replaceAll("{postre}", v.dish) : pickFrom(a.thanks, seed) };
  }
  if (v.ratio >= 0.3) return { char: v.char, stars: 4, text: v.fav ? pickFrom(a.praiseFav, seed + 1).replaceAll("{postre}", v.dish) : pickFrom(a.thanks, seed + 1) };
  return { char: v.char, stars: 3, text: pickFrom(a.grumble, seed) };
}

/** Las reseñas que más cuentan del turno: primero las peores, luego las mejores. */
export function topReviews(visits: Visit[], max = 3): Review[] {
  const all = visits.map((v, i) => reviewFor(v, i + v.char.length));
  const worst = [...all].sort((a, b) => a.stars - b.stars)[0];
  const best = [...all].sort((a, b) => b.stars - a.stars);
  const out: Review[] = [];
  for (const r of [best[0], worst, best[1]]) if (r && !out.includes(r)) out.push(r);
  return out.slice(0, max);
}
