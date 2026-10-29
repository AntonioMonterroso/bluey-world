"use client";

import { updateProfile, useProfile } from "@/lib/db/profile";
import { cn } from "@/lib/utils";

const OPTIONS = ["Q", "$", "€", "L", "₡", "S/"];

/** Símbolo de moneda que se ve en todo el dinero de la app. */
export function CurrencyField() {
  const { profile } = useProfile();
  const current = profile.currency ?? "Q";
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Símbolo de moneda">
      {OPTIONS.map((c) => (
        <button key={c} type="button" role="radio" aria-checked={current === c} onClick={() => void updateProfile({ currency: c })} className={cn("flex size-12 items-center justify-center rounded-full border-2 font-semibold", current === c ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-card")}>{c}</button>
      ))}
    </div>
  );
}
