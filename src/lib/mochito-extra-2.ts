import { rng, shuffle } from "./game/engine";

// Aún más de Mochito: su cuarto por dentro, el paseo por la colonia, la escuela de perritos y la cocina de premios,
// y la lógica de seis juegos (colorea por números, sombras, tumba latas, bolos, tren de huesos y tambores). Lógica pura.

type Lvl = "facil" | "normal" | "dificil";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const pick = <T,>(arr: readonly T[], rnd: () => number) => arr[Math.floor(rnd() * arr.length) % arr.length];

// ── Su cuarto ───────────────────────────────────────────────────────

export type RoomSlot = "pared" | "piso" | "ventana" | "cuadro" | "lampara" | "planta" | "alfombra";
export interface RoomItem { id: string; name: string; price: number }

export const ROOM: Record<RoomSlot, { name: string; items: RoomItem[] }> = {
  pared: { name: "Pared", items: [
    { id: "crema", name: "Crema", price: 0 }, { id: "menta", name: "Verde menta", price: 15 }, { id: "rayas", name: "Rayas rosas", price: 25 },
    { id: "estrellas", name: "Estrellitas", price: 35 }, { id: "huellas", name: "Huellitas", price: 40 },
  ] },
  piso: { name: "Piso", items: [
    { id: "madera", name: "Madera", price: 0 }, { id: "barro", name: "Piso de barro", price: 15 }, { id: "ajedrez", name: "Cuadritos", price: 25 }, { id: "azul", name: "Azulejo azul", price: 30 },
  ] },
  ventana: { name: "Cortinas", items: [
    { id: "nada", name: "Sin cortinas", price: 0 }, { id: "rojas", name: "Rojas", price: 15 }, { id: "flores", name: "Con flores", price: 25 }, { id: "noche", name: "Azul con estrellas", price: 30 },
  ] },
  cuadro: { name: "Cuadro", items: [
    { id: "nada", name: "Sin cuadro", price: 0 }, { id: "hueso", name: "Hueso dorado", price: 20 }, { id: "lago", name: "El lago", price: 25 },
    { id: "retrato", name: "Su retrato", price: 30 }, { id: "volcan", name: "El volcán", price: 35 },
  ] },
  lampara: { name: "Lámpara", items: [
    { id: "nada", name: "Sin lámpara", price: 0 }, { id: "pie", name: "Lámpara de pie", price: 20 }, { id: "luces", name: "Guirnalda de luces", price: 30 }, { id: "luna", name: "Luna de noche", price: 35 },
  ] },
  planta: { name: "Planta", items: [
    { id: "nada", name: "Sin planta", price: 0 }, { id: "cactus", name: "Cactus", price: 10 }, { id: "helecho", name: "Helecho", price: 20 }, { id: "girasol", name: "Girasol en maceta", price: 25 },
  ] },
  alfombra: { name: "Alfombra", items: [
    { id: "nada", name: "Sin alfombra", price: 0 }, { id: "redonda", name: "Redonda", price: 15 }, { id: "huella", name: "Huella gigante", price: 30 }, { id: "arcoiris", name: "Arcoíris", price: 35 },
  ] },
};
export const ROOM_SLOTS = Object.keys(ROOM) as RoomSlot[];
export type Room = Partial<Record<RoomSlot, string>>;
export const roomItem = (slot: RoomSlot, id?: string) => ROOM[slot].items.find((i) => i.id === id) ?? ROOM[slot].items[0];
export const roomBuyId = (slot: RoomSlot, id: string) => `mochito-cuarto:${slot}:${id}`;
/** Cuántos rincones de su cuarto ya tienen algo comprado. */
export const roomCozy = (room?: Room) => ROOM_SLOTS.filter((s) => roomItem(s, room?.[s]).price > 0).length;

// ── Paseo por la colonia ────────────────────────────────────────────

export type Spot = "arbol" | "poste" | "tienda" | "fuente" | "jardin" | "banca" | "buzon" | "panaderia" | "charco" | "parquecito";
export type StreetKind = "oler" | "tesoro" | "vecino" | "ardilla";
export interface SpotInfo { name: string; kinds: StreetKind[]; smell: string; neighbor?: string }

export const SPOTS: Record<Spot, SpotInfo> = {
  arbol: { name: "El árbol grande", kinds: ["oler", "ardilla", "tesoro"], smell: "Aquí pasó un gato. Y un perro. Y otro gato." },
  poste: { name: "El poste", kinds: ["oler", "tesoro"], smell: "Huele a que todos los perros de la colonia dejaron su firma." },
  tienda: { name: "La tienda", kinds: ["vecino"], smell: "Huele a pan dulce y a jabón.", neighbor: "tendera" },
  fuente: { name: "La fuente", kinds: ["tesoro", "oler"], smell: "Huele a agua fresquita." },
  jardin: { name: "El jardín de la esquina", kinds: ["vecino", "oler"], smell: "Huele a rosas y a tierra mojada.", neighbor: "jardinera" },
  banca: { name: "La banca", kinds: ["tesoro", "vecino"], smell: "Alguien comió elotes aquí.", neighbor: "abuelito" },
  buzon: { name: "El buzón", kinds: ["vecino", "oler"], smell: "Huele a papel y a sobres.", neighbor: "cartero" },
  panaderia: { name: "La panadería", kinds: ["vecino"], smell: "¡Pan recién hecho!", neighbor: "panadero" },
  charco: { name: "El charco", kinds: ["tesoro", "oler"], smell: "Huele a lluvia de ayer." },
  parquecito: { name: "El parquecito", kinds: ["ardilla", "vecino", "tesoro"], smell: "Huele a pasto recién cortado.", neighbor: "ciclista" },
};
export const SPOT_IDS = Object.keys(SPOTS) as Spot[];

export const NEIGHBORS: Record<string, { name: string; line: string; cookie?: boolean }> = {
  tendera: { name: "La señora de la tienda", line: "¡Qué perrito tan bien portado! Ten, una galletita.", cookie: true },
  jardinera: { name: "La señora de las flores", line: "Mira mis rosas, pero sin escarbar, ¿eh?" },
  abuelito: { name: "El abuelito del periódico", line: "Este perro es más listo que yo. Buenos días, amigo." },
  cartero: { name: "El cartero", line: "Hoy no traigo cartas para ti, pero sí una caricia." },
  panadero: { name: "El panadero", line: "Para ti, una orilla de pan sin azúcar.", cookie: true },
  ciclista: { name: "La niña de la bici", line: "¡Ring, ring! ¿Me echas una carrera?" },
};

export const TREASURES = [
  { id: "piedra", name: "Piedra brillante", color: "#b9c3d1" },
  { id: "bellota", name: "Bellota", color: "#9a6532" },
  { id: "pluma", name: "Pluma azul", color: "#3f74c4" },
  { id: "hoja", name: "Hoja dorada", color: "#e3a72f" },
  { id: "chapita", name: "Chapita", color: "#d6453d" },
  { id: "palito", name: "El palito perfecto", color: "#8a5a2e" },
  { id: "caracol", name: "Caracol", color: "#e9b9a0" },
  { id: "boton", name: "Botón rojo", color: "#c8323e" },
  { id: "canica", name: "Canica", color: "#4fb3a9" },
  { id: "moneda", name: "Moneda antigua", color: "#c9a24b" },
] as const;
export type Treasure = (typeof TREASURES)[number]["id"];

export const STREET_STOPS = 4;
export const STREET_COINS = 6;
export const SQUIRREL_HOLD_MS = 1500;
export const SQUIRREL_WAIT_MS = 4000;

/** El recorrido del día: en cada parada eliges entre dos lugares. Es el mismo todo el día. */
export function streetRoute(day: string): [Spot, Spot][] {
  const s = shuffle(SPOT_IDS, rng(`colonia:${day}`));
  return Array.from({ length: STREET_STOPS }, (_, i) => [s[i * 2], s[i * 2 + 1]] as [Spot, Spot]);
}

export interface StreetEvent { kind: StreetKind; treasure?: Treasure; neighbor?: string; smell: string }

/** Qué pasa en un lugar. Si llegas a la última parada sin tesoro, ahí encuentras uno. */
export function streetEvent(day: string, stop: number, spot: Spot, found: number): StreetEvent {
  const r = rng(`colonia:${day}:${stop}:${spot}`);
  const info = SPOTS[spot];
  let kind = pick(info.kinds, r);
  if (stop === STREET_STOPS - 1 && found === 0) kind = "tesoro";
  const ev: StreetEvent = { kind, smell: info.smell };
  if (kind === "tesoro") ev.treasure = pick(TREASURES, r).id;
  if (kind === "vecino") ev.neighbor = info.neighbor ?? "abuelito";
  return ev;
}

// ── Escuela de perritos ─────────────────────────────────────────────

export type Command = "sentado" | "echado" | "ven" | "espera" | "pata" | "suelta" | "salta" | "tunel" | "gira" | "reverencia" | "muerto" | "busca";
export const COMMANDS: Record<Command, { say: string; did: string; move: string[] }> = {
  sentado: { say: "¡Sentado!", did: "Se sentó", move: ["translateY(0px) scaleY(1)", "translateY(8px) scaleY(0.88)", "translateY(8px) scaleY(0.88)"] },
  echado: { say: "¡Échate!", did: "Se echó en el piso", move: ["translateY(0px) scaleY(1)", "translateY(18px) scaleY(0.7)", "translateY(18px) scaleY(0.7)"] },
  ven: { say: "¡Ven!", did: "Vino corriendo", move: ["translateX(-40px)", "translateX(0px)", "translateX(0px)"] },
  espera: { say: "¡Espera!", did: "Se quedó quietito", move: ["scale(1)", "scale(1.02)", "scale(1)"] },
  pata: { say: "¡La pata!", did: "Dio la pata", move: ["rotate(0deg)", "rotate(-10deg)", "rotate(-4deg)", "rotate(-10deg)"] },
  suelta: { say: "¡Suelta!", did: "Soltó la pelota", move: ["rotate(0deg)", "rotate(6deg)", "rotate(0deg)"] },
  salta: { say: "¡Salta!", did: "Saltó la valla", move: ["translateY(0px)", "translateY(-44px)", "translateY(0px)"] },
  tunel: { say: "¡Al túnel!", did: "Pasó por el túnel", move: ["translateX(-50px) scale(0.95)", "translateX(0px) scale(0.95)", "translateX(50px) scale(1)", "translateX(0px) scale(1)"] },
  gira: { say: "¡Gira!", did: "Dio una vuelta", move: ["scaleX(1)", "scaleX(-1)", "scaleX(1)"] },
  reverencia: { say: "¡Reverencia!", did: "Hizo una reverencia", move: ["rotate(0deg)", "rotate(14deg) translateY(8px)", "rotate(14deg) translateY(8px)", "rotate(0deg)"] },
  muerto: { say: "¡Hazte el dormido!", did: "Se hizo el dormido", move: ["rotate(0deg)", "rotate(-80deg)", "rotate(-80deg)"] },
  busca: { say: "¡Busca!", did: "Buscó con la nariz", move: ["translateX(0px)", "translateX(-20px)", "translateX(20px)", "translateX(0px)"] },
};

export const COURSES = [
  { id: "cachorro", name: "Curso de cachorro", level: 1, commands: ["sentado", "echado", "ven"] as Command[] },
  { id: "modales", name: "Buenos modales", level: 2, commands: ["espera", "pata", "suelta"] as Command[] },
  { id: "agilidad", name: "Agilidad", level: 3, commands: ["salta", "tunel", "gira"] as Command[] },
  { id: "avanzado", name: "Curso avanzado", level: 5, commands: ["reverencia", "muerto", "busca"] as Command[] },
];
export type CourseId = (typeof COURSES)[number]["id"];
export const CLASSES_PER_COURSE = 3;
export const CLASS_ROUNDS = 5;
export const CLASS_PASS = 4;
export const CLASS_COINS = 4;
export const DIPLOMA_COINS = 15;
export interface School { done?: Record<string, number>; last?: string }

/** Las cinco órdenes de una clase. Mochito todavía se equivoca; en cada clase acierta un poco más. */
export function classPlan(rnd: () => number, course: CourseId, classNo: number) {
  const cmds = COURSES.find((c) => c.id === course)!.commands;
  const right = 0.45 + 0.1 * Math.min(classNo, 2);
  return Array.from({ length: CLASS_ROUNDS }, () => {
    const cmd = pick(cmds, rnd);
    const ok = rnd() < right;
    const others = cmds.filter((c) => c !== cmd);
    return { cmd, did: ok ? cmd : pick(others, rnd) };
  });
}
export const courseClasses = (s: School | undefined, id: string) => Math.min(CLASSES_PER_COURSE, s?.done?.[id] ?? 0);
export const diplomas = (s?: School) => COURSES.filter((c) => courseClasses(s, c.id) >= CLASSES_PER_COURSE).length;
/** El curso que toca: el primero que ya se puede tomar y no ha terminado. */
export const nextCourse = (s: School | undefined, level: number) => COURSES.find((c) => c.level <= level && courseClasses(s, c.id) < CLASSES_PER_COURSE) ?? null;

// ── Cocina de premios ───────────────────────────────────────────────

export type Ingredient = "avena" | "mani" | "huevo" | "agua" | "zanahoria" | "calabaza" | "canela" | "manzana" | "yogur" | "arroz" | "pollo" | "perejil" | "chocolate" | "uvas" | "cebolla" | "sal";
export const INGREDIENTS: Record<Ingredient, { name: string; bad?: string }> = {
  avena: { name: "Avena" }, mani: { name: "Crema de maní" }, huevo: { name: "Huevo" }, agua: { name: "Agua" },
  zanahoria: { name: "Zanahoria rallada" }, calabaza: { name: "Puré de calabaza" }, canela: { name: "Canela" },
  manzana: { name: "Manzana sin semillas" }, yogur: { name: "Yogur natural" }, arroz: { name: "Arroz" }, pollo: { name: "Pollo cocido" }, perejil: { name: "Perejil" },
  chocolate: { name: "Chocolate", bad: "El chocolate le hace daño al corazón y a la pancita de los perritos." },
  uvas: { name: "Uvas", bad: "Las uvas y las pasas les enferman los riñones." },
  cebolla: { name: "Cebolla", bad: "La cebolla le hace daño a su sangre." },
  sal: { name: "Sal", bad: "Mucha sal les da sed y les hace mal." },
};
export const GOOD_INGREDIENTS = (Object.keys(INGREDIENTS) as Ingredient[]).filter((i) => !INGREDIENTS[i].bad);
export const BAD_INGREDIENTS = (Object.keys(INGREDIENTS) as Ingredient[]).filter((i) => INGREDIENTS[i].bad);

export type Treat = "mani" | "zanahoria" | "calabaza" | "manzana" | "pollo";
export const PET_RECIPES: Record<Treat, { name: string; level: number; items: Ingredient[]; color: string }> = {
  mani: { name: "Galletas de crema de maní", level: 1, items: ["avena", "mani", "huevo", "agua"], color: "#c98b4a" },
  zanahoria: { name: "Galletas de zanahoria", level: 1, items: ["avena", "zanahoria", "huevo", "agua"], color: "#e48a3a" },
  calabaza: { name: "Galletas de calabaza", level: 2, items: ["avena", "calabaza", "huevo", "canela"], color: "#e39a3b" },
  manzana: { name: "Galletas de manzana", level: 3, items: ["avena", "manzana", "huevo", "yogur"], color: "#d9b26a" },
  pollo: { name: "Bocaditos de pollo y arroz", level: 4, items: ["arroz", "pollo", "huevo", "perejil"], color: "#d8c49a" },
};
export const TREAT_IDS = Object.keys(PET_RECIPES) as Treat[];
export const treatsFor = (level: number) => TREAT_IDS.filter((t) => PET_RECIPES[t].level <= level);

/** La alacena para una receta: lo que lleva, dos cosas buenas que no lleva y dos que les hacen daño. */
export function pantryFor(t: Treat, rnd: () => number): Ingredient[] {
  const need = PET_RECIPES[t].items;
  const extra = shuffle(GOOD_INGREDIENTS.filter((i) => !need.includes(i)), rnd).slice(0, 2);
  const bad = shuffle(BAD_INGREDIENTS, rnd).slice(0, 2);
  return shuffle([...need, ...extra, ...bad], rnd);
}

export const CUTTERS = [
  { id: "hueso", name: "Hueso" }, { id: "huella", name: "Huellita" }, { id: "corazon", name: "Corazón" }, { id: "estrella", name: "Estrella" },
] as const;
export type Cutter = (typeof CUTTERS)[number]["id"];
export const MIX_TAPS = 8;
export const CUT_COUNT = 6;
export const BAKE_MS = 6000;
export const BAKE_COINS = 5;
export type BakeZone = "crudas" | "doradas" | "tostadas";
/** Cómo salen según cuánto tiempo estuvieron (0 a 1). */
export const bakeZone = (p: number): BakeZone => (p < 0.5 ? "crudas" : p <= 0.8 ? "doradas" : "tostadas");
export const bakeCount = (z: BakeZone) => (z === "doradas" ? 6 : z === "tostadas" ? 4 : 0);

// ── Galletas para Mochito (carriles y pedidos) ──────────────────────

export const LANES = 3;
export const laneX = (lane: number) => (lane + 0.5) / LANES;
export const laneOf = (x: number) => Math.max(0, Math.min(LANES - 1, Math.floor(clamp01(x) * LANES)));
export const WANT_EVERY_MS = 8000;
export const DOG_WHY: Record<string, string> = {
  chocolate: "El chocolate le hace daño al corazón y a la pancita.",
  uvas: "Las uvas le enferman los riñones.",
  cebolla: "La cebolla le hace daño a su sangre.",
};
/** Lo que pide vale doble. */
export const catchPoints = (name: string, want: string) => (name === want ? 2 : 1);

// ── Colorea por números ─────────────────────────────────────────────

/** Puntaje: cada error resta un poquito. */
export const numbersScore = (mistakes: number, regions: number) => (regions <= 0 ? 0 : clamp01(1 - mistakes / regions));

// ── Parejas de sombras ──────────────────────────────────────────────

export const SHADOW_ROUNDS = 3;
export const shadowSpec = (l: Lvl) => (l === "facil" ? { pairs: 3, decoys: 0 } : l === "dificil" ? { pairs: 5, decoys: 2 } : { pairs: 4, decoys: 1 });
/** Una ronda: las cosas de la izquierda y sus sombras revueltas (con alguna sombra de más que no es de nadie). */
export function shadowRound(rnd: () => number, l: Lvl, pool: number) {
  const { pairs, decoys } = shadowSpec(l);
  const all = shuffle(Array.from({ length: pool }, (_, i) => i), rnd);
  const items = all.slice(0, pairs);
  const shadows = shuffle([...items, ...all.slice(pairs, pairs + decoys)], rnd);
  return { items, shadows };
}
export const shadowScore = (mistakes: number, total: number) => (total <= 0 ? 0 : clamp01(1 - mistakes / total));

// ── Tumba latas ─────────────────────────────────────────────────────

export interface Can { r: number; c: number; x: number; y: number }
export const CAN_W = 0.13;
export const CAN_H = 0.2;
/** Una pirámide de latas: abajo `rows`, arriba una. x es el centro; y la base (0 = la mesa). */
export function canTower(rows: number): Can[] {
  const out: Can[] = [];
  for (let r = 0; r < rows; r++) {
    const n = rows - r;
    for (let c = 0; c < n; c++) out.push({ r, c, x: 0.5 + (c - (n - 1) / 2) * CAN_W, y: r * CAN_H });
  }
  return out;
}
/** Las latas que se quedan sin apoyo se caen (en cadena, de abajo hacia arriba). */
export function canSettle(cans: Can[], up: boolean[]): boolean[] {
  const next = [...up];
  const at = (r: number, c: number) => cans.findIndex((k) => k.r === r && k.c === c);
  for (const [i, k] of cans.entries()) {
    if (!next[i] || k.r === 0) continue;
    const a = at(k.r - 1, k.c);
    const b = at(k.r - 1, k.c + 1);
    if (!next[a] || !next[b]) next[i] = false;
  }
  return next;
}
/** ¿A qué lata le pega la pelota en (ax, ay)? */
export function canHit(cans: Can[], up: boolean[], ax: number, ay: number): number | null {
  const i = cans.findIndex((k, j) => up[j] && Math.abs(k.x - ax) <= CAN_W / 2 && ay >= k.y && ay < k.y + CAN_H);
  return i < 0 ? null : i;
}
export const latasSpec = (l: Lvl) => (l === "facil" ? { rows: 3, balls: 3, towers: 3, period: 2200, vertical: false } : l === "dificil" ? { rows: 4, balls: 3, towers: 3, period: 1200, vertical: true } : { rows: 4, balls: 4, towers: 3, period: 1700, vertical: true });
/** La mira va y viene (0 a 1 y de regreso). */
export const sweep = (ms: number, period: number) => { const t = (((ms % period) + period) % period) / period; return t < 0.5 ? t * 2 : 2 - t * 2; };
/** Dónde apunta: la mira de 0 a 1 se pasa a la mesa (x) y a la altura de la torre (y). */
export const aimX = (s: number) => 0.12 + s * 0.76;
export const aimY = (s: number, rows: number) => s * rows * CAN_H * 0.999;
export const latasScore = (down: number, total: number) => (total <= 0 ? 0 : clamp01(down / total));

// ── Bolos ───────────────────────────────────────────────────────────

export interface Pin { x: number; y: number; row: number }
export const BALL_R = 0.06;
export const PIN_R = 0.035;
/** Los pinos en triángulo: la punta adelante (y más chica) y las filas hacia atrás. */
export function pinRack(rows: number): Pin[] {
  const out: Pin[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c <= r; c++) out.push({ row: r, x: 0.5 + (c - r / 2) * 0.12, y: 0.62 + r * 0.1 });
  return out;
}
/** Por dónde va la bola: sale en x0 y se curva hacia un lado mientras avanza (y de 0 a 1). */
export const ballX = (x0: number, curve: number, y: number) => x0 + curve * 0.28 * y * y;
export const inGutter = (x: number) => x < 0.08 || x > 0.92;
/**
 * Los pinos que caen. La bola tumba los que toca; cada pino que cae empuja a los de atrás que tiene cerca,
 * más mientras más fuerza (0 a 1) lleve la bola.
 */
export function bowlKnock(pins: Pin[], up: boolean[], x0: number, curve: number, power: number, rnd: () => number): number[] {
  const down = new Set<number>();
  let gutterAt = 2;
  for (let y = 0; y <= 1.0001; y += 0.02) if (inGutter(ballX(x0, curve, y))) { gutterAt = y; break; }
  pins.forEach((p, i) => {
    if (!up[i] || p.y > gutterAt) return;
    if (Math.abs(ballX(x0, curve, p.y) - p.x) < BALL_R + PIN_R) down.add(i);
  });
  const queue = [...down];
  while (queue.length) {
    const i = queue.shift()!;
    pins.forEach((q, j) => {
      if (!up[j] || down.has(j) || q.row !== pins[i].row + 1 || Math.abs(q.x - pins[i].x) > 0.07) return;
      if (rnd() < 0.35 + power * 0.55) { down.add(j); queue.push(j); }
    });
  }
  return [...down].sort((a, b) => a - b);
}
export const bolosSpec = (l: Lvl) => (l === "facil" ? { rows: 3, frames: 3, period: 2400, bumpers: true } : l === "dificil" ? { rows: 4, frames: 4, period: 1300, bumpers: false } : { rows: 4, frames: 4, period: 1800, bumpers: false });
/** Con barreras, la bola rebota y nunca cae al canal. */
export const bumped = (x0: number, curve: number, bumpers: boolean) => {
  if (!bumpers) return { x0, curve };
  const end = ballX(x0, curve, 1);
  return end < 0.12 || end > 0.88 ? { x0, curve: curve * 0.4 } : { x0, curve };
};
export const bolosScore = (down: number, total: number) => (total <= 0 ? 0 : clamp01(down / total));

// ── Tren de huesos ──────────────────────────────────────────────────

export type Dir4 = "arriba" | "abajo" | "izq" | "der";
const DXY: Record<Dir4, [number, number]> = { arriba: [0, -1], abajo: [0, 1], izq: [-1, 0], der: [1, 0] };
const OPP: Record<Dir4, Dir4> = { arriba: "abajo", abajo: "arriba", izq: "der", der: "izq" };
export const TRAIN_GOAL = 15;
export const trainSpec = (l: Lvl) => (l === "facil" ? { n: 9, tick: 300, wrap: true } : l === "dificil" ? { n: 13, tick: 160, wrap: false } : { n: 11, tick: 220, wrap: false });
export interface Train { body: number[]; dir: Dir4; grow: number; alive: boolean; bones: number }
export function trainStart(n: number): Train {
  const mid = Math.floor(n / 2);
  const c = mid * n + mid;
  return { body: [c, c - 1, c - 2], dir: "der", grow: 0, alive: true, bones: 0 };
}
/** No se puede dar media vuelta de golpe. */
export const canTurn = (cur: Dir4, next: Dir4) => next !== cur && next !== OPP[cur];
/** Un paso del tren. Si come el hueso, crece (se suma un amiguito al final). */
export function trainStep(t: Train, n: number, bone: number, wrap: boolean): { train: Train; ate: boolean } {
  if (!t.alive) return { train: t, ate: false };
  const head = t.body[0];
  let x = (head % n) + DXY[t.dir][0];
  let y = Math.floor(head / n) + DXY[t.dir][1];
  if (wrap) { x = (x + n) % n; y = (y + n) % n; }
  if (x < 0 || y < 0 || x >= n || y >= n) return { train: { ...t, alive: false }, ate: false };
  const cell = y * n + x;
  const ate = cell === bone;
  const grow = t.grow + (ate ? 1 : 0);
  const keep = grow > 0 ? t.body : t.body.slice(0, -1);
  if (keep.includes(cell)) return { train: { ...t, alive: false }, ate: false };
  return { train: { ...t, body: [cell, ...keep], grow: Math.max(0, grow - 1), bones: t.bones + (ate ? 1 : 0) }, ate };
}
/** Un lugar libre para el siguiente hueso. */
export function trainBone(rnd: () => number, n: number, body: number[]): number {
  const free = Array.from({ length: n * n }, (_, i) => i).filter((i) => !body.includes(i));
  return free.length ? free[Math.floor(rnd() * free.length) % free.length] : -1;
}
export const trainScore = (bones: number) => clamp01(bones / TRAIN_GOAL);

// ── Toca el tambor ──────────────────────────────────────────────────

export const DRUMS = 4;
export const DRUM_GOAL = 10;
export const drumSpec = (l: Lvl) => (l === "facil" ? { start: 2, gap: 750, retries: 2 } : l === "dificil" ? { start: 3, gap: 420, retries: 0 } : { start: 3, gap: 580, retries: 1 });
export const drumSeq = (rnd: () => number, len: number) => Array.from({ length: len }, () => Math.floor(rnd() * DRUMS) % DRUMS);
/** Puntaje según la melodía más larga que repitió bien. */
export const drumScore = (best: number, start: number) => clamp01((best - start + 1) / (DRUM_GOAL - start + 1));
