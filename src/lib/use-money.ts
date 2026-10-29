"use client";

import { useProfile } from "@/lib/db/profile";
import { money } from "@/lib/budget";

/** Formateador de dinero con el símbolo elegido en el perfil (Q por defecto). */
export function useMoney() {
  const { profile } = useProfile();
  const symbol = profile.currency ?? "Q";
  return (n: number) => money(n, symbol);
}
