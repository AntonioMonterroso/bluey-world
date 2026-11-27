import { dayKey, rng, weekKey } from "./game/engine";

// Más vida para Mochito: el veterinario, los cuentos para dormir, el concurso de perritos, el clima del paseo
// y la lógica de cuatro juegos (rompecabezas, lluvia de galletas, laberinto y pintar). Lógica pura.

type Lvl = "facil" | "normal" | "dificil";
const DAY = 86_400_000;

// ── Veterinario ─────────────────────────────────────────────────────

export type VetTool = "estetoscopio" | "lampara" | "termometro" | "gotas" | "venda" | "vitamina";
export const VET_TOOLS: { id: VetTool; name: string; the: string; that: string }[] = [
  { id: "estetoscopio", name: "Estetoscopio", the: "el estetoscopio", that: "Ese es el estetoscopio" },
  { id: "lampara", name: "Lamparita", the: "la lamparita", that: "Esa es la lamparita" },
  { id: "termometro", name: "Termómetro", the: "el termómetro", that: "Ese es el termómetro" },
  { id: "gotas", name: "Gotitas", the: "las gotitas", that: "Esas son las gotitas" },
  { id: "venda", name: "Vendita", the: "la vendita", that: "Esa es la vendita" },
  { id: "vitamina", name: "Vitamina", the: "la vitamina", that: "Esa es la vitamina" },
];

export type Ailment = "estornudos" | "orejas" | "pancita" | "patita";
export interface VetStep { tool: VetTool; ask: string; done: string }

export const AILMENTS: Record<Ailment, { name: string; says: string; steps: VetStep[] }> = {
  estornudos: {
    name: "Estornuda mucho",
    says: "¡Achís! Ay, no paro de estornudar…",
    steps: [
      { tool: "termometro", ask: "Primero vamos a ver si tiene calentura. Pásame el termómetro.", done: "Sin calentura. Es un resfriadito chiquito." },
      { tool: "estetoscopio", ask: "Ahora escuchemos cómo respira. ¿Me das el estetoscopio?", done: "Respira muy bien. Solo es la nariz." },
      { tool: "vitamina", ask: "Para terminar, su vitamina con sabor a pollo.", done: "¡Se la tomó toda! Mañana ya no estornuda." },
    ],
  },
  orejas: {
    name: "Le pican las orejitas",
    says: "Me pica la oreja y no me alcanzo a rascar.",
    steps: [
      { tool: "lampara", ask: "Déjame ver esas orejas. Pásame la lamparita.", done: "Un poquito rojitas, nada grave." },
      { tool: "gotas", ask: "Le ponemos unas gotitas. Despacito, ¿sí?", done: "Listo. Ya no le va a picar." },
      { tool: "vitamina", ask: "Y su vitamina, que se portó muy bien.", done: "¡Qué valiente! Ni se movió." },
    ],
  },
  pancita: {
    name: "Le duele la pancita",
    says: "Creo que comí una galleta de más…",
    steps: [
      { tool: "estetoscopio", ask: "Vamos a escuchar esa pancita. ¿Me pasas el estetoscopio?", done: "Hace ruiditos, pero está bien." },
      { tool: "termometro", ask: "Revisemos la temperatura con el termómetro.", done: "Temperatura normal. Solo comió de más." },
      { tool: "vitamina", ask: "Esta vitamina le asienta la pancita.", done: "Hoy, comidita ligera y mucha agua." },
    ],
  },
  patita: {
    name: "Cojea de una patita",
    says: "Me raspé la patita jugando en el parque.",
    steps: [
      { tool: "lampara", ask: "Déjame ver esa patita con la lamparita.", done: "Es un raspón pequeño. Ya casi sana." },
      { tool: "venda", ask: "Le ponemos una vendita para que no se ensucie.", done: "Mira qué vendita tan bonita." },
      { tool: "vitamina", ask: "Y su vitamina para que sane rápido.", done: "En dos días ya corre como siempre." },
    ],
  },
};

export const CHECKUP_STEPS: VetStep[] = [
  { tool: "estetoscopio", ask: "Es su chequeo de cada semana. Primero escuchemos su corazón.", done: "Pum, pum. Un corazón fuerte y feliz." },
  { tool: "lampara", ask: "Ahora las orejas y los dientes. Pásame la lamparita.", done: "Orejas limpias y dientes blanquitos." },
  { tool: "termometro", ask: "Y la temperatura con el termómetro.", done: "Todo normal." },
  { tool: "vitamina", ask: "Por portarse bien, su vitamina.", done: "¡Está sanísimo! Lo están cuidando muy bien." },
];

const AILMENT_IDS = Object.keys(AILMENTS) as Ailment[];
export const SICK_CHANCE = 0.22;
export const CHECKUP_EVERY_DAYS = 7;

/** Algunos días Mochito amanece malito (nada serio). Si ya fue al veterinario hoy, ya está bien. */
export function mochitoAilment(now: number, lastVet?: number): Ailment | null {
  if (lastVet && dayKey(lastVet) === dayKey(now)) return null;
  const r = rng(`malito:${dayKey(now)}`);
  if (r() >= SICK_CHANCE) return null;
  return AILMENT_IDS[Math.floor(r() * AILMENT_IDS.length)];
}
/** Le toca su chequeo si nunca ha ido o pasó una semana. */
export const checkupDue = (lastVet: number | undefined, now: number) => !lastVet || now - lastVet >= CHECKUP_EVERY_DAYS * DAY;
/** Los pasos de la visita: los de lo que tiene, o el chequeo. */
export const vetSteps = (a: Ailment | null) => (a ? AILMENTS[a].steps : CHECKUP_STEPS);
export const VET_DOCTOR = "pimienta";

// ── Cuentos para dormir ─────────────────────────────────────────────

export interface Story { id: string; title: string; pages: string[] }

export const STORIES: Story[] = [
  {
    id: "galleta-voladora",
    title: "La galleta que quería volar",
    pages: [
      "En la panadería vivía una galleta redonda que miraba los pájaros por la ventana. «Yo también quiero volar», decía cada mañana.",
      "Mochito la escuchó y tuvo una idea. La puso con cuidado en el globo rojo de la fiesta y lo soltó tantito, sin dejar de agarrar el hilo.",
      "La galleta subió hasta la lámpara y vio todo el local: los panes, las tortas, la cocinera sonriendo. «¡Estoy volando!», gritó feliz.",
      "Cuando bajó, le dio las gracias a Mochito. Esa noche durmió en su frasco soñando con nubes de azúcar glas.",
    ],
  },
  {
    id: "estrella-de-nube",
    title: "Nube y la estrella perdida",
    pages: [
      "Una noche, Nube vio que faltaba una estrella en el cielo. «Se le olvidó el camino a casa», le dijo a Mochito.",
      "Buscaron debajo del tobogán, entre las flores y dentro de los charquitos. En uno de ellos brillaba algo chiquito.",
      "Era el reflejo de la estrella, que se había escondido detrás de una nube gris. Mochito ladró bajito: «¡Ahí estás!».",
      "La nube gris se movió y la estrella volvió a su lugar. Nube y Mochito se acostaron en el pasto a verla hasta quedarse dormidos.",
    ],
  },
  {
    id: "paraguas-pimienta",
    title: "El paraguas de Pimienta",
    pages: [
      "Pimienta cuida el parque y nunca sale sin su paraguas amarillo, aunque haga sol.",
      "Un día empezó a llover de repente. Todos los perritos corrieron a esconderse, pero no cabían debajo del árbol.",
      "Pimienta abrió su paraguas y dijo: «Aquí cabemos todos si nos juntamos». Se apretaron Mochito, Canela, Tamal y Chispa.",
      "Esperaron juntitos a que pasara la lluvia, contando gotas. Desde ese día, a nadie le da miedo que llueva en el parque.",
    ],
  },
  {
    id: "panque-gigante",
    title: "Mochito y el panqué gigante",
    pages: [
      "Mochito soñó que la masa de panqué empezaba a crecer y crecer hasta salirse del molde.",
      "Creció tanto que llenó la cocina, el local y la calle. Olía a vainilla por todo el barrio.",
      "Los vecinos salieron con platos y cucharas. «¡Hay panqué para todos!», dijo Mochito, y nadie se quedó sin su pedacito.",
      "Cuando despertó, la cocinera estaba horneando un panqué de verdad. Mochito movió la colita y se volvió a dormir, contento.",
    ],
  },
  {
    id: "pelota-del-rio",
    title: "La pelota que se fue al río",
    pages: [
      "La pelota favorita de Mochito rodó, rodó y cayó al río que pasa junto al parque.",
      "Mochito quería saltar por ella, pero Rayo le dijo: «Espera, el agua va muy rápido. Busquemos ayuda».",
      "Una pata con sus patitos empujó la pelota con el pico hasta la orilla, como si jugaran fútbol.",
      "Mochito les dio las gracias y aprendió que pedir ayuda también es ser valiente. Esa noche abrazó su pelota hasta dormirse.",
    ],
  },
  {
    id: "ronquido-misterioso",
    title: "El ronquido misterioso",
    pages: [
      "Una noche se oyó un ruido en la casa: «Rrr… fiu… rrr… fiu». Mochito paró las orejas.",
      "Buscó en la cocina, en el sillón y detrás de la puerta. El ruido seguía: «Rrr… fiu».",
      "Al final se miró en el espejo con la boca abierta y se dio cuenta: ¡era él mismo, roncando medio dormido!",
      "Se rió tanto que se le quitó el sueño. Pero solo un ratito. Al ratito ya estaba roncando otra vez.",
    ],
  },
];

/** El cuento sugerido de hoy (va cambiando cada noche). */
export const storyOfDay = (now: number) => STORIES[Math.floor(rng(`cuento:${dayKey(now)}`)() * STORIES.length)];

// ── Concurso de perritos ────────────────────────────────────────────

export type Ribbon = "azul" | "rojo" | "amarillo" | "verde";
export const RIBBONS: Record<Ribbon, { name: string; place: string; coins: number; color: string }> = {
  azul: { name: "Listón azul", place: "Primer lugar", coins: 30, color: "#2f6fd0" },
  rojo: { name: "Listón rojo", place: "Segundo lugar", coins: 20, color: "#d0403a" },
  amarillo: { name: "Listón amarillo", place: "Tercer lugar", coins: 12, color: "#e7b416" },
  verde: { name: "Listón verde", place: "Por participar", coins: 6, color: "#3f9a54" },
};

export type ShowCategory = "estilo" | "truco" | "simpatia";
export const SHOW_CATEGORY: Record<ShowCategory, string> = { estilo: "Estilo", truco: "Truco", simpatia: "Simpatía" };

export interface ShowInput { outfitCount: number; trickLevel: number | null; clean: number; love: number }
export interface JudgeScore { judge: string; category: ShowCategory; points: number; says: string }

const JUDGE_SAYS: Record<ShowCategory, [string, string, string]> = {
  estilo: ["Le falta un poquito de ropa para lucirse.", "¡Qué bien combinado viene!", "¡El perrito mejor vestido que he visto!"],
  truco: ["Hay que practicar un truco más difícil.", "¡Muy buen truco! Lo hizo con calma.", "¡Aplausos! Ese truco es de campeón."],
  simpatia: ["Se nota que necesita un baño y cariños.", "Llegó limpiecito y de buen humor.", "¡Qué simpático! Brilla de limpio y feliz."],
};

export const showWeek = (now: number) => weekKey(now);

/** Las calificaciones de los tres jueces (sus amigos del parque) de 1 a 10. */
export function judgeShow(input: ShowInput, judges: string[], week: string): JudgeScore[] {
  const base: Record<ShowCategory, number> = {
    estilo: Math.min(1, input.outfitCount / 4),
    truco: input.trickLevel == null ? 0.1 : Math.min(1, 0.4 + 0.6 * (input.trickLevel / 12)),
    simpatia: Math.min(1, (input.clean + input.love) / 200),
  };
  const cats: ShowCategory[] = ["estilo", "truco", "simpatia"];
  return cats.map((category, i) => {
    const judge = judges[i % judges.length];
    const jitter = Math.round((rng(`concurso:${week}:${judge}`)() - 0.5) * 2);
    const points = Math.max(1, Math.min(10, Math.round(3 + base[category] * 7) + jitter));
    const tier = points >= 9 ? 2 : points >= 6 ? 1 : 0;
    return { judge, category, points, says: JUDGE_SAYS[category][tier] };
  });
}
export const showTotal = (s: JudgeScore[]) => s.reduce((a, x) => a + x.points, 0);
export const ribbonFor = (total: number): Ribbon => (total >= 26 ? "azul" : total >= 21 ? "rojo" : total >= 15 ? "amarillo" : "verde");
/** Los tres jueces de la semana. */
export function showJudges(friendIds: string[], week: string) {
  const r = rng(`jueces:${week}`);
  const pool = [...friendIds];
  const out: string[] = [];
  while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return out;
}

// ── El clima del paseo ──────────────────────────────────────────────

export type Weather = "sol" | "lluvia" | "viento" | "hojas";
export const WEATHER: Record<Weather, { name: string; today: string; walk: string }> = {
  sol: { name: "Soleado", today: "Hoy hace sol: perfecto para pasear.", walk: "Hizo un sol bonito y me eché en el pasto calientito." },
  lluvia: { name: "Lluvia", today: "Hoy llueve: sale con botitas y paraguas.", walk: "Llovió y salté en todos los charcos con mis botitas." },
  viento: { name: "Viento", today: "Hoy hace viento: cuidado con las orejas.", walk: "El viento me volteó las orejas. ¡Parecía avión!" },
  hojas: { name: "Hojas", today: "Hoy caen hojas: el parque está de colores.", walk: "Caían hojitas de colores y las perseguí todas." },
};
export const WEATHERS = Object.keys(WEATHER) as Weather[];

/** El clima del día. De mayo a octubre llueve más (temporada de lluvia); de noviembre a febrero hace más viento. */
export function weatherOf(now: number): Weather {
  const m = new Date(now).getMonth() + 1;
  const r = rng(`clima:${dayKey(now)}`)();
  const table: [Weather, number][] =
    m >= 5 && m <= 10 ? [["lluvia", 0.45], ["sol", 0.3], ["hojas", m >= 9 ? 0.15 : 0.05], ["viento", 1]]
    : m >= 11 || m <= 2 ? [["sol", 0.4], ["viento", 0.3], ["hojas", 0.25], ["lluvia", 1]]
    : [["sol", 0.6], ["viento", 0.2], ["hojas", 0.1], ["lluvia", 1]];
  let acc = 0;
  for (const [w, p] of table) { acc += p; if (r < acc) return w; }
  return "sol";
}

/** Ropa de lluvia encima de la que ya trae: botitas y paraguas. */
export const RAIN_GEAR = { feet: "wear:m-botitas", hand: "wear:x-paraguas" };
export const rainOutfit = (outfit: Record<string, string> | undefined) => ({ ...outfit, ...RAIN_GEAR });

// ── Rompecabezas ────────────────────────────────────────────────────

export const puzzleSize = (l: Lvl) => (l === "facil" ? 3 : l === "dificil" ? 5 : 4);

/** Revuelve las piezas: `perm[lugar] = pieza`. Nunca queda armado. */
export function puzzleShuffle(rnd: () => number, n: number) {
  const total = n * n;
  for (;;) {
    const p = Array.from({ length: total }, (_, i) => i);
    for (let i = total - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    if (p.filter((x, i) => x === i).length <= Math.floor(total / 4)) return p;
  }
}
/** Cambios mínimos para armarlo (piezas − ciclos). */
export function minSwaps(perm: number[]) {
  const seen = new Array(perm.length).fill(false);
  let cycles = 0;
  for (let i = 0; i < perm.length; i++) {
    if (seen[i]) continue;
    cycles++;
    for (let j = i; !seen[j]; j = perm[j]) seen[j] = true;
  }
  return perm.length - cycles;
}
export const puzzleSolved = (perm: number[]) => perm.every((x, i) => x === i);
export const puzzleScore = (swaps: number, min: number) => (swaps <= 0 ? 0 : Math.max(0.3, Math.min(1, min / swaps)));

// ── Lluvia de galletas ──────────────────────────────────────────────

export const RAIN_MS = 35_000;
export const RAIN_LIVES = 3;
export const RAIN_POINTS = { galleta: 1, dorada: 3 };
export const rainSpec = (l: Lvl) =>
  l === "facil" ? { every: 760, speed: 0.32, branch: 0.18, gold: 0.12 }
  : l === "dificil" ? { every: 460, speed: 0.52, branch: 0.3, gold: 0.08 }
  : { every: 600, speed: 0.42, branch: 0.24, gold: 0.1 };
/** Puntaje: lo que atrapó contra lo que cayó; si se le acabaron las vidas, vale menos. */
export const rainScore = (got: number, possible: number, lives: number) =>
  possible > 0 ? Math.max(0, Math.min(1, (got / possible / 0.75) * (lives > 0 ? 1 : 0.7))) : 0;

// ── Laberinto del hueso ─────────────────────────────────────────────

export const N = 1, E = 2, S = 4, W = 8;
export type Dir = "arriba" | "derecha" | "abajo" | "izquierda";
const STEP: Record<Dir, { bit: number; dr: number; dc: number; back: number }> = {
  arriba: { bit: N, dr: -1, dc: 0, back: S },
  derecha: { bit: E, dr: 0, dc: 1, back: W },
  abajo: { bit: S, dr: 1, dc: 0, back: N },
  izquierda: { bit: W, dr: 0, dc: -1, back: E },
};
export const mazeSize = (l: Lvl) => (l === "facil" ? 6 : l === "dificil" ? 10 : 8);

/** Un laberinto perfecto (un solo camino entre dos puntos). `open[celda]` dice por dónde se puede pasar. */
export function mazeOf(rnd: () => number, size: number) {
  const open = new Array(size * size).fill(0);
  const seen = new Array(size * size).fill(false);
  const stack = [0];
  seen[0] = true;
  while (stack.length) {
    const cell = stack[stack.length - 1];
    const r = Math.floor(cell / size), c = cell % size;
    const options = (Object.keys(STEP) as Dir[]).filter((d) => {
      const nr = r + STEP[d].dr, nc = c + STEP[d].dc;
      return nr >= 0 && nr < size && nc >= 0 && nc < size && !seen[nr * size + nc];
    });
    if (!options.length) { stack.pop(); continue; }
    const d = options[Math.floor(rnd() * options.length)];
    const next = (r + STEP[d].dr) * size + c + STEP[d].dc;
    open[cell] |= STEP[d].bit;
    open[next] |= STEP[d].back;
    seen[next] = true;
    stack.push(next);
  }
  return { size, open, start: 0, goal: size * size - 1 };
}
export type Maze = ReturnType<typeof mazeOf>;

/** A qué celda llegas al moverte (o la misma si hay pared). */
export function mazeMove(m: Maze, cell: number, d: Dir) {
  if (!(m.open[cell] & STEP[d].bit)) return cell;
  return cell + STEP[d].dr * m.size + STEP[d].dc;
}
/** Pasos del camino más corto. */
export function mazeShortest(m: Maze) {
  const dist = new Array(m.open.length).fill(-1);
  dist[m.start] = 0;
  const q = [m.start];
  while (q.length) {
    const cell = q.shift()!;
    if (cell === m.goal) return dist[cell];
    for (const d of Object.keys(STEP) as Dir[]) {
      const n = mazeMove(m, cell, d);
      if (n !== cell && dist[n] < 0) { dist[n] = dist[cell] + 1; q.push(n); }
    }
  }
  return -1;
}
export const mazeScore = (steps: number, shortest: number) => (steps <= 0 ? 0 : Math.max(0.3, Math.min(1, shortest / steps)));
/** Semilla del laberinto del día (el mismo para todo el día). */
export const mazeSeed = (now: number, l: Lvl) => `laberinto:${dayKey(now)}:${l}`;

// ── Pinta a Mochito ─────────────────────────────────────────────────

export const PAINT_COLORS = [
  { id: "cafe", name: "Café", hex: "#a8703f" },
  { id: "caramelo", name: "Caramelo", hex: "#d9a066" },
  { id: "crema", name: "Crema", hex: "#f4e4c8" },
  { id: "blanco", name: "Blanco", hex: "#ffffff" },
  { id: "negro", name: "Negro", hex: "#2a211c" },
  { id: "gris", name: "Gris", hex: "#8c8c96" },
  { id: "rojo", name: "Rojo", hex: "#d6453d" },
  { id: "rosa", name: "Rosa", hex: "#f08bb4" },
  { id: "naranja", name: "Naranja", hex: "#f39a3b" },
  { id: "amarillo", name: "Amarillo", hex: "#f6cf45" },
  { id: "verde", name: "Verde", hex: "#5bb06a" },
  { id: "celeste", name: "Celeste", hex: "#7cc3ef" },
  { id: "azul", name: "Azul", hex: "#3f6fc4" },
  { id: "morado", name: "Morado", hex: "#9b74d1" },
];
/** Puntaje del dibujo: cuánto pintaste. */
export const paintScore = (colored: number, total: number) => (total > 0 ? Math.min(1, colored / total) : 0);
