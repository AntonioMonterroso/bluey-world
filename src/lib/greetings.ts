// Saludos que cambian según la hora, el día, tu cumpleaños y lo que más te gusta. Lógica pura.

export interface GreetInput { name: string; nickname?: string; birthday?: string; interest?: "cocina" | "dinero" | "juego" }

const BY_INTEREST: Record<string, string[]> = {
  cocina: ["¿Qué horneamos hoy? Tengo antojo de algo con chocolate.", "Tu recetario te extraña. ¿Le damos vida a una receta?", "Hoy huele a que algo rico va a salir del horno."],
  dinero: ["¿Anotamos los gastos de hoy? Cuentas claras, días tranquilos.", "Revisa si viene algún pago fijo esta semana: yo te aviso.", "Cada abono a tu meta cuenta. ¡Vamos por ella!"],
  juego: ["La pastelería está lista para abrir. ¿Atendemos un turno?", "Hay un reto nuevo en la sala de juegos. ¿Te animas?", "Los vecinos de Dulce Villa preguntaron por ti."],
};
const GENERAL = ["Me alegra verte por aquí.", "Hoy va a ser un buen día, lo presiento.", "Un paso a la vez, y todo sale."];

function partOfDay(h: number) {
  return h < 5 ? "noche" : h < 12 ? "mañana" : h < 19 ? "tarde" : "noche";
}

export function greetingFor(p: GreetInput, now: number): { title: string; line: string; birthday: boolean } {
  const d = new Date(now);
  const who = (p.nickname?.trim() || p.name.trim()) || "";
  const mmdd = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (p.birthday && p.birthday === mmdd) {
    return { title: `¡Feliz cumpleaños${who ? `, ${who}` : ""}!`, line: "Hoy el día es tuyo. Todo el barrio te manda un abrazo con chispas de colores.", birthday: true };
  }
  const part = partOfDay(d.getHours());
  const hello = part === "mañana" ? "Buenos días" : part === "tarde" ? "Buenas tardes" : "Buenas noches";
  const pool = [...(p.interest ? BY_INTEREST[p.interest] : []), ...GENERAL];
  const dayOfYear = Math.floor((now - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000);
  const night = part === "noche" ? ["Ya es tarde: algo cortito y a descansar.", "Noche tranquila. ¿Revisamos lo de mañana?"] : [];
  const lines = [...night, ...pool];
  return { title: `${hello}${who ? `, ${who}` : ""}`, line: lines[dayOfYear % lines.length], birthday: false };
}
