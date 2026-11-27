import { describe, expect, it } from "vitest";
import { rng } from "@/lib/game/engine";
import {
  CONSTELLATIONS, HANG_WORDS, HOLES, LETTERS, STAND_ORDERS, buddyStage, buddyToday, campStars, daysToLetter, golfScore, golfShot, hangMisses, hangPoints, hangShown,
  hangSolved, hangWords, letterOf, orderOk, orderText, standOrders, towerDrop, towerX, tttBest, tttMove, tttWinner, type Cell,
} from "@/lib/mochito-extra-3";
import { applyCare, earnedMedals, EMPTY_STATS } from "@/lib/mochito-play";

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTime();

describe("su mascota", () => {
  it("come y juega una vez al día; los corazones dan etapas", () => {
    const b = { kind: "gatito" as const, name: "Michi", since: "2026-11-27", fed: "2026-11-27", hearts: 6 };
    expect(buddyToday(b, day(2026, 11, 27))).toEqual({ fed: true, played: false });
    expect(buddyToday(b, day(2026, 11, 28)).fed).toBe(false);
    expect(buddyStage(6).name).toBe("Ya se conocen");
    expect(buddyStage(30).name).toBe("Inseparables");
  });
});

describe("cartas", () => {
  it("llega una carta cada dos días, igual todo el día", () => {
    const a = letterOf("2026-11-27", ["panque", "canela"]);
    const b = letterOf("2026-11-28", ["panque", "canela"]);
    expect([a, b].filter(Boolean).length).toBe(1);
    const one = (a ?? b)!;
    expect(LETTERS[one.letter].replies.length).toBe(3);
    expect(letterOf(one.id, ["panque", "canela"])).toEqual(one);
    expect(daysToLetter(one.id)).toBe(0);
    expect(letterOf("2026-11-27", [])).toBeNull();
  });
});

describe("campamento", () => {
  it("primero salen las constelaciones que no ha visto", () => {
    const seen = CONSTELLATIONS.slice(0, 5).map((c) => c.id);
    expect(campStars("w2026-11-23", seen)).toBe(CONSTELLATIONS[5].id);
  });
});

describe("limonada", () => {
  it("cinco pedidos del día y se revisan completos", () => {
    const o = standOrders("2026-11-27", ["Panqué"]);
    expect(o.length).toBe(STAND_ORDERS);
    expect(orderOk(o[0], { ...o[0] })).toBe(true);
    expect(orderOk(o[0], { ...o[0], ice: !o[0].ice })).toBe(false);
    expect(orderText({ who: "x", drink: "jamaica", big: true, ice: false })).toBe("Jamaica grande, sin hielo");
  });
  it("cuenta en sus medallas", () => {
    const s = applyCare(EMPTY_STATS, "stand", Date.now());
    expect(earnedMedals({ stats: s, tricks: [], level: 1, things: 0 }).map((m) => m.id)).toContain("limonada-1");
  });
});

describe("gato", () => {
  it("sabe quién gana y en difícil no deja ganar", () => {
    expect(tttWinner(["X", "X", "X", "", "", "", "", "", ""] as Cell[])).toMatchObject({ who: "X" });
    expect(tttWinner(["X", "O", "X", "X", "O", "O", "O", "X", "X"] as Cell[])).toBe("empate");
    expect(tttBest(["X", "X", "", "", "O", "", "", "", ""] as Cell[], "O")).toBe(2);
    expect(tttBest(["O", "O", "", "X", "X", "", "", "", ""] as Cell[], "O")).toBe(2);
    expect(tttMove(rng("a"), ["X", "", "", "", "", "", "", "", ""] as Cell[], "O", "dificil")).toBe(4);
  });
});

describe("ahorcado", () => {
  it("muestra las letras adivinadas y cuenta errores", () => {
    expect(hangShown("HUESO", ["H", "O"]).join("")).toBe("H___O");
    expect(hangMisses("HUESO", ["H", "Z", "Q"])).toBe(2);
    expect(hangSolved("BAÑO", ["B", "A", "Ñ", "O"])).toBe(true);
    expect(hangPoints(true, 0, 6)).toBe(1);
    expect(hangWords(rng("h"), "facil").every((w) => w.length <= 6)).toBe(true);
    expect(HANG_WORDS.every((w) => /^[A-ZÑ]+$/.test(w))).toBe(true);
  });
});

describe("minigolf", () => {
  it("derecho al hoyo con fuerza justa entra; muy fuerte se pasa", () => {
    const h = HOLES[0];
    expect(golfShot(h, h.start, -Math.PI / 2, 0.55, 4.5).inCup).toBe(true);
    expect(golfShot(h, h.start, 0, 0.5, 4.5).inCup).toBe(false);
    const r = golfShot(h, h.start, -Math.PI / 2, 1, 4.5);
    for (const [x, y] of r.path) { expect(x).toBeGreaterThanOrEqual(0); expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThanOrEqual(160); }
  });
  it("las paredes no se atraviesan", () => {
    const h = HOLES[3];
    const r = golfShot(h, h.start, -Math.PI / 2, 0.8, 4.5);
    for (const [x, y] of r.path) expect(x > 30 && x < 70 && y > 60 && y < 90).toBe(false);
  });
  it("puntaje por golpes", () => {
    expect(golfScore([2, 3], HOLES)).toBe(1);
    expect(golfScore([4], HOLES)).toBeCloseTo(0.6);
  });
});

describe("torre", () => {
  it("lo que sobresale se cae; casi exacto queda igual", () => {
    expect(towerDrop({ x: 0.3, w: 0.4 }, 0.31, 0.02)).toEqual({ x: 0.3, w: 0.4, perfect: true });
    const d = towerDrop({ x: 0.3, w: 0.4 }, 0.4, 0.02)!;
    expect(d.x).toBeCloseTo(0.4);
    expect(d.w).toBeCloseTo(0.3);
    expect(towerDrop({ x: 0.3, w: 0.4 }, 0.75, 0.02)).toBeNull();
    expect(towerX(1, 0.4)).toBeCloseTo(0.6);
  });
});
