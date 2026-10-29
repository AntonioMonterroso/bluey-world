/**
 * Dónde están la cabeza y el torso de cada personaje, para poder vestirlos.
 * Todo en fracciones (0 a 1) del ancho y alto de su imagen, medidas sobre cada dibujo (calibradas el 2026-10-29).
 */
export interface Anchors {
  hx: number; // centro de la cabeza
  hy: number; // parte de arriba del cráneo (donde se apoyan los gorros)
  hw: number; // ancho de la cabeza
  ey: number; // línea de los ojos
  tx: number; // centro del torso
  tt: number; // arriba del torso
  tb: number; // abajo del torso
  tw: number; // ancho del torso
  // Opcionales: dónde están las manos y los pies si no están donde se calcula desde el torso.
  hrx?: number; // mano derecha (x)
  hry?: number; // altura de las manos
  fy?: number; // altura de los pies (parte de abajo)
  fx?: number; // centro de los pies (x)
  fs?: number; // separación de los pies
}

const A = (hx: number, hy: number, hw: number, ey: number, tx: number, tt: number, tb: number, tw: number): Anchors => ({ hx, hy, hw, ey, tx, tt, tb, tw });

export const ANCHORS: Record<string, Anchors> = {
  bluey: A(0.47, 0.2, 0.42, 0.33, 0.43, 0.47, 0.75, 0.46),
  bingo: A(0.46, 0.17, 0.44, 0.28, 0.46, 0.45, 0.76, 0.38),
  chilli: A(0.44, 0.2, 0.38, 0.32, 0.42, 0.45, 0.76, 0.44),
  muffin: A(0.55, 0.2, 0.46, 0.4, 0.58, 0.6, 0.84, 0.42),
  socks: A(0.54, 0.2, 0.42, 0.33, 0.56, 0.5, 0.85, 0.5),
  lucky: A(0.66, 0.04, 0.5, 0.16, 0.48, 0.42, 0.82, 0.48),
  mackenzie: A(0.55, 0.2, 0.4, 0.27, 0.5, 0.45, 0.84, 0.42),
  trixie: A(0.5, 0.1, 0.46, 0.28, 0.5, 0.45, 0.82, 0.42),
  bandit: A(0.47, 0.15, 0.45, 0.3, 0.5, 0.45, 0.85, 0.42),
  judo: A(0.52, 0.1, 0.4, 0.28, 0.5, 0.45, 0.85, 0.45),
  honey: A(0.38, 0.12, 0.45, 0.22, 0.44, 0.45, 0.82, 0.45),
  buddy: A(0.6, 0.12, 0.52, 0.33, 0.52, 0.52, 0.85, 0.5),
  indy: A(0.45, 0.06, 0.42, 0.25, 0.5, 0.45, 0.75, 0.3),
  "jean-luc": A(0.55, 0.1, 0.4, 0.16, 0.53, 0.4, 0.8, 0.32),
  missy: A(0.55, 0.06, 0.48, 0.35, 0.56, 0.55, 0.84, 0.52),
  snickers: A(0.62, 0.06, 0.45, 0.21, 0.46, 0.45, 0.9, 0.45),
  chloe: A(0.45, 0.12, 0.4, 0.2, 0.46, 0.35, 0.7, 0.28),
  coco: A(0.5, 0.22, 0.3, 0.38, 0.48, 0.55, 0.85, 0.32),
  winton: A(0.5, 0.06, 0.58, 0.3, 0.48, 0.5, 0.85, 0.5),
  rusty: A(0.5, 0.12, 0.35, 0.45, 0.48, 0.6, 0.85, 0.38),
  "bluey-bebe": A(0.52, 0.12, 0.48, 0.35, 0.52, 0.55, 0.78, 0.55),
  "bluey-chica": A(0.5, 0.2, 0.42, 0.38, 0.55, 0.52, 0.8, 0.55),
};

// Pies medidos sobre cada dibujo (fy = base de los pies, fx = centro, fs = separación). Donde no hay medida se calcula desde el torso.
const FEET: Record<string, Pick<Anchors, "fx" | "fs" | "fy">> = {
  bluey: { fx: 0.476, fs: 0.157, fy: 0.975 },
  bingo: { fx: 0.496, fs: 0.2, fy: 0.89 },
  lucky: { fx: 0.565, fs: 0.114, fy: 0.97 },
  bandit: { fx: 0.474, fs: 0.094, fy: 0.98 },
  buddy: { fx: 0.555, fs: 0.148, fy: 0.975 },
  "jean-luc": { fx: 0.507, fs: 0.099, fy: 0.985 },
  missy: { fx: 0.52, fs: 0.117, fy: 0.96 },
  winton: { fx: 0.455, fs: 0.124, fy: 0.97 },
  "bluey-chica": { fx: 0.572, fs: 0.127, fy: 0.975 },
};
for (const [id, f] of Object.entries(FEET)) Object.assign(ANCHORS[id], f);
// Manos que no caen donde se calcula (brazos levantados).
Object.assign(ANCHORS.bingo, { hrx: 0.88, hry: 0.33 });

/** Los Terriers son un grupo de tres: no se pueden vestir. */
export const anchorsFor = (id: string): Anchors | null => ANCHORS[id] ?? null;
