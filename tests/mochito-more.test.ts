import { describe, expect, it } from "vitest";
import { rng } from "@/lib/game/engine";
import {
  AILMENTS, CHECKUP_STEPS, STORIES, checkupDue, judgeShow, mazeMove, mazeOf, mazeScore, mazeShortest, minSwaps, mochitoAilment,
  puzzleScore, puzzleShuffle, puzzleSolved, rainScore, ribbonFor, showJudges, showTotal, vetSteps, weatherOf, WEATHERS,
} from "@/lib/mochito-more";
import { applyCare, earnedMedals, EMPTY_STATS } from "@/lib/mochito-play";

const day = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

describe("veterinario", () => {
  it("a veces está malito, pero no si ya fue hoy", () => {
    const days = Array.from({ length: 200 }, (_, i) => day(2026, 1, 1) + i * 86_400_000);
    const sick = days.filter((d) => mochitoAilment(d));
    expect(sick.length).toBeGreaterThan(15);
    expect(sick.length).toBeLessThan(80);
    expect(mochitoAilment(sick[0], sick[0] - 1000)).toBeNull();
  });
  it("el chequeo toca cada semana", () => {
    expect(checkupDue(undefined, day(2026, 1, 1))).toBe(true);
    expect(checkupDue(day(2026, 1, 1), day(2026, 1, 5))).toBe(false);
    expect(checkupDue(day(2026, 1, 1), day(2026, 1, 9))).toBe(true);
  });
  it("todas las visitas terminan con la vitamina", () => {
    for (const a of Object.values(AILMENTS)) expect(a.steps.at(-1)!.tool).toBe("vitamina");
    expect(vetSteps(null)).toBe(CHECKUP_STEPS);
  });
  it("cuenta en sus medallas", () => {
    const s = applyCare(EMPTY_STATS, "vet", day(2026, 1, 1));
    expect(earnedMedals({ stats: s, tricks: [], level: 1, things: 0 }).map((m) => m.id)).toContain("vet-1");
  });
});

describe("cuentos", () => {
  it("seis cuentos con ids distintos y cuatro páginas", () => {
    expect(new Set(STORIES.map((s) => s.id)).size).toBe(6);
    for (const s of STORIES) expect(s.pages.length).toBe(4);
  });
});

describe("concurso", () => {
  const judges = ["panque", "canela", "nube"];
  it("bien vestido, con buen truco y limpio gana listón azul", () => {
    const s = judgeShow({ outfitCount: 5, trickLevel: 12, clean: 100, love: 100 }, judges, "w2026-01-05");
    expect(showTotal(s)).toBeGreaterThanOrEqual(26);
    expect(ribbonFor(showTotal(s))).toBe("azul");
  });
  it("sin ropa ni truco recibe listón verde o amarillo", () => {
    const s = judgeShow({ outfitCount: 0, trickLevel: null, clean: 20, love: 20 }, judges, "w2026-01-05");
    expect(["verde", "amarillo"]).toContain(ribbonFor(showTotal(s)));
    for (const j of s) expect(j.points).toBeGreaterThanOrEqual(1);
  });
  it("tres jueces distintos por semana", () => {
    const j = showJudges(["a", "b", "c", "d", "e"], "w2026-02-02");
    expect(new Set(j).size).toBe(3);
  });
});

describe("clima", () => {
  it("en temporada de lluvia llueve más que en verano", () => {
    const rainy = Array.from({ length: 120 }, (_, i) => weatherOf(day(2026, 6, 1) + i * 86_400_000)).filter((w) => w === "lluvia").length;
    const dry = Array.from({ length: 90 }, (_, i) => weatherOf(day(2026, 1, 1) + i * 86_400_000)).filter((w) => w === "lluvia").length;
    expect(rainy / 120).toBeGreaterThan(dry / 90);
  });
  it("salen los cuatro climas en el año", () => {
    const all = new Set(Array.from({ length: 365 }, (_, i) => weatherOf(day(2026, 1, 1) + i * 86_400_000)));
    for (const w of WEATHERS) expect(all.has(w)).toBe(true);
  });
});

describe("rompecabezas", () => {
  it("nunca empieza armado y los cambios mínimos lo arman", () => {
    const r = rng("p");
    for (let i = 0; i < 30; i++) {
      const p = puzzleShuffle(r, 3);
      expect(puzzleSolved(p)).toBe(false);
      const perm = [...p];
      let swaps = 0;
      for (let k = 0; k < perm.length; k++) while (perm[k] !== k) { const t = perm[k]; [perm[k], perm[t]] = [perm[t], perm[k]]; swaps++; }
      expect(swaps).toBe(minSwaps(p));
    }
  });
  it("puntaje: con los cambios justos vale 1", () => {
    expect(puzzleScore(5, 5)).toBe(1);
    expect(puzzleScore(20, 5)).toBe(0.3);
  });
});

describe("laberinto", () => {
  it("siempre tiene salida y todas las celdas se conectan", () => {
    for (const size of [6, 8, 10]) {
      const m = mazeOf(rng(`m${size}`), size);
      expect(mazeShortest(m)).toBeGreaterThan(size - 2);
      expect(m.open.every((x) => x > 0)).toBe(true);
    }
  });
  it("no se atraviesan paredes", () => {
    const m = mazeOf(rng("w"), 6);
    expect(mazeMove(m, 0, "arriba")).toBe(0);
    expect(mazeMove(m, 0, "izquierda")).toBe(0);
  });
  it("puntaje: el camino corto vale 1", () => {
    expect(mazeScore(10, 10)).toBe(1);
    expect(mazeScore(40, 10)).toBe(0.3);
  });
});

describe("lluvia de galletas", () => {
  it("sin vidas vale menos", () => {
    expect(rainScore(30, 40, 2)).toBe(1);
    expect(rainScore(30, 40, 0)).toBeCloseTo(0.7);
  });
});
