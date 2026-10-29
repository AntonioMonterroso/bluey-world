"use client";

import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/db";
import { syncMenuFromCooking } from "@/lib/bakery";

/** Mantiene el menú al día: cada receta cocinada aparece como postre de Dulce Co. */
export function BakeryMenuSync() {
  const stamp = useLiveQuery(async () => {
    const [logs, menu] = await Promise.all([db.cook_log.count(), db.bakery_menu.count()]);
    return `${logs}:${menu}`;
  }, []);

  useEffect(() => {
    if (stamp !== undefined) void syncMenuFromCooking();
  }, [stamp]);

  return null;
}
