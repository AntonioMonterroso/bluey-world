"use client";

import { useSyncExternalStore } from "react";

export type SyncState = "local" | "login" | "offline" | "syncing" | "synced" | "error";

type Snapshot = { state: SyncState; lastSync: number | null };

const SERVER_SNAPSHOT: Snapshot = { state: "local", lastSync: null };
let snap: Snapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

export function setSyncStatus(next: Partial<Snapshot>) {
  snap = { ...snap, ...next };
  listeners.forEach((l) => l());
}

export function useSyncStatus() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => snap,
    () => SERVER_SNAPSHOT,
  );
}
