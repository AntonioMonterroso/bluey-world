"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LAST_BACKUP_KEY, exportAll, readBackup, restoreBackup } from "@/lib/backup";

function lastBackupText() {
  try {
    const v = Number(localStorage.getItem(LAST_BACKUP_KEY));
    if (!v) return "Todavía no has descargado ningún respaldo en este dispositivo.";
    const days = Math.floor((Date.now() - v) / 86_400_000);
    return days === 0 ? "Último respaldo: hoy." : `Último respaldo: hace ${days} ${days === 1 ? "día" : "días"}.`;
  } catch { return ""; }
}

/** Descargar todo a un archivo y volver a cargarlo (por si algo sale mal). */
export function BackupCard() {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(lastBackupText);
  const fileRef = useRef<HTMLInputElement>(null);

  async function download() {
    setBusy(true);
    const { blob, filename, rows } = await exportAll();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setBusy(false);
    setLast(lastBackupText());
    setMsg(`Listo: ${rows} cosas guardadas en «${filename}». Guárdalo en un lugar seguro (correo, Drive, tu computadora).`);
  }

  async function load(file: File) {
    const read = readBackup(await file.text());
    if (!read.ok) return setMsg(read.error);
    if (!confirm(`El respaldo trae ${read.rows} cosas. Se agregan a tu cuenta y reemplazan las que tengan el mismo origen. ¿Cargar?`)) return;
    setBusy(true);
    const n = await restoreBackup(read.file, (d) => setMsg(`Cargando… ${d} de ${read.rows}`));
    setBusy(false);
    setMsg(`Respaldo cargado: ${n} cosas. Se suben a la nube solas.`);
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">Descarga un archivo con todo lo tuyo: recetas, dinero, pedidos y progreso. Si algo se pierde, lo vuelves a cargar aquí. {last}</p>
      <div className="flex flex-wrap gap-2">
        <Button className="h-11 rounded-2xl" disabled={busy} onClick={() => void download()}><Download aria-hidden /> Descargar respaldo</Button>
        <Button variant="outline" className="h-11 rounded-2xl" disabled={busy} onClick={() => fileRef.current?.click()}><Upload aria-hidden /> Cargar respaldo</Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = ""; }} />
      </div>
      <p role="status" className="min-h-5 text-sm font-semibold text-primary">{msg}</p>
    </div>
  );
}
