"use client";

import { useState } from "react";
import { Apple, Bird, Bone, Cake, Carrot, Cloud, Cookie, Crown, Drumstick, Egg, Flower2, Footprints, Ghost, Gift, Heart, PartyPopper, Rainbow, Snowflake, Soup, Squirrel, Star, Sun, TreePine, Wheat, type LucideIcon } from "lucide-react";
import { DressedImage } from "@/components/dressed-image";
import { MochitoFigure } from "@/components/mochito-figure";
import { RARITY_LABEL, STICKERS, STICKER_THEMES, stickerCount, type Sticker } from "@/lib/mochito-stickers";
import type { Festive } from "@/lib/mochito-life";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = { Apple, Bird, Bone, Cake, Carrot, Cloud, Cookie, Crown, Drumstick, Egg, Flower2, Footprints, Ghost, Gift, Heart, PartyPopper, Rainbow, Snowflake, Soup, Squirrel, Star, Sun, TreePine, Wheat };
const POSES: Record<string, { transform?: string; festive?: Festive; sleeping?: boolean }> = {
  feliz: {}, girado: { transform: "scaleX(-1)" }, sentado: { transform: "translateY(6%) scaleY(0.88)" }, saltando: { transform: "translateY(-6%) rotate(-8deg)" },
  dormido: { sleeping: true }, fiesta: { festive: "cumple" }, navidad: { festive: "navidad" }, halloween: { festive: "halloween" },
};

/** Una pegatina: círculo de color con Mochito en su pose o un dibujito. Las brillantes llevan borde dorado. */
export function StickerArt({ sticker, outfit, className }: { sticker: Sticker; outfit?: Record<string, string>; className?: string }) {
  const [kind, key] = sticker.art.split(":");
  const Icon = kind === "icon" ? ICONS[key] : null;
  const pose = POSES[key] ?? {};
  return (
    <span className={cn("relative flex aspect-square items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-md", sticker.rarity === "brillante" && "ring-2 ring-[var(--gold)]", className)} style={{ background: sticker.color }}>
      {Icon ? <Icon className="size-1/2 text-[#5a3b2e]" strokeWidth={1.8} aria-hidden /> : (
        <span className="block h-[78%] translate-y-[6%]" style={{ transform: pose.transform, transformOrigin: "50% 100%" }}>
          {pose.festive || pose.sleeping ? <MochitoFigure outfit={outfit} festive={pose.festive} sleeping={pose.sleeping} /> : <DressedImage char="mochito" outfit={outfit} alt="" className="h-full" />}
        </span>
      )}
      {sticker.rarity === "brillante" && <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgb(255_255_255/0.55)_45%,transparent_60%)]" />}
    </span>
  );
}

/** El álbum de pegatinas, por páginas de tema. */
export function StickersTab({ have, outfit }: { have?: Record<string, number>; outfit?: Record<string, string> }) {
  const [theme, setTheme] = useState(STICKER_THEMES[0].id);
  const [pick, setPick] = useState<string | null>(null);
  const total = stickerCount(have);
  const page = STICKERS.filter((s) => s.theme === theme);
  const chosen = STICKERS.find((s) => s.id === pick && (have?.[s.id] ?? 0) > 0);
  return (
    <div role="tabpanel" className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Tiene {total} de {STICKERS.length} pegatinas. Se ganan paseando (siempre una), cumpliendo las misiones, jugando, bañándolo y con trucos.</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Página del álbum">
        {STICKER_THEMES.map((t) => {
          const n = STICKERS.filter((s) => s.theme === t.id && (have?.[s.id] ?? 0) > 0).length;
          return (
            <button key={t.id} type="button" role="radio" aria-checked={theme === t.id} onClick={() => { setTheme(t.id); setPick(null); }} className={cn("min-h-11 rounded-full border-2 px-4 text-sm font-semibold active:scale-[0.97]", theme === t.id ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary")}>
              {t.name} <span className="tabular-nums opacity-80">{n}/8</span>
            </button>
          );
        })}
      </div>
      <ul className="grid grid-cols-4 gap-3 rounded-3xl bg-[repeating-linear-gradient(0deg,transparent_0_23px,rgb(0_0_0/0.04)_23px_24px)] bg-secondary/40 p-3">
        {page.map((s) => {
          const n = have?.[s.id] ?? 0;
          return (
            <li key={s.id} className="flex flex-col items-center gap-1">
              {n > 0 ? (
                <button type="button" onClick={() => setPick(s.id)} aria-label={`${s.name}${n > 1 ? `, tienes ${n}` : ""}`} className={cn("relative w-full rounded-full active:scale-[0.97]", pick === s.id && "outline-2 outline-offset-2 outline-primary")}>
                  <StickerArt sticker={s} outfit={outfit} />
                  {n > 1 && <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">×{n}</span>}
                </button>
              ) : (
                <span className="flex aspect-square w-full items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40 text-lg font-semibold text-muted-foreground/60" aria-label="Pegatina que falta">?</span>
              )}
              <span className="text-center text-[11px] font-semibold leading-tight">{n > 0 ? s.name : "—"}</span>
            </li>
          );
        })}
      </ul>
      {chosen && (
        <div className="flex items-center gap-3 rounded-3xl border bg-card p-3">
          <StickerArt sticker={chosen} outfit={outfit} className="w-20 shrink-0" />
          <div>
            <p className="font-semibold">{chosen.name}</p>
            <p className="text-sm text-muted-foreground">{RARITY_LABEL[chosen.rarity]} · tienes {have?.[chosen.id]}</p>
          </div>
        </div>
      )}
    </div>
  );
}
