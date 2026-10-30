"use client";

import { useState } from "react";
import { Cake, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ART_ICON, PLANT_ICON } from "@/components/bakery-scene";
import { StickerEditor } from "@/components/sticker-editor";
import { setDecor, useBakery, useMenu } from "@/lib/bakery";
import { useProfile } from "@/lib/db/profile";
import { DECOR_ITEMS, SLOTS, equipped, type DecorItem } from "@/lib/game/decor";
import { owns } from "@/lib/game/shop";
import { buyItem, useGame } from "@/lib/game/use-game";
import { cn } from "@/lib/utils";

function Preview({ item }: { item: DecorItem }) {
  if (item.style && (item.slot === "wall" || item.slot === "floor" || item.slot === "counter")) {
    return <div className="size-20 rounded-2xl border" style={{ background: item.style, borderColor: item.accent }} aria-hidden />;
  }
  const Icon = PLANT_ICON[item.id] ?? ART_ICON[item.id];
  if (Icon) return <Icon className="size-14" style={{ color: item.accent }} aria-hidden />;
  if (item.slot === "lights" && item.accent) {
    return (
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => <span key={i} className="size-4 rounded-full" style={{ background: item.accent, boxShadow: `0 0 8px ${item.accent}` }} />)}
      </div>
    );
  }
  if (item.slot === "tables") {
    return <span className="block h-4 w-16 rounded-full border-2" style={{ background: item.accent ?? "#f3d9b8", borderColor: "#c9a578" }} aria-hidden />;
  }
  return <Cake className="size-10 text-muted-foreground/40" aria-hidden />;
}

export function BakeryDecorPage() {
  const { ready, bakery } = useBakery();
  const menu = useMenu();
  const { profile } = useProfile();
  const g = useGame();
  const [message, setMessage] = useState<string | null>(null);
  if (!ready || menu === undefined || !g.ready) return null;

  async function choose(item: DecorItem) {
    if (!owns(item, g.ownedIds)) {
      const problem = await buyItem(item);
      if (problem) return setMessage(problem);
      setMessage(`¡Compraste ${item.name}!`);
    }
    await setDecor(item.slot, item.id);
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Decorar</h1>
        <p className="flex items-center gap-2 rounded-full bg-secondary px-5 py-2 font-heading text-xl">
          <Coins className="size-5 text-primary" aria-hidden /> {g.coins} monedas
        </p>
      </div>

      <StickerEditor bakery={bakery} menu={menu} character={profile.character} outfit={profile.outfit} owned={g.ownedIds} />
      <p role="status" className="min-h-6 text-sm font-semibold text-primary">{message}</p>

      {SLOTS.map((slot) => {
        const items = DECOR_ITEMS.filter((i) => i.slot === slot.id);
        const current = equipped(bakery.decor, slot.id);
        return (
          <section key={slot.id} aria-labelledby={`slot-${slot.id}`} className="flex flex-col gap-3">
            <h2 id={`slot-${slot.id}`} className="text-2xl">{slot.label}</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {items.map((item) => {
                const mine = owns(item, g.ownedIds);
                const on = current.id === item.id;
                const missing = item.price - g.coins;
                return (
                  <li key={item.id} className={cn("flex flex-col gap-3 rounded-3xl border bg-card p-3", on && "border-primary")}>
                    <div className="flex h-24 items-center justify-center"><Preview item={item} /></div>
                    <p className="text-center font-semibold">{item.name}</p>
                    <Button
                      variant={on ? "secondary" : mine ? "outline" : "default"}
                      disabled={on || (!mine && missing > 0)}
                      className="h-11 w-full rounded-2xl"
                      onClick={() => void choose(item)}
                    >
                      {on ? "En uso" : mine ? "Poner" : (<><Coins aria-hidden /> {item.price}{missing > 0 ? ` · faltan ${missing}` : ""}</>)}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
