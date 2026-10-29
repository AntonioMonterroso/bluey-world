"use client";

import Image from "next/image";
import Link from "next/link";
import { Coins, Lock } from "lucide-react";
import { CHARACTERS } from "@/lib/characters";
import { updateProfile, useProfile } from "@/lib/db/profile";
import { CHARACTER_ITEMS, owns } from "@/lib/game/shop";
import { useGame } from "@/lib/game/use-game";
import { cn } from "@/lib/utils";

export function CharacterPicker() {
  const { profile } = useProfile();
  const current = profile.character;
  const game = useGame();
  return (
    <div role="radiogroup" aria-label="Elige tu personaje" className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
      {CHARACTERS.map((c) => {
        const selected = c.id === current;
        const item = CHARACTER_ITEMS.find((i) => i.id === `char:${c.id}`)!;
        if (game.ready && !selected && !owns(item, game.ownedIds)) {
          return (
            <Link
              key={c.id}
              href="/tienda"
              aria-label={`${c.name}: bloqueado, cuesta ${item.price} monedas. Ir a la tienda`}
              className="flex flex-col items-center gap-1 rounded-3xl border-2 border-transparent bg-card p-2 text-xs font-semibold text-muted-foreground hover:border-border"
            >
              <Image src={c.src} alt="" width={c.w} height={c.h} className="h-20 w-auto object-contain opacity-50 grayscale" />
              <span className="flex items-center gap-1"><Lock className="size-3" aria-hidden /> {c.name}</span>
              <span className="flex items-center gap-1 text-primary"><Coins className="size-3" aria-hidden /> {item.price}</span>
            </Link>
          );
        }
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => void updateProfile({ character: c.id })}
            className={cn(
              "flex flex-col items-center gap-1 rounded-3xl border-2 bg-card p-2 text-xs font-semibold",
              selected ? "border-primary bg-accent/50" : "border-transparent hover:border-border",
            )}
          >
            <Image
              src={c.src}
              alt=""
              width={c.w}
              height={c.h}
              className="h-20 w-auto object-contain"
            />
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
