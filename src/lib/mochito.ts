// Mochito: el perrito que siempre acompaña a tu personaje. Lógica pura.

export const MOCHITO_APPEAL = 3; // en el local saluda a los clientes

const ALWAYS = [
  "¡Guau! Aquí estoy contigo.",
  "¿Horneamos algo rico hoy?",
  "Yo pruebo lo que se caiga, prometido.",
  "Lava la fruta antes de cortarla, ¡guau!",
  "La mantequilla a temperatura ambiente se bate mejor.",
  "Precalienta el horno antes de meter la mezcla.",
  "Tamiza la harina y te queda más esponjoso.",
  "No abras el horno los primeros minutos, que se baja el pastel.",
  "Un descansito también cuenta. Toma agua.",
  "¡Me encanta acompañarte!",
  "Anota tus gastos y yo cuido las monedas.",
  "Si sale feo, igual sabe rico. ¡Guau!",
];

const BY_TIME: [number, number, string[]][] = [
  [5, 12, ["¡Buenos días! ¿Ya desayunaste?", "Mañana fresca, buena para hornear pan."]],
  [12, 19, ["¡Buenas tardes! ¿Un cafecito con galleta?", "La tarde es perfecta para decorar."]],
  [19, 24, ["Ya es de noche, no te desveles mucho.", "¿Me cuentas tu día en el diario?"]],
  [0, 5, ["Shhh… ya es muy tarde. A dormir, ¿sí?"]],
];

/** Una frase de Mochito según la hora; `pick` (0 a 1) elige cuál. */
export function mochitoLine(hour: number, pick: number) {
  const timed = BY_TIME.find(([a, b]) => hour >= a && hour < b)?.[2] ?? [];
  const all = [...timed, ...ALWAYS];
  return all[Math.min(all.length - 1, Math.floor(pick * all.length))];
}
