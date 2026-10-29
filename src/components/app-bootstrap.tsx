"use client";

import { asset } from "@/lib/base";
import { useEffect } from "react";
import { ensureProfile, useProfile } from "@/lib/db/profile";
import { startSyncEngine } from "@/lib/db/sync";
import { initAuth } from "@/lib/auth";
import { setSfxEnabled } from "@/lib/sfx";
import { CHARACTERS } from "@/lib/characters";
import { THEME_STORAGE_KEY } from "@/lib/themes";

const ROUTES = ["/", "/ajustes", "/login", "/recetas", "/recetas/nueva", "/recetas/ver", "/recetas/editar", "/recetas/importar", "/cocinar", "/temporizadores", "/mi-cocina", "/mi-cocina/diario", "/mi-cocina/despensa", "/mi-cocina/precios", "/mi-cocina/compras", "/dinero", "/dinero/movimientos", "/dinero/recurrentes", "/dinero/cuentas", "/dinero/presupuesto", "/dinero/metas", "/bingo", "/logros", "/tienda", "/vestuario", "/pasteleria", "/pasteleria/menu", "/pasteleria/decorar", "/pasteleria/vender", "/pasteleria/ganancias", "/pasteleria/equipo", "/pasteleria/mejoras", "/pasteleria/eventos", "/jugar", "/jugar/clientes", "/jugar/venta", "/jugar/sala", "/jugar/historia"];

/** Arranca la base local, la sincronización y el service worker; aplica el tema del perfil. */
export function AppBootstrap() {
  const { ready, profile } = useProfile();

  useEffect(() => {
    initAuth();
    void ensureProfile();
    return startSyncEngine();
  }, []);

  useEffect(() => {
    setSfxEnabled(profile.sfx !== false);
  }, [profile.sfx]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.setAttribute("data-theme", profile.theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, profile.theme);
    } catch {}
  }, [ready, profile.theme]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(asset("/sw.js"), { scope: asset("/") }).then(async () => {
      const reg = await navigator.serviceWorker.ready;
      const assets = performance
        .getEntriesByType("resource")
        .map((e) => new URL(e.name))
        .filter((u) => u.origin === location.origin && u.pathname.startsWith("/_next/static/"))
        .map((u) => u.pathname + u.search);
      reg.active?.postMessage({
        type: "warm",
        assets,
        urls: [
          ...ROUTES.map(asset),
          ...CHARACTERS.map((c) => c.src),
          asset("/personajes/elenco.webp"),
          asset("/personajes/familia.webp"),
          asset("/personajes/bingo-bailando.webp"),
        ],
      });
    });
  }, []);

  return null;
}
