"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { notifyTimer, startRinging, stopRinging, unlockAudio } from "@/lib/alarm";
import { useProfile } from "@/lib/db/profile";
import { markRinging, useNow, useTimers } from "@/lib/timers";
import { TimerCard } from "@/components/timer-card";

/** Vigila los temporizadores en toda la app, hace sonar la alarma y muestra el panel flotante. */
export function TimerHost() {
  const timers = useTimers();
  const { profile } = useProfile();
  const pathname = usePathname();
  const hasRunning = !!timers?.some((t) => t.status === "running");
  const now = useNow(hasRunning);
  const ringing = !!timers?.some((t) => t.status === "ringing");

  // El audio solo se desbloquea tras un toque del usuario.
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  // Llegó la hora (también si pasó mientras la app estaba cerrada).
  useEffect(() => {
    for (const t of timers ?? []) {
      if (t.status === "running" && t.end_at !== null && t.end_at <= now) {
        void markRinging(t.id).then((first) => {
          if (first) void notifyTimer(t.label);
        });
      }
    }
  }, [timers, now]);

  useEffect(() => {
    if (ringing) startRinging(profile.sound ?? "campana");
    else stopRinging();
    return stopRinging;
  }, [ringing, profile.sound]);

  // En /temporizadores y /cocinar los temporizadores ya se ven dentro de la pantalla.
  if (!timers?.length || pathname.startsWith("/temporizadores") || pathname.startsWith("/cocinar")) return null;

  const shown = [...timers].sort((a, b) => Number(b.status === "ringing") - Number(a.status === "ringing")).slice(0, 3);

  return (
    <aside
      aria-label="Temporizadores"
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 flex flex-col gap-2 md:inset-x-auto md:bottom-4 md:right-4 md:w-80"
    >
      {shown.map((t) => (
        <TimerCard key={t.id} timer={t} now={now} character={profile.character} compact />
      ))}
      {timers.length > shown.length && (
        <Link href="/temporizadores" className="w-fit self-end rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary shadow-sm">
          +{timers.length - shown.length} más
        </Link>
      )}
    </aside>
  );
}
