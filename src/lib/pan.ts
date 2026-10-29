// Escala por molde: la masa se reparte por área, así que el factor es la razón de áreas.

export type PanShape = "round" | "rect";
export interface Pan { shape: PanShape; a: number; b: number } // cm: diámetro, o largo × ancho

export const PAN_PRESETS: { label: string; pan: Pan }[] = [
  { label: "Redondo 15 cm", pan: { shape: "round", a: 15, b: 0 } },
  { label: "Redondo 18 cm", pan: { shape: "round", a: 18, b: 0 } },
  { label: "Redondo 20 cm", pan: { shape: "round", a: 20, b: 0 } },
  { label: "Redondo 23 cm", pan: { shape: "round", a: 23, b: 0 } },
  { label: "Redondo 26 cm", pan: { shape: "round", a: 26, b: 0 } },
  { label: "Cuadrado 20 cm", pan: { shape: "rect", a: 20, b: 20 } },
  { label: "Cuadrado 23 cm", pan: { shape: "rect", a: 23, b: 23 } },
  { label: "Rectangular 23 × 33 cm", pan: { shape: "rect", a: 23, b: 33 } },
  { label: "Rectangular 30 × 40 cm", pan: { shape: "rect", a: 30, b: 40 } },
];

export function panArea(p: Pan): number {
  return p.shape === "round" ? Math.PI * (p.a / 2) ** 2 : p.a * p.b;
}

/** Cuánto hay que multiplicar la receta al pasar del molde original al nuevo (0 si algún dato no sirve). */
export function panFactor(from: Pan, to: Pan): number {
  const a = panArea(from);
  const b = panArea(to);
  return a > 0 && b > 0 ? b / a : 0;
}
