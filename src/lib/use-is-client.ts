"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false al pre-renderizar en el servidor, true en el navegador. Para pantallas que dependen de la fecha de hoy. */
export function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
