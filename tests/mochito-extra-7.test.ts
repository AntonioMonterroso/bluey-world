import { describe, expect, it } from "vitest";
import { rng } from "@/lib/game/engine";
import {
  MARKET_ITEMS, antPos, antsOf, changeOptions, codeCheck, codeMake, codeSpec, digOf, marketOf, marketTotal, nextPart, picClues, picMake, picsOf, pipesDone, pipesFlow, pipesMake, raceTime,
  rivalsOf, rocksOf, rotCw, rvApply, rvCount, rvFlips, rvInit, rvMove, rvMoves, DIG_SIZE, DINO_PARTS, E_, N_, S_, W_,
} from "@/lib/mochito-extra-7";

describe("mercado", () => {
  it("cuatro cosas, el total y el vuelto entre tres opciones", () => {
    const l = marketOf("2026-11-27");
    expect(l.length).toBe(MARKET_ITEMS);
    expect(new Set(l.map((g) => g.id)).size).toBe(MARKET_ITEMS);
    expect(marketTotal(l)).toBe(l.reduce((a, g) => a + g.price, 0));
    const o = changeOptions("2026-11-27", 3);
    expect(o.length).toBe(3);
    expect(o).toContain(3);
    expect(new Set(o).size).toBe(3);
    expect(changeOptions("2026-11-27", 0)).toContain(0);
  });
});

describe("fósiles", () => {
  it("tres casillas juntas dentro de la arena y las partes en orden", () => {
    for (const d of ["2026-11-27", "2026-11-28", "2026-12-01"]) {
      const f = digOf(d);
      expect(f.length).toBe(3);
      f.forEach((x) => { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(DIG_SIZE * DIG_SIZE); });
      const step = f[1] - f[0];
      expect([1, DIG_SIZE]).toContain(step);
      expect(f[2] - f[1]).toBe(step);
      if (step === 1) expect(Math.floor(f[0] / DIG_SIZE)).toBe(Math.floor(f[2] / DIG_SIZE));
    }
    expect(nextPart(0)).toMatchObject({ part: 0, done: false });
    expect(nextPart(DINO_PARTS.length).dino?.id).toBe("cuellilargo");
    expect(nextPart(DINO_PARTS.length * 3).done).toBe(true);
  });
});

describe("picnic", () => {
  it("las hormigas caminan de la orilla al mantel", () => {
    const a = antsOf("2026-11-27")[0];
    const far = antPos(a, a.at), near = antPos(a, a.at + a.dur);
    expect(Math.hypot(far.x - 0.5, far.y - 0.5)).toBeGreaterThan(Math.hypot(near.x - 0.5, near.y - 0.5));
  });
});

describe("carrera", () => {
  it("empujar ayuda, las piedras estorban y los rivales son de la semana", () => {
    expect(raceTime(25, 0, "medianas")).toBeLessThan(raceTime(10, 0, "medianas"));
    expect(raceTime(25, 2, "grandes") - raceTime(25, 0, "grandes")).toBeGreaterThan(raceTime(25, 2, "chicas") - raceTime(25, 0, "chicas"));
    expect(rocksOf("2026-W48").every((r) => r.lane >= 0 && r.lane < 3)).toBe(true);
    const rv = rivalsOf("2026-W48", ["a", "b", "c", "d"]);
    expect(rv.length).toBe(3);
    expect(rivalsOf("2026-W48", ["a", "b", "c", "d"])).toEqual(rv);
  });
});

describe("voltea fichas", () => {
  it("empieza con cuatro, voltea en línea y Mochito juega", () => {
    const b = rvInit(8);
    expect(rvCount(b, "y")).toBe(2);
    expect(rvMoves(b, 8, "y").length).toBe(4);
    const m = rvMoves(b, 8, "y")[0];
    expect(rvFlips(b, 8, m, "y").length).toBe(1);
    const a = rvApply(b, 8, m, "y");
    expect(rvCount(a, "y")).toBe(4);
    for (const l of ["facil", "normal", "dificil"] as const) expect(rvMoves(a, 8, "m")).toContain(rvMove(rng(l), a, 8, l));
  });
});

describe("adivina los colores", () => {
  it("cuenta los que están en su lugar y los que están en otro", () => {
    expect(codeCheck([0, 1, 2, 3], [0, 2, 1, 5])).toEqual({ exact: 1, near: 2 });
    expect(codeCheck([1, 1, 2, 2], [1, 2, 1, 1])).toEqual({ exact: 1, near: 2 });
    const s = codeMake(rng("c"), "normal");
    expect(s.length).toBe(codeSpec("normal").len);
    expect(new Set(s).size).toBe(s.length);
  });
});

describe("tuberías", () => {
  it("la solución lleva el agua a la plantita y los tubos giran", () => {
    expect(rotCw(N_)).toBe(E_);
    expect(rotCw(W_)).toBe(N_);
    expect(rotCw(N_ | S_, 2)).toBe(N_ | S_);
    for (const n of [4, 5, 6]) {
      const p = pipesMake(rng(`p${n}`), n);
      expect(pipesDone(p.sol, n)).toBe(true);
      expect(pipesFlow(p.sol, n).size).toBe(n * n);
    }
  });
});

describe("dibujo escondido", () => {
  it("todos los dibujos son cuadrados y las pistas cuentan bien", () => {
    for (const l of ["facil", "normal", "dificil"] as const) for (const p of picsOf(l)) for (const r of p.rows) expect(r.length).toBe(p.rows.length);
    expect(picClues([true, true, false, true, false])).toEqual([2, 1]);
    expect(picClues([false, false])).toEqual([0]);
    expect(picMake(rng("x"), "dificil").n).toBe(10);
  });
});
