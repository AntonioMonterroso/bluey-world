"use client";

import { useEffect } from "react";

/** Deja dicho a qué pantalla va Mochito (un juego o el vestidor) para que se abra directo ahí. */
export const MOCHITO_GOTO = "bw-mochito-goto";
export type MochitoGoto = "vestir" | "juego:mochito" | "juego:pelota" | "juego:escondidas";
export const goTo = (where: MochitoGoto) => { try { sessionStorage.setItem(MOCHITO_GOTO, where); } catch {} };

/** ¿Venimos del rincón de Mochito al vestidor? */
export function cameFromMochito(where: "vestir") {
  try { return sessionStorage.getItem(MOCHITO_GOTO) === where; } catch { return false; }
}

/** Si venimos del rincón de Mochito a jugar, cuál de sus juegos abrir. */
export function mochitoGameGoto(): "mochito" | "pelota" | "escondidas" | null {
  try {
    const v = sessionStorage.getItem(MOCHITO_GOTO);
    return v === "juego:mochito" ? "mochito" : v === "juego:pelota" ? "pelota" : v === "juego:escondidas" ? "escondidas" : null;
  } catch { return null; }
}

/** Ya se usó el aviso: la próxima vez que entres a esa pantalla abre normal. */
export function useClearMochitoGoto() {
  useEffect(() => { try { sessionStorage.removeItem(MOCHITO_GOTO); } catch {} }, []);
}
