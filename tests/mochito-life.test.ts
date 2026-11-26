import { describe, expect, it } from "vitest";
import { rng } from "@/lib/game/engine";
import {
  COOK_ROUNDS, DOG_UNSAFE, LOG_DAYS, LOG_PER_DAY, appendLog, cookRound, cookScore, festiveOf, giftFor, giftOpened, isMorning, isNight,
  logDayTitle, logLine, memoDeck, memoScore, mochitoBirthday, nextStreak,
} from "@/lib/mochito-life";

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

describe("Cumpleaños y fiestas de Mochito", () => {
  it("cumple años el día que llegó, desde el primer año", () => {
    expect(mochitoBirthday([], at(2026, 11, 26))).toBeNull();
    const days = ["2026-11-30", "2025-11-26", "2026-01-02"];
    expect(mochitoBirthday(days, at(2026, 11, 26))).toMatchObject({ md: "11-26", isToday: true, age: 1, since: "2025-11-26" });
    expect(mochitoBirthday(["2026-11-26"], at(2026, 11, 26))?.isToday).toBe(false);
    expect(mochitoBirthday(days, at(2026, 11, 27))?.isToday).toBe(false);
  });

  it("se viste solo en fiestas y su cumpleaños gana", () => {
    expect(festiveOf(at(2026, 12, 24))).toBe("navidad");
    expect(festiveOf(at(2026, 12, 31))).toBe("anio");
    expect(festiveOf(at(2027, 2, 14))).toBe("carino");
    expect(festiveOf(at(2026, 11, 1))).toBe("halloween");
    expect(festiveOf(at(2026, 9, 15))).toBe("patria");
    expect(festiveOf(at(2026, 6, 3))).toBeNull();
    expect(festiveOf(at(2026, 12, 24), true)).toBe("cumple");
  });
});

describe("Diario de Mochito", () => {
  it("anota sin repetir, con tope por día y solo los últimos días", () => {
    const now = at(2026, 11, 26);
    let log = appendLog(undefined, now, "Hola");
    log = appendLog(log, now, "Hola");
    expect(log).toEqual([{ d: "2026-11-26", e: ["Hola"] }]);
    for (let i = 0; i < 20; i++) log = appendLog(log, now, `x${i}`);
    expect(log[0].e).toHaveLength(LOG_PER_DAY);
    let many = undefined as ReturnType<typeof appendLog> | undefined;
    for (let d = 0; d < LOG_DAYS + 10; d++) many = appendLog(many, now + d * 86_400_000, "día");
    expect(many).toHaveLength(LOG_DAYS);
  });

  it("lo cuenta en primera persona", () => {
    expect(logLine({ kind: "walk", friend: "Panqué", newFriend: true })).toMatch(/me hice amigo de Panqué/);
    expect(logLine({ kind: "birthday", age: 1 })).toMatch(/1 año/);
    expect(logDayTitle("2026-11-26", at(2026, 11, 26))).toBe("Hoy");
    expect(logDayTitle("2026-11-25", at(2026, 11, 26))).toBe("Ayer");
  });
});

describe("Regalo del día", () => {
  it("la racha sigue si vienes al día siguiente y se corta si faltas", () => {
    const now = at(2026, 11, 26);
    expect(nextStreak(undefined, now)).toBe(1);
    expect(nextStreak({ day: "2026-11-25", streak: 4 }, now)).toBe(5);
    expect(nextStreak({ day: "2026-11-23", streak: 4 }, now)).toBe(1);
    expect(giftOpened({ day: "2026-11-26" }, now)).toBe(true);
  });

  it("crece con la racha y da bonos a los 7 y 30 días", () => {
    expect(giftFor(1).coins).toBe(3);
    expect(giftFor(6).bonus).toBe(0);
    expect(giftFor(7)).toEqual({ coins: 29, bonus: 20 });
    expect(giftFor(30)).toEqual({ coins: 70, bonus: 60 });
  });

  it("de noche duerme y de mañana saluda", () => {
    expect(isNight(at(2026, 11, 26, 23))).toBe(true);
    expect(isNight(at(2026, 11, 26, 14))).toBe(false);
    expect(isMorning(at(2026, 11, 26, 8))).toBe(true);
  });
});

describe("Cocina y Memoria de Mochito", () => {
  it("la receta trae sus pasos y trampas que no son para perros", () => {
    const r = cookRound(rng("c"), "dificil");
    expect(r.recipe.steps.every((s) => r.table.includes(s))).toBe(true);
    expect(r.table.filter((x) => DOG_UNSAFE.includes(x))).toHaveLength(4);
    expect(new Set(r.table).size).toBe(r.table.length);
    expect(cookScore(true, 20_000, 20_000, 0, 0)).toBe(1);
    expect(cookScore(false, 1, 1, 0, 0)).toBe(0);
    expect(cookScore(true, 0, 20_000, 5, 3)).toBe(0.2);
    expect(COOK_ROUNDS).toBe(3);
  });

  it("la memoria trae parejas completas", () => {
    const deck = memoDeck(rng("m"), 6, ["panque", "canela"]);
    expect(deck).toHaveLength(12);
    const counts = deck.reduce<Record<string, number>>((a, c) => ({ ...a, [c.face]: (a[c.face] ?? 0) + 1 }), {});
    expect(Object.values(counts).every((n) => n === 2)).toBe(true);
    expect(memoScore(6, 6)).toBe(1);
    expect(memoScore(6, 18)).toBe(0);
  });
});
