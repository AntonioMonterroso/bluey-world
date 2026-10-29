// Cada turno de venta trae una sorpresa (cambia cómo llegan los clientes) y un reto con premio.
// Salen de la fecha y del número de turno, así que son los mismos si recargas la página.

export interface TurnMods { arrivalMult?: number; patienceBonusMs?: number; tipBonus?: number; priceMult?: number }
export interface Surprise { id: string; name: string; text: string; mods: TurnMods }

export const SURPRISES: Surprise[] = [
  { id: "normal", name: "Un día cualquiera", text: "Nada raro en Dulce Villa. Bueno, casi nada.", mods: {} },
  { id: "lluvia", name: "Tarde de lluvia", text: "Llega menos gente, pero se quedan contentos y dejan más propina.", mods: { arrivalMult: 1.25, tipBonus: 0.06 } },
  { id: "excursion", name: "Excursión escolar", text: "¡Un bus de niños! Llegan muy seguido y con poca paciencia.", mods: { arrivalMult: 0.75, patienceBonusMs: -2500 } },
  { id: "feria", name: "Feria en la plaza", text: "Hay fiesta afuera: todos pagan un poco más.", mods: { priceMult: 1.1 } },
  { id: "tranquila", name: "Tarde tranquila", text: "Los clientes esperan con calma. Buen momento para atender perfecto.", mods: { patienceBonusMs: 4000 } },
  { id: "influencer", name: "Pasó una influencer", text: "Subió una foto de tu local: llega más gente y deja propina.", mods: { arrivalMult: 0.85, tipBonus: 0.08 } },
  { id: "apagon", name: "Se fue la luz un rato", text: "Llega menos gente, pero todos tienen paciencia.", mods: { arrivalMult: 1.15, patienceBonusMs: 2500 } },
];

export interface TurnStats { served: number; lost: number; sales: number; tips: number; items: Record<string, number>; perfect: boolean }
export interface TurnGoal { id: string; text: string; check: (s: TurnStats) => boolean }

export const GOALS: TurnGoal[] = [
  { id: "atiende6", text: "Atiende a 6 clientes o más", check: (s) => s.served >= 6 },
  { id: "nadie", text: "Que nadie se vaya sin su pedido", check: (s) => s.lost === 0 && s.served > 0 },
  { id: "variedad", text: "Vende 3 postres distintos", check: (s) => Object.keys(s.items).length >= 3 },
  { id: "propinas", text: "Junta propinas de 15 o más", check: (s) => s.tips >= 15 },
  { id: "ventas", text: "Vende 100 o más en el turno", check: (s) => s.sales >= 100 },
  { id: "pocos", text: "Que se vaya como máximo 1 cliente", check: (s) => s.lost <= 1 && s.served >= 3 },
];
export const GOAL_BONUS = { xp: 10, coins: 15 };

const hash = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };

/** `menu` = cuántos postres hay en la vitrina: si son menos de 3, no se pide vender 3 distintos. */
export function turnFor(day: string, index: number, menu = 3): { surprise: Surprise; goal: TurnGoal } {
  const h = hash(`${day}#${index}`);
  const goals = GOALS.filter((g) => g.id !== "variedad" || menu >= 3);
  return { surprise: SURPRISES[h % SURPRISES.length], goal: goals[(h >>> 8) % goals.length] };
}

/** Aplica la sorpresa a las opciones del turno. */
export function applyTurn<T extends { arrivalMult: number; patienceBonusMs: number; tipBonus: number; priceMult: number }>(opts: T, mods: TurnMods): T {
  return {
    ...opts,
    arrivalMult: opts.arrivalMult * (mods.arrivalMult ?? 1),
    patienceBonusMs: opts.patienceBonusMs + (mods.patienceBonusMs ?? 0),
    tipBonus: opts.tipBonus + (mods.tipBonus ?? 0),
    priceMult: opts.priceMult * (mods.priceMult ?? 1),
  };
}
