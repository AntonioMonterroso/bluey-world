import { describe, expect, it } from "vitest";
import { rng } from "@/lib/game/engine";
import {
  BAD_INGREDIENTS, CLASS_ROUNDS, COURSES, PET_RECIPES, ROOM, STREET_STOPS, TREAT_IDS, aimY, bakeCount, bakeZone, bowlKnock, canHit, canSettle, canTower,
  canTurn, catchPoints, classPlan, diplomas, drumScore, drumSeq, laneOf, laneX, nextCourse, numbersScore, pantryFor, pinRack, roomCozy, roomItem,
  shadowRound, streetEvent, streetRoute, sweep, trainBone, trainStart, trainStep, treatsFor, type Treat,
} from "@/lib/mochito-extra-2";
import { applyCare, earnedMedals, EMPTY_STATS } from "@/lib/mochito-play";

describe("su cuarto", () => {
  it("lo de cada rincón empieza gratis y cuenta lo comprado", () => {
    for (const s of Object.values(ROOM)) expect(s.items[0].price).toBe(0);
    expect(roomItem("pared", "nada").id).toBe("crema");
    expect(roomCozy({ pared: "menta", piso: "madera", planta: "cactus" })).toBe(2);
  });
});

describe("paseo por la colonia", () => {
  it("cuatro paradas con dos lugares distintos, igual todo el día", () => {
    const r = streetRoute("2026-11-27");
    expect(r.length).toBe(STREET_STOPS);
    expect(new Set(r.flat()).size).toBe(STREET_STOPS * 2);
    expect(streetRoute("2026-11-27")).toEqual(r);
  });
  it("si no encontró nada, la última parada siempre tiene tesoro", () => {
    for (const [a, b] of streetRoute("2026-11-27")) {
      expect(streetEvent("2026-11-27", STREET_STOPS - 1, a, 0).treasure).toBeTruthy();
      expect(streetEvent("2026-11-27", STREET_STOPS - 1, b, 0).kind).toBe("tesoro");
    }
    expect(streetEvent("d", 0, "tienda", 0)).toMatchObject({ kind: "vecino", neighbor: "tendera" });
  });
});

describe("escuela", () => {
  it("cinco órdenes del curso; a veces se equivoca", () => {
    const plan = classPlan(rng("c"), "cachorro", 0);
    expect(plan.length).toBe(CLASS_ROUNDS);
    for (const p of plan) { expect(COURSES[0].commands).toContain(p.cmd); expect(COURSES[0].commands).toContain(p.did); }
  });
  it("el curso que sigue y los diplomas", () => {
    expect(nextCourse(undefined, 1)?.id).toBe("cachorro");
    expect(nextCourse({ done: { cachorro: 3 } }, 1)).toBeNull();
    expect(nextCourse({ done: { cachorro: 3 } }, 2)?.id).toBe("modales");
    expect(diplomas({ done: { cachorro: 3, modales: 2 } })).toBe(1);
  });
});

describe("cocina de premios", () => {
  it("la alacena trae lo de la receta y dos cosas malas", () => {
    for (const t of TREAT_IDS) {
      const p = pantryFor(t as Treat, rng(t));
      expect(p.length).toBe(8);
      for (const i of PET_RECIPES[t].items) expect(p).toContain(i);
      expect(p.filter((i) => BAD_INGREDIENTS.includes(i)).length).toBe(2);
    }
    expect(treatsFor(1)).toEqual(["mani", "zanahoria"]);
  });
  it("el punto dorado da más galletas", () => {
    expect(bakeZone(0.3)).toBe("crudas");
    expect(bakeCount(bakeZone(0.7))).toBe(6);
    expect(bakeCount(bakeZone(0.95))).toBe(4);
  });
  it("cuenta en sus medallas", () => {
    const s = applyCare(EMPTY_STATS, "bake", Date.now());
    expect(earnedMedals({ stats: s, tricks: [], level: 1, things: 0 }).map((m) => m.id)).toContain("horno-1");
  });
});

describe("galletas en carriles", () => {
  it("cada carril tiene su centro", () => {
    expect(laneOf(laneX(0))).toBe(0);
    expect(laneOf(laneX(2))).toBe(2);
    expect(laneOf(1)).toBe(2);
    expect(catchPoints("hueso", "hueso")).toBe(2);
    expect(catchPoints("pollo", "hueso")).toBe(1);
  });
});

describe("juegos", () => {
  it("colorea por números", () => {
    expect(numbersScore(0, 10)).toBe(1);
    expect(numbersScore(20, 10)).toBe(0);
  });
  it("sombras: cada cosa tiene su sombra, más las de sobra", () => {
    const r = shadowRound(rng("s"), "dificil", 20);
    expect(r.items.length).toBe(5);
    expect(r.shadows.length).toBe(7);
    for (const i of r.items) expect(r.shadows).toContain(i);
  });
  it("tumba latas: si pegas abajo se cae lo de arriba", () => {
    const cans = canTower(3);
    expect(cans.length).toBe(6);
    const mid = canHit(cans, cans.map(() => true), 0.5, 0.05)!;
    expect(cans[mid]).toMatchObject({ r: 0, c: 1 });
    const up = cans.map((_, i) => i !== mid);
    expect(canSettle(cans, up).filter(Boolean).length).toBe(2);
    expect(canHit(cans, cans.map(() => true), 0.02, 0.05)).toBeNull();
    expect(aimY(1, 3)).toBeLessThan(0.6);
    expect(sweep(0, 1000)).toBe(0);
    expect(sweep(500, 1000)).toBe(1);
  });
  it("bolos: derecho al centro y con fuerza tumba varios; al canal ninguno", () => {
    const pins = pinRack(4);
    expect(pins.length).toBe(10);
    const up = pins.map(() => true);
    expect(bowlKnock(pins, up, 0.5, 0, 1, rng("b")).length).toBeGreaterThan(3);
    expect(bowlKnock(pins, up, 0.05, 0, 1, rng("b"))).toEqual([]);
  });
  it("tren: crece al comer y choca con la pared", () => {
    let t = trainStart(9);
    const head = t.body[0];
    const r = trainStep(t, 9, head + 1, false);
    expect(r.ate).toBe(true);
    t = trainStep(r.train, 9, -1, false).train;
    expect(t.body.length).toBe(4);
    for (let k = 0; k < 9; k++) t = trainStep(t, 9, -1, false).train;
    expect(t.alive).toBe(false);
    expect(trainStep(trainStart(9), 9, -1, true).train.alive).toBe(true);
    expect(canTurn("der", "izq")).toBe(false);
    expect(trainStart(9).body).not.toContain(trainBone(rng("x"), 9, trainStart(9).body));
  });
  it("tambor", () => {
    expect(drumSeq(rng("t"), 6).every((d) => d >= 0 && d < 4)).toBe(true);
    expect(drumScore(10, 3)).toBe(1);
    expect(drumScore(2, 3)).toBe(0);
  });
});

describe("diario", async () => {
  const { logLine } = await import("@/lib/mochito-life");
  it("anota lo nuevo", () => {
    expect(logLine({ kind: "street", treasure: "Canica", neighbor: "El cartero" })).toBe("Paseamos con correa por la colonia y saludamos al cartero. Me traje un tesoro: canica.");
    expect(logLine({ kind: "school", course: "Agilidad", diploma: true })).toContain("«Agilidad»");
    expect(logLine({ kind: "bake", recipe: "galletas de zanahoria", count: 6 })).toContain("6 galletas de zanahoria");
  });
});
