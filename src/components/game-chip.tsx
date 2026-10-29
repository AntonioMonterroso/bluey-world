"use client";

import Link from "next/link";
import { Coins } from "lucide-react";
import { useGame } from "@/lib/game/use-game";
import { cn } from "@/lib/utils";

/** Nivel y monedas siempre a la vista. */
export function GameChip({ className }: { className?: string }) {
  const g = useGame();
  return (
    <Link
      href="/logros"
      aria-label={`Nivel ${g.level}, ${g.coins} monedas. Ver logros`}
      className={cn("flex min-h-11 items-center gap-3 rounded-full bg-card px-4 text-sm font-semibold", className)}
    >
      <span>Nv {g.ready ? g.level : "–"}</span>
      <span className="flex items-center gap-1 text-primary">
        <Coins className="size-4" aria-hidden /> {g.ready ? g.coins : "–"}
      </span>
    </Link>
  );
}
