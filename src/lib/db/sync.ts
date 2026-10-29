import { db, SYNC_TABLES, type SyncRow, type SyncTable } from "./db";
import { getSupabase } from "@/lib/supabase";
import { setSyncStatus } from "./sync-status";

const PAGE = 500;
let running = false;
let timer: ReturnType<typeof setTimeout> | undefined;

interface RemoteRecord {
  table_name: string;
  id: string;
  data: SyncRow;
  updated_at: number;
  deleted_at: number | null;
}

async function getMeta(key: string) {
  return (await db.meta.get(key))?.value;
}

/** Borra los datos de este dispositivo (los de la nube quedan intactos). */
export async function resetLocal() {
  await db.transaction("rw", [...SYNC_TABLES.map((t) => db.table(t)), db.outbox, db.meta, db.timers], async () => {
    for (const t of SYNC_TABLES) await db.table(t).clear();
    await db.outbox.clear();
    await db.meta.clear();
    await db.timers.clear();
  });
}

/** Sube los cambios pendientes y baja los nuevos. Seguro de llamar varias veces. */
export async function syncNow() {
  if (running) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setSyncStatus({ state: "offline" });
    return;
  }
  const supabase = getSupabase();
  if (!supabase) {
    setSyncStatus({ state: "local" });
    return;
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) {
    setSyncStatus({ state: "login" }); // sin sesión: todo sigue local hasta iniciar sesión
    return;
  }

  running = true;
  setSyncStatus({ state: "syncing" });
  try {
    // Si entra otra persona en este dispositivo, no se mezclan los datos.
    const lastUser = await getMeta("userId");
    if (lastUser && lastUser !== user.id) await resetLocal();
    await db.meta.put({ key: "userId", value: user.id });

    // 1) Subir
    const items = await db.outbox.orderBy("seq").toArray();
    if (items.length) {
      const latest = new Map<string, (typeof items)[number]>();
      for (const it of items) latest.set(`${it.table}/${it.id}`, it);
      const rows = [...latest.values()].map((it) => ({
        user_id: user.id,
        table_name: it.table,
        id: it.id,
        data: it.row,
        updated_at: it.row.updated_at,
        deleted_at: it.row.deleted_at ?? null,
      }));
      const { error } = await supabase
        .from("records")
        .upsert(rows, { onConflict: "user_id,table_name,id" });
      if (error) throw error;
      await db.outbox.bulkDelete(items.map((i) => i.seq!));
    }

    // 2) Bajar (el cambio más reciente gana)
    let cursor = Number((await getMeta("lastPull")) ?? 0);
    for (;;) {
      const { data, error } = await supabase
        .from("records")
        .select("table_name,id,data,updated_at,deleted_at")
        .gt("updated_at", cursor)
        .order("updated_at", { ascending: true })
        .limit(PAGE);
      if (error) throw error;
      const batch = (data ?? []) as RemoteRecord[];
      for (const r of batch) {
        if (!(SYNC_TABLES as readonly string[]).includes(r.table_name)) continue;
        const table = db.table(r.table_name as SyncTable);
        const local = (await table.get(r.id)) as SyncRow | undefined;
        // Si hay un cambio local sin subir y más nuevo, se conserva.
        if (!local || r.updated_at > local.updated_at) {
          await table.put({ ...r.data, id: r.id, updated_at: r.updated_at, deleted_at: r.deleted_at });
        }
        cursor = Math.max(cursor, r.updated_at);
      }
      await db.meta.put({ key: "lastPull", value: String(cursor) });
      if (batch.length < PAGE) break;
    }

    setSyncStatus({ state: "synced", lastSync: Date.now() });
  } catch (e) {
    console.error("[sync]", e);
    setSyncStatus({ state: navigator.onLine ? "error" : "offline" });
  } finally {
    running = false;
  }
}

/** Agrupa escrituras seguidas en una sola sincronización. */
export function scheduleSync(delay = 1500) {
  if (typeof window === "undefined") return;
  clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), delay);
}

/** Dispara la sincronización al volver la conexión, al volver a la pestaña y cada minuto. */
export function startSyncEngine() {
  const run = () => void syncNow();
  const onVisible = () => document.visibilityState === "visible" && run();
  const onOffline = () => setSyncStatus({ state: "offline" });
  window.addEventListener("online", run);
  window.addEventListener("offline", onOffline);
  document.addEventListener("visibilitychange", onVisible);
  const interval = setInterval(run, 60_000);
  run();
  return () => {
    window.removeEventListener("online", run);
    window.removeEventListener("offline", onOffline);
    document.removeEventListener("visibilitychange", onVisible);
    clearInterval(interval);
  };
}
