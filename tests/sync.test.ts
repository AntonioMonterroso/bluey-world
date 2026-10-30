// Prueba de la sincronización con una nube simulada: dos dispositivos, dos cuentas, borrados,
// cambios sin internet y el respaldo. La nube falsa se porta como la tabla `records` de Supabase
// (cada cuenta solo ve lo suyo y gana el cambio más nuevo).
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = { user_id: string; table_name: string; id: string; data: Record<string, unknown>; updated_at: number; deleted_at: number | null };
const server = new Map<string, Row>();
let currentUser: string | null = "user-a";
let online = true;

function fakeClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: currentUser ? { user: { id: currentUser } } : null } }),
      signOut: async () => { currentUser = null; return { error: null }; },
    },
    from: () => ({
      upsert: async (rows: Row[]) => {
        if (!online) return { error: new Error("offline") };
        for (const r of rows) {
          if (r.user_id !== currentUser) return { error: new Error("RLS") };
          const key = `${r.user_id}|${r.table_name}|${r.id}`;
          const prev = server.get(key);
          if (!prev || r.updated_at >= prev.updated_at) server.set(key, structuredClone(r)); // el más nuevo gana
        }
        return { error: null };
      },
      select: () => {
        let cursor = 0;
        let limit = 1000;
        const q = {
          gt: (_c: string, v: number) => { cursor = v; return q; },
          order: () => q,
          limit: (n: number) => { limit = n; return q; },
          then: (res: (v: unknown) => void) => {
            const data = [...server.values()]
              .filter((r) => r.user_id === currentUser && r.updated_at > cursor)
              .sort((a, b) => a.updated_at - b.updated_at)
              .slice(0, limit)
              .map((r) => structuredClone(r));
            res({ data, error: null });
          },
        };
        return q;
      },
    }),
  };
}

vi.mock("@/lib/supabase", () => ({ getSupabase: () => fakeClient() }));
Object.defineProperty(globalThis, "navigator", { value: { get onLine() { return online; } }, configurable: true });

const { db } = await import("@/lib/db/db");
const { syncNow } = await import("@/lib/db/sync");
const { upsertRow, deleteRow } = await import("@/lib/db/repo");
const { logout } = await import("@/lib/auth");
const backup = await import("@/lib/backup");

/** Simula abrir la app en otro dispositivo: base local vacía. */
async function newDevice() {
  db.close();
  await db.delete();
  await db.open();
}
const recipe = (id: string, title: string) => ({ id, title, category: "Pasteles", servings: 8, prep_min: null, cook_min: null, difficulty: 1 as const, tags: [], photo: null, ingredients: [], steps: [], notes: "", secret: "", source_url: "", video_url: "", favorite: false, created_at: Date.now(), cooked_count: 0 });
const tick = () => new Promise((r) => setTimeout(r, 3)); // que el reloj avance entre cambios

beforeEach(async () => {
  server.clear();
  currentUser = "user-a";
  online = true;
  await newDevice();
});

describe("sincronización", () => {
  it("lo que anotas en un dispositivo aparece en el otro", async () => {
    await syncNow(); // primer ingreso en el dispositivo A
    await upsertRow("recipes", recipe("r1", "Brownies"));
    await syncNow();
    expect([...server.values()].map((r) => r.id)).toEqual(["r1"]);

    await newDevice(); // dispositivo B, misma cuenta
    await syncNow();
    expect((await db.recipes.get("r1"))?.title).toBe("Brownies");
  });

  it("gana el cambio más nuevo, y lo local sin subir no se pisa", async () => {
    await syncNow();
    await upsertRow("recipes", recipe("r1", "Versión 1"));
    await syncNow();
    await tick();
    // En otro dispositivo cambian el título (más nuevo)…
    const remote = [...server.values()][0];
    server.set(`user-a|recipes|r1`, { ...remote, data: { ...remote.data, title: "Versión 2" }, updated_at: Date.now() });
    await syncNow();
    expect((await db.recipes.get("r1"))?.title).toBe("Versión 2");
    // …y si aquí hay un cambio aún más nuevo sin subir, se queda el de aquí y sube.
    await tick();
    online = false;
    await upsertRow("recipes", { ...recipe("r1", "Versión 3 (aquí)") });
    online = true;
    await syncNow();
    expect((await db.recipes.get("r1"))?.title).toBe("Versión 3 (aquí)");
    expect(server.get("user-a|recipes|r1")?.data.title).toBe("Versión 3 (aquí)");
  });

  it("los borrados viajan entre dispositivos", async () => {
    await syncNow();
    await upsertRow("recipes", recipe("r1", "Para borrar"));
    await syncNow();
    await tick();
    await deleteRow("recipes", "r1");
    await syncNow();
    await newDevice();
    await syncNow();
    expect((await db.recipes.get("r1"))?.deleted_at).toBeTruthy();
  });

  it("dos cuentas en el mismo dispositivo no se mezclan", async () => {
    await syncNow();
    await upsertRow("recipes", recipe("ra", "De la cuenta A"));
    await syncNow();
    currentUser = "user-b"; // entra otra persona
    await syncNow();
    expect(await db.recipes.count()).toBe(0);
    await upsertRow("recipes", recipe("rb", "De la cuenta B"));
    await syncNow();
    expect([...server.values()].filter((r) => r.user_id === "user-a").map((r) => r.id)).toEqual(["ra"]);
    expect([...server.values()].filter((r) => r.user_id === "user-b").map((r) => r.id)).toEqual(["rb"]);
    currentUser = "user-a"; // vuelve la primera: ve solo lo suyo
    await syncNow();
    expect((await db.recipes.toArray()).map((r) => r.id)).toEqual(["ra"]);
  });

  it("datos de antes de tener cuenta no se suben a la cuenta", async () => {
    await upsertRow("recipes", recipe("viejo", "De antes"));
    await syncNow(); // primer ingreso en este dispositivo: empieza limpio
    expect(server.size).toBe(0);
    expect(await db.recipes.count()).toBe(0);
  });

  it("salir sin internet con cambios pendientes avisa y no borra", async () => {
    await syncNow();
    online = false;
    await upsertRow("recipes", recipe("r1", "Pendiente"));
    expect(await logout()).toBeGreaterThan(0);
    expect(await db.recipes.count()).toBe(1);
    online = true;
    expect(await logout()).toBe(0); // con internet: sube, borra local y sale
    expect(await db.recipes.count()).toBe(0);
    expect(server.get("user-a|recipes|r1")?.data.title).toBe("Pendiente");
  });
});

describe("respaldo", () => {
  it("descargar y volver a cargar recupera todo", async () => {
    await syncNow();
    await upsertRow("recipes", recipe("r1", "Pastel"));
    await upsertRow("expenses", { id: "g1", date: Date.now(), amount: 25, category: "Comida", note: "Harina", store: "", photo: null, kind: "gasto" });
    const { blob, rows } = await backup.exportAll();
    expect(rows).toBeGreaterThanOrEqual(2);
    const read = backup.readBackup(await blob.text());
    expect(read.ok).toBe(true);
    await newDevice();
    await syncNow();
    server.clear();
    expect(await db.recipes.count()).toBe(0);
    if (read.ok) await backup.restoreBackup(read.file);
    expect((await db.recipes.get("r1"))?.title).toBe("Pastel");
    expect((await db.expenses.get("g1"))?.amount).toBe(25);
    await syncNow(); // y vuelve a la nube
    expect(server.has("user-a|recipes|r1")).toBe(true);
  });

  it("rechaza archivos que no son respaldos", () => {
    expect(backup.readBackup("hola").ok).toBe(false);
    expect(backup.readBackup(JSON.stringify({ app: "otra", tables: {} })).ok).toBe(false);
  });
});
