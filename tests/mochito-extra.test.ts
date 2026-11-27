import { describe, expect, it } from "vitest";
import { dayKey, rng } from "@/lib/game/engine";
import {
  DIFFS, DIFF_IDS, PLACE_IDS, PLACES, SEEDS, daysToParty, daysToWeekend, diffHit, diffPick, fishPlan, fishPossible, fishScore, frisbeeCatch, frisbeeLand,
  frisbeePower, groomActive, isWeekend, mochitoParty, partyCandles, plant, plotGrowth, seedsFor, soupFind, soupLine, soupOf, waterPlot,
} from "@/lib/mochito-extra";
import { applyCare, earnedMedals, EMPTY_STATS } from "@/lib/mochito-play";

const day = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
const DAY = 86_400_000;

describe("jardín", () => {
  it("crece solo los días que lo riegas", () => {
    let p = plant("fresa", day(2026, 3, 1));
    expect(plotGrowth(p, day(2026, 3, 1)).stage).toBe(0);
    p = waterPlot(p, day(2026, 3, 1));
    p = waterPlot(p, day(2026, 3, 1, 18));
    expect(plotGrowth(p, day(2026, 3, 1)).watered).toBe(1);
    expect(plotGrowth(p, day(2026, 3, 1)).wateredToday).toBe(true);
    expect(plotGrowth(p, day(2026, 3, 5)).ready).toBe(false);
    p = waterPlot(waterPlot(p, day(2026, 3, 4)), day(2026, 3, 9));
    expect(plotGrowth(p, day(2026, 3, 9)).ready).toBe(true);
    expect(plotGrowth(p, day(2026, 3, 9)).stage).toBe(3);
  });
  it("las semillas se abren con el nivel", () => {
    expect(seedsFor(1)).toEqual(["zanahoria", "tulipan"]);
    expect(seedsFor(10).length).toBe(Object.keys(SEEDS).length);
  });
});

describe("peluquería", () => {
  it("el peinado dura tres días", () => {
    const g = { style: "mono" as const, color: "#fff", day: dayKey(day(2026, 3, 1)) };
    expect(groomActive(g, day(2026, 3, 3))).toBe(true);
    expect(groomActive(g, day(2026, 3, 4))).toBe(false);
    expect(groomActive(undefined, day(2026, 3, 1))).toBe(false);
  });
  it("cuenta en sus medallas", () => {
    const s = applyCare(EMPTY_STATS, "groom", day(2026, 1, 1));
    expect(earnedMedals({ stats: s, tricks: [], level: 1, things: 0 }).map((m) => m.id)).toContain("pelu-1");
  });
});

describe("viajes", () => {
  it("solo sábado y domingo", () => {
    expect(isWeekend(day(2026, 11, 28))).toBe(true);
    expect(isWeekend(day(2026, 11, 29))).toBe(true);
    expect(isWeekend(day(2026, 11, 27))).toBe(false);
    expect(daysToWeekend(day(2026, 11, 25))).toBe(3);
  });
  it("seis lugares con tres momentos cada uno", () => {
    expect(PLACE_IDS.length).toBe(6);
    for (const p of PLACE_IDS) expect(PLACES[p].moments.length).toBe(3);
  });
});

describe("fiesta", () => {
  const days = ["2025-01-31", "2025-02-01"];
  it("cumplemés cada mes y cumpleaños cada año", () => {
    expect(mochitoParty(days, day(2025, 1, 31))).toBeNull();
    expect(mochitoParty(days, day(2025, 3, 31))).toEqual({ kind: "mes", months: 2 });
    expect(mochitoParty(days, day(2025, 4, 30))).toEqual({ kind: "mes", months: 3 });
    expect(mochitoParty(days, day(2025, 4, 29))).toBeNull();
    expect(mochitoParty(days, day(2026, 1, 31))).toEqual({ kind: "cumple", age: 1 });
    expect(partyCandles({ kind: "mes", months: 20 })).toBe(12);
  });
  it("sabe cuánto falta", () => {
    expect(daysToParty(days, day(2025, 3, 25))).toBe(6);
    expect(daysToParty([], day(2025, 3, 25))).toBeNull();
  });
});

describe("pesca", () => {
  it("el puntaje va de 0 a 1", () => {
    const plan = fishPlan(rng("f"), "normal");
    expect(plan.length).toBe(8);
    const possible = fishPossible(plan);
    expect(fishScore(possible, possible)).toBe(1);
    expect(fishScore(0, possible)).toBe(0);
  });
});

describe("frisbee", () => {
  it("la fuerza sube y baja", () => {
    expect(frisbeePower(0, 1000)).toBe(0);
    expect(frisbeePower(500, 1000)).toBe(1);
    expect(frisbeePower(750, 1000)).toBe(0.5);
  });
  it("cerca lo atrapa en el aire, lejos falla", () => {
    expect(frisbeeCatch(0.6, 0.61, 0.08)).toBe("aire");
    expect(frisbeeCatch(0.6, 0.66, 0.08)).toBe("atrapa");
    expect(frisbeeCatch(0.6, 0.8, 0.08)).toBe("falla");
    expect(frisbeeLand(1, 0.2)).toBeLessThanOrEqual(1.05);
  });
});

describe("diferencias", () => {
  it("elige distintas y se encuentran tocando cerca", () => {
    const d = diffPick(rng("d"), "dificil");
    expect(new Set(d).size).toBe(7);
    for (const id of DIFF_IDS) expect(diffHit(DIFFS[id].x, DIFFS[id].y, [id])).toBe(id);
    expect(diffHit(0, 74, ["sol"])).toBeNull();
  });
});

describe("sopa de letras", () => {
  it("todas las palabras están donde dice y se encuentran en los dos sentidos", () => {
    for (const lvl of ["facil", "normal", "dificil"] as const) {
      for (let k = 0; k < 10; k++) {
        const s = soupOf(rng(`${lvl}${k}`), lvl);
        for (const w of s.words) {
          expect(w.cells.map((c) => s.cells[c]).join("")).toBe(w.word);
          expect(soupFind(s, w.cells[0], w.cells.at(-1)!)).toBe(w.word);
          expect(soupFind(s, w.cells.at(-1)!, w.cells[0])).toBe(w.word);
        }
        expect(s.cells.every((c) => c.length === 1)).toBe(true);
      }
    }
  });
  it("las líneas torcidas no cuentan", () => {
    expect(soupLine(8, 0, 10)).toBeNull();
    expect(soupLine(8, 0, 18)).toEqual([0, 9, 18]);
  });
});

it("el día siguiente de la fiesta ya no es fiesta", () => {
  const t = day(2025, 3, 31);
  expect(mochitoParty(["2025-01-31"], t + DAY)).toBeNull();
});
