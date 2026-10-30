// Diario: cómo responden los personajes según su ánimo, de qué habla y lo que contó otros días.
// Lógica pura (sin base de datos) para poder probarla.

export interface Mood { id: string; label: string; tone: "bien" | "neutro" | "mal" }

export const MOODS: Mood[] = [
  { id: "feliz", label: "Feliz", tone: "bien" },
  { id: "emocionada", label: "Emocionada", tone: "bien" },
  { id: "tranquila", label: "Tranquila", tone: "neutro" },
  { id: "cansada", label: "Cansada", tone: "mal" },
  { id: "estresada", label: "Estresada", tone: "mal" },
  { id: "triste", label: "Triste", tone: "mal" },
  { id: "enojada", label: "Enojada", tone: "mal" },
];
export const moodOf = (id: string) => MOODS.find((m) => m.id === id) ?? MOODS[2];

/** Temas que reconoce en lo que escribe (sin tildes, en minúsculas). */
const TOPICS: { id: string; words: string[] }[] = [
  { id: "postres", words: ["postre", "pastel", "hornee", "horne", "receta", "galleta", "cupcake", "pay ", "flan", "torta", "cocin"] },
  { id: "trabajo", words: ["trabajo", "jefe", "oficina", "cliente", "pedido", "turno", "reunion"] },
  { id: "dinero", words: ["dinero", "pagar", "pague", "deuda", "gaste", "gasto", "sueldo", "cuenta", "ahorr", "precio", "caro"] },
  { id: "familia", words: ["mama", "papa", "hijo", "hija", "hermano", "hermana", "familia", "abuel", "tia", "primo", "prima", "esposo", "esposa"] },
  { id: "amor", words: ["novio", "novia", "amor", "pareja", "cita"] },
  { id: "amigos", words: ["amiga", "amigo", "amigas", "amigos"] },
  { id: "salud", words: ["enferm", "duele", "dolor", "doctor", "medic", "gripe", "hospital"] },
  { id: "descanso", words: ["dormi", "dormir", "sueno", "desvel", "cansad", "agotad"] },
  { id: "logro", words: ["logre", "pude", "termine", "me salio bien", "gane", "aprendi", "lo hice", "por fin"] },
  { id: "gratitud", words: ["gracias", "agradec", "bendic"] },
  { id: "preocupacion", words: ["preocup", "miedo", "ansied", "nervios", "no se que hacer"] },
  { id: "estudio", words: ["examen", "estudi", "clase", "universidad", "colegio", "tarea"] },
];

/** Palabras que piden una respuesta de cuidado de verdad, no un comentario simpático. */
const CARE = ["no quiero vivir", "quiero morir", "matarme", "suicid", "hacerme dano", "no vale la pena vivir", "desaparecer para siempre"];

export const normalize = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function topicsOf(text: string): string[] {
  const t = ` ${normalize(text)} `;
  return TOPICS.filter((x) => x.words.some((w) => t.includes(w))).map((x) => x.id);
}

export const needsCare = (text: string) => { const t = normalize(text); return CARE.some((w) => t.includes(w)); };

const BY_MOOD: Record<string, string[]> = {
  feliz: ["¡Qué bonito leerte así! Guarda este día en el corazón.", "Tu alegría se contagia. Me hiciste sonreír a mí también.", "Días así hay que celebrarlos. ¿Un postre para festejar?"],
  emocionada: ["¡Siento la emoción desde aquí! Cuéntame cómo sigue.", "Esa chispa que tienes hoy es tuya. Aprovéchala.", "¡Qué emoción! Ya quiero saber qué pasa después."],
  tranquila: ["Qué rico un día tranquilo. También eso es un regalo.", "La calma también se disfruta. Gracias por contarme.", "Un día en paz. Respira hondo y disfrútalo."],
  cansada: ["Hiciste mucho. Hoy te mereces descansar sin culpa.", "Estar cansada no es fallar: es haber dado tu esfuerzo. Duerme rico.", "Bájale el ritmo un poquito. Mañana seguimos juntas."],
  estresada: ["Una cosa a la vez. No tienes que resolverlo todo hoy.", "Respira conmigo: inhala cuatro, sostén cuatro, suelta cuatro. Ya pasó un poquito.", "Lo que puedas hacer hoy está bien. Lo demás también tiene su momento."],
  triste: ["Estoy aquí contigo. Está bien sentirse así.", "Gracias por contármelo. No tienes que estar bien todo el tiempo.", "Te mando un abrazo grande. Mañana puede ser más suave."],
  enojada: ["Tienes derecho a sentirte así. Sacarlo escribiendo ya ayuda.", "Respira. Lo que sientes es válido, y no tienes que decidir nada ahora.", "Qué bueno que lo escribiste aquí en vez de guardártelo."],
};

const BY_TOPIC: Record<string, string> = {
  postres: "Y eso de cocinar… ¿lo anotamos en tu diario de postres?",
  trabajo: "El trabajo pesa a veces. Me gusta que te des este ratito para ti.",
  dinero: "Si quieres, revisamos juntas tus cuentas en Dinero: verlo claro quita peso.",
  familia: "La familia es lo más lindo… y a veces lo más difícil. Gracias por contarme.",
  amor: "Ay, el corazón. Cuéntame más cuando quieras.",
  amigos: "Las amigas de verdad son tesoro. Qué bueno que las tienes.",
  salud: "Cuídate mucho. Si algo duele, que te vea alguien que sepa, ¿sí?",
  descanso: "Dormir bien también es parte de cuidarte.",
  logro: "¡Eso es un logro! Que no se te pase celebrarlo.",
  gratitud: "Agradecer hace que lo bueno pese más. Bonito detalle.",
  preocupacion: "Lo que te preocupa no lo cargas sola. Escríbelo cuantas veces haga falta.",
  estudio: "Aprender cansa, pero cada día sabes más. Vas bien.",
};

export interface PastEntry { at: number; mood: string; topics?: string[] }

const DAY = 86_400_000;
const dayNo = (ms: number) => { const d = new Date(ms); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).getTime() / DAY); };

/** Días seguidos escribiendo hasta hoy (o hasta ayer, si hoy aún no escribe). */
export function journalStreak(ats: number[], now: number): number {
  const days = new Set(ats.map(dayNo));
  let d = dayNo(now);
  if (!days.has(d)) d -= 1;
  let n = 0;
  while (days.has(d)) { n++; d--; }
  return n;
}

function pick<T>(list: T[], seed: number) { return list[Math.abs(seed) % list.length]; }
function hash(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }

/** Lo que recuerda de días anteriores (lo más reciente primero en `past`). */
function memoryLine(mood: Mood, past: PastEntry[], now: number): string | null {
  const recent = past.filter((p) => now - p.at < 4 * DAY && dayNo(p.at) < dayNo(now));
  const last = recent[0];
  if (last && moodOf(last.mood).tone === "mal" && mood.tone === "bien") {
    const ago = dayNo(now) - dayNo(last.at);
    return `${ago === 1 ? "Ayer" : `Hace ${ago} días`} te sentías ${moodOf(last.mood).label.toLowerCase()}. ¡Qué gusto ver que hoy estás mejor!`;
  }
  const lowRun = past.slice(0, 3);
  if (mood.tone === "mal" && lowRun.length === 3 && lowRun.every((p) => moodOf(p.mood).tone === "mal") && now - lowRun[2].at < 7 * DAY) {
    return "Llevas varios días pesados. Hablar con alguien de confianza puede ayudar mucho; yo aquí sigo para escucharte.";
  }
  if (last?.topics?.includes("salud") && now - last.at < 3 * DAY) return "¿Y cómo sigues de salud? Lo tengo presente.";
  if (last?.topics?.includes("preocupacion") && mood.tone !== "mal") return "La otra vez algo te preocupaba. Me alegra leerte con más calma.";
  return null;
}

export interface ReplyInput { text: string; mood: string; who: string; past: PastEntry[]; now: number; streak: number }

/** La respuesta del personaje: frase por ánimo + algo sobre lo que contó + un recuerdo de días pasados. */
export function replyFor({ text, mood, who, past, now, streak }: ReplyInput): { reply: string; topics: string[] } {
  const topics = topicsOf(text);
  const name = who.trim();
  if (needsCare(text)) {
    return {
      topics: [...topics, "cuidado"],
      reply: `${name ? `${name}, ` : ""}lo que escribiste me importa muchísimo. No tienes que pasar esto sola: habla hoy mismo con alguien de confianza, y si sientes que estás en peligro, llama a emergencias o a una línea de ayuda de tu país. Tu vida vale mucho.`,
    };
  }
  const m = moodOf(mood);
  const seed = hash(text) + dayNo(now);
  const parts: string[] = [];
  parts.push(pick(BY_MOOD[m.id] ?? BY_MOOD.tranquila, seed));
  const topic = topics.find((t) => BY_TOPIC[t]);
  if (topic) parts.push(BY_TOPIC[topic]);
  const mem = memoryLine(m, past, now);
  if (mem) parts.push(mem);
  if (streak === 3 || streak === 7 || (streak > 0 && streak % 10 === 0)) parts.push(`¡Ya son ${streak} días seguidos escribiéndome!`);
  if (name && seed % 2 === 0) parts[0] = `${name}, ${parts[0].charAt(0).toLowerCase()}${parts[0].slice(1)}`;
  return { reply: parts.join(" "), topics };
}

/** Comentario de un personaje sobre un postre del diario. */
export function cookComment(rating: number | null, notes: string, change: string | undefined, seed: string): string {
  const s = hash(seed);
  if (!rating) return pick(["¡Se ve rico! Dale estrellas para recordarlo.", "¿Qué tal te quedó? Cuéntame con estrellas."], s);
  if (rating >= 5) return pick(["¡Cinco estrellas! Esta receta ya es tuya.", "Perfecto. Guárdala entre las favoritas."], s);
  if (rating >= 4) return change ? "Casi perfecto, y ya sabes qué ajustar. La próxima sale de diez." : "¡Muy bien! Un poquito más y es de cinco.";
  if (rating >= 3) return "Nada mal. Cada intento te enseña algo.";
  return notes || change ? "No salió como querías, pero ya anotaste qué cambiar. Eso es aprender." : "Hasta las mejores reposteras tienen días así. La próxima sale mejor.";
}

/** Ideas para escribir cuando no sabe por dónde empezar. */
export const PROMPTS = [
  "¿Qué fue lo mejor de hoy?",
  "¿Qué te hizo reír hoy?",
  "¿Por qué tres cosas das gracias hoy?",
  "¿Qué te preocupa y qué sí puedes hacer al respecto?",
  "¿Qué te gustaría hornear esta semana?",
  "¿Qué aprendiste hoy?",
  "¿Con quién te gustaría pasar más tiempo?",
  "¿Qué harías mañana si todo saliera bien?",
  "Cuéntame algo que hiciste por ti hoy.",
  "¿Qué le dirías a la tú de hace un año?",
];
