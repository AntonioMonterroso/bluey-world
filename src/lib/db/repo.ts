import { db, type SyncRow, type SyncTable } from "./db";
import { scheduleSync } from "./sync";

type Writable<T extends SyncRow> = Omit<T, "updated_at">;

/** Guarda una fila localmente y la encola para subirla cuando haya conexión. */
export async function upsertRow<T extends SyncRow>(table: SyncTable, row: Writable<T>) {
  const full = { ...row, updated_at: Date.now() } as T;
  await db.transaction("rw", db.table(table), db.outbox, async () => {
    await db.table(table).put(full);
    // Solo importa el último cambio por fila: evita acumular uno por tecla.
    await db.outbox.where({ table, id: full.id }).delete();
    await db.outbox.add({ table, id: full.id, row: full, ts: full.updated_at });
  });
  scheduleSync();
  return full;
}

/** Borrado lógico (se sincroniza como cualquier otro cambio). */
export async function deleteRow(table: SyncTable, id: string) {
  const current = await db.table(table).get(id);
  if (!current) return;
  await upsertRow(table, { ...current, deleted_at: Date.now() });
}
