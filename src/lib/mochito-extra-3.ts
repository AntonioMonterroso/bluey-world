import { dayKey, rng, shuffle, weekKey } from "./game/engine";

// Todavía más de Mochito: su propia mascota, las cartas de sus amigos, el campamento de noche y el puesto de limonada,
// y la lógica de cuatro juegos (gato, ahorcado, minigolf y torre de bloques). Lógica pura.

type Lvl = "facil" | "normal" | "dificil";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const pick = <T,>(arr: readonly T[], rnd: () => number) => arr[Math.floor(rnd() * arr.length) % arr.length];
const DAY = 86_400_000;
const dayNo = (key: string) => { const [y, m, d] = key.split("-").map(Number); return Math.round(new Date(y, m - 1, d).getTime() / DAY); };

// ── Su mascota ──────────────────────────────────────────────────────

export type PetKind = "gatito" | "pollito" | "conejito" | "tortuguita";
export const PETS: Record<PetKind, { name: string; food: string; play: string; color: string; says: string }> = {
  gatito: { name: "Gatito", food: "un platito de leche para gatos", play: "perseguimos una bolita de estambre", color: "#f2a65a", says: "Miau. (Quiere decir: tú me caes bien)." },
  pollito: { name: "Pollito", food: "un puñito de maíz", play: "jugamos a las escondidas en el pasto", color: "#f6d33c", says: "¡Pío, pío! Sigue a Mochito a todos lados." },
  conejito: { name: "Conejito", food: "una hojita de lechuga", play: "saltamos juntos por el jardín", color: "#e9e2da", says: "Mueve la nariz muy rápido cuando está feliz." },
  tortuguita: { name: "Tortuguita", food: "unas hojitas tiernas", play: "hicimos una carrera… muy lenta", color: "#6fb36a", says: "No tiene prisa. Mochito la espera." },
};
export const PET_KINDS = Object.keys(PETS) as PetKind[];
export interface Buddy { kind: PetKind; name: string; since: string; fed?: string; played?: string; hearts: number }
export const BUDDY_STAGES = [
  { at: 0, name: "Recién llegado" }, { at: 5, name: "Ya se conocen" }, { at: 15, name: "Mejores amigos" }, { at: 30, name: "Inseparables" },
];
export const buddyStage = (hearts: number) => [...BUDDY_STAGES].reverse().find((s) => hearts >= s.at)!;
export const buddyName = (s: string) => s.trim().slice(0, 14);
/** Lo que falta hoy: comer y jugar (cada cosa una vez al día suma un corazón). */
export function buddyToday(b: Buddy | undefined, now: number) {
  const d = dayKey(now);
  return { fed: b?.fed === d, played: b?.played === d };
}

// ── Cartas de sus amigos ────────────────────────────────────────────

export interface Letter { text: string; replies: [string, string][] }
/** [respuesta que eliges, lo que contesta el amigo después]. */
export const LETTERS: Letter[] = [
  { text: "¡Hola, Mochito! Hoy encontré un charco gigante en el parque. ¿Quieres venir a saltar conmigo mañana?", replies: [["¡Sí! Llevo mis botitas.", "¡Yupi! Te espero junto a la fuente."], ["Mejor un charco chiquito, me da miedo mojarme las orejas.", "Está bien, busco uno chiquito para ti."], ["¿Y si llevamos una pelota?", "¡Gran idea! Pelota más charco es lo mejor."]] },
  { text: "Mochito, perdí mi pelota favorita. Es roja y tiene una mordidita. Si la ves, ¿me avisas?", replies: [["La busco en el paseo de hoy.", "¡Gracias! Eres un gran amigo."], ["Te presto la mía mientras la encuentras.", "¡Qué buena onda eres!"], ["Creo que la vi debajo de la banca.", "¡Allí estaba! Te debo un hueso."]] },
  { text: "¡Feliz día, Mochito! Te mando un dibujo: somos tú y yo comiendo galletas. (Me salió un poco chueco).", replies: [["¡Me encanta! Lo voy a poner en mi cuarto.", "¡Qué alegría! Te haré otro."], ["Yo te mando uno de los dos en el lago.", "¡Lo voy a guardar para siempre!"], ["Así de chueco es más bonito.", "Jaja, tienes razón."]] },
  { text: "Mochito, ¿cuál es tu truco favorito? Yo estoy aprendiendo a dar la pata, pero siempre doy la otra.", replies: [["Mi favorito es sentarme. ¡Es el más fácil!", "Voy a practicar ese primero."], ["Practica con premio, así se aprende rápido.", "¡Ya lo hice tres veces bien!"], ["La otra pata también cuenta.", "Jaja, entonces ya me sale."]] },
  { text: "Hoy llovió y me tuve que quedar en casa. Me aburrí mucho. ¿Qué haces tú cuando llueve?", replies: [["Me acurruco en mi camita y escucho la lluvia.", "Qué buen plan, lo voy a probar."], ["Juego con mi juguete favorito.", "Voy a buscar el mío."], ["Le pido a mi familia que me lea un cuento.", "¡Esa es la mejor idea!"]] },
  { text: "¡Adivina qué! Me bañaron y ahora huelo a flores. Todos los perros del parque me siguen. ¿Tú también hueles a flores?", replies: [["Yo huelo a galleta, que es mejor.", "Jaja, ¡ahora te voy a seguir yo!"], ["Me bañaron ayer: huelo a burbujas.", "Hagamos un club de los perros limpios."], ["No, me revolqué en el pasto.", "¡Qué valiente! Yo no me atrevo."]] },
  { text: "Mochito, mi familia va a hacer una fiesta el sábado. ¿Vienes? Habrá pastel para perros.", replies: [["¡Claro! Llevo un regalo.", "¡Qué emoción! Te guardo el pedazo más grande."], ["Sí, y llevo mis mejores ropas.", "¡Vas a ser el más elegante!"], ["¿Puedo llevar a mi mascota?", "¡Sí! Todos son bienvenidos."]] },
  { text: "Ayer vi una ardilla que corría más rápido que yo. ¿Me ayudas a entrenar para alcanzarla?", replies: [["¡Vamos a correr al parque todos los días!", "¡Seremos los más rápidos!"], ["Mejor la saludamos; las ardillas son amigas.", "Tienes razón, le diré hola."], ["Yo la distraigo y tú corres.", "¡Plan perfecto!"]] },
  { text: "Te extraño, Mochito. Hace mucho que no jugamos. ¿Cuándo nos vemos?", replies: [["¡En el próximo paseo!", "¡Voy a estar esperándote!"], ["Hoy mismo, si quieres.", "¡Corro para allá!"], ["Yo también te extraño. Te mando un abrazo.", "¡Abrazo de vuelta, muy fuerte!"]] },
  { text: "Mochito, aprendí a contar hasta cinco: uno, dos, tres… se me olvidó lo demás. ¿Me ayudas?", replies: [["Cuatro y cinco. ¡Ya casi!", "¡Uno, dos, tres, cuatro, cinco! ¡Lo logré!"], ["Cuenta tus patitas: son cuatro, y tu cola es la cinco.", "¡Qué buena forma de contar!"], ["Yo solo sé contar galletas.", "Jaja, esa es la mejor cuenta."]] },
];
export const LETTER_EVERY = 2;
export const LETTER_COINS = 3;
/** ¿Llega carta hoy? Cada dos días, de un amigo y con una carta del montón que salen del día. */
export function letterOf(day: string, friendIds: string[]) {
  if (dayNo(day) % LETTER_EVERY !== 0 || !friendIds.length) return null;
  const r = rng(`carta:${day}`);
  return { id: day, from: pick(friendIds, r), letter: Math.floor(r() * LETTERS.length) % LETTERS.length };
}
/** Cuántos días faltan para la siguiente carta. */
export const daysToLetter = (day: string) => (LETTER_EVERY - (dayNo(day) % LETTER_EVERY)) % LETTER_EVERY;
export interface Mail { [id: string]: { from: string; letter: number; reply?: number } }

// ── Campamento de noche ─────────────────────────────────────────────

export const CAMP_COINS = 12;
export const STAKES = 4;
export const STICKS = 5;
export const FIRE_HOLD_MS = 1600;
export const TOAST_TURNS = 4;
export const campKey = (now: number) => weekKey(now);
/** Constelaciones: puntos (en un cielo de 100×60) que se unen en orden. */
export const CONSTELLATIONS = [
  { id: "hueso", name: "El Gran Hueso", pts: [[20, 30], [30, 22], [32, 32], [68, 28], [70, 38], [80, 30]] },
  { id: "huella", name: "La Huella", pts: [[50, 44], [36, 30], [44, 18], [56, 18], [64, 30], [50, 44]] },
  { id: "mochito", name: "Mochito de las estrellas", pts: [[30, 40], [40, 20], [55, 18], [66, 28], [62, 42], [44, 46], [30, 40]] },
  { id: "pelota", name: "La Pelota", pts: [[50, 10], [64, 18], [68, 32], [60, 46], [44, 48], [32, 36], [34, 20], [50, 10]] },
  { id: "cola", name: "La Cola Feliz", pts: [[20, 46], [32, 36], [40, 40], [52, 26], [64, 30], [76, 14]] },
  { id: "luna", name: "El Plato de Luna", pts: [[24, 30], [34, 40], [50, 44], [66, 40], [76, 30], [50, 34], [24, 30]] },
] as const;
export type Constellation = (typeof CONSTELLATIONS)[number]["id"];
/** La constelación de esta semana: primero las que no ha visto. */
export function campStars(key: string, seen: string[]): Constellation {
  const fresh = CONSTELLATIONS.filter((c) => !seen.includes(c.id));
  return pick(fresh.length ? fresh : CONSTELLATIONS, rng(`campamento:${key}`)).id;
}
export interface Camp { last?: string; stars?: string[] }

// ── Puesto de limonada ──────────────────────────────────────────────

export type Drink = "limonada" | "jamaica" | "horchata";
export const DRINKS: Record<Drink, { name: string; color: string }> = {
  limonada: { name: "Limonada", color: "#e9e27a" }, jamaica: { name: "Jamaica", color: "#b8304f" }, horchata: { name: "Horchata", color: "#efe2c8" },
};
export const DRINK_IDS = Object.keys(DRINKS) as Drink[];
export interface Order { who: string; drink: Drink; big: boolean; ice: boolean }
export const STAND_ORDERS = 5;
export const STAND_COIN_PER = 2;
/** Los pedidos del día (siempre los mismos ese día). */
export function standOrders(day: string, who: string[]): Order[] {
  const r = rng(`limonada:${day}`);
  return Array.from({ length: STAND_ORDERS }, () => ({ who: pick(who, r), drink: pick(DRINK_IDS, r), big: r() < 0.5, ice: r() < 0.6 }));
}
export const orderOk = (o: Order, g: { drink?: Drink; big?: boolean; ice?: boolean }) => g.drink === o.drink && g.big === o.big && g.ice === o.ice;
export const orderText = (o: Order) => `${DRINKS[o.drink].name} ${o.big ? "grande" : "chica"}, ${o.ice ? "con hielo" : "sin hielo"}`;

// ── Gato (tres en raya) ─────────────────────────────────────────────

export type Cell = "" | "X" | "O";
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
export function tttWinner(b: Cell[]): { who: "X" | "O"; line: number[] } | "empate" | null {
  for (const l of LINES) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return { who: b[l[0]] as "X" | "O", line: l };
  return b.every(Boolean) ? "empate" : null;
}
function minimax(b: Cell[], me: "X" | "O", turn: "X" | "O"): number {
  const w = tttWinner(b);
  if (w === "empate") return 0;
  if (w) return w.who === me ? 10 : -10;
  const scores = b.map((c, i) => {
    if (c) return null;
    const n = [...b]; n[i] = turn;
    return minimax(n, me, turn === "X" ? "O" : "X") * 0.9;
  }).filter((v): v is number => v !== null);
  return turn === me ? Math.max(...scores) : Math.min(...scores);
}
/** La mejor jugada para `me` (la que nunca pierde). */
export function tttBest(b: Cell[], me: "X" | "O"): number {
  let best = -Infinity, at = -1;
  b.forEach((c, i) => {
    if (c) return;
    const n = [...b]; n[i] = me;
    const s = minimax(n, me, me === "X" ? "O" : "X");
    if (s > best) { best = s; at = i; }
  });
  return at;
}
/** Jugada de Mochito: en fácil se distrae seguido; en difícil no se deja ganar. */
export function tttMove(rnd: () => number, b: Cell[], me: "X" | "O", l: Lvl): number {
  const free = b.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  const slip = l === "facil" ? 0.6 : l === "normal" ? 0.25 : 0;
  return rnd() < slip ? pick(free, rnd) : tttBest(b, me);
}
export const TTT_GAMES = 3;
export const tttPoints = (r: "gana" | "empate" | "pierde") => (r === "gana" ? 1 : r === "empate" ? 0.6 : 0.15);

// ── Ahorcado (la galleta) ───────────────────────────────────────────

export const HANG_WORDS = ["PERRO", "HUESO", "PATITA", "GALLETA", "PELOTA", "PASEO", "CORREA", "OREJAS", "CACHORRO", "PARQUE", "COLLAR", "CAMITA", "AMIGO", "TRUCO", "PLATITO", "CARIÑO", "MASCOTA", "JARDIN", "ESTRELLA", "FOGATA", "LIMONADA", "CARTA", "VECINO", "TESORO", "DIPLOMA", "BURBUJA", "ARDILLA", "MARIPOSA", "COLITA", "LADRIDO"];
export const HANG_ROUNDS = 3;
export const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
export const hangLives = (l: Lvl) => (l === "facil" ? 8 : l === "dificil" ? 5 : 6);
export const hangWords = (rnd: () => number, l: Lvl) => shuffle(HANG_WORDS.filter((w) => (l === "facil" ? w.length <= 6 : l === "dificil" ? w.length >= 6 : true)), rnd).slice(0, HANG_ROUNDS);
export const hangShown = (word: string, guessed: string[]) => word.split("").map((ch) => (guessed.includes(ch) ? ch : "_"));
export const hangMisses = (word: string, guessed: string[]) => guessed.filter((g) => !word.includes(g)).length;
export const hangSolved = (word: string, guessed: string[]) => word.split("").every((ch) => guessed.includes(ch));
/** Por palabra: adivinada vale más mientras menos galleta se comió. */
export const hangPoints = (solved: boolean, misses: number, lives: number) => (solved ? 0.5 + 0.5 * clamp01(1 - misses / lives) : 0.1);

// ── Minigolf ────────────────────────────────────────────────────────

export interface Rect { x: number; y: number; w: number; h: number }
export interface Hole { name: string; start: [number, number]; cup: [number, number]; walls: Rect[]; par: number }
/** Campo de 100×160. */
export const HOLES: Hole[] = [
  { name: "Derechito", start: [50, 140], cup: [50, 30], walls: [], par: 2 },
  { name: "La banca", start: [30, 140], cup: [70, 30], walls: [{ x: 20, y: 80, w: 50, h: 8 }], par: 3 },
  { name: "El zigzag", start: [20, 145], cup: [80, 20], walls: [{ x: 0, y: 105, w: 62, h: 8 }, { x: 38, y: 55, w: 62, h: 8 }], par: 3 },
  { name: "La casita", start: [50, 145], cup: [50, 25], walls: [{ x: 30, y: 60, w: 40, h: 30 }], par: 3 },
  { name: "Los postes", start: [15, 145], cup: [85, 25], walls: [{ x: 25, y: 110, w: 10, h: 10 }, { x: 55, y: 85, w: 10, h: 10 }, { x: 30, y: 55, w: 10, h: 10 }, { x: 65, y: 40, w: 10, h: 10 }], par: 3 },
  { name: "El túnel", start: [85, 145], cup: [15, 25], walls: [{ x: 0, y: 70, w: 40, h: 8 }, { x: 60, y: 70, w: 40, h: 8 }, { x: 0, y: 110, w: 70, h: 8 }], par: 4 },
];
export const golfSpec = (l: Lvl) => (l === "facil" ? { holes: 3, cupR: 6, maxShots: 6 } : l === "dificil" ? { holes: 6, cupR: 3.5, maxShots: 5 } : { holes: 4, cupR: 4.5, maxShots: 6 });
export const GOLF_W = 100;
export const GOLF_H = 160;
const BALL = 2.2;
/**
 * Simula un tiro: sale con un ángulo (radianes, 0 = derecha, -π/2 = arriba) y fuerza (0 a 1).
 * Rebota en orillas y paredes, frena con el pasto y cae al hoyo si pasa cerca y no va muy rápido.
 */
export function golfShot(hole: Hole, from: [number, number], angle: number, power: number, cupR: number) {
  let x = from[0], y = from[1];
  let vx = Math.cos(angle) * (0.6 + power * 4.4);
  let vy = Math.sin(angle) * (0.6 + power * 4.4);
  const path: [number, number][] = [[x, y]];
  for (let k = 0; k < 900; k++) {
    let nx = x + vx, ny = y + vy;
    if (nx < BALL || nx > GOLF_W - BALL) { vx = -vx * 0.8; nx = Math.max(BALL, Math.min(GOLF_W - BALL, nx)); }
    if (ny < BALL || ny > GOLF_H - BALL) { vy = -vy * 0.8; ny = Math.max(BALL, Math.min(GOLF_H - BALL, ny)); }
    for (const w of hole.walls) {
      if (nx > w.x - BALL && nx < w.x + w.w + BALL && ny > w.y - BALL && ny < w.y + w.h + BALL) {
        const wasX = x > w.x - BALL && x < w.x + w.w + BALL;
        if (wasX) { vy = -vy * 0.8; ny = y; } else { vx = -vx * 0.8; nx = x; }
      }
    }
    x = nx; y = ny;
    vx *= 0.975; vy *= 0.975;
    const speed = Math.hypot(vx, vy);
    if (k % 2 === 0) path.push([x, y]);
    if (Math.hypot(x - hole.cup[0], y - hole.cup[1]) < cupR && speed < 2.6) { path.push([hole.cup[0], hole.cup[1]]); return { path, end: hole.cup as [number, number], inCup: true }; }
    if (speed < 0.05) break;
  }
  path.push([x, y]);
  return { path, end: [x, y] as [number, number], inCup: false };
}
/** Puntaje del recorrido: par o menos vale todo; cada golpe de más resta. */
export function golfScore(strokes: number[], holes: Hole[]) {
  if (!strokes.length) return 0;
  const per = strokes.map((s, i) => clamp01(1 - Math.max(0, s - holes[i].par) * 0.2));
  return per.reduce((a, b) => a + b, 0) / per.length;
}

// ── Torre de bloques ────────────────────────────────────────────────

export const TOWER_GOAL = 15;
export const TOWER_W = 0.4;
export const towerSpec = (l: Lvl) => (l === "facil" ? { period: 2600, speedUp: 0.97, perfect: 0.03 } : l === "dificil" ? { period: 1500, speedUp: 0.95, perfect: 0.015 } : { period: 2000, speedUp: 0.96, perfect: 0.02 });
/**
 * Suelta un bloque en `x` (orilla izquierda, de 0 a 1) sobre el de abajo. Lo que sobresale se cae.
 * Si cae casi exacto, queda igual de ancho que el de abajo. Si no toca nada, se acabó.
 */
export function towerDrop(below: { x: number; w: number }, x: number, perfect: number): { x: number; w: number; perfect: boolean } | null {
  if (Math.abs(x - below.x) <= perfect) return { x: below.x, w: below.w, perfect: true };
  const l = Math.max(below.x, x);
  const r = Math.min(below.x + below.w, x + below.w);
  if (r - l <= 0.005) return null;
  return { x: l, w: r - l, perfect: false };
}
/** Dónde va el bloque que se mueve: de orilla a orilla según su ancho. */
export const towerX = (s: number, w: number) => s * (1 - w);
export const towerScore = (height: number) => clamp01(height / TOWER_GOAL);
