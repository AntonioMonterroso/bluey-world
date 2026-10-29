"use client";

import { Cloud, CloudOff, HardDrive, RefreshCw, TriangleAlert } from "lucide-react";
import { useSyncStatus, type SyncState } from "@/lib/db/sync-status";
import { cn } from "@/lib/utils";

const LABEL: Record<SyncState, { text: string; icon: typeof Cloud }> = {
  local: { text: "Guardado en este dispositivo", icon: HardDrive },
  login: { text: "Guardado aquí · entra para respaldar", icon: HardDrive },
  offline: { text: "Sin conexión · se sincroniza al volver", icon: CloudOff },
  syncing: { text: "Sincronizando…", icon: RefreshCw },
  synced: { text: "Todo al día", icon: Cloud },
  error: { text: "No se pudo sincronizar · reintentando", icon: TriangleAlert },
};

export function SyncBadge({ className }: { className?: string }) {
  const { state } = useSyncStatus();
  const { text, icon: Icon } = LABEL[state];
  return (
    <p
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground",
        className,
      )}
    >
      <Icon className={cn("size-4 shrink-0", state === "syncing" && "animate-spin")} aria-hidden />
      {text}
    </p>
  );
}
