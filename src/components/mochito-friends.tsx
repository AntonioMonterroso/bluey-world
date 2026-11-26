"use client";

import { Heart } from "lucide-react";
import { PuppyArt } from "@/components/puppy-art";
import { FRIENDS, FRIEND_AT, friendsOf } from "@/lib/mochito-play";
import { cn } from "@/lib/utils";

/** Los perritos del parque: a quién conoce Mochito y quiénes ya son sus amigos. */
export function FriendsTab({ met }: { met?: Record<string, number> }) {
  const friends = friendsOf(met).length;
  return (
    <div role="tabpanel" className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        En el paseo a veces se encuentra a otros perritos. Después de {FRIEND_AT} encuentros se hacen amigos, lo visitan en tu local y atraen más clientes. Tiene {friends} de {FRIENDS.length} amigos.
      </p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FRIENDS.map((f) => {
          const n = met?.[f.id] ?? 0;
          const known = n > 0;
          const friend = n >= FRIEND_AT;
          return (
            <li key={f.id} className={cn("flex flex-col items-center gap-1 rounded-3xl border-2 p-3 text-center", friend ? "border-primary bg-card" : known ? "border-border bg-card" : "border-dashed border-border bg-secondary/40")}>
              <span className="h-16 w-16"><PuppyArt friend={f} unknown={!known} /></span>
              <p className="text-sm font-semibold">{known ? f.name : "¿Quién será?"}</p>
              <span className="flex gap-0.5" aria-label={`${Math.min(n, FRIEND_AT)} de ${FRIEND_AT} encuentros`}>
                {Array.from({ length: FRIEND_AT }, (_, i) => (
                  <Heart key={i} className={cn("size-3.5", i < n ? "fill-primary text-primary" : "text-muted-foreground/40")} aria-hidden />
                ))}
              </span>
              <p className="text-xs leading-snug text-muted-foreground">{friend ? `¡Amigos! «${f.says}»` : known ? `Se han visto ${n} ${n === 1 ? "vez" : "veces"}.` : "Todavía no se conocen."}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
