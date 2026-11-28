import { describe, expect, it } from "vitest";
import { rng } from "@/lib/game/engine";
import {
  ANIMALS, FARM_ANIMALS, MK_HIS, MK_MINE, POOL_START, RINGS, SCRUBS, carDone, carOf, eggsOf, farmOf, inLens, lightsMake, lightsOff, lightsPress, mkInit, mkMove, mkMoves, mkSow,
  moonLit, moonPhase, pegApply, pegJumps, pegLeft, pegMake, poolAir, ringsOf, skyOf, slideDone, slideMake, slideMove, slideSolved, swimCost, washApply, type Zone,
} from "@/lib/mochito-extra-8";

describe("granja", () => {
  it("cuatro animales distintos que piden algo que les gusta, y huevos en los nidos", () => {
    const f = farmOf("2026-11-27");
    expect(f.length).toBe(FARM_ANIMALS);
    expect(new Set(f.map((a) => a.id)).size).toBe(FARM_ANIMALS);
    for (const a of f) expect((ANIMALS.find((x) => x.id === a.id)!.likes as readonly string[]).includes(a.wants)).toBe(true);
    const e = eggsOf("2026-11-27");
    expect([2, 3]).toContain(e.nests.length);
  });
});

describe("noche de estrellas", () => {
  it("la luna del calendario y las cosas del cielo separadas", () => {
    expect(moonPhase(Date.UTC(2024, 0, 25, 17, 54))).toBe(4);
    expect(moonPhase(Date.UTC(2024, 0, 11, 11, 57))).toBe(0);
    expect(moonLit(Date.UTC(2024, 0, 25, 17, 54)).lit).toBeGreaterThan(0.97);
    const s = skyOf("2026-11-27");
    expect(s.length).toBe(3);
    expect(new Set(s.map((x) => x.id)).size).toBe(3);
    expect(inLens({ x: s[0].x, y: s[0].y }, s[0])).toBe(true);
    expect(inLens({ x: s[0].x + 30, y: s[0].y }, s[0])).toBe(false);
  });
});

describe("piscina", () => {
  it("el aire alcanza yendo al aro más cercano", () => {
    for (const d of ["2026-11-27", "2026-11-28", "2026-12-03"]) {
      const r = ringsOf(d);
      expect(r.length).toBe(RINGS);
      const air = poolAir(r);
      let at: { x: number; y: number } = POOL_START, used = 0;
      const left = [...r];
      while (left.length) { left.sort((a, b) => swimCost(at, a) - swimCost(at, b)); const n = left.shift()!; used += swimCost(at, n); at = n; }
      expect(used).toBeLessThanOrEqual(air);
    }
  });
});

describe("lavar el carro", () => {
  it("hay que seguir el orden y tallar las manchas", () => {
    let z: Zone[] = carOf("2026-11-27");
    expect(washApply(z, "jabon", 0).ok).toBe(false);
    for (let i = 0; i < z.length; i++) {
      z = washApply(z, "manguera", i).zones;
      z = washApply(z, "jabon", i).zones;
      if (z[i].spot) { expect(washApply(z, "manguera", i).ok).toBe(false); for (let k = 0; k < SCRUBS; k++) z = washApply(z, "esponja", i).zones; }
      z = washApply(z, "manguera", i).zones;
      z = washApply(z, "toalla", i).zones;
    }
    expect(carDone(z)).toBe(true);
  });
});

describe("semillitas", () => {
  it("reparte, repite turno en el granero y se lleva las de enfrente", () => {
    const b = mkInit(4);
    const r = mkSow(b, 2, "y");
    expect(r.again).toBe(true);
    expect(r.b[MK_MINE]).toBe(1);
    const c = [0, 0, 1, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0];
    const s = mkSow(c, 2, "y");
    expect(s.took).toBe(6);
    expect(s.b[MK_MINE]).toBe(6);
    const total = (x: number[]) => x.reduce((a, v) => a + v, 0);
    expect(total(mkSow(b, 5, "y").b)).toBe(48);
    for (const l of ["facil", "normal", "dificil"] as const) expect(mkMoves(b, "m")).toContain(mkMove(rng(l), b, l));
    expect(mkSow(b, 12, "m").b[MK_HIS]).toBe(1);
  });
});

describe("cuadritos deslizantes", () => {
  it("revuelto se puede mover y ordenado está listo", () => {
    expect(slideDone(slideSolved(4))).toBe(true);
    const b = slideMake(rng("s"), 3);
    expect(slideDone(b)).toBe(false);
    expect([...b].sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(slideMove(slideSolved(3), 3, 0)).toBeNull();
    expect(slideMove(slideSolved(3), 3, 7)?.[7]).toBe(0);
  });
});

describe("apaga las luces", () => {
  it("tocar otra vez las mismas apaga todo", () => {
    for (const n of [3, 4, 5]) {
      const { b, taps } = lightsMake(rng(`l${n}`), n);
      expect(lightsOff(b)).toBe(false);
      let x = b;
      for (const t of taps) x = lightsPress(x, n, t);
      expect(lightsOff(x)).toBe(true);
    }
  });
});

describe("salta fichas", () => {
  it("cada tablero tiene saltos y un salto quita una ficha", () => {
    for (const l of ["facil", "normal", "dificil"] as const) {
      const b = pegMake(rng(`p${l}`), l);
      expect(pegLeft(b)).toBe(l === "facil" ? 6 : l === "normal" ? 10 : 16);
      const j = pegJumps(b);
      expect(j.length).toBeGreaterThan(0);
      expect(pegLeft(pegApply(b, j[0]))).toBe(pegLeft(b) - 1);
    }
  });
});
