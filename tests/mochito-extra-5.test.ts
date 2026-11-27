import { describe, expect, it } from "vitest";
import { rng } from "@/lib/game/engine";
import {
  BIN_IDS, DAYCARE_PUPPIES, TRASH_COUNT, bonesCanMove, bonesScore, bonesSlide, bonesStart, daycareOf, dmApply, dmInit, dmMove, dmMoves, dmMoreJumps, dmWinner,
  domDeal, domEnds, domMove, domPlace, domSides, domSet, molesPlan, molesScore, playScript, trashOf, workshopOf, type Dm, type Tile,
} from "@/lib/mochito-extra-5";
import { applyCare, earnedMedals, EMPTY_STATS } from "@/lib/mochito-play";

describe("guardería", () => {
  it("tres cachorritos; cada uno termina queriendo dormir", () => {
    const p = daycareOf("2026-11-27");
    expect(p.length).toBe(DAYCARE_PUPPIES);
    for (const x of p) { expect(x.wants.length).toBe(3); expect(x.wants.at(-1)).toBe("dormir"); }
    expect(daycareOf("2026-11-27")).toEqual(p);
  });
  it("cuenta en sus medallas", () => {
    const s = applyCare(EMPTY_STATS, "daycare", Date.now());
    expect(earnedMedals({ stats: s, tricks: [], level: 1, things: 0 }).map((m) => m.id)).toContain("guarderia-1");
  });
});

describe("teatro", () => {
  it("arma una obra de cuatro escenas con los personajes", () => {
    const s = playScript("castillo", ["Mochito", "Canela"], "dragon", "cancion");
    expect(s.length).toBe(4);
    expect(s[0]).toContain("un castillo");
    expect(s.join(" ")).toContain("Canela");
  });
});

describe("limpiar el parque", () => {
  it("ocho cosas y al menos una de cada bote", () => {
    const t = trashOf("2026-11-27");
    expect(t.length).toBe(TRASH_COUNT);
    for (const b of BIN_IDS) expect(t.some((x) => x.bin === b)).toBe(true);
    expect(new Set(t.map((x) => x.id)).size).toBe(TRASH_COUNT);
  });
});

describe("taller", () => {
  it("un juguete del día de un amigo", () => {
    const w = workshopOf("2026-11-27", ["panque", "luna"]);
    expect(["panque", "luna"]).toContain(w.from);
    expect(workshopOf("2026-11-27", ["panque", "luna"])).toEqual(w);
  });
});

describe("topos", () => {
  it("nunca salen dos en el mismo hoyo a la vez", () => {
    const plan = molesPlan(rng("t"), "dificil");
    expect(plan.length).toBeGreaterThan(20);
    for (const a of plan) for (const b of plan) if (a !== b && a.hole === b.hole) expect(a.at + a.stay <= b.at || b.at + b.stay <= a.at).toBe(true);
    expect(molesScore(0, plan)).toBe(0);
  });
});

describe("dominó", () => {
  it("28 fichas, se reparte y se pone volteando si hace falta", () => {
    expect(domSet(6).length).toBe(28);
    const d = domDeal(rng("d"), "normal");
    expect(d.me.length + d.him.length + d.pile.length).toBe(28);
    let line: Tile[] = domPlace([], [3, 5], "der");
    expect(domSides([5, 1], line)).toEqual(["der"]);
    line = domPlace(line, [5, 1], "der");
    line = domPlace(line, [2, 3], "izq");
    expect(domEnds(line)).toEqual([2, 1]);
    expect(domMove([[6, 6], [1, 4]], line, "normal")).toMatchObject({ i: 1, side: "der" });
  });
});

describe("damas", () => {
  it("se empieza con 12 y 12 y se come saltando", () => {
    const b = dmInit();
    expect(b.filter((p) => p === "h").length).toBe(12);
    expect(dmMoves(b, "h").length).toBe(7);
    const t: Dm = Array(64).fill("");
    t[5 * 8 + 2] = "h"; t[4 * 8 + 3] = "p"; t[2 * 8 + 5] = "p";
    const cap = dmMoves(t, "h").find((m) => m.cap !== undefined)!;
    expect(cap).toEqual({ from: 42, to: 28, cap: 35 });
    const after = dmApply(t, cap);
    expect(dmMoreJumps(after, 28).length).toBe(1);
    expect(dmApply(after, dmMoreJumps(after, 28)[0])[2 * 8 + 5]).toBe("");
  });
  it("corona al llegar al otro lado y Mochito come si puede", () => {
    const t: Dm = Array(64).fill("");
    t[1 * 8 + 2] = "h";
    expect(dmApply(t, { from: 10, to: 1 })[1]).toBe("H");
    const u: Dm = Array(64).fill("");
    u[2 * 8 + 1] = "p"; u[3 * 8 + 2] = "h"; u[7 * 8 + 7] = "h";
    expect(dmMove(rng("m"), u, "normal")?.cap).toBe(26);
    expect(dmWinner(Array(64).fill("").map((_, i) => (i === 0 ? "h" : "")) as Dm, "p")).toBe("h");
  });
});

describe("junta los huesos", () => {
  it("los iguales se juntan una sola vez por movimiento", () => {
    const g = [2, 2, 2, 2, 0, 0, 0, 0, 4, 4, 8, 0, 0, 0, 0, 0];
    const r = bonesSlide(g, "izq");
    expect(r.grid.slice(0, 4)).toEqual([4, 4, 0, 0]);
    expect(r.grid.slice(8, 12)).toEqual([8, 8, 0, 0]);
    expect(r.gained).toBe(16);
    expect(bonesSlide([2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "arriba").grid[0]).toBe(4);
    expect(bonesStart(rng("b")).filter(Boolean).length).toBe(2);
    expect(bonesCanMove([2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2])).toBe(false);
    expect(bonesScore(256, 256)).toBe(1);
  });
});
