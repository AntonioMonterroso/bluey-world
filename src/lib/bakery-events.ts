import type { BakeryDay } from "@/lib/db/db";
import {
  activeEvents, combineMods, criticVisited, type EventInstance, type EventMods,
} from "@/lib/game/events";
import type { ShiftOptions } from "@/lib/game/sales";

const lite = (days: BakeryDay[]) => days.map((d) => ({ at: d.at, served: d.served, items: d.items, critic: d.critic }));

/** Suma lo que cambian los eventos activos a las opciones del turno. */
export function applyEventMods(base: ShiftOptions, now: number, days: BakeryDay[]): { opts: ShiftOptions; active: EventInstance[]; criticComing: boolean } {
  const active = activeEvents(now);
  const m = combineMods(active);
  const weeklyCritic = active.find((e) => e.weekly && e.def.mods.critic);
  const criticComing = !!weeklyCritic && !criticVisited(lite(days), weeklyCritic.win);
  return {
    active,
    criticComing,
    opts: {
      ...base,
      maxCustomers: base.maxCustomers + m.maxCustomersBonus,
      arrivalMult: base.arrivalMult * m.arrivalMult,
      tipBonus: base.tipBonus + m.tipBonus,
      priceMult: base.priceMult * m.priceMult,
      patienceBonusMs: base.patienceBonusMs + m.patienceBonusMs,
      favCategories: m.favCategories,
      critic: criticComing,
    },
  };
}

/** Frases sencillas de lo que hace un evento. */
export function describeMods(m: EventMods): string[] {
  const out: string[] = [];
  if (m.favCategories?.length) out.push(`Piden más: ${m.favCategories.join(", ")} (y pagan un poco más)`);
  if (m.arrivalMult && m.arrivalMult < 1) out.push("Los clientes llegan más seguido");
  if (m.tipBonus) out.push(`Propinas +${Math.round(m.tipBonus * 100)} %`);
  if (m.priceMult && m.priceMult > 1) out.push(`Todo se paga ${Math.round((m.priceMult - 1) * 100)} % más`);
  if (m.patienceBonusMs) out.push(`Los clientes esperan ${Math.round(m.patienceBonusMs / 1000)} s más`);
  if (m.maxCustomersBonus) out.push(`Cabe ${m.maxCustomersBonus} cliente más a la vez`);
  if (m.critic) out.push("Llega un crítico gastronómico en tu primer turno");
  return out;
}

export { lite as dayLites };
