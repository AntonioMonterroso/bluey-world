// Minijuego "Horno perfecto": detener la aguja en la zona dorada. Lógica pura.

export const GOLD: [number, number] = [0.43, 0.59];
export const CENTER = 0.51;
export const OVEN_MS = 1900; // una ida y vuelta

/** Posición de la aguja (0 a 1) a los `t` milisegundos: va y viene. */
export function needlePos(t: number, period = OVEN_MS): number {
  const x = (t % period) / period; // 0..1
  return x < 0.5 ? x * 2 : (1 - x) * 2;
}

/** Calidad (0.3 a 1) según qué tan cerca del centro dorado se detuvo. */
export const ovenQuality = (pos: number) => Math.round(Math.max(0.3, 1 - Math.abs(pos - CENTER) * 2) * 100) / 100;

export const ovenStars = (q: number) => (q >= 0.9 ? 3 : q >= 0.65 ? 2 : 1);
export const inGold = (pos: number) => pos >= GOLD[0] && pos <= GOLD[1];
