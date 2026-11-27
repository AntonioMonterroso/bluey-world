import { describe, expect, it } from "vitest";
import { rng } from "@/lib/game/engine";
import {
  FRIEND_BDAYS, TREE_PARTS, addMats, c4Drop, c4Empty, c4Move, c4Row, c4Winner, canBuild, fairHit, fairPrize, friendBdays, gatherOf, laddersBoard, laddersMove,
  nextFriendBday, nextPart, rpsMochito, rpsWin, sumsBest, sumsPoints, sumsRound, teethDone, teethNext, type C4,
} from "@/lib/mochito-extra-4";
import { FRIENDS, applyCare, earnedMedals, EMPTY_STATS } from "@/lib/mochito-play";

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d, 20).getTime();

describe("dientes", () => {
  it("la racha sigue si fue ayer y empieza de nuevo si se saltó un día", () => {
    let t = teethNext(undefined, day(2026, 11, 25));
    t = teethNext(t, day(2026, 11, 26));
    expect(t.streak).toBe(2);
    expect(teethNext(t, day(2026, 11, 26))).toEqual(t);
    expect(teethDone(t, day(2026, 11, 26))).toBe(true);
    const gap = teethNext(t, day(2026, 11, 28));
    expect(gap.streak).toBe(1);
    expect(gap.best).toBe(2);
  });
  it("cruza de mes y de año", () => {
    expect(teethNext({ last: "2026-12-31", streak: 4 }, day(2027, 1, 1)).streak).toBe(5);
  });
});

describe("casita del árbol", () => {
  it("se junta lo del día y se construye parte por parte", () => {
    const m = gatherOf("2026-11-27");
    expect(m.tablas).toBeGreaterThanOrEqual(3);
    expect(gatherOf("2026-11-27")).toEqual(m);
    expect(nextPart(undefined)?.id).toBe("piso");
    expect(canBuild({ mats: { tablas: 3, clavos: 2 } }, TREE_PARTS[0])).toBe(true);
    expect(canBuild({ mats: { tablas: 2, clavos: 2 } }, TREE_PARTS[0])).toBe(false);
    expect(addMats({ tablas: 3 }, { tablas: 2, cuerda: 1 }, -1)).toMatchObject({ tablas: 1, cuerda: 0 });
    expect(nextPart({ built: TREE_PARTS.map((p) => p.id) })).toBeNull();
  });
});

describe("feria", () => {
  it("el premio depende de los tiros", () => {
    expect(fairPrize(3, "2026-11").size).toBe("grande");
    expect(fairPrize(1, "2026-11").size).toBe("chico");
    expect(fairPrize(0, "2026-11").size).toBe("consuelo");
    expect(fairHit(0.55, 0.09)).toBe(true);
    expect(fairHit(0.7, 0.09)).toBe(false);
  });
});

describe("cumpleaños de amigos", () => {
  it("cada perrito del parque tiene su día; se festeja hasta 6 días después", () => {
    for (const f of FRIENDS) expect(FRIEND_BDAYS[f.id]).toBeTruthy();
    expect(friendBdays(day(2026, 11, 29)).map((b) => b.id)).toContain("luna");
    expect(friendBdays(day(2026, 12, 4))[0]).toMatchObject({ id: "luna", late: 5 });
    expect(friendBdays(day(2026, 12, 6))).toEqual([]);
    expect(friendBdays(day(2026, 11, 29), { luna: 2026 })).toEqual([]);
    expect(friendBdays(day(2027, 1, 16)).map((b) => b.id)).toContain("panque");
    expect(nextFriendBday(day(2026, 11, 27))).toEqual({ id: "luna", days: 2 });
    expect(nextFriendBday(day(2026, 11, 29), { luna: 2026 }).id).toBe("panque");
  });
  it("cuenta en sus medallas", () => {
    const s = applyCare(EMPTY_STATS, "fbday", Date.now());
    expect(earnedMedals({ stats: s, tricks: [], level: 1, things: 0 }).map((m) => m.id)).toContain("cumple-amigo-1");
  });
});

describe("cuatro en línea", () => {
  it("las fichas caen hasta abajo y se ve quién gana", () => {
    let b = c4Empty();
    expect(c4Row(b, 3)).toBe(5);
    for (const c of [0, 1, 2, 3]) b = c4Drop(b, c, "Y")!;
    expect(c4Winner(b)).toMatchObject({ who: "Y" });
  });
  it("Mochito gana si puede y tapa si debe", () => {
    let b: C4 = c4Empty();
    for (const c of [0, 1, 2]) b = c4Drop(b, c, "M")!;
    expect(c4Move(rng("a"), b, "normal")).toBe(3);
    let y: C4 = c4Empty();
    for (const c of [2, 3, 4]) y = c4Drop(y, c, "Y")!;
    expect([1, 5]).toContain(c4Move(rng("b"), y, "dificil"));
  });
});

describe("sumas con huesos", () => {
  it("siempre se puede llegar", () => {
    for (const l of ["facil", "normal", "dificil"] as const) for (let k = 0; k < 30; k++) {
      const r = sumsRound(rng(`${l}${k}`), l);
      expect(sumsBest(r)).toBeLessThan(Infinity);
    }
    expect(sumsBest({ start: 0, target: 7, steps: [2, 5] })).toBe(2);
    expect(sumsPoints(true, 2, 2)).toBe(1);
    expect(sumsPoints(false, 9, 2)).toBe(0);
  });
});

describe("escaleras y resbaladillas", () => {
  it("sube por escaleras, baja por resbaladillas y rebota en la meta", () => {
    const b = laddersBoard("facil");
    expect(laddersMove(1, 2, b)).toEqual({ land: 3, to: 11, kind: "escalera" });
    expect(laddersMove(10, 4, b)).toEqual({ land: 14, to: 4, kind: "resbaladilla" });
    expect(laddersMove(23, 4, b).land).toBe(23);
    for (const l of ["facil", "normal", "dificil"] as const) {
      const bb = laddersBoard(l);
      for (const [a, z] of Object.entries(bb.jumps)) { expect(+a).toBeLessThan(bb.size); expect(z).toBeLessThanOrEqual(bb.size); expect(bb.jumps[z]).toBeUndefined(); }
    }
  });
});

describe("piedra, papel o tijera", () => {
  it("quién gana y las mañas de Mochito", () => {
    expect(rpsWin("piedra", "tijera")).toBe(1);
    expect(rpsWin("piedra", "papel")).toBe(-1);
    const r = rng("r");
    const picks = Array.from({ length: 200 }, () => rpsMochito(r, "facil", "papel", [], [], null));
    expect(picks.filter((p) => p === "papel").length).toBeGreaterThan(110);
    const hard = Array.from({ length: 200 }, () => rpsMochito(r, "dificil", "papel", ["piedra", "piedra", "piedra"], [], null));
    expect(hard.filter((p) => p === "papel").length).toBeGreaterThan(110);
  });
});
