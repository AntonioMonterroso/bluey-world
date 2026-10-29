"use client";

import { audioCtx, unlockAudio } from "@/lib/alarm";

// Efectos del juego: se sintetizan en el navegador (sin archivos), suaves y cortos.
let enabled = true;
export const setSfxEnabled = (v: boolean) => {
  enabled = v;
};
export const sfxEnabled = () => enabled;

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number) {
  const ctx = audioCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export type Sfx = "door" | "serve" | "cash" | "coin" | "sad" | "success" | "gong" | "bake" | "click";

export function sfx(name: Sfx) {
  if (!enabled) return;
  unlockAudio();
  if (!audioCtx()) return;
  switch (name) {
    case "door": // campanita de la puerta
      tone(988, 0, 0.45, "sine", 0.16);
      tone(740, 0.18, 0.6, "sine", 0.14);
      break;
    case "serve":
      tone(520, 0, 0.09, "triangle", 0.14);
      tone(780, 0.05, 0.1, "triangle", 0.1);
      break;
    case "cash": // caja registradora
      tone(1318, 0, 0.12, "square", 0.05);
      tone(1760, 0.07, 0.14, "square", 0.05);
      tone(2093, 0.16, 0.5, "sine", 0.16);
      break;
    case "coin":
      tone(1568, 0, 0.12, "sine", 0.14);
      tone(2093, 0.08, 0.25, "sine", 0.14);
      break;
    case "sad":
      tone(392, 0, 0.3, "sine", 0.14);
      tone(311, 0.22, 0.45, "sine", 0.14);
      break;
    case "success":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.35, "triangle", 0.18));
      break;
    case "gong": // llega el crítico
      tone(196, 0, 1.3, "sine", 0.22);
      tone(392, 0, 0.9, "sine", 0.1);
      break;
    case "bake":
      tone(1175, 0, 0.7, "sine", 0.18);
      break;
    case "click":
      tone(700, 0, 0.04, "square", 0.05);
      break;
  }
}

/** Qué sonido corresponde al aviso que muestra el turno de venta. */
export function sfxForLog(log: string): Sfx | null {
  if (log.includes("Llegó el crítico")) return "gong";
  if (log.includes("Llegó un cliente")) return "door";
  if (log.includes("encantado")) return "success";
  if (log.includes("Cobrado")) return "cash";
  if (log.includes("Pedido listo")) return "coin";
  if (log.includes("se fue") || log.includes("esperó demasiado")) return "sad";
  return null;
}
