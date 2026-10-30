"use client";

import { db, SYNC_TABLES, type SyncRow, type SyncTable } from "@/lib/db/db";
import { upsertRow } from "@/lib/db/repo";

// Respaldo de todo en un archivo: se descarga y se puede volver a cargar. Lo que se carga se guarda
// como cambio nuevo, así también sube a la nube.

const MARK = "dulce-rincon-respaldo";
export const LAST_BACKUP_KEY = "bw-last-backup";

interface BackupFile { app: typeof MARK; version: 1; exported_at: number; tables: Partial<Record<SyncTable, SyncRow[]>> }

export async function exportAll(): Promise<{ blob: Blob; filename: string; rows: number }> {
  const tables: BackupFile["tables"] = {};
  let rows = 0;
  for (const t of SYNC_TABLES) {
    const all = (await db.table(t).toArray()) as SyncRow[];
    const alive = all.filter((r) => !r.deleted_at);
    if (alive.length) { tables[t] = alive; rows += alive.length; }
  }
  const file: BackupFile = { app: MARK, version: 1, exported_at: Date.now(), tables };
  const d = new Date();
  const name = `respaldo-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.json`;
  try { localStorage.setItem(LAST_BACKUP_KEY, String(Date.now())); } catch {}
  return { blob: new Blob([JSON.stringify(file)], { type: "application/json" }), filename: name, rows };
}

/** Revisa el archivo y devuelve cuántas filas trae, o un error en palabras simples. */
export function readBackup(text: string): { ok: true; file: BackupFile; rows: number } | { ok: false; error: string } {
  let data: unknown;
  try { data = JSON.parse(text); } catch { return { ok: false, error: "Ese archivo no es un respaldo de la app." }; }
  const f = data as BackupFile;
  if (!f || f.app !== MARK || typeof f.tables !== "object") return { ok: false, error: "Ese archivo no es un respaldo de la app." };
  let rows = 0;
  for (const [t, list] of Object.entries(f.tables)) {
    if (!(SYNC_TABLES as readonly string[]).includes(t) || !Array.isArray(list)) continue;
    rows += list.filter((r) => r && typeof r.id === "string").length;
  }
  return { ok: true, file: f, rows };
}

/** Carga el respaldo: agrega lo que falte y reemplaza lo que tenga el mismo id. */
export async function restoreBackup(file: BackupFile, onProgress?: (done: number) => void): Promise<number> {
  let done = 0;
  for (const [t, list] of Object.entries(file.tables)) {
    if (!(SYNC_TABLES as readonly string[]).includes(t) || !Array.isArray(list)) continue;
    for (const row of list) {
      if (!row || typeof row.id !== "string") continue;
      await upsertRow(t as SyncTable, { ...row, deleted_at: null });
      done++;
      if (done % 50 === 0) onProgress?.(done);
    }
  }
  return done;
}
