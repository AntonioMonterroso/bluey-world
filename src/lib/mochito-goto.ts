"use client";

import { useEffect } from "react";

/** Deja dicho a qué pantalla va Mochito (un juego o el vestidor) para que se abra directo ahí. */
export const MOCHITO_GOTO = "bw-mochito-goto";
export type MochitoGoto = "vestir" | "juego:mochito" | "juego:pelota" | "juego:escondidas" | "juego:simon" | "juego:carrera";
export const goTo = (where: MochitoGoto) => { try { sessionStorage.setItem(MOCHITO_GOTO, where); } catch {} };

/** ¿Venimos del rincón de Mochito al vestidor? */
export function cameFromMochito(where: "vestir") {
  try { return sessionStorage.getItem(MOCHITO_GOTO) === where; } catch { return false; }
}

/** Si venimos del rincón de Mochito a jugar, cuál de sus juegos abrir. */
const MOCHITO_GAMES = ["mochito", "pelota", "escondidas", "simon", "carrera"] as const;
export function mochitoGameGoto(): (typeof MOCHITO_GAMES)[number] | null {
  try {
    const v = sessionStorage.getItem(MOCHITO_GOTO)?.replace("juego:", "");
    return (MOCHITO_GAMES as readonly string[]).includes(v ?? "") ? (v as (typeof MOCHITO_GAMES)[number]) : null;
  } catch { return null; }
}

/** Ya se usó el aviso: la próxima vez que entres a esa pantalla abre normal. */
export function useClearMochitoGoto() {
  useEffect(() => { try { sessionStorage.removeItem(MOCHITO_GOTO); } catch {} }, []);
}
