"use client";

import Image from "next/image";
import { MOCHITO } from "@/lib/characters";
import { MOCHITO_APPEAL } from "@/lib/mochito";
import { updateProfile, useProfile } from "@/lib/db/profile";

/** Mostrar u ocultar a Mochito, el compañero de tu personaje. */
export function MochitoToggle() {
  const { profile } = useProfile();
  const on = profile.mochito !== false;
  return (
    <label className="flex cursor-pointer items-center gap-4 rounded-3xl bg-card p-4">
      <Image src={MOCHITO.src} alt="" width={MOCHITO.w} height={MOCHITO.h} className="h-20 w-auto object-contain" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-heading text-xl">Mochito</span>
        <span className="text-sm text-pretty text-muted-foreground">
          Va siempre junto a tu personaje, sea cual sea. Tócalo y te dice algo. En tu local saluda a los clientes (+{MOCHITO_APPEAL} de encanto).
        </span>
      </span>
      <input
        type="checkbox"
        role="switch"
        aria-label="Mostrar a Mochito"
        checked={on}
        onChange={(e) => void updateProfile({ mochito: e.target.checked })}
        className="size-6 shrink-0 cursor-pointer accent-primary"
      />
    </label>
  );
}
