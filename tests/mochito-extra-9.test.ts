import { describe, expect, it } from "vitest";
import { rng } from "@/lib/game/engine";
import {
  CINEMA_COLS, CINEMA_ROWS, FIRE_MAX, MOVIES, ZOO_ANIMALS, ZOO_TODAY, catOf, cinemaOf, fireSize, firesOf, flightOf, flowAdj, flowDone, flowMake, flowSpec, hanoiDone, hanoiInit,
  hanoiMin, hanoiMove, hiloDeck, hiloRight, hiloSpec, sticksMove, sticksStart, takenSeats, underBalloon, zooOf,
} from "@/lib/mochito-extra-9";

describe("zoológico", () => {
  it("cinco animales y primero los que faltan en el álbum", () => {
    const z = zooOf("2026-11-27", ["mono", "leon"]);
    expect(z.length).toBe(ZOO_TODAY);
    expect(z.map((a) => a.id)).not.toContain("mono");
    expect(zooOf("2026-11-27", ZOO_ANIMALS.map((a) => a.id)).length).toBe(ZOO_TODAY);
  });
});

describe("cine", () => {
  it("tres películas, tu asiento libre y preguntas con respuesta", () => {
    const c = cinemaOf("2026-11-27");
    expect(new Set(c.billboard).size).toBe(3);
    const mine = c.row * CINEMA_COLS + c.col;
    expect(takenSeats("2026-11-27", mine)).not.toContain(mine);
    expect(mine).toBeLessThan(CINEMA_ROWS.length * CINEMA_COLS);
    for (const m of MOVIES) for (const q of m.quiz) expect(q.a[q.ok]).toBeTruthy();
  });
});

describe("bomberos", () => {
  it("los fuegos crecen y el agua los apaga", () => {
    const f = firesOf("2026-11-27")[0];
    expect(fireSize(f, f.at - 1, 0)).toBe(0);
    expect(fireSize(f, f.at, 0)).toBe(2);
    expect(fireSize(f, f.at + 999_999, 0)).toBe(FIRE_MAX);
    expect(fireSize(f, f.at, 2)).toBe(0);
    expect(new Set(firesOf("2026-11-27").map((x) => x.cell)).size).toBe(6);
    expect(catOf("2026-11-27")).toBeGreaterThanOrEqual(3);
    expect(catOf("2026-11-27")).toBeLessThanOrEqual(6);
  });
});

describe("globo", () => {
  it("ocho lugares en fila y tres para fotografiar", () => {
    const f = flightOf("2026-11-27");
    expect(f.map.length).toBe(8);
    expect(f.goals.length).toBe(3);
    expect(underBalloon(f.map, f.map[2].x)?.id).toBe(f.map[2].id);
    expect(underBalloon(f.map, 0.02)).toBeNull();
  });
});

describe("toma palitos", () => {
  it("en difícil Mochito deja 1, 5, 9…", () => {
    expect(sticksMove(rng("a"), 7, "dificil")).toBe(2);
    expect(sticksMove(rng("a"), 2, "dificil")).toBe(1);
    for (const l of ["facil", "normal", "dificil"] as const) { expect(sticksStart(l) % 4).not.toBe(1); const m = sticksMove(rng(l), 3, l); expect(m).toBeGreaterThanOrEqual(1); expect(m).toBeLessThanOrEqual(3); }
  });
});

describe("une los colores", () => {
  it("la solución une cada par y llena todo", () => {
    for (const l of ["facil", "normal", "dificil"] as const) {
      const s = flowSpec(l);
      const p = flowMake(rng(`f${l}`), s.n, s.pairs);
      expect(p.dots.length).toBe(s.pairs);
      expect(p.sol.every((c) => c >= 0)).toBe(true);
      const paths = p.segs;
      for (const seg of paths) for (let i = 1; i < seg.length; i++) expect(flowAdj(seg[i - 1], seg[i], s.n)).toBe(true);
      expect(flowDone(paths, p.dots, s.n)).toBe(true);
      expect(flowDone(paths.slice(1), p.dots, s.n)).toBe(false);
    }
  });
});

describe("¿mayor o menor?", () => {
  it("el mazo y los aciertos", () => {
    const d = hiloDeck(rng("h"), "facil");
    expect(d.length).toBe(hiloSpec("facil").cards + 1);
    expect(d.every((c) => c.v >= 1 && c.v <= 10)).toBe(true);
    expect(hiloRight(4, 9, "mayor")).toBe(true);
    expect(hiloRight(4, 2, "mayor")).toBe(false);
    expect(hiloRight(5, 5, "menor")).toBe(true);
  });
});

describe("torre de discos", () => {
  it("no se pone grande sobre chico y se termina en el mínimo", () => {
    let s = hanoiInit(3);
    expect(hanoiMove(s, 1, 2)).toBeNull();
    s = hanoiMove(s, 0, 2)!;
    expect(hanoiMove(s, 0, 2)).toBeNull();
    const solve = (n: number, a: number, b: number, c: number): [number, number][] => (n ? [...solve(n - 1, a, c, b), [a, c], ...solve(n - 1, b, a, c)] : []);
    let t = hanoiInit(4);
    const moves = solve(4, 0, 1, 2);
    for (const [f, to] of moves) t = hanoiMove(t, f, to)!;
    expect(hanoiDone(t, 4)).toBe(true);
    expect(moves.length).toBe(hanoiMin(4));
  });
});
