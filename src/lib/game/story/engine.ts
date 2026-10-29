import type { Chapter, Node, StoryData, StoryState, TaskId } from "./types";

/** Cuántas partidas distintas de la sala se piden en el reto final. */
export const FINAL_GAMES = 3;
export const FINAL_REPUTATION = 4;

export const emptyState = (): StoryState => ({ chapter: 1, pos: 0, started: {}, done: [], flags: {} });

/** Reemplaza {nombre} y {local} en los textos. */
export function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
}

/** ¿Ya hiciste esta tarea? Las que dependen de una acción cuentan solo desde que empezó el capítulo. */
export function taskDone(id: TaskId, d: StoryData, since: number): boolean {
  const after = (times: number[]) => times.some((t) => t >= since);
  switch (id) {
    case "cook": return after(d.cookTimes);
    case "shift": return after(d.shiftTimes);
    case "expense": return after(d.expenseTimes);
    case "budget": return after(d.budgetTimes);
    case "hire": return d.staffCount > 0;
    case "secret": return after(d.secretRecipeTimes);
    case "decor": return after(d.decorTimes);
    case "critic": return after(d.criticTimes);
    case "price": return after(d.priceTimes);
    case "special": return after(d.deliveredTimes);
    case "upgrade": return after(d.upgradeTimes);
    case "team2": return d.staffCount >= 2;
    case "minis": return new Set(d.miniPlays.filter((p) => p.at >= since).map((p) => p.game)).size >= FINAL_GAMES;
    case "rep": return d.reputation >= FINAL_REPUTATION;
    case "outfit": return d.outfitCount >= 3;
    case "goal": return after(d.goalTimes);
    case "order": return after(d.orderTimes);
    case "diary": return after(d.diaryTimes);
    case "pantry": return after(d.pantryTimes);
    case "recurring": return after(d.recurringTimes);
  }
}

export const isUnlocked = (s: StoryState, n: number) => n <= s.chapter;

/** Historias del barrio y de temporada: cuándo se pueden leer. */
export function sideUnlocked(c: Chapter, s: StoryState, activeEventIds: string[]): boolean {
  if (s.done.includes(c.n) || s.started[String(c.n)]) return true;
  if (c.kind === "barrio") return c.after === undefined || s.done.includes(c.after);
  if (c.kind === "temporada") return !!c.event && activeEventIds.includes(c.event);
  return false;
}
export const isDone = (s: StoryState, n: number) => s.done.includes(n);

/** Los nodos que se ven según tus decisiones (los que traen `if` solo salen si tomaste esa decisión). */
export function visibleNodes(nodes: Node[], flags: Record<string, string>): Node[] {
  return nodes.filter((n) => n.k !== "say" || !n.if || flags[n.if[0]] === n.if[1]);
}

/** Progreso de una tarea para mostrarlo ("2 de 3"), o null si es de sí o no. */
export function taskProgress(id: TaskId, d: StoryData, since: number): { have: number; need: number } | null {
  if (id === "minis") return { have: Math.min(FINAL_GAMES, new Set(d.miniPlays.filter((p) => p.at >= since).map((p) => p.game)).size), need: FINAL_GAMES };
  if (id === "rep") return { have: Math.round(d.reputation * 10) / 10, need: FINAL_REPUTATION };
  if (id === "team2") return { have: Math.min(2, d.staffCount), need: 2 };
  return null;
}

/** Posición del siguiente nodo que detiene la lectura (decisión, tarea o pedir nombre), o el final. */
export function nextStop(nodes: Node[], from: number): number {
  for (let i = from; i < nodes.length; i++) if (nodes[i].k !== "say") return i;
  return nodes.length;
}

/** Marca un capítulo como terminado y abre el siguiente. */
export function finishChapter(s: StoryState, n: number, total: number): StoryState {
  return {
    ...s,
    done: s.done.includes(n) ? s.done : [...s.done, n].sort((a, b) => a - b),
    // Solo la historia principal abre el capítulo siguiente; las del barrio y de temporada no.
    chapter: n <= total ? Math.max(s.chapter, Math.min(total, n + 1)) : s.chapter,
    pos: 0,
  };
}

/** Empieza (o reinicia) un capítulo. La primera vez anota la hora para medir las tareas. */
export function startChapter(s: StoryState, n: number, now: number, restart = false): StoryState {
  const had = s.started[String(n)];
  return { ...s, pos: 0, started: { ...s.started, [String(n)]: restart || !had ? now : had } };
}

export const chapterTasks = (c: Chapter) => c.nodes.filter((n): n is Extract<Node, { k: "task" }> => n.k === "task");
