// Cada prenda puesta se guarda como texto: "wear:lazo" o, si la personalizaste,
// "wear:lazo~c=ff7aa8~x=2~y=-1~s=1.1~r=10" (color, mover x/y, tamaño, giro).
// Así el look, los looks guardados y la ropa del equipo siguen siendo simples ranura → texto.

export interface Tweak {
  c: string | null; // color en hex sin '#', o null = el de tu paleta
  x: number; // mover a los lados (unidades del dibujo; el ancho total es 100)
  y: number; // mover arriba o abajo
  s: number; // tamaño (1 = normal)
  r: number; // giro en grados
}

export const DEFAULT_TWEAK: Tweak = { c: null, x: 0, y: 0, s: 1, r: 0 };
export const TWEAK_LIMITS = { x: [-45, 45], y: [-45, 45], s: [0.3, 3], r: [-180, 180] } as const;

const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v));
const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

export const idOf = (value: string) => value.split("~")[0];

export function parseWear(value: string): { id: string; tweak: Tweak } {
  const [id, ...parts] = value.split("~");
  const t: Tweak = { ...DEFAULT_TWEAK };
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k === "c" && /^[0-9a-fA-F]{6}$/.test(v ?? "")) t.c = v.toLowerCase();
    else if (k === "x" || k === "y" || k === "s" || k === "r") {
      const n = Number(v);
      if (Number.isFinite(n)) t[k] = clamp(n, TWEAK_LIMITS[k]);
    }
  }
  return { id, tweak: t };
}

export function encodeWear(id: string, tweak: Partial<Tweak>): string {
  const t = { ...DEFAULT_TWEAK, ...tweak };
  const parts: string[] = [];
  if (t.c) parts.push(`c=${t.c.replace("#", "").toLowerCase()}`);
  if (t.x) parts.push(`x=${round(clamp(t.x, TWEAK_LIMITS.x))}`);
  if (t.y) parts.push(`y=${round(clamp(t.y, TWEAK_LIMITS.y))}`);
  if (t.s !== 1) parts.push(`s=${round(clamp(t.s, TWEAK_LIMITS.s))}`);
  if (t.r) parts.push(`r=${round(clamp(t.r, TWEAK_LIMITS.r), 1)}`);
  return parts.length ? `${id}~${parts.join("~")}` : id;
}

/** Cambia solo una parte de la personalización de una prenda puesta. */
export const withTweak = (value: string, patch: Partial<Tweak>) => {
  const { id, tweak } = parseWear(value);
  return encodeWear(id, { ...tweak, ...patch });
};

export const isTweaked = (value: string) => value.includes("~");

/** Quita lo personalizado de todas las prendas (queda solo cuál lleva cada ranura). */
export const plainOutfit = (outfit: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(outfit).map(([slot, v]) => [slot, idOf(v)]));

/** Colores para elegir. El primero (null) es el de tu paleta. */
export const WEAR_COLORS: { hex: string | null; name: string }[] = [
  { hex: null, name: "Mi paleta" },
  { hex: "ff7aa8", name: "Rosa" },
  { hex: "e0433f", name: "Rojo" },
  { hex: "ff9a3c", name: "Naranja" },
  { hex: "f6c744", name: "Amarillo" },
  { hex: "5fbf7a", name: "Verde" },
  { hex: "3fb8af", name: "Turquesa" },
  { hex: "4a90e2", name: "Azul" },
  { hex: "8e6bd8", name: "Morado" },
  { hex: "b07a4f", name: "Café" },
  { hex: "ffffff", name: "Blanco" },
  { hex: "2b2b3a", name: "Negro" },
];
