import { dayKey, rng } from "./game/engine";
import { WALK_EXTRA } from "./mochito-lines";

// Lo que Mochito va ganando contigo: nivel, trucos, medallas y su paseo del día. Lógica pura.

export interface MochitoStats {
  xp: number;
  pets: number;
  treats: number;
  games: number;
  walks: number;
  baths?: number;
  photos?: number;
  vets?: number;
  stories?: number;
  shows?: number;
  grooms?: number;
  trips?: number;
  parties?: number;
  streets?: number;
  classes?: number;
  bakes?: number;
  buddy?: number;
  letters?: number;
  camps?: number;
  stands?: number;
  brushes?: number;
  fairs?: number;
  fbdays?: number;
  daycares?: number;
  plays?: number;
  cleans?: number;
  repairs?: number;
  kites?: number;
  beaches?: number;
  sleepovers?: number;
  chores?: number;
  markets?: number;
  digs?: number;
  picnics?: number;
  races?: number;
  farms?: number;
  nights?: number;
  swims?: number;
  washes?: number;
  zoos?: number;
  movies?: number;
  fires?: number;
  balloons?: number;
  days: string[]; // días en que lo cuidaste
  walk_day?: string; // último día que salió de paseo
  xp_day?: string;
  xp_today?: number;
  count_day?: string; // día de las cuentas de hoy
  count?: Partial<Record<CareKind, number>>; // lo que hicieron hoy (para las misiones)
}

export type CareKind = "pet" | "treat" | "game" | "walk" | "trick" | "bath" | "photo" | "vet" | "story" | "show" | "groom" | "trip" | "party" | "garden" | "street" | "school" | "bake" | "buddy" | "letter" | "camp" | "stand" | "teeth" | "tree" | "fair" | "fbday" | "daycare" | "theater" | "clean" | "repair" | "kite" | "beach" | "sleepover" | "chores" | "market" | "dig" | "picnic" | "race" | "farm" | "night" | "pool" | "carwash" | "zoo" | "cinema" | "fire" | "balloon";

export const EMPTY_STATS: MochitoStats = { xp: 0, pets: 0, treats: 0, games: 0, walks: 0, days: [] };

export const CARE_XP: Record<CareKind, number> = { pet: 2, treat: 4, game: 6, walk: 8, trick: 10, bath: 6, photo: 2, vet: 6, story: 4, show: 10, groom: 6, trip: 12, party: 15, garden: 3, street: 8, school: 8, bake: 5, buddy: 3, letter: 4, camp: 12, stand: 8, teeth: 4, tree: 6, fair: 12, fbday: 8, daycare: 10, theater: 6, clean: 8, repair: 8, kite: 8, beach: 10, sleepover: 12, chores: 4, market: 8, dig: 8, picnic: 10, race: 12, farm: 10, night: 8, pool: 10, carwash: 8, zoo: 10, cinema: 8, fire: 12, balloon: 10 };
/** Tope de experiencia por día con cariños, galletas y juegos (el paseo y los trucos no cuentan). */
export const DAILY_XP = 40;
export const PET_XP_EVERY_MS = 5 * 60_000;

/** Suma lo que hiciste con Mochito. `lastPet` evita que acariciarlo sin parar suba el nivel de golpe. */
export function applyCare(stats: MochitoStats | undefined, kind: CareKind, now: number, lastPet?: number): MochitoStats {
  const s: MochitoStats = { ...EMPTY_STATS, ...stats, days: [...(stats?.days ?? [])] };
  const day = dayKey(now);
  if (!s.days.includes(day)) s.days = [...s.days, day].slice(-400);
  s.count = s.count_day === day ? { ...s.count } : {};
  s.count_day = day;
  s.count[kind] = (s.count[kind] ?? 0) + 1;
  if (kind === "pet") s.pets++;
  if (kind === "treat") s.treats++;
  if (kind === "game") s.games++;
  if (kind === "walk") { s.walks++; s.walk_day = day; }
  if (kind === "bath") s.baths = (s.baths ?? 0) + 1;
  if (kind === "photo") s.photos = (s.photos ?? 0) + 1;
  if (kind === "vet") s.vets = (s.vets ?? 0) + 1;
  if (kind === "story") s.stories = (s.stories ?? 0) + 1;
  if (kind === "show") s.shows = (s.shows ?? 0) + 1;
  if (kind === "groom") s.grooms = (s.grooms ?? 0) + 1;
  if (kind === "trip") s.trips = (s.trips ?? 0) + 1;
  if (kind === "party") s.parties = (s.parties ?? 0) + 1;
  if (kind === "street") s.streets = (s.streets ?? 0) + 1;
  if (kind === "school") s.classes = (s.classes ?? 0) + 1;
  if (kind === "bake") s.bakes = (s.bakes ?? 0) + 1;
  if (kind === "buddy") s.buddy = (s.buddy ?? 0) + 1;
  if (kind === "letter") s.letters = (s.letters ?? 0) + 1;
  if (kind === "camp") s.camps = (s.camps ?? 0) + 1;
  if (kind === "stand") s.stands = (s.stands ?? 0) + 1;
  if (kind === "teeth") s.brushes = (s.brushes ?? 0) + 1;
  if (kind === "fair") s.fairs = (s.fairs ?? 0) + 1;
  if (kind === "fbday") s.fbdays = (s.fbdays ?? 0) + 1;
  if (kind === "daycare") s.daycares = (s.daycares ?? 0) + 1;
  if (kind === "theater") s.plays = (s.plays ?? 0) + 1;
  if (kind === "clean") s.cleans = (s.cleans ?? 0) + 1;
  if (kind === "repair") s.repairs = (s.repairs ?? 0) + 1;
  if (kind === "kite") s.kites = (s.kites ?? 0) + 1;
  if (kind === "beach") s.beaches = (s.beaches ?? 0) + 1;
  if (kind === "sleepover") s.sleepovers = (s.sleepovers ?? 0) + 1;
  if (kind === "chores") s.chores = (s.chores ?? 0) + 1;
  if (kind === "market") s.markets = (s.markets ?? 0) + 1;
  if (kind === "dig") s.digs = (s.digs ?? 0) + 1;
  if (kind === "picnic") s.picnics = (s.picnics ?? 0) + 1;
  if (kind === "race") s.races = (s.races ?? 0) + 1;
  if (kind === "farm") s.farms = (s.farms ?? 0) + 1;
  if (kind === "night") s.nights = (s.nights ?? 0) + 1;
  if (kind === "pool") s.swims = (s.swims ?? 0) + 1;
  if (kind === "carwash") s.washes = (s.washes ?? 0) + 1;
  if (kind === "zoo") s.zoos = (s.zoos ?? 0) + 1;
  if (kind === "cinema") s.movies = (s.movies ?? 0) + 1;
  if (kind === "fire") s.fires = (s.fires ?? 0) + 1;
  if (kind === "balloon") s.balloons = (s.balloons ?? 0) + 1;

  let gain = CARE_XP[kind];
  if (kind === "pet" && lastPet && now - lastPet < PET_XP_EVERY_MS) gain = 0;
  if (kind === "pet" || kind === "treat" || kind === "game" || kind === "bath" || kind === "photo" || kind === "vet" || kind === "story" || kind === "groom" || kind === "garden" || kind === "bake" || kind === "buddy" || kind === "teeth") {
    const today = s.xp_day === day ? (s.xp_today ?? 0) : 0;
    gain = Math.max(0, Math.min(gain, DAILY_XP - today));
    s.xp_day = day;
    s.xp_today = today + gain;
  }
  s.xp += gain;
  return s;
}

// ── Nivel ───────────────────────────────────────────────────────────

export const MAX_LEVEL = 15;
/** Experiencia total para llegar a un nivel: 0, 10, 30, 60, 100… */
export const xpForLevel = (level: number) => (5 * (level - 1) * level);

export function mochitoLevel(xp: number) {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  const from = xpForLevel(level);
  const to = level < MAX_LEVEL ? xpForLevel(level + 1) : from;
  return { level, have: xp - from, need: to - from, max: level >= MAX_LEVEL };
}

// ── Trucos ──────────────────────────────────────────────────────────

export interface Trick { id: string; name: string; level: number; says: string }

export const TRICKS: Trick[] = [
  { id: "sentarse", name: "Sentarse", level: 1, says: "¡Sentado! ¿Lo hice bien?" },
  { id: "pata", name: "Dar la pata", level: 2, says: "Toma mi patita. ¡Somos amigos!" },
  { id: "girar", name: "Girar", level: 3, says: "¡Vuelta y vuelta! Me mareé un poquito." },
  { id: "saltar", name: "Saltar", level: 5, says: "¡Brinco alto como un panqué que sube!" },
  { id: "rodar", name: "Rodar", level: 7, says: "¡Rodé como una dona!" },
  { id: "muerto", name: "Hacerse el dormido", level: 9, says: "Zzz… ¡Ja! Era broma." },
  { id: "bailar", name: "Bailar", level: 12, says: "¡A bailar! Esta canción me encanta." },
];

export const TEACH_TRIES = 3;

export const trickReady = (t: Trick, level: number) => level >= t.level;

// ── Medallas ────────────────────────────────────────────────────────

export interface MedalInput { stats: MochitoStats; tricks: string[]; level: number; things: number; friends?: number; stickers?: number; weathers?: number; storiesRead?: number; blue?: number; harvests?: number; seedKinds?: number; places?: number; cozy?: number; treasures?: number; diplomas?: number; bakedKinds?: number; buddyHearts?: number; stars?: number; perfectStand?: boolean; teethBest?: number; treeParts?: number; bigPrizes?: number; fbdayFriends?: number; recycled?: number; toyKinds?: number; perfectDaycare?: boolean; kiteBest?: number; shellKinds?: number; sleepFriends?: number; choreStars?: number; exactChange?: number; dinoParts?: number; perfectPicnic?: boolean; raceWins?: number; farmEggs?: number; skyKinds?: number; allRings?: boolean; zooKinds?: number; perfectMovies?: number; catsSaved?: number; placesUp?: number }
export interface Medal { id: string; name: string; desc: string; coins: number; check: (m: MedalInput) => boolean }

export const MEDALS: Medal[] = [
  { id: "carino-1", name: "Primer cariño", desc: "Acaricia a Mochito por primera vez.", coins: 5, check: (m) => m.stats.pets >= 1 },
  { id: "carino-50", name: "Mejores amigos", desc: "Dale 50 cariños.", coins: 10, check: (m) => m.stats.pets >= 50 },
  { id: "galleta-25", name: "Panza contenta", desc: "Dale 25 galletas.", coins: 10, check: (m) => m.stats.treats >= 25 },
  { id: "galleta-100", name: "Chef de Mochito", desc: "Dale 100 galletas.", coins: 20, check: (m) => m.stats.treats >= 100 },
  { id: "dias-7", name: "Una semana juntos", desc: "Cuídalo 7 días distintos.", coins: 15, check: (m) => m.stats.days.length >= 7 },
  { id: "dias-30", name: "Un mes juntos", desc: "Cuídalo 30 días distintos.", coins: 30, check: (m) => m.stats.days.length >= 30 },
  { id: "paseo-1", name: "Primer paseo", desc: "Sácalo a pasear.", coins: 5, check: (m) => m.stats.walks >= 1 },
  { id: "paseo-10", name: "Explorador", desc: "Sácalo a pasear 10 veces.", coins: 15, check: (m) => m.stats.walks >= 10 },
  { id: "juego-10", name: "Compañero de juegos", desc: "Juega 10 partidas con él.", coins: 10, check: (m) => m.stats.games >= 10 },
  { id: "truco-1", name: "Primer truco", desc: "Enséñale un truco.", coins: 5, check: (m) => m.tricks.length >= 1 },
  { id: "truco-todos", name: "Perrito de circo", desc: "Enséñale todos los trucos.", coins: 25, check: (m) => TRICKS.every((t) => m.tricks.includes(t.id)) },
  { id: "nivel-5", name: "Nivel 5", desc: "Lleva a Mochito al nivel 5.", coins: 10, check: (m) => m.level >= 5 },
  { id: "nivel-10", name: "Nivel 10", desc: "Lleva a Mochito al nivel 10.", coins: 20, check: (m) => m.level >= 10 },
  { id: "casita", name: "Su casita", desc: "Ponle cama, platito y juguete.", coins: 10, check: (m) => m.things >= 3 },
  { id: "bano-1", name: "Rechinando de limpio", desc: "Báñalo por primera vez.", coins: 5, check: (m) => (m.stats.baths ?? 0) >= 1 },
  { id: "bano-10", name: "Siempre limpiecito", desc: "Báñalo 10 veces.", coins: 10, check: (m) => (m.stats.baths ?? 0) >= 10 },
  { id: "foto-5", name: "Fotógrafo", desc: "Tómale 5 fotos.", coins: 10, check: (m) => (m.stats.photos ?? 0) >= 5 },
  { id: "amigo-1", name: "Primer amigo", desc: "Haz un amigo en el paseo.", coins: 10, check: (m) => (m.friends ?? 0) >= 1 },
  { id: "pegatinas-10", name: "Coleccionista", desc: "Junta 10 pegatinas distintas.", coins: 10, check: (m) => (m.stickers ?? 0) >= 10 },
  { id: "pegatinas-todas", name: "Álbum completo", desc: "Junta las 32 pegatinas.", coins: 40, check: (m) => (m.stickers ?? 0) >= 32 },
  { id: "vet-1", name: "Paciente valiente", desc: "Llévalo al veterinario.", coins: 5, check: (m) => (m.stats.vets ?? 0) >= 1 },
  { id: "vet-5", name: "Siempre sanito", desc: "Llévalo 5 veces al veterinario.", coins: 15, check: (m) => (m.stats.vets ?? 0) >= 5 },
  { id: "cuentos-todos", name: "Cuentacuentos", desc: "Léele los 6 cuentos para dormir.", coins: 15, check: (m) => (m.storiesRead ?? 0) >= 6 },
  { id: "cuentos-10", name: "Buenas noches", desc: "Léele 10 cuentos.", coins: 10, check: (m) => (m.stats.stories ?? 0) >= 10 },
  { id: "liston-azul", name: "Campeón del parque", desc: "Gana el listón azul en el concurso.", coins: 20, check: (m) => (m.blue ?? 0) >= 1 },
  { id: "clima-todos", name: "Llueva o truene", desc: "Pasea con sol, lluvia, viento y hojas.", coins: 15, check: (m) => (m.weathers ?? 0) >= 4 },
  { id: "jardin-1", name: "Primera cosecha", desc: "Cosecha algo de su jardín.", coins: 5, check: (m) => (m.harvests ?? 0) >= 1 },
  { id: "jardin-20", name: "Manos verdes", desc: "Cosecha 20 veces.", coins: 15, check: (m) => (m.harvests ?? 0) >= 20 },
  { id: "jardin-todo", name: "Huerto completo", desc: "Cosecha las 6 semillas distintas.", coins: 20, check: (m) => (m.seedKinds ?? 0) >= 6 },
  { id: "pelu-1", name: "Recién peinado", desc: "Llévalo a la peluquería.", coins: 5, check: (m) => (m.stats.grooms ?? 0) >= 1 },
  { id: "pelu-10", name: "Pelo de concurso", desc: "Péinalo 10 veces.", coins: 10, check: (m) => (m.stats.grooms ?? 0) >= 10 },
  { id: "viaje-1", name: "Mochilero", desc: "Llévalo de viaje un fin de semana.", coins: 10, check: (m) => (m.places ?? 0) >= 1 },
  { id: "viaje-todos", name: "Trotamundos", desc: "Visita los 6 lugares de viaje.", coins: 30, check: (m) => (m.places ?? 0) >= 6 },
  { id: "fiesta-1", name: "Fiestero", desc: "Hazle su fiesta de cumpleaños o de cumplemés.", coins: 10, check: (m) => (m.stats.parties ?? 0) >= 1 },
  { id: "cuarto-4", name: "Hogar, dulce hogar", desc: "Decora 4 rincones de su cuarto.", coins: 10, check: (m) => (m.cozy ?? 0) >= 4 },
  { id: "cuarto-todo", name: "Cuarto de revista", desc: "Decora los 7 rincones de su cuarto.", coins: 25, check: (m) => (m.cozy ?? 0) >= 7 },
  { id: "colonia-1", name: "Vecino nuevo", desc: "Pasea con correa por la colonia.", coins: 5, check: (m) => (m.stats.streets ?? 0) >= 1 },
  { id: "tesoros-todos", name: "Cazatesoros", desc: "Junta los 10 tesoros de la colonia.", coins: 25, check: (m) => (m.treasures ?? 0) >= 10 },
  { id: "escuela-1", name: "Primer diploma", desc: "Termina un curso en la escuela de perritos.", coins: 10, check: (m) => (m.diplomas ?? 0) >= 1 },
  { id: "escuela-todas", name: "Graduado con honores", desc: "Gana los 4 diplomas de la escuela.", coins: 30, check: (m) => (m.diplomas ?? 0) >= 4 },
  { id: "horno-1", name: "Pastelero canino", desc: "Hornéale una tanda de premios.", coins: 5, check: (m) => (m.stats.bakes ?? 0) >= 1 },
  { id: "horno-todas", name: "Chef de premios", desc: "Hornea las 5 recetas de premios.", coins: 20, check: (m) => (m.bakedKinds ?? 0) >= 5 },
  { id: "mascota-1", name: "Hermanito nuevo", desc: "Adopta una mascota para Mochito.", coins: 10, check: (m) => (m.stats.buddy ?? 0) >= 1 },
  { id: "mascota-30", name: "Inseparables", desc: "Junta 30 corazones con su mascota.", coins: 25, check: (m) => (m.buddyHearts ?? 0) >= 30 },
  { id: "cartas-1", name: "Correo para mí", desc: "Contesta una carta de un amigo.", coins: 5, check: (m) => (m.stats.letters ?? 0) >= 1 },
  { id: "cartas-10", name: "Amigo por carta", desc: "Contesta 10 cartas.", coins: 15, check: (m) => (m.stats.letters ?? 0) >= 10 },
  { id: "campamento-1", name: "Explorador", desc: "Acampa una noche con Mochito.", coins: 10, check: (m) => (m.stats.camps ?? 0) >= 1 },
  { id: "estrellas-todas", name: "Cielo completo", desc: "Descubre las 6 constelaciones.", coins: 30, check: (m) => (m.stars ?? 0) >= 6 },
  { id: "limonada-1", name: "Pequeño comerciante", desc: "Abre el puesto de limonada.", coins: 5, check: (m) => (m.stats.stands ?? 0) >= 1 },
  { id: "limonada-perfecta", name: "Servicio perfecto", desc: "Atiende los 5 pedidos del día sin un error.", coins: 15, check: (m) => !!m.perfectStand },
  { id: "dientes-7", name: "Sonrisa brillante", desc: "Cepíllale los dientes 7 días seguidos.", coins: 15, check: (m) => (m.teethBest ?? 0) >= 7 },
  { id: "dientes-30", name: "Dientes de campeón", desc: "Cepíllale los dientes 30 días en total.", coins: 25, check: (m) => (m.stats.brushes ?? 0) >= 30 },
  { id: "arbol-1", name: "Carpintero", desc: "Construye la primera parte de la casita del árbol.", coins: 5, check: (m) => (m.treeParts ?? 0) >= 1 },
  { id: "arbol-todo", name: "Casita en las alturas", desc: "Termina la casita del árbol.", coins: 30, check: (m) => (m.treeParts ?? 0) >= 7 },
  { id: "feria-1", name: "¡A la feria!", desc: "Ve a la feria del mes.", coins: 10, check: (m) => (m.stats.fairs ?? 0) >= 1 },
  { id: "feria-grande", name: "Puntería de oro", desc: "Gana un premio grande en el tiro al blanco.", coins: 15, check: (m) => (m.bigPrizes ?? 0) >= 1 },
  { id: "cumple-amigo-1", name: "Buen amigo", desc: "Festeja el cumpleaños de un perrito del parque.", coins: 10, check: (m) => (m.stats.fbdays ?? 0) >= 1 },
  { id: "cumple-amigos-todos", name: "Nunca se le olvida", desc: "Festeja el cumpleaños de los 8 perritos del parque.", coins: 30, check: (m) => (m.fbdayFriends ?? 0) >= 8 },
  { id: "guarderia-1", name: "Cuidacachorros", desc: "Cuida a los cachorritos de los vecinos.", coins: 10, check: (m) => (m.stats.daycares ?? 0) >= 1 },
  { id: "guarderia-perfecta", name: "Todos felices", desc: "Cuida a los cachorritos sin un solo error.", coins: 15, check: (m) => !!m.perfectDaycare },
  { id: "teatro-1", name: "¡Se abre el telón!", desc: "Presenta una obra de títeres.", coins: 5, check: (m) => (m.stats.plays ?? 0) >= 1 },
  { id: "teatro-10", name: "Gran director", desc: "Presenta 10 obras.", coins: 20, check: (m) => (m.stats.plays ?? 0) >= 10 },
  { id: "parque-1", name: "Parque limpio", desc: "Limpia el parque una vez.", coins: 5, check: (m) => (m.stats.cleans ?? 0) >= 1 },
  { id: "parque-100", name: "Amigo del planeta", desc: "Recicla bien 100 cosas.", coins: 25, check: (m) => (m.recycled ?? 0) >= 100 },
  { id: "taller-1", name: "Manitas", desc: "Arregla un juguete en el taller.", coins: 5, check: (m) => (m.stats.repairs ?? 0) >= 1 },
  { id: "taller-todos", name: "Doctor de juguetes", desc: "Arregla los 4 tipos de juguete.", coins: 20, check: (m) => (m.toyKinds ?? 0) >= 4 },
  { id: "barrilete-1", name: "Al viento", desc: "Vuela el barrilete por primera vez.", coins: 5, check: (m) => (m.stats.kites ?? 0) >= 1 },
  { id: "barrilete-alto", name: "Hasta las nubes", desc: "Sube el barrilete a 100 metros.", coins: 15, check: (m) => (m.kiteBest ?? 0) >= 100 },
  { id: "playa-1", name: "Pies en la arena", desc: "Pasa un día en la playa.", coins: 5, check: (m) => (m.stats.beaches ?? 0) >= 1 },
  { id: "playa-conchas", name: "Coleccionista de conchas", desc: "Junta las 6 cosas distintas del mar.", coins: 25, check: (m) => (m.shellKinds ?? 0) >= 6 },
  { id: "pijamada-1", name: "Noche de pijamas", desc: "Haz una pijamada con un amigo.", coins: 10, check: (m) => (m.stats.sleepovers ?? 0) >= 1 },
  { id: "pijamada-3", name: "Casa llena", desc: "Haz pijamada con 3 amigos distintos.", coins: 20, check: (m) => (m.sleepFriends ?? 0) >= 3 },
  { id: "casa-1", name: "Gran ayudante", desc: "Haz una tarea de la casa.", coins: 5, check: (m) => (m.stats.chores ?? 0) >= 1 },
  { id: "casa-50", name: "Estrella de la casa", desc: "Junta 50 estrellas ayudando en casa.", coins: 25, check: (m) => (m.choreStars ?? 0) >= 50 },
  { id: "mercado-1", name: "De compras", desc: "Ve al mercado con la lista.", coins: 5, check: (m) => (m.stats.markets ?? 0) >= 1 },
  { id: "mercado-vuelto", name: "Cuentas claras", desc: "Elige bien el vuelto 5 veces.", coins: 15, check: (m) => (m.exactChange ?? 0) >= 5 },
  { id: "fosil-1", name: "Buscahuesos", desc: "Desentierra tu primer fósil.", coins: 5, check: (m) => (m.stats.digs ?? 0) >= 1 },
  { id: "fosil-dino", name: "Museo abierto", desc: "Arma un dinosaurio completo.", coins: 25, check: (m) => (m.dinoParts ?? 0) >= 6 },
  { id: "picnic-1", name: "Día de campo", desc: "Haz un picnic en el parque.", coins: 5, check: (m) => (m.stats.picnics ?? 0) >= 1 },
  { id: "picnic-perfecto", name: "Ni una hormiga", desc: "Termina un picnic sin que se lleven nada.", coins: 15, check: (m) => !!m.perfectPicnic },
  { id: "carrera-1", name: "¡Arrancan!", desc: "Corre en la carrera de carritos.", coins: 5, check: (m) => (m.stats.races ?? 0) >= 1 },
  { id: "carrera-ganar", name: "Primer lugar", desc: "Gana la carrera de carritos de la semana.", coins: 20, check: (m) => (m.raceWins ?? 0) >= 1 },
  { id: "granja-1", name: "Día en la granja", desc: "Visita la granja y dale de comer a los animales.", coins: 5, check: (m) => (m.stats.farms ?? 0) >= 1 },
  { id: "granja-huevos", name: "Canasta de huevos", desc: "Junta 20 huevos en la granja.", coins: 20, check: (m) => (m.farmEggs ?? 0) >= 20 },
  { id: "cielo-1", name: "Ojos al cielo", desc: "Mira el cielo con el telescopio.", coins: 5, check: (m) => (m.stats.nights ?? 0) >= 1 },
  { id: "cielo-todos", name: "Cuaderno del cielo", desc: "Encuentra las 6 cosas del cielo.", coins: 25, check: (m) => (m.skyKinds ?? 0) >= 6 },
  { id: "piscina-1", name: "¡Al agua!", desc: "Ve a la piscina.", coins: 5, check: (m) => (m.stats.swims ?? 0) >= 1 },
  { id: "piscina-aros", name: "Buzo estrella", desc: "Saca los 6 aros en una sola zambullida.", coins: 15, check: (m) => !!m.allRings },
  { id: "carro-1", name: "Carro brillante", desc: "Lava el carro de la familia.", coins: 5, check: (m) => (m.stats.washes ?? 0) >= 1 },
  { id: "carro-10", name: "Autolavado Mochito", desc: "Lava el carro 10 veces.", coins: 20, check: (m) => (m.stats.washes ?? 0) >= 10 },
  { id: "zoo-1", name: "Safari de un día", desc: "Visita el zoológico.", coins: 5, check: (m) => (m.stats.zoos ?? 0) >= 1 },
  { id: "zoo-todos", name: "Álbum del zoológico", desc: "Conoce a los 12 animales del zoológico.", coins: 25, check: (m) => (m.zooKinds ?? 0) >= 12 },
  { id: "cine-1", name: "Función de estreno", desc: "Ve una película en el cine.", coins: 5, check: (m) => (m.stats.movies ?? 0) >= 1 },
  { id: "cine-preguntas", name: "Ojo de crítico", desc: "Contesta bien todas las preguntas de 3 películas.", coins: 15, check: (m) => (m.perfectMovies ?? 0) >= 3 },
  { id: "bomberos-1", name: "Bombero de un día", desc: "Apaga los fuegos con los bomberos.", coins: 5, check: (m) => (m.stats.fires ?? 0) >= 1 },
  { id: "bomberos-gatos", name: "Rescatista", desc: "Baja 5 gatitos de los árboles.", coins: 20, check: (m) => (m.catsSaved ?? 0) >= 5 },
  { id: "globo-1", name: "Por las nubes", desc: "Da un paseo en globo.", coins: 5, check: (m) => (m.stats.balloons ?? 0) >= 1 },
  { id: "globo-lugares", name: "Mapa desde arriba", desc: "Fotografía los 8 lugares del pueblo desde el globo.", coins: 25, check: (m) => (m.placesUp ?? 0) >= 8 },
  { id: "amigos-todos", name: "Amigo de todos", desc: "Hazte amigo de todos los perritos del parque.", coins: 30, check: (m) => (m.friends ?? 0) >= FRIENDS.length },
];

export const medalEventId = (id: string) => `mochito-medalla:${id}`;
export const earnedMedals = (m: MedalInput) => MEDALS.filter((x) => x.check(m));

// ── Paseo del día ───────────────────────────────────────────────────

export const WALK_LINES_BASE = [
  "¡Olí una flor que olía a vainilla!",
  "Vi una ardilla. Ella me vio a mí. Empate.",
  "Saludé a un perrito nuevo. Se llama Panqué.",
  "Encontré un charquito y NO me metí. Bueno, un poquito.",
  "El parque huele a pan recién hecho. ¿Será tu local?",
  "Una señora me dijo que soy muy guapo. Tiene razón.",
  "Perseguí una hoja. Gané yo.",
  "Me senté bajo un árbol a pensar en galletas.",
];
export const WALK_LINES = [...WALK_LINES_BASE, ...WALK_EXTRA];

export type WalkFind =
  | { kind: "coins"; coins: number; text: string }
  | { kind: "line"; text: string }
  | { kind: "wear"; text: string; itemId: string; itemName: string };

export const walkedToday = (stats: MochitoStats | undefined, now: number) => stats?.walk_day === dayKey(now);

/** Lo que encuentra en el paseo: sale de la fecha, así no cambia si vuelves a abrirlo. */
export function walkFind(now: number, cheapWear: { id: string; name: string }[]): WalkFind {
  const rnd = rng(`paseo:${dayKey(now)}`);
  const roll = rnd();
  if (roll < 0.2 && cheapWear.length) {
    const it = cheapWear[Math.floor(rnd() * cheapWear.length)];
    return { kind: "wear", itemId: it.id, itemName: it.name, text: `¡Encontré algo para ponernos! Es: ${it.name}.` };
  }
  if (roll < 0.7) {
    const coins = 3 + Math.floor(rnd() * 6);
    return { kind: "coins", coins, text: `¡Encontré ${coins} monedas brillantes debajo de una banca!` };
  }
  return { kind: "line", text: WALK_LINES[Math.floor(rnd() * WALK_LINES.length)] };
}

// ── Atrapa la pelota ────────────────────────────────────────────────

export const FETCH_THROWS = 5;
/** La fuerza sube y baja mientras mantienes presionado (0 a 1 y de regreso). */
export function chargeAt(ms: number, period: number) {
  const t = (ms % period) / period;
  return t < 0.5 ? t * 2 : 2 - t * 2;
}
export const fetchPeriod = (l: "facil" | "normal" | "dificil") => (l === "facil" ? 2200 : l === "dificil" ? 1100 : 1600);
/** Dónde cae la pelota (0 a 1 de la cancha) según la fuerza. */
export const landingOf = (power: number) => 0.2 + Math.max(0, Math.min(1, power)) * 0.72;
/** Dónde está la banderita: más lejos en difícil. */
export function fetchTarget(rnd: () => number, l: "facil" | "normal" | "dificil") {
  const min = l === "dificil" ? 0.55 : 0.35;
  return min + rnd() * (0.92 - min);
}
/** Puntos de un tiro (0 a 1): más cerca de la bandera, más puntos; lejos también suma un poco. */
export function fetchPoints(landing: number, target: number, l: "facil" | "normal" | "dificil" = "normal") {
  const tol = l === "facil" ? 0.3 : l === "dificil" ? 0.16 : 0.22;
  const close = Math.max(0, 1 - Math.abs(landing - target) / tol);
  return Math.round(Math.min(1, close * 0.85 + target * 0.15) * 100) / 100;
}

// ── Escondidas ──────────────────────────────────────────────────────

export const HIDE_SPOTS = ["Vitrina", "Maceta", "Caja", "Horno", "Costal de harina", "Cortina", "Mesa", "Banco", "Carrito", "Canasta"];
export const HIDE_ROUNDS = 5;
export const hideCount = (l: "facil" | "normal" | "dificil") => (l === "facil" ? 4 : l === "dificil" ? 9 : 6);
export const hideMs = (l: "facil" | "normal" | "dificil") => (l === "facil" ? 10_000 : l === "dificil" ? 6_000 : 8_000);

export function hideRound(rnd: () => number, l: "facil" | "normal" | "dificil") {
  const pool = [...HIDE_SPOTS];
  const spots: string[] = [];
  for (let i = 0; i < hideCount(l); i++) spots.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return { spots, at: Math.floor(rnd() * spots.length) };
}

/** Puntaje de una ronda: encontrarlo vale 0.6 y lo rápido el resto; cada error resta un poco. */
export function hideRoundScore(found: boolean, leftMs: number, totalMs: number, misses: number) {
  if (!found) return 0;
  return Math.max(0.3, Math.min(1, 0.6 + 0.4 * (leftMs / totalMs) - misses * 0.1));
}

// ── Baño y cepillado ────────────────────────────────────────────────

const HOUR_MS = 3_600_000;
/** Limpieza (0 a 100): baja en 3 días; con lodo del paseo queda en 0 hasta bañarlo. */
export function cleanOf(care: { washed?: number; muddy?: boolean } | undefined, now: number) {
  if (care?.muddy) return 0;
  if (!care?.washed) return 60;
  return Math.max(0, Math.min(100, Math.round(100 - ((now - care.washed) / HOUR_MS / 72) * 100)));
}
export const SCRUB_STEPS = 10; // pasadas para enjabonar y para cepillar

// ── Amiguitos del parque ────────────────────────────────────────────

export interface Friend { id: string; name: string; coat: string; ear: string; spot?: string; says: string }

export const FRIENDS: Friend[] = [
  { id: "panque", name: "Panqué", coat: "#e9c48f", ear: "#b9854c", says: "¡Hola! Huelo a vainilla, ¿y tú?" },
  { id: "canela", name: "Canela", coat: "#c9763f", ear: "#8a4a22", says: "¿Jugamos a perseguirnos la cola?" },
  { id: "pimienta", name: "Pimienta", coat: "#5b5b63", ear: "#2f2f35", spot: "#f4f4f4", says: "Yo cuido el parque. Es mi trabajo." },
  { id: "chispa", name: "Chispa", coat: "#f6f0e4", ear: "#d7b98d", spot: "#c58a4b", says: "¡Corro más rápido que el viento!" },
  { id: "nube", name: "Nube", coat: "#ffffff", ear: "#e3e3ea", says: "Me gusta dormir bajo los árboles." },
  { id: "tamal", name: "Tamal", coat: "#a86d3c", ear: "#6e4322", spot: "#f0d7b0", says: "¿Tienes algo de comer? Pregunto nomás." },
  { id: "rayo", name: "Rayo", coat: "#efd36b", ear: "#c49a2a", says: "¡Una pelota! ¿Dónde? ¿Dónde?" },
  { id: "luna", name: "Luna", coat: "#3d3a4a", ear: "#23212b", spot: "#d8d3e8", says: "De noche veo las estrellas contigo." },
];

export const FRIEND_AT = 3; // encuentros para ser amigos

/** En el paseo, a veces se encuentra a un perrito. Sale de la fecha, así no cambia en el día. */
export function walkMeet(now: number): Friend | null {
  const rnd = rng(`amigo:${dayKey(now)}`);
  if (rnd() >= 0.55) return null;
  return FRIENDS[Math.floor(rnd() * FRIENDS.length)];
}
export const friendsOf = (met: Record<string, number> | undefined) => FRIENDS.filter((f) => (met?.[f.id] ?? 0) >= FRIEND_AT);
/** Qué amigo viene de visita al local hoy (si tienes amigos). */
export function visitorOf(met: Record<string, number> | undefined, now: number): Friend | null {
  const list = friendsOf(met);
  if (!list.length) return null;
  return list[Math.floor(rng(`visita:${dayKey(now)}`)() * list.length)];
}

// ── Ayudante en el local ────────────────────────────────────────────

/** Lo que Mochito aporta en un turno de Dulce Co. según su nivel, sus trucos y sus amigos. */
export function mochitoHelper(level: number, tricks: number, friends: number) {
  return {
    appeal: Math.min(8, 3 + Math.floor(level / 3)) + Math.min(3, friends),
    patienceMs: Math.min(3000, tricks * 400),
    tipBonus: Math.min(0.06, Math.round(level * 0.004 * 1000) / 1000),
    findChance: Math.min(0.4, 0.1 + level * 0.02),
  };
}
/** Si encuentra propinas debajo de las mesas al terminar el turno (y cuántas monedas). */
export function helperFind(seed: string, chance: number) {
  const rnd = rng(`ayuda:${seed}`);
  return rnd() < chance ? 2 + Math.floor(rnd() * 5) : 0;
}

// ── Simón dice ──────────────────────────────────────────────────────

export const SIMON_MOVES = ["sentarse", "pata", "girar", "saltar"] as const;
export type SimonMove = (typeof SIMON_MOVES)[number];
export const SIMON_ROUNDS = 6;
export const simonStart = (l: "facil" | "normal" | "dificil") => (l === "facil" ? 2 : 3);
export const simonStepMs = (l: "facil" | "normal" | "dificil") => (l === "facil" ? 950 : l === "dificil" ? 560 : 760);
/** Una secuencia más larga en cada ronda; empieza igual que la anterior y suma un truco. */
export function simonSeq(rnd: () => number, len: number): SimonMove[] {
  return Array.from({ length: len }, () => SIMON_MOVES[Math.floor(rnd() * SIMON_MOVES.length)]);
}
export const simonScore = (roundsDone: number) => Math.max(0, Math.min(1, roundsDone / SIMON_ROUNDS));

// ── Carrera al parque ───────────────────────────────────────────────

export const RUN_MS = 30_000;
export const JUMP_MS = 650;
export const RUN_X = 0.16; // dónde va Mochito
export const OBSTACLES = [
  { id: "charco", name: "Charco", h: 0.06 },
  { id: "piedra", name: "Piedra", h: 0.12 },
  { id: "rama", name: "Rama", h: 0.1 },
] as const;
export const runSpec = (l: "facil" | "normal" | "dificil") => (l === "facil" ? { speed: 0.32, every: 1700 } : l === "dificil" ? { speed: 0.55, every: 1050 } : { speed: 0.42, every: 1350 });
/** Altura del salto (0 a 0.3 de la cancha) a los `ms` de haber saltado. */
export function jumpHeight(ms: number) {
  if (ms < 0 || ms >= JUMP_MS) return 0;
  const t = ms / JUMP_MS;
  return 1.2 * t * (1 - t);
}
/** ¿Choca? El obstáculo está a la altura de Mochito y él no saltó lo suficiente. */
export const collides = (x: number, h: number, jump: number) => Math.abs(x - RUN_X) < 0.045 && jump < h;
export function runScore(cleared: number, hits: number) {
  const total = cleared + hits;
  return total ? Math.max(0, Math.min(1, cleared / total - hits * 0.03)) : 0;
}

// ── Misiones del día ────────────────────────────────────────────────

export interface Mission { id: string; text: string; need: number; care?: CareKind; did?: "cooked" | "wrote" | "spent" | "gift" }

export const MISSIONS_CARE: Mission[] = [
  { id: "carinos", text: "Dale 3 cariños a Mochito", need: 3, care: "pet" },
  { id: "galletas", text: "Dale una galleta", need: 1, care: "treat" },
  { id: "bano", text: "Báñalo", need: 1, care: "bath" },
  { id: "juegos", text: "Juega 2 partidas con él", need: 2, care: "game" },
  { id: "paseo", text: "Sácalo a pasear", need: 1, care: "walk" },
  { id: "foto", text: "Tómale una foto", need: 1, care: "photo" },
];
export const MISSIONS_LIFE: Mission[] = [
  { id: "cocinar", text: "Cocina una receta de verdad", need: 1, did: "cooked" },
  { id: "diario", text: "Escribe en tu diario", need: 1, did: "wrote" },
  { id: "anotar", text: "Anota un gasto o ingreso", need: 1, did: "spent" },
  { id: "regalo", text: "Abre su regalo del día", need: 1, did: "gift" },
];
export const MISSIONS_REWARD = { coins: 15, xp: 10, dogXp: 10 };

/** Las 3 misiones de hoy: dos con Mochito y una de tu día. Salen de la fecha. */
export function missionsFor(now: number): Mission[] {
  const rnd = rng(`misiones:${dayKey(now)}`);
  const care = [...MISSIONS_CARE];
  const a = care.splice(Math.floor(rnd() * care.length), 1)[0];
  const b = care.splice(Math.floor(rnd() * care.length), 1)[0];
  const c = MISSIONS_LIFE[Math.floor(rnd() * MISSIONS_LIFE.length)];
  return [a, b, c];
}

/** Cuánto lleva de cada misión hoy. `did` son las cosas de tu día que ya hiciste. */
export function missionProgress(m: Mission, stats: MochitoStats | undefined, now: number, did: Set<string>) {
  const have = m.care ? (stats?.count_day === dayKey(now) ? (stats.count?.[m.care] ?? 0) : 0) : did.has(m.did!) ? 1 : 0;
  return { have: Math.min(have, m.need), done: have >= m.need };
}
