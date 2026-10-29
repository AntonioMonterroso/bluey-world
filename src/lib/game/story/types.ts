// La historia es DATOS: cada capítulo es una lista de nodos. Se puede corregir o ampliar sin tocar el motor.

/** "yo" es tu personaje; "narrador" es la voz sin cara; el resto es el id de un personaje (chilli, bandit...). */
export type Who = "yo" | "narrador" | string;

/** Tareas de la vida real. Se marcan solas mirando tus datos. */
export type TaskId = "cook" | "shift" | "expense" | "budget" | "hire" | "secret" | "decor" | "critic" | "price" | "special" | "upgrade" | "team2" | "minis" | "rep"
  | "outfit" | "goal" | "order" | "diary" | "pantry" | "recurring";

export type Node =
  | { k: "say"; who: Who; text: string; stage?: string[]; if?: [string, string] } // stage: quiénes se ven; if: solo si esa decisión se tomó
  | { k: "name" } // pide tu nombre y el del letrero
  | { k: "choice"; prompt: string; who?: Who; options: { label: string; flag?: [string, string]; reply: Node[] }[] }
  | { k: "task"; id: TaskId; text: string; href: string; cta: string; skippable?: string }; // skippable: texto del botón para seguir sin hacerla (tareas que dependen del calendario)

export interface Chapter {
  n: number;
  act: 1 | 2 | 3;
  kind?: "main" | "barrio" | "temporada"; // historia principal, historias del barrio o de temporada
  after?: number; // historias del barrio: se abren al terminar este capítulo principal
  event?: string; // de temporada: id de la fiesta (halloween, navidad...) durante la que se abre
  who?: string; // personaje protagonista (para la tarjeta)
  title: string;
  blurb: string; // lo que se ve en el mapa
  nodes: Node[];
  reward: { xp: number; coins: number };
}

/** Lo mínimo de tus datos que necesita la historia para marcar tareas. */
export interface StoryData {
  cookTimes: number[]; // cuándo cocinaste
  shiftTimes: number[]; // cuándo terminó cada turno de venta
  expenseTimes: number[]; // cuándo anotaste/cambiaste gastos
  budgetTimes: number[]; // cuándo fijaste/cambiaste topes
  staffCount: number; // empleados contratados
  secretRecipeTimes: number[]; // recetas con tu secreto y foto (cuándo se guardaron)
  decorTimes: number[]; // cuándo cambiaste decoración o adornos del día
  criticTimes: number[]; // turnos en los que vino el crítico
  priceTimes: number[]; // precios de productos actualizados
  deliveredTimes: number[]; // pedidos especiales entregados
  upgradeTimes: number[]; // mejoras compradas
  miniPlays: { at: number; game: string }[]; // partidas de la sala de juegos
  reputation: number; // 1 a 5
  cooks: number; // recetas cocinadas en total
  shifts: number; // turnos atendidos en total
  outfitCount: number; // prendas que lleva puesta tu personaje
  goalTimes: number[]; // metas de ahorro con dinero abonado
  orderTimes: number[]; // pedidos de clientes anotados
  diaryTimes: number[]; // notas del diario de postres
  pantryTimes: number[]; // cosas anotadas en la despensa
  recurringTimes: number[]; // pagos fijos anotados
}

export interface StoryState {
  chapter: number; // el capítulo más avanzado al que puedes entrar (empieza en 1)
  pos: number; // dónde vas dentro del capítulo actual
  started: Record<string, number>; // cuándo empezaste cada capítulo
  done: number[]; // capítulos terminados
  flags: Record<string, string>; // tus decisiones
}
