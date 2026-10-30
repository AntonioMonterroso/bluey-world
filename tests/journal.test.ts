import { describe, expect, it } from "vitest";
import { journalStreak, needsCare, replyFor, topicsOf } from "@/lib/journal-core";

const DAY = 86_400_000;
const now = new Date(2026, 9, 30, 20).getTime();

describe("diario", () => {
  it("reconoce de qué habla, con o sin tildes", () => {
    expect(topicsOf("Hoy horneé un pastel para mi mamá")).toEqual(expect.arrayContaining(["postres", "familia"]));
    expect(topicsOf("Me preocupa pagar la deuda")).toEqual(expect.arrayContaining(["dinero", "preocupacion"]));
  });

  it("responde distinto según el ánimo y menciona el tema", () => {
    const sad = replyFor({ text: "Fue un día largo en el trabajo", mood: "triste", who: "", past: [], now, streak: 1 });
    const happy = replyFor({ text: "Fue un día largo en el trabajo", mood: "feliz", who: "", past: [], now, streak: 1 });
    expect(sad.reply).not.toEqual(happy.reply);
    expect(sad.reply).toContain("trabajo");
  });

  it("recuerda que ayer estaba mal y hoy está mejor", () => {
    const r = replyFor({ text: "Hoy todo bien", mood: "feliz", who: "", past: [{ at: now - DAY, mood: "cansada" }], now, streak: 2 });
    expect(r.reply).toContain("Ayer te sentías cansada");
  });

  it("si escribe algo de riesgo, responde con cuidado", () => {
    expect(needsCare("A veces siento que no quiero vivir")).toBe(true);
    const r = replyFor({ text: "a veces quiero morir", mood: "triste", who: "", past: [], now, streak: 0 });
    expect(r.reply).toContain("emergencias");
  });

  it("cuenta los días seguidos escribiendo", () => {
    expect(journalStreak([now, now - DAY, now - 2 * DAY, now - 4 * DAY], now)).toBe(3);
    expect(journalStreak([now - DAY, now - 2 * DAY], now)).toBe(2);
    expect(journalStreak([now - 3 * DAY], now)).toBe(0);
  });
});

import { freeAhead, lastMonths } from "@/lib/money-core";

describe("dinero en palabras", () => {
  it("lo libre descuenta los pagos fijos de los próximos 30 días y suma los cobros", () => {
    const n = new Date(2026, 9, 30, 12).getTime();
    const base = { id: "r", updated_at: 0, category: "", frequency: "mensual" as const, anchor_day: 2, remind_days: 3, active: true, account_id: null };
    const rec = [
      { ...base, id: "renta", name: "Renta", kind: "gasto" as const, amount: 300, next_due: new Date(2026, 10, 2, 12).getTime() },
      { ...base, id: "sueldo", name: "Sueldo", kind: "ingreso" as const, amount: 200, next_due: new Date(2026, 10, 15, 12).getTime() },
    ];
    expect(freeAhead({ cash: 1000, debt: 0, net: 1000 }, rec as never, n).free).toBe(900);
  });
  it("arma los últimos meses con su balance", () => {
    const n = new Date(2026, 9, 15).getTime();
    const moves = [
      { id: "a", updated_at: 0, date: new Date(2026, 9, 2).getTime(), amount: 100, category: "Comida", note: "", store: "", photo: null, kind: "gasto" as const },
      { id: "b", updated_at: 0, date: new Date(2026, 8, 2).getTime(), amount: 500, category: "Sueldo", note: "", store: "", photo: null, kind: "ingreso" as const },
    ];
    const m = lastMonths(moves, n, 3);
    expect(m.map((x) => x.net)).toEqual([0, 500, -100]);
  });
});

import { setsDone, stickerPoints } from "@/lib/game/stickers";

describe("pegatinas en el local", () => {
  const at = (id: string) => ({ id, x: 50, y: 50, r: 0 });
  it("suman encanto, más con una colección completa y con la favorita del día", () => {
    const desayuno = ["sticker:coffee", "sticker:croissant", "sticker:egg", "sticker:milk"].map(at);
    expect(stickerPoints(desayuno, null)).toMatchObject({ base: 4, sets: 4, fav: 0, total: 8 });
    expect(stickerPoints(desayuno, "sticker:egg").total).toBe(11);
    expect(setsDone(desayuno).find((s) => s.id === "desayuno")?.done).toBe(true);
  });
  it("las de fiestas valen doble y nunca pasan del tope", () => {
    const fiestas = ["sticker:corazon", "sticker:trofeo", "sticker:fantasma", "sticker:pino", "sticker:fiesta", "sticker:barrilete"].map(at);
    expect(stickerPoints(fiestas, "sticker:pino").total).toBe(15);
  });
});
