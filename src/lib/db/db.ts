import Dexie, { type Table } from "dexie";

// Base local (IndexedDB). Toda la app lee y escribe aquí; la sincronización con
// Supabase corre aparte, así que todo funciona sin internet.

export interface SyncRow {
  id: string;
  updated_at: number; // ms epoch; el más reciente gana
  deleted_at?: number | null; // borrado lógico para poder sincronizarlo
}

export interface Profile extends SyncRow {
  name: string;
  character: string;
  theme: string;
  sound?: string; // sonido de alarma
  currency?: string; // símbolo de moneda (Q por defecto)
  margin?: number; // % de ganancia sobre el costo para sugerir precio de venta
  frame?: string; // marco de fotos activo (tienda)
  outfit?: Record<string, string>; // ropa puesta: ranura → artículo
  looks?: { name: string; outfit: Record<string, string>; fav?: boolean }[]; // looks guardados
  fits?: Record<string, { x: number; y: number; s: number; r: number }>; // cómo le queda cada prenda a cada personaje ("personaje|prenda")
  sfx?: boolean; // efectos de sonido del juego (activados por defecto)
  nickname?: string; // cómo le gusta que le digan
  birthday?: string; // "MM-DD" (sin año)
  interest?: "cocina" | "dinero" | "juego"; // lo que más le gusta (ordena el Inicio)
  onboarded_at?: number; // cuándo terminó el registro inicial
  journal_voice?: boolean; // en el diario, el personaje responde en voz alta
  journal_char?: string; // quién la escucha en el diario (si no, su personaje)
  mochito?: boolean; // false = Mochito escondido (por defecto siempre acompaña)
  mochito_outfit?: Record<string, string>; // ropa de Mochito: ranura → artículo
  mochito_care?: { fed?: number; petted?: number; played?: number; washed?: number; muddy?: boolean; vet?: number }; // última vez que comió, lo acariciaste, jugó y se bañó; lodo del paseo
  mochito_friends?: Record<string, number>; // perritos del parque: cuántas veces se encontraron
  mochito_log?: { d: string; e: string[] }[]; // su diario: lo que hicieron juntos cada día
  mochito_gift?: { day?: string; streak?: number }; // regalo del día: último día abierto y racha
  mochito_greet?: string; // último día que te dio los buenos días
  mochito_stickers?: Record<string, number>; // pegatinas: id → cuántas tiene
  mochito_stories?: string[]; // cuentos para dormir que ya le leíste
  mochito_show?: { week: string; ribbon: string; total: number }; // concurso de perritos de esta semana
  mochito_ribbons?: Record<string, number>; // listones ganados: color → cuántos
  mochito_weathers?: string[]; // climas en que ha paseado
  mochito_garden?: (import("../mochito-extra").Plot | null)[]; // su jardín: lo sembrado en cada parcela
  mochito_basket?: Record<string, number>; // canasta: lo cosechado que aún no se usa
  mochito_harvest?: Record<string, number>; // todo lo que ha cosechado (semilla → cuántas veces)
  mochito_groom?: import("../mochito-extra").Groom; // peinado de la peluquería (dura unos días)
  mochito_trips?: { last?: string; places?: Record<string, number> }; // viajes: último fin de semana y lugares visitados
  mochito_parties?: string[]; // días en que le hiciste fiesta
  mochito_room?: import("../mochito-extra-2").Room; // su cuarto por dentro: lo puesto en cada rincón
  mochito_treasures?: Record<string, number>; // tesoros del paseo por la colonia
  mochito_street?: string; // último día que paseó por la colonia
  mochito_school?: import("../mochito-extra-2").School; // escuela: clases aprobadas por curso y último día de clase
  mochito_jar?: Record<string, number>; // frasco de premios horneados que aún no se usan
  mochito_baked?: Record<string, number>; // tandas horneadas por receta
  mochito_buddy?: import("../mochito-extra-3").Buddy; // su mascota: tipo, nombre, corazones y si ya comió/jugó hoy
  mochito_mail?: import("../mochito-extra-3").Mail; // cartas de sus amigos: día → de quién, cuál carta y qué le contestaste
  mochito_camp?: import("../mochito-extra-3").Camp; // campamento: última semana y constelaciones descubiertas
  mochito_stand?: { last?: string; perfect?: number }; // puesto de limonada: último día y días sin errores
  mochito_teeth?: import("../mochito-extra-4").Teeth; // dientes: último día cepillado, racha y mejor racha
  mochito_tree?: import("../mochito-extra-4").TreeHouse; // casita del árbol: partes hechas y materiales
  mochito_fair?: import("../mochito-extra-4").Fair; // feria: último mes y premios ganados
  mochito_fbdays?: Record<string, number>; // cumpleaños de amigos: perrito → último año festejado
  mochito_daycare?: import("../mochito-extra-5").Daycare; // guardería: último día y veces sin errores
  mochito_theater?: import("../mochito-extra-5").Theater; // teatro: último día y obras presentadas
  mochito_clean?: import("../mochito-extra-5").Clean; // parque: último día y cosas recicladas bien
  mochito_workshop?: import("../mochito-extra-5").Workshop; // taller: último día y juguetes arreglados por tipo
  mochito_house?: { style?: string; roof?: string; wall?: string; flowers?: string; sign?: string }; // su casita en el jardín
  mochito_stats?: import("../mochito-play").MochitoStats; // nivel, cuentas y días que lo cuidaste
  mochito_tricks?: string[]; // trucos que ya aprendió
  mochito_home?: { bed?: string; bowl?: string; toy?: string }; // sus cosas puestas (ids de la tienda)
}

/** Foto de Mochito (solo en este dispositivo, no se sincroniza). */
export interface MochitoPhoto {
  id: string;
  at: number;
  data: string; // imagen JPEG como data URL
  scene: string;
}

/** Temporizador local (no se sincroniza). Se calcula con la hora de fin, así sobrevive a pantalla bloqueada. */
export interface Timer {
  id: string;
  label: string;
  duration_ms: number;
  status: "running" | "paused" | "ringing";
  end_at: number | null; // solo si running
  left_ms: number | null; // solo si paused
  recipe_id: string | null;
  created_at: number;
}

/** Producto del súper con el precio de su presentación (ej. harina 1 kg a Q8.50). */
export interface Product extends SyncRow {
  name: string;
  pack_qty: number;
  pack_unit: string; // g, kg, ml, l, unidad, docena
  price: number;
  store: string;
  g_per_cup: number | null; // gramos por taza, para pasar tazas a gramos
  grams_per_unit: number | null; // gramos (o ml) de una unidad/barra/lata
}

export interface PriceEntry extends SyncRow {
  product_id: string;
  price: number;
  pack_qty: number;
  pack_unit: string;
  store: string;
  at: number;
}

export type MoneyKind = "gasto" | "ingreso" | "transferencia";

/** Un movimiento de dinero. Sin `kind` es un gasto (así eran los datos de antes). */
export interface Expense extends SyncRow {
  date: number;
  amount: number;
  category: string;
  note: string;
  store: string;
  photo: string | null; // foto del recibo
  kind?: MoneyKind;
  account_id?: string | null; // cuenta de donde sale (gasto, transferencia) o a donde entra (ingreso)
  to_account_id?: string | null; // solo transferencias: cuenta que recibe
  recurring_id?: string | null; // si vino de un pago o ingreso fijo
}

export type AccountType = "efectivo" | "banco" | "tarjeta" | "ahorro";

/** Dónde está tu dinero: efectivo, banco, tarjeta (deuda) o ahorro. */
export interface Account extends SyncRow {
  name: string;
  type: AccountType;
  opening: number; // saldo con el que empezaste a anotar (negativo en una tarjeta con deuda)
  limit: number | null; // límite de crédito, solo tarjeta
  archived: boolean;
}

export type Frequency = "semanal" | "bisemanal" | "quincenal" | "mensual" | "anual";

/** Un pago o ingreso que se repite (renta, luz, sueldo...). */
export interface Recurring extends SyncRow {
  name: string;
  kind: "gasto" | "ingreso";
  amount: number;
  category: string;
  account_id: string | null;
  frequency: Frequency;
  next_due: number; // próxima fecha (mediodía)
  anchor_day: number; // día del mes que se respeta en mensual y anual
  active: boolean;
  remind_days: number; // cuántos días antes empieza a avisar
  note: string;
}

export interface Budget extends SyncRow {
  category: string; // el id es la categoría
  limit: number; // tope mensual
}

export interface ShoppingItem extends SyncRow {
  name: string;
  qty: number | null;
  unit: string;
  checked: boolean;
  recipe_id: string | null;
}

/** Registro de puntos y monedas. El id es una clave fija (ej. "cook:<id>"), así nada se cuenta dos veces. */
export interface GameEvent extends SyncRow {
  kind: string; // cook, recipe, badge, bingo, mission, level, buy, welcome...
  label: string;
  xp: number;
  coins: number; // negativo al comprar
  at: number;
}

/** Cosas de la tienda que ya compró (el id es el id del artículo). */
export interface OwnedItem extends SyncRow {
  bought_at: number;
}

/** Casillas del Bingo que se marcan a mano. El id es "<semana>:<reto>". */
export interface BingoMark extends SyncRow {
  done: boolean;
}

/** Tu pastelería de Dulce Co.: nombre del letrero y decoración puesta (ranura → id del artículo). */
export interface Bakery extends SyncRow {
  name: string;
  decor: Record<string, string>;
  stickers?: { id: string; x: number; y: number; r: number }[]; // pegatinas pegadas en el local (x, y en %)
}

/** Un postre del menú: de una receta que ya cocinaste, o inventado solo para el juego. */
export interface MenuItem extends SyncRow {
  kind: "recipe" | "custom";
  recipe_id: string | null;
  name: string;
  icon: string;
  price: number;
  active: boolean; // en la vitrina
}

/** Un turno de venta en Dulce Co. */
export interface BakeryDay extends SyncRow {
  date: number; // inicio del día
  at: number; // cuándo terminó el turno
  served: number;
  lost: number;
  sales: number;
  tips: number;
  cost: number; // costo estimado de lo vendido
  coins: number; // monedas ganadas por el turno
  rating: number; // 1 a 5
  items: Record<string, number>; // id del postre → vendidos
  perfect: boolean;
  wages?: number; // sueldos pagados en monedas
  critic?: "ok" | "fail"; // si vino el crítico en este turno y cómo salió
  events?: string[]; // eventos activos durante el turno
}

/** Un empleado de Dulce Co. */
export interface BakeryStaff extends SyncRow {
  char: string; // id del personaje
  role: string; // puesto: caja, atencion, reposteria, decoracion
  specialty: string; // en qué puesto rinde más
  level: number; // 1 a 5
  worked: number; // turnos trabajados (cada 8 asciende)
  mood: number; // ánimo 0-100 en mood_at; se recupera con el tiempo
  mood_at: number;
  on_duty: boolean; // trabaja en el próximo turno
  outfit?: Record<string, string>; // su ropa (ranura → prenda)
}

/** Nivel de cada mejora del local (el id es la mejora). */
export interface BakeryUpgrade extends SyncRow {
  level: number;
}

/** Un cliente frecuente de Dulce Co. (el id es el personaje). */
export interface Regular extends SyncRow {
  visits: number;
  loyalty: number; // 0 a 100: sube cuando lo atiendes bien y baja si se va sin su pedido
  last_at: number;
}

/** Un pedido especial de un cliente (una torta decorada a su gusto). */
export interface SpecialOrder extends SyncRow {
  day: string; // "2026-10-22"
  char: string;
  request: { frosting: string; toppings: string[] };
  price: number;
  base_menu_id: string | null; // postre con el que se hizo la torta
  quality: number | null; // 0 a 1, según qué tan parecida quedó al pedido
  status: "pending" | "ready" | "delivered";
}

/** Adornos del día de la pastelería (duran un día). */
export interface DayPlan extends SyncRow {
  props: Record<string, string>; // lugar → adorno
}

/** Tanda horneada dentro del juego (solo postres inventados). */
export interface BakeryBatch extends SyncRow {
  menu_id: string;
  qty: number;
  cost: number; // monedas
  at: number;
  quality?: number; // 0 a 1, del minijuego del horno
}

/** Cada vez que cocina una receta (diario y base de las recompensas). */
export interface CookLog extends SyncRow {
  recipe_id: string;
  title: string;
  cooked_at: number;
  servings: number;
  rating: number | null;
  notes: string;
  photo: string | null;
  change?: string; // "qué cambiaría" la próxima vez
}

/** Lo que escribe (o dicta) en su diario y lo que le respondió el personaje que la escuchó. */
export interface JournalEntry extends SyncRow {
  at: number;
  text: string;
  mood: string; // feliz, emocionada, tranquila, cansada, triste, estresada, enojada
  char: string; // quién la escuchó
  reply: string; // lo que le respondió
  topics?: string[]; // de qué habló (trabajo, familia, postres…), para recordarlo después
}

/** Meta de ahorro (ej. comprar una batidora): cuánto falta y para cuándo. */
export interface SavingsGoal extends SyncRow {
  name: string;
  target: number;
  saved: number;
  deadline: number | null; // ms, mediodía del día límite
  created_at: number;
  done_at: number | null;
}

/** Tu avance en el Modo Historia (una sola fila, id "main"). */
export interface StoryProgress extends SyncRow {
  chapter: number;
  pos: number;
  started: Record<string, number>;
  done: number[];
  flags: Record<string, string>;
}

/** Tu récord en cada minijuego (el id es el juego). */
export interface MiniScore extends SyncRow {
  best: number; // mejor puntaje (0 a 1)
  best_level: string; // dificultad del récord
  plays: number;
  last_at: number;
}

export type OrderStatus = "cotizado" | "confirmado" | "horneando" | "entregado" | "pagado" | "cancelado";

/** Pedido de un cliente de verdad: qué quiere, para cuándo, cuánto paga y cuánto ya dio de anticipo. */
export interface ClientOrder extends SyncRow {
  client: string;
  phone: string;
  item: string; // "Torta de chocolate para 20"
  design: string; // detalles de decoración, mensaje, colores
  due: number; // día de entrega (ms, mediodía)
  price: number;
  deposit: number;
  cost: number; // costo estimado de hacerlo
  status: OrderStatus;
  recipe_id: string | null;
  notes: string;
  created_at: number;
  paid_at: number | null;
}

/** Algo que tienes en casa. */
export interface PantryItem extends SyncRow {
  name: string;
  qty: number | null;
  unit: string;
  expires: number | null; // ms, mediodía del día de caducidad
  min: number | null; // avisa cuando queda menos de esto
}

export interface Ingredient {
  qty: number | null; // null = "al gusto" u otra cantidad no numérica
  unit: string;
  name: string;
}

export interface RecipeStep {
  text: string;
  minutes: number | null;
}

/** Contenido editable de una receta (lo que se guarda en cada versión). */
export interface RecipeContent {
  title: string;
  category: string;
  servings: number;
  prep_min: number | null;
  cook_min: number | null;
  difficulty: 1 | 2 | 3;
  tags: string[];
  photo: string | null; // data URL reducida; viaja con la receta
  ingredients: Ingredient[];
  steps: RecipeStep[];
  notes: string;
  secret: string; // "mi secreto"
  source_url: string;
  video_url: string;
}

export interface Recipe extends SyncRow, RecipeContent {
  favorite: boolean;
  created_at: number;
  cooked_count: number;
}

export interface RecipeVersion extends SyncRow {
  recipe_id: string;
  snapshot: RecipeContent;
  note: string;
}

export interface OutboxItem {
  seq?: number;
  table: SyncTable;
  id: string;
  row: SyncRow;
  ts: number;
}

export interface Meta {
  key: string;
  value: string;
}

// Tablas sincronizadas. Se van sumando en cada fase (recipes, expenses, ...).
export const SYNC_TABLES = [
  "profile",
  "recipes",
  "recipe_versions",
  "cook_log",
  "products",
  "price_history",
  "expenses",
  "budgets",
  "shopping_items",
  "game_events",
  "owned_items",
  "bingo_marks",
  "bakery",
  "bakery_menu",
  "bakery_days",
  "bakery_batches",
  "bakery_staff",
  "bakery_upgrades",
  "regulars",
  "special_orders",
  "day_plan",
  "client_orders",
  "pantry",
  "savings_goals",
  "story_progress",
  "accounts",
  "recurring",
  "mini_scores",
  "journal",
] as const;
export type SyncTable = (typeof SYNC_TABLES)[number];

class BlueyDB extends Dexie {
  profile!: Table<Profile, string>;
  recipes!: Table<Recipe, string>;
  recipe_versions!: Table<RecipeVersion, string>;
  cook_log!: Table<CookLog, string>;
  timers!: Table<Timer, string>;
  mochito_photos!: Table<MochitoPhoto, string>;
  products!: Table<Product, string>;
  price_history!: Table<PriceEntry, string>;
  expenses!: Table<Expense, string>;
  budgets!: Table<Budget, string>;
  shopping_items!: Table<ShoppingItem, string>;
  game_events!: Table<GameEvent, string>;
  owned_items!: Table<OwnedItem, string>;
  bingo_marks!: Table<BingoMark, string>;
  bakery!: Table<Bakery, string>;
  bakery_menu!: Table<MenuItem, string>;
  bakery_days!: Table<BakeryDay, string>;
  bakery_batches!: Table<BakeryBatch, string>;
  bakery_staff!: Table<BakeryStaff, string>;
  bakery_upgrades!: Table<BakeryUpgrade, string>;
  regulars!: Table<Regular, string>;
  special_orders!: Table<SpecialOrder, string>;
  day_plan!: Table<DayPlan, string>;
  client_orders!: Table<ClientOrder, string>;
  pantry!: Table<PantryItem, string>;
  savings_goals!: Table<SavingsGoal, string>;
  story_progress!: Table<StoryProgress, string>;
  accounts!: Table<Account, string>;
  recurring!: Table<Recurring, string>;
  mini_scores!: Table<MiniScore, string>;
  journal!: Table<JournalEntry, string>;
  outbox!: Table<OutboxItem, number>;
  meta!: Table<Meta, string>;

  constructor() {
    super("bluey-world");
    this.version(1).stores({
      profile: "id, updated_at",
      outbox: "++seq, table, id",
      meta: "key",
    });
    this.version(2).stores({
      recipes: "id, updated_at, category, favorite",
      recipe_versions: "id, recipe_id, updated_at",
    });
    this.version(3).stores({
      cook_log: "id, recipe_id, cooked_at, updated_at",
      timers: "id, status, end_at",
    });
    this.version(4).stores({
      products: "id, updated_at, name",
      price_history: "id, product_id, at, updated_at",
      expenses: "id, date, category, updated_at",
      budgets: "id, updated_at",
      shopping_items: "id, updated_at",
    });
    this.version(5).stores({
      game_events: "id, at, kind, updated_at",
      owned_items: "id, updated_at",
      bingo_marks: "id, updated_at",
    });
    this.version(6).stores({
      bakery: "id, updated_at",
      bakery_menu: "id, updated_at, recipe_id",
    });
    this.version(7).stores({
      bakery_days: "id, date, updated_at",
      bakery_batches: "id, menu_id, updated_at",
    });
    this.version(8).stores({
      bakery_staff: "id, updated_at",
      bakery_upgrades: "id, updated_at",
    });
    this.version(9).stores({
      regulars: "id, updated_at",
    });
    this.version(10).stores({
      special_orders: "id, day, updated_at",
      day_plan: "id, updated_at",
    });
    this.version(11).stores({
      client_orders: "id, due, status, updated_at",
      pantry: "id, expires, updated_at",
    });
    this.version(12).stores({
      savings_goals: "id, updated_at",
    });
    this.version(13).stores({
      story_progress: "id, updated_at",
    });
    this.version(14).stores({
      accounts: "id, updated_at",
      recurring: "id, next_due, updated_at",
    });
    this.version(16).stores({
      journal: "id, at, updated_at",
    });
    this.version(15).stores({
      mini_scores: "id, updated_at",
    });
    this.version(17).stores({
      mochito_photos: "id, at",
    });
  }
}

export const db = new BlueyDB();
