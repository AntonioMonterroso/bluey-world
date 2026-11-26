import { describe, expect, it } from "vitest";
import { rng } from "@/lib/game/engine";
import {
  DAILY_XP, MEDALS, TRICKS, applyCare, chargeAt, earnedMedals, fetchPoints, hideRound, hideRoundScore, landingOf, mochitoLevel, walkFind, walkedToday, xpForLevel,
} from "@/lib/mochito-play";

const DAY = new Date(2026, 10, 26, 10).getTime();

describe("Mochito: nivel y cuidados", () => {
  it("sube de nivel con la curva 0, 10, 30, 60…", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(10);
    expect(xpForLevel(3)).toBe(30);
    expect(mochitoLevel(0).level).toBe(1);
    expect(mochitoLevel(10).level).toBe(2);
    expect(mochitoLevel(29)).toMatchObject({ level: 2, have: 19, need: 20 });
    expect(mochitoLevel(999_999).max).toBe(true);
  });

  it("cuenta cada cuidado, anota el día y no da puntos por acariciar sin parar", () => {
    let s = applyCare(undefined, "pet", DAY);
    expect(s).toMatchObject({ pets: 1, xp: 2, days: ["2026-11-26"] });
    s = applyCare(s, "pet", DAY + 60_000, DAY);
    expect(s.pets).toBe(2);
    expect(s.xp).toBe(2);
    s = applyCare(s, "treat", DAY + 120_000);
    expect(s).toMatchObject({ treats: 1, xp: 6, days: ["2026-11-26"] });
  });

  it("respeta el tope diario, pero el paseo y los trucos siempre suman", () => {
    let s = applyCare(undefined, "game", DAY);
    for (let i = 0; i < 20; i++) s = applyCare(s, "game", DAY + i);
    expect(s.xp).toBe(DAILY_XP);
    s = applyCare(s, "walk", DAY);
    expect(s.xp).toBe(DAILY_XP + 8);
    expect(walkedToday(s, DAY)).toBe(true);
    expect(walkedToday(s, DAY + 86_400_000)).toBe(false);
    const next = applyCare(s, "game", DAY + 86_400_000);
    expect(next.xp).toBe(DAILY_XP + 8 + 6);
  });
});

describe("Mochito: trucos, medallas y paseo", () => {
  it("los trucos van de menos a más nivel", () => {
    const lv = TRICKS.map((t) => t.level);
    expect([...lv].sort((a, b) => a - b)).toEqual(lv);
    expect(TRICKS[0].level).toBe(1);
  });

  it("da medallas según lo que llevan juntos", () => {
    const base = { xp: 0, pets: 0, treats: 0, games: 0, walks: 0, days: [] as string[] };
    expect(earnedMedals({ stats: base, tricks: [], level: 1, things: 0 })).toEqual([]);
    const ids = earnedMedals({ stats: { ...base, pets: 1, walks: 1, days: ["a", "b", "c", "d", "e", "f", "g"] }, tricks: TRICKS.map((t) => t.id), level: 5, things: 3 }).map((m) => m.id);
    expect(ids).toEqual(expect.arrayContaining(["carino-1", "paseo-1", "dias-7", "truco-1", "truco-todos", "nivel-5", "casita"]));
    expect(ids).not.toContain("dias-30");
    expect(new Set(MEDALS.map((m) => m.id)).size).toBe(MEDALS.length);
  });

  it("el paseo encuentra lo mismo todo el día", () => {
    const wear = [{ id: "wear:lazo", name: "Lazo" }];
    expect(walkFind(DAY, wear)).toEqual(walkFind(DAY + 3_600_000, wear));
    for (let d = 0; d < 30; d++) {
      const f = walkFind(DAY + d * 86_400_000, []);
      expect(f.kind).not.toBe("wear");
      if (f.kind === "coins") expect(f.coins).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("Juegos de Mochito", () => {
  it("la fuerza sube y baja y define dónde cae la pelota", () => {
    expect(chargeAt(0, 1000)).toBe(0);
    expect(chargeAt(500, 1000)).toBe(1);
    expect(chargeAt(750, 1000)).toBeCloseTo(0.5);
    expect(landingOf(0)).toBeLessThan(landingOf(1));
    expect(landingOf(5)).toBe(landingOf(1));
  });

  it("caer en la bandera vale más que caer lejos", () => {
    expect(fetchPoints(0.9, 0.9)).toBeGreaterThan(0.95);
    expect(fetchPoints(0.9, 0.9)).toBeGreaterThan(fetchPoints(0.4, 0.4));
    expect(fetchPoints(0.6, 0.7)).toBeGreaterThan(fetchPoints(0.4, 0.7));
    expect(fetchPoints(0.1, 0.9)).toBeLessThan(0.2);
  });

  it("en escondidas hay lugares distintos y Mochito está en uno", () => {
    const r = hideRound(rng("x"), "dificil");
    expect(r.spots).toHaveLength(9);
    expect(new Set(r.spots).size).toBe(9);
    expect(r.at).toBeGreaterThanOrEqual(0);
    expect(r.at).toBeLessThan(9);
    expect(hideRoundScore(false, 5000, 8000, 0)).toBe(0);
    expect(hideRoundScore(true, 8000, 8000, 0)).toBe(1);
    expect(hideRoundScore(true, 0, 8000, 5)).toBe(0.3);
  });
});

describe("Frases nuevas de Mochito", () => {
  it("son 300, sin repetirse ni con las de antes", async () => {
    const { NEW_LINES } = await import("@/lib/mochito-lines");
    const { MOCHITO_LINES } = await import("@/lib/mochito");
    const all = Object.values(NEW_LINES).flat();
    expect(all).toHaveLength(300);
    expect(new Set(all).size).toBe(300);
    const old = new Set(Object.values(MOCHITO_LINES).flat());
    expect(all.filter((x) => old.has(x))).toEqual([]);
  });

  it("dice lo del día especial, lo que hiciste hoy y lo de la semana", async () => {
    const { BIRTHDAY, DID, HOLIDAYS, WEEKDAY, calendarLines, dateLines, didLines, extraLine } = await import("@/lib/mochito-lines");
    const xmas = new Date(2026, 11, 25, 10).getTime();
    expect(dateLines(xmas)).toBe(HOLIDAYS[0].lines);
    expect(dateLines(xmas, "12-25")).toBe(BIRTHDAY);
    expect(dateLines(new Date(2026, 5, 3).getTime())).toEqual([]);
    expect(extraLine({ now: xmas }, 0)).toBe(HOLIDAYS[0].lines[0]);
    expect(didLines([])).toBe(DID.nothing);
    expect(didLines(["cooked"])).toEqual(DID.cooked);
    expect(extraLine({ now: new Date(2026, 5, 3).getTime(), did: ["wrote"] }, 0.1)).toBe(DID.wrote[Math.floor((0.1 / 0.6) * DID.wrote.length)]);
    const friday = new Date(2026, 10, 27, 10).getTime();
    expect(calendarLines(friday)).toEqual(expect.arrayContaining(WEEKDAY[5]));
    const lastDay = new Date(2026, 10, 30, 10).getTime();
    expect(calendarLines(lastDay).some((l) => /mes/.test(l))).toBe(true);
  });

  it("al tocarlo siempre dice algo", async () => {
    const { mochitoSays } = await import("@/lib/mochito");
    for (let i = 0; i < 50; i++) {
      const line = mochitoSays("contento", 10, i / 50, { now: new Date(2026, 10, 26, 10).getTime(), did: [] });
      expect(typeof line).toBe("string");
      expect(line.length).toBeGreaterThan(5);
    }
  });
});

describe("Baño, amigos, ayudante y juegos nuevos", () => {
  it("el lodo del paseo lo deja sucio hasta bañarlo", async () => {
    const { cleanOf } = await import("@/lib/mochito-play");
    const { mochitoState } = await import("@/lib/mochito");
    const noon = new Date(2026, 10, 26, 12).getTime();
    expect(cleanOf({ muddy: true, washed: noon }, noon)).toBe(0);
    expect(cleanOf({ washed: noon }, noon)).toBe(100);
    expect(cleanOf({ washed: noon - 36 * 3_600_000 }, noon)).toBe(50);
    expect(cleanOf(undefined, noon)).toBe(60);
    expect(mochitoState({ fed: noon, petted: noon, played: noon, muddy: true }, noon).mood).toBe("sucio");
    expect(mochitoState({ fed: noon, petted: noon, played: noon, washed: noon }, noon).mood).toBe("feliz");
  });

  it("el baño y las fotos cuentan para sus medallas", () => {
    let s = applyCare(undefined, "bath", DAY);
    s = applyCare(s, "photo", DAY);
    expect(s).toMatchObject({ baths: 1, photos: 1 });
    const ids = earnedMedals({ stats: s, tricks: [], level: 1, things: 0, friends: 1 }).map((m) => m.id);
    expect(ids).toEqual(expect.arrayContaining(["bano-1", "amigo-1"]));
  });

  it("los amigos salen del paseo y uno visita el local", async () => {
    const { FRIENDS, FRIEND_AT, friendsOf, visitorOf, walkMeet } = await import("@/lib/mochito-play");
    expect(walkMeet(DAY)).toEqual(walkMeet(DAY + 3_600_000));
    let met = 0;
    for (let d = 0; d < 60; d++) if (walkMeet(DAY + d * 86_400_000)) met++;
    expect(met).toBeGreaterThan(15);
    expect(met).toBeLessThan(50);
    const counts = { [FRIENDS[0].id]: FRIEND_AT, [FRIENDS[1].id]: FRIEND_AT - 1 };
    expect(friendsOf(counts).map((f) => f.id)).toEqual([FRIENDS[0].id]);
    expect(visitorOf(counts, DAY)?.id).toBe(FRIENDS[0].id);
    expect(visitorOf({}, DAY)).toBeNull();
  });

  it("en el local ayuda más mientras más nivel, trucos y amigos tiene", async () => {
    const { helperFind, mochitoHelper } = await import("@/lib/mochito-play");
    const { appealOf } = await import("@/lib/game/appeal");
    const low = mochitoHelper(1, 0, 0);
    const high = mochitoHelper(12, 7, 5);
    expect(low.appeal).toBe(3);
    expect(high.appeal).toBe(10);
    expect(high.patienceMs).toBe(2800);
    expect(high.tipBonus).toBeGreaterThan(low.tipBonus);
    expect(appealOf({ prices: {}, props: {}, shown: 0, mochito: 7 }).mochito).toBe(7);
    expect(helperFind("x", 0)).toBe(0);
    expect(helperFind("x", 1)).toBeGreaterThanOrEqual(2);
  });

  it("Simón dice y la carrera calculan bien", async () => {
    const { SIMON_ROUNDS, collides, jumpHeight, runScore, simonScore, simonSeq, JUMP_MS, RUN_X } = await import("@/lib/mochito-play");
    expect(simonSeq(rng("a"), 5)).toHaveLength(5);
    expect(simonScore(SIMON_ROUNDS)).toBe(1);
    expect(simonScore(0)).toBe(0);
    expect(jumpHeight(0)).toBe(0);
    expect(jumpHeight(JUMP_MS / 2)).toBeCloseTo(0.3);
    expect(jumpHeight(JUMP_MS)).toBe(0);
    expect(collides(RUN_X, 0.12, 0)).toBe(true);
    expect(collides(RUN_X, 0.12, 0.3)).toBe(false);
    expect(collides(RUN_X + 0.2, 0.12, 0)).toBe(false);
    expect(runScore(10, 0)).toBe(1);
    expect(runScore(5, 5)).toBeLessThan(0.5);
  });
});
