"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Heart, RotateCcw, RotateCw, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BakeryScene, StickerBadge } from "@/components/bakery-scene";
import { saveBakery } from "@/lib/bakery";
import type { Bakery, MenuItem } from "@/lib/db/db";
import { dayKey } from "@/lib/game/engine";
import { STICKER_ITEMS } from "@/lib/game/shop";
import { MAX_STICKERS, MAX_STICKER_POINTS, favoriteOfDay, setsDone, stickerPoints, type PlacedSticker } from "@/lib/game/stickers";
import { cn } from "@/lib/utils";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
// Lugares libres donde cae una pegatina nueva (en la pared y la vitrina, sin tapar el letrero).
const SPOTS = [[30, 30], [70, 26], [16, 52], [84, 56], [42, 48], [58, 46], [26, 66], [76, 70]];

/** El local con las pegatinas que se pueden arrastrar, y abajo tus pegatinas para pegar. */
export function StickerEditor({ bakery, menu, character, outfit, owned }: {
  bakery: Bakery; menu: MenuItem[]; character: string; outfit?: Record<string, string>; owned: Set<string>;
}) {
  const [draft, setDraft] = useState<PlacedSticker[] | null>(null); // mientras arrastras
  const [sel, setSel] = useState<number | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const drag = useRef<{ i: number; dx: number; dy: number; list: PlacedSticker[] } | null>(null); // lo último, aunque React no haya repintado
  const [day] = useState(() => dayKey(Date.now()));

  const placed = draft ?? bakery.stickers ?? [];
  const mine = STICKER_ITEMS.filter((s) => owned.has(s.id));
  const fav = favoriteOfDay(STICKER_ITEMS.map((s) => s.id), day);
  const favItem = STICKER_ITEMS.find((s) => s.id === fav);
  const pts = stickerPoints(placed, fav);
  const sets = setsDone(placed);
  const save = (next: PlacedSticker[]) => saveBakery({ stickers: next });

  function toPct(clientX: number, clientY: number) {
    const r = area.current!.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * 100, y: ((clientY - r.top) / r.height) * 100 };
  }

  function down(e: React.PointerEvent, i: number) {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sin captura también funciona */ }
    const p = toPct(e.clientX, e.clientY);
    drag.current = { i, dx: p.x - placed[i].x, dy: p.y - placed[i].y, list: placed };
    setSel(i);
    setDraft(placed);
  }
  function moveTo(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const p = toPct(e.clientX, e.clientY);
    d.list = d.list.map((s, k) => (k === d.i ? { ...s, x: Math.round(clamp(p.x - d.dx, 4, 96)), y: Math.round(clamp(p.y - d.dy, 6, 94)) } : s));
    setDraft(d.list);
  }
  function up() {
    if (drag.current) void save(drag.current.list);
    drag.current = null;
    setDraft(null);
  }

  function toggle(id: string) {
    const at = placed.findIndex((p) => p.id === id);
    if (at >= 0) { setSel(null); return void save(placed.filter((_, k) => k !== at)); }
    if (placed.length >= MAX_STICKERS) return;
    const free = SPOTS.find(([x, y]) => !placed.some((p) => Math.abs(p.x - x) < 8 && Math.abs(p.y - y) < 8)) ?? [50, 50];
    const next = [...placed, { id, x: free[0], y: free[1], r: [-12, 8, -6, 14, -3][placed.length % 5] }];
    setSel(next.length - 1);
    void save(next);
  }

  const nudge = (patch: Partial<PlacedSticker>) => sel !== null && placed[sel] && void save(placed.map((s, k) => (k === sel ? { ...s, ...patch } : s)));
  const current = sel !== null ? placed[sel] : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-2 z-20">
        <BakeryScene name={bakery.name} decor={bakery.decor} menu={menu} character={character} outfit={outfit} className="shadow-md" />
        <div ref={area} className="absolute inset-0 z-10" style={{ containerType: "inline-size" }} onPointerDown={(e) => { if (e.target === e.currentTarget) setSel(null); }}>
          {placed.map((s, i) => (
            <button
              key={`${s.id}-${i}`}
              type="button"
              aria-label={`Mover pegatina ${STICKER_ITEMS.find((x) => x.id === s.id)?.name ?? ""}`}
              onPointerDown={(e) => down(e, i)}
              onPointerMove={moveTo}
              onPointerUp={up}
              onPointerCancel={up}
              onClick={() => setSel(i)}
              className="absolute flex cursor-grab touch-none items-center justify-center rounded-full active:cursor-grabbing"
              style={{ left: `calc(${s.x}% - 5cqw)`, top: `calc(${s.y}% - 5cqw)`, width: "10cqw", height: "10cqw" }}
            >
              <StickerBadge id={s.id} r={s.r} selected={sel === i} />
            </button>
          ))}
        </div>
      </div>

      {current && (
        <div role="toolbar" aria-label="Pegatina elegida" className="flex flex-wrap items-center gap-2 rounded-3xl bg-card p-2">
          <span className="px-2 text-sm font-semibold">{STICKER_ITEMS.find((x) => x.id === current.id)?.name}</span>
          <Button variant="outline" size="icon" className="size-11 rounded-2xl" aria-label="Girar a la izquierda" onClick={() => nudge({ r: current.r - 10 })}><RotateCcw aria-hidden /></Button>
          <Button variant="outline" size="icon" className="size-11 rounded-2xl" aria-label="Girar a la derecha" onClick={() => nudge({ r: current.r + 10 })}><RotateCw aria-hidden /></Button>
          <Button variant="ghost" className="h-11 rounded-2xl" onClick={() => toggle(current.id)}><Trash2 aria-hidden /> Despegar</Button>
          <span className="ml-auto px-2 text-xs text-muted-foreground">Arrástrala para moverla</span>
        </div>
      )}

      <section aria-labelledby="pegatinas-local" className="flex flex-col gap-4 rounded-3xl bg-secondary p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="pegatinas-local" className="text-2xl">Pegatinas en tu local</h2>
          <p className="font-heading text-xl tabular-nums">+{pts.total} de {MAX_STICKER_POINTS} de encanto</p>
        </div>
        <p className="text-sm text-pretty">
          Cada pegatina pegada hace tu local más atractivo: llegan más clientes y dejan mejores propinas. Las de fiestas valen doble. Caben {MAX_STICKERS}.
        </p>

        {favItem && (
          <p className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm">
            <Heart className="size-4 shrink-0 text-primary" aria-hidden />
            <span>Hoy a los clientes les encanta la pegatina <span className="font-semibold">{favItem.name}</span>{owned.has(favItem.id) ? (pts.fav ? ": ¡ya la tienes pegada! +3." : ": pégala para ganar +3.") : favItem.event ? `, que se gana en el evento ${favItem.event}.` : ". Cómprala en la Tienda."}</span>
          </p>
        )}

        {mine.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
            Todavía no tienes pegatinas. <Link href="/tienda" className="font-semibold text-primary underline underline-offset-4">Cómpralas en la Tienda</Link> o gánalas en los eventos.
          </p>
        ) : (
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {mine.map((s) => {
              const on = placed.some((p) => p.id === s.id);
              const full = !on && placed.length >= MAX_STICKERS;
              return (
                <li key={s.id}>
                  <button type="button" aria-pressed={on} disabled={full} onClick={() => toggle(s.id)} className={cn("flex w-full flex-col items-center gap-1 rounded-2xl border-2 bg-card p-2 text-xs font-semibold transition-[border-color] duration-150 active:scale-[0.97] disabled:opacity-50", on ? "border-primary" : "border-transparent")} style={{ containerType: "inline-size" }}>
                    <StickerBadge id={s.id} size={60} />
                    <span className="truncate">{s.name}</span>
                    <span className="text-[11px] font-normal text-muted-foreground">{on ? "Pegada" : "Pegar"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold"><Sparkles className="size-4 text-primary" aria-hidden /> Colecciones (+4 cada una)</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {sets.map((s) => (
              <li key={s.id} className={cn("rounded-2xl border-2 bg-card px-4 py-3 text-sm", s.done ? "border-primary" : "border-transparent")}>
                <p className="flex justify-between gap-2 font-semibold"><span>{s.name}</span><span className="tabular-nums">{s.have} de {s.need}</span></p>
                <p className="text-xs text-muted-foreground">{s.done ? s.perk : `Pega: ${s.items.map((i) => STICKER_ITEMS.find((x) => x.id === i)?.name).join(", ")}${s.id === "fiestas" ? " (con tres basta)" : ""}.`}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
