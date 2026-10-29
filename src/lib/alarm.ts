"use client";

// Alarma de temporizadores: sonido sintetizado (sin archivos, funciona offline), vibración y notificación.

export const SOUNDS = [
  { id: "campana", name: "Campanita" },
  { id: "arpa", name: "Arpa" },
  { id: "pitido", name: "Pitido suave" },
] as const;

let ctx: AudioContext | null = null;

/** Hay que llamarla tras un toque del usuario; los navegadores bloquean el audio antes. */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {}
}

/** El contexto de audio, o null si el navegador no lo permite todavía. */
export const audioCtx = () => ctx;

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playSound(id: string) {
  unlockAudio();
  if (!ctx) return;
  if (id === "arpa") {
    [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25].forEach((f, i) => tone(f, i * 0.16, 0.5, "triangle", 0.28));
  } else if (id === "pitido") {
    [0, 0.28, 0.56].forEach((s) => tone(1000, s, 0.14, "square", 0.1));
  } else {
    [0, 0.55, 1.1].forEach((s) => {
      tone(880, s, 1.1, "sine", 0.3);
      tone(1320, s, 0.8, "sine", 0.12);
      tone(1760, s, 0.5, "sine", 0.06);
    });
  }
}

let ringTimer: ReturnType<typeof setInterval> | undefined;

function ringOnce(id: string) {
  playSound(id);
  try {
    if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.([300, 150, 300, 150, 300]);
  } catch {}
}

export function startRinging(id: string) {
  if (ringTimer) return;
  ringOnce(id);
  ringTimer = setInterval(() => ringOnce(id), 3000);
}

export function stopRinging() {
  clearInterval(ringTimer);
  ringTimer = undefined;
  try {
    if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(0);
  } catch {}
}

export async function askNotificationPermission() {
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {}
  }
}

export async function notifyTimer(label: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const options: NotificationOptions = {
    body: label,
    icon: "/icons/icon-192.png",
    tag: `timer-${label}`,
    requireInteraction: true,
  };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification("¡Tiempo!", options);
    else new Notification("¡Tiempo!", options);
  } catch {}
}
