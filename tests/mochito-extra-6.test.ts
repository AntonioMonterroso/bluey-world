import { describe, expect, it } from "vitest";
import { rng } from "@/lib/game/engine";
import {
  CHORES_PER_DAY, KITE_FALL, SHELLS, SHELLS_PER_WAVE, WAVES, WORM_SIZE, beachCoins, beachOf, boxesClosed, boxesEdges, boxesMove, choresOf, kiteGain, shadowStory,
  shipsAim, shipsAllSunk, shipsPlace, shipsShot, shipsSpec, socksOf, sudokuClash, sudokuMake, sudokuSolved, windAt, wormStart, wormStep,
} from "@/lib/mochito-extra-6";

describe("barrilete", () => {
  it("el viento va de 0 a 1 y con buen viento sube", () => {
    for (let t = 0; t < 60_000; t += 700) { const w = windAt("2026-11-27", t); expect(w).toBeGreaterThanOrEqual(0); expect(w).toBeLessThanOrEqual(1); }
    expect(kiteGain(0.95, "corta")).toBeGreaterThan(kiteGain(0.95, "larga"));
    expect(kiteGain(0.65, "larga")).toBeGreaterThan(4);
    expect(kiteGain(0.65, "corta")).toBe(4);
    expect(kiteGain(0.1, "corta")).toBe(-KITE_FALL);
  });
});

describe("playa", () => {
  it("tres olas de cuatro cosas y al menos una rara", () => {
    const b = beachOf("2026-11-27");
    expect(b.length).toBe(WAVES);
    for (const w of b) expect(w.length).toBe(SHELLS_PER_WAVE);
    expect(b.flat().some((s) => SHELLS[s.kind].rare)).toBe(true);
    expect(beachOf("2026-11-27")).toEqual(b);
    expect(beachCoins(["almeja", "estrella"])).toBe(5);
  });
});

describe("pijamada", () => {
  it("el cuento termina de risa y con el nombre del amigo", () => {
    const s = shadowStory("fantasma", "Canela");
    expect(s.length).toBe(5);
    expect(s.join(" ")).toContain("Canela");
  });
});

describe("ayudar en casa", () => {
  it("cuatro tareas distintas al día y los calcetines vienen en pares", () => {
    const c = choresOf("2026-11-27");
    expect(c.length).toBe(CHORES_PER_DAY);
    expect(new Set(c).size).toBe(CHORES_PER_DAY);
    const s = socksOf("2026-11-27");
    expect(s.length).toBe(8);
    for (const x of new Set(s)) expect(s.filter((y) => y === x).length).toBe(2);
  });
});

describe("sudoku", () => {
  it("la solución cumple las reglas en 4×4 y 6×6", () => {
    for (const l of ["facil", "normal", "dificil"] as const) {
      const s = sudokuMake(rng(`s${l}`), l);
      expect(sudokuSolved(s.solution, s)).toBe(true);
      expect(s.puzzle.filter(Boolean).length).toBe(l === "facil" ? 9 : l === "normal" ? 6 : 16);
      expect(s.puzzle.every((v, i) => v === 0 || v === s.solution[i])).toBe(true);
    }
  });
  it("marca lo que choca en fila, columna y cuadro", () => {
    const g = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const s = { size: 4, bw: 2, bh: 2 };
    expect(sudokuClash(g, s, 3, 1)).toEqual([0]);
    expect(sudokuClash(g, s, 5, 1)).toEqual([0]);
    expect(sudokuClash(g, s, 10, 1)).toEqual([]);
  });
});

describe("puntos y cajitas", () => {
  it("la cuarta raya cierra la cajita y Mochito la toma", () => {
    expect(boxesEdges(3).length).toBe(24);
    const t = new Set(["h:0:0", "h:1:0", "v:0:0"]);
    expect(boxesClosed(3, t, "v:0:1")).toEqual([0]);
    expect(boxesMove(rng("c"), 3, t, "normal")).toBe("v:0:1");
  });
  it("si no puede cerrar, no deja la tercera raya", () => {
    const t = new Set(["h:0:0", "v:0:0"]);
    const m = boxesMove(rng("d"), 3, t, "normal")!;
    expect(["h:1:0", "v:0:1"]).not.toContain(m);
  });
});

describe("barquitos", () => {
  it("se acomodan sin tocarse y se hunden", () => {
    const { size, ships } = shipsSpec("dificil");
    const f = shipsPlace(rng("b"), size, ships);
    expect(f.map((s) => s.length)).toEqual(ships);
    const all = f.flat();
    expect(new Set(all).size).toBe(all.length);
    const shots = new Set<number>();
    const first = f[0];
    first.slice(0, -1).forEach((x) => { expect(shipsShot(f, shots, x)).toBe("tocado"); shots.add(x); });
    expect(shipsShot(f, shots, first.at(-1)!)).toBe("hundido");
    f.flat().forEach((x) => shots.add(x));
    expect(shipsAllSunk(f, shots)).toBe(true);
  });
  it("después de tocar, Mochito busca al lado", () => {
    const f = [[8, 9, 10]];
    const aim = shipsAim(rng("a"), 7, f, new Set([9]), "normal");
    expect([2, 16, 8, 10]).toContain(aim);
  });
});

describe("gusanito", () => {
  it("avanza, come, crece y choca con la pared", () => {
    let w = wormStart(rng("w"));
    const head = w.body[0];
    w = { ...w, food: head + 1 };
    const s = wormStep(rng("x"), w, "der");
    expect(s.ate).toBe(true);
    expect(s.worm.body.length).toBe(4);
    expect(wormStep(rng("x"), s.worm, "izq").worm.way).toBe("der");
    let z = { body: [WORM_SIZE - 1], way: "der" as const, food: 0 };
    expect(wormStep(rng("y"), z, "der").dead).toBe(true);
    z = { body: [5, 6, 18, 17], way: "izq" as const, food: 100 };
    expect(wormStep(rng("y"), { ...z, body: [17, 5, 6, 18, 30] }, "arriba").dead).toBe(true);
  });
});
