"use client";

import Image from "next/image";
import { useState } from "react";
import { Coins, Lock, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playSound } from "@/lib/alarm";
import { updateProfile, useProfile } from "@/lib/db/profile";
import {
  CHARACTER_ITEMS, FRAME_ITEMS, SOUND_ITEMS, STICKER_ITEMS, frameClass, owns, type ShopItem,
} from "@/lib/game/shop";
import { buyItem, useGame } from "@/lib/game/use-game";
import { cn } from "@/lib/utils";

type Game = ReturnType<typeof useGame>;
type Profile = ReturnType<typeof useProfile>["profile"];

function ShopAction({ item, g, profile, onBuy }: { item: ShopItem; g: Game; profile: Profile; onBuy: (i: ShopItem) => void }) {
  const mine = owns(item, g.ownedIds);
  const missing = item.price - g.coins;
  if (!mine && item.event) return <p className="text-center text-xs font-semibold text-muted-foreground">Solo en el evento: {item.event}</p>;
  const equipped =
    (item.kind === "character" && item.id === `char:${profile.character}`) ||
    (item.kind === "sound" && item.id === `sound:${profile.sound ?? "campana"}`) ||
    (item.kind === "frame" && item.id === `frame:${profile.frame ?? ""}`);

  if (!mine) {
    return (
      <Button disabled={missing > 0} onClick={() => onBuy(item)} className="h-11 w-full rounded-2xl">
        <Coins aria-hidden /> {item.price}{missing > 0 ? ` · faltan ${missing}` : ""}
      </Button>
    );
  }
  if (item.kind === "sticker") return <p className="text-center text-sm font-semibold text-primary">En tu álbum</p>;
  return (
    <Button
      variant={equipped ? "secondary" : "outline"}
      disabled={equipped}
      className="h-11 w-full rounded-2xl"
      onClick={() => {
        if (item.kind === "character") void updateProfile({ character: item.id.slice(5) });
        if (item.kind === "sound") { void updateProfile({ sound: item.id.slice(6) }); playSound(item.id.slice(6)); }
        if (item.kind === "frame") void updateProfile({ frame: item.id.slice(6) });
      }}
    >
      {equipped ? "En uso" : "Usar"}
    </Button>
  );
}

function ShopCard({ item, g, profile, onBuy, children }: { item: ShopItem; g: Game; profile: Profile; onBuy: (i: ShopItem) => void; children: React.ReactNode }) {
  const mine = owns(item, g.ownedIds);
  return (
    <li className="flex flex-col gap-3 rounded-3xl border bg-card p-3">
      <div className="flex h-28 items-center justify-center">{children}</div>
      <div className="text-center">
        <p className="font-semibold">{item.name}</p>
        {!mine && <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Lock className="size-3" aria-hidden /> Bloqueado</p>}
      </div>
      <ShopAction item={item} g={g} profile={profile} onBuy={onBuy} />
    </li>
  );
}

export function ShopPage() {
  const g = useGame();
  const { profile } = useProfile();
  const [message, setMessage] = useState<string | null>(null);
  if (!g.ready) return null;

  async function buy(item: ShopItem) {
    const problem = await buyItem(item);
    setMessage(problem ?? `¡Es tuyo! ${item.name}`);
  }

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Tienda</h1>
        <p className="flex items-center gap-2 rounded-full bg-secondary px-5 py-2 font-heading text-xl">
          <Coins className="size-5 text-primary" aria-hidden /> {g.coins} monedas
        </p>
      </div>
      <p className="text-muted-foreground">Las monedas las ganas cocinando de verdad, completando el Bingo y cumpliendo misiones.</p>
      <p role="status" className="min-h-6 text-sm font-semibold text-primary">{message}</p>

      <section aria-labelledby="personajes" className="flex flex-col gap-3">
        <h2 id="personajes" className="text-2xl">Personajes</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CHARACTER_ITEMS.map((i) => (
            <ShopCard key={i.id} item={i} g={g} profile={profile} onBuy={buy}>
              <Image src={i.src!} alt="" width={i.w!} height={i.h!} className={cn("h-full w-auto object-contain", !owns(i, g.ownedIds) && "opacity-60 grayscale")} />
            </ShopCard>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sonidos" className="flex flex-col gap-3">
        <h2 id="sonidos" className="text-2xl">Sonidos de alarma</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SOUND_ITEMS.map((i) => (
            <ShopCard key={i.id} item={i} g={g} profile={profile} onBuy={buy}>
              <button type="button" aria-label={`Probar ${i.name}`} onClick={() => playSound(i.id.slice(6))} className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
                <Volume2 className="size-7" aria-hidden />
              </button>
            </ShopCard>
          ))}
        </ul>
      </section>

      <section aria-labelledby="marcos" className="flex flex-col gap-3">
        <h2 id="marcos" className="text-2xl">Marcos para tus fotos</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FRAME_ITEMS.map((i) => (
            <ShopCard key={i.id} item={i} g={g} profile={profile} onBuy={buy}>
              <div className={cn("size-24 rounded-2xl bg-accent/60", frameClass(i.id.slice(6)))} aria-hidden />
            </ShopCard>
          ))}
        </ul>
        {profile.frame && (
          <Button variant="ghost" className="h-11 w-fit rounded-2xl" onClick={() => void updateProfile({ frame: "" })}>Quitar marco</Button>
        )}
      </section>

      <section aria-labelledby="pegatinas" className="flex flex-col gap-3">
        <h2 id="pegatinas" className="text-2xl">Pegatinas</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {STICKER_ITEMS.map((i) => {
            const Icon = i.icon!;
            return (
              <ShopCard key={i.id} item={i} g={g} profile={profile} onBuy={buy}>
                <Icon className={cn("size-14", owns(i, g.ownedIds) ? "text-primary" : "text-muted-foreground/50")} aria-hidden />
              </ShopCard>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
