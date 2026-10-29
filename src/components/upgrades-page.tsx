"use client";

import { useState } from "react";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buyUpgrade, useUpgradeLevels } from "@/lib/bakery-team";
import { UPGRADES, nextUpgradeCost } from "@/lib/game/team";
import { useGame } from "@/lib/game/use-game";
import { cn } from "@/lib/utils";

export function UpgradesPage() {
  const ups = useUpgradeLevels();
  const game = useGame();
  const [message, setMessage] = useState<string | null>(null);
  if (!ups || !game.ready) return null;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Mejoras</h1>
        <p className="flex items-center gap-2 rounded-full bg-secondary px-5 py-2 font-heading text-xl">
          <Coins className="size-5 text-primary" aria-hidden /> {game.coins} monedas
        </p>
      </div>
      <p className="text-muted-foreground">Las mejoras son para siempre y se notan en cada turno de venta.</p>
      <p role="status" className="min-h-6 text-sm font-semibold text-primary">{message}</p>

      <ul className="flex flex-col gap-3">
        {UPGRADES.map((u) => {
          const level = ups[u.id] ?? 0;
          const max = u.costs.length;
          const cost = nextUpgradeCost(u.id, level);
          const missing = cost === null ? 0 : cost - game.coins;
          return (
            <li key={u.id} className="flex flex-col gap-3 rounded-3xl border bg-card p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-heading text-lg">{u.name}</p>
                  <span className="flex gap-1" role="img" aria-label={`Nivel ${level} de ${max}`}>
                    {Array.from({ length: max }, (_, i) => <span key={i} className={cn("size-3 rounded-full", i < level ? "bg-primary" : "bg-secondary")} />)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{level > 0 ? `Ahora: ${u.desc(level)}` : "Todavía no la tienes"}</p>
                {cost !== null && <p className="text-sm font-semibold">Siguiente: {u.desc(level + 1)}</p>}
              </div>
              {cost === null ? (
                <p className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold">Al máximo</p>
              ) : (
                <Button disabled={missing > 0} className="h-11 rounded-2xl" onClick={async () => setMessage((await buyUpgrade(u.id)) ?? `¡Mejoraste: ${u.name}!`)}>
                  <Coins aria-hidden /> {cost}{missing > 0 ? ` · faltan ${missing}` : ""}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
