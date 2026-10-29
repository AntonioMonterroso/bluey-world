"use client";

import Image from "next/image";
import { ART, makeCtx, type ArtCtx } from "@/components/wardrobe-art";
import { getCharacter } from "@/lib/characters";
import { anchorsFor } from "@/lib/game/anchors";
import { parseWear, type Tweak } from "@/lib/game/outfit";
import { wearById } from "@/lib/game/wardrobe";
import { cn } from "@/lib/utils";

/** Punto de giro y tamaño de cada ranura (dónde "se apoya" la prenda). */
function pivot(slot: string | undefined, c: ArtCtx): [number, number] {
  switch (slot) {
    case "head": return [c.cx, c.top];
    case "face": return [c.cx, c.ey];
    case "neck": return [c.tx, c.tt];
    case "body": return [c.tx, c.tt + c.h / 2];
    case "hand": return [c.hr, c.hy];
    case "feet": return [c.tx, c.fy];
    default: return [c.W / 2, c.H / 2];
  }
}

/** Color propio y posición ajustada de una prenda. */
function place(id: string, t: Tweak, c: ArtCtx) {
  const [px, py] = pivot(wearById(id)?.slot, c);
  const moved = t.x || t.y || t.s !== 1 || t.r;
  return {
    transform: moved ? `translate(${t.x} ${t.y}) translate(${px} ${py}) rotate(${t.r}) scale(${t.s}) translate(${-px} ${-py})` : undefined,
    style: t.c ? ({ ["--primary" as string]: `#${t.c}` } as React.CSSProperties) : undefined,
  };
}

/** Imagen del personaje con su ropa encima (y detrás, la capa y el fondo). */
export function DressedImage({
  char,
  outfit,
  className,
  imgClassName,
  priority,
  alt,
}: {
  char: string;
  outfit?: Record<string, string>;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  alt?: string;
}) {
  const c = getCharacter(char);
  const anchors = anchorsFor(char);
  const arts = anchors && outfit ? Object.values(outfit).map((v) => { const { id, tweak } = parseWear(v); return { id, tweak, art: ART[id] }; }).filter((x) => x.art) : [];
  const ctx = anchors ? makeCtx(anchors, c.h / c.w) : null;
  const layer = (name: "back" | "front") => {
    const items = arts.filter((x) => x.art.layer === name);
    if (!ctx || items.length === 0) return null;
    return (
      <svg
        viewBox={`0 0 ${ctx.W} ${ctx.H}`}
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        aria-hidden
      >
        {items.map((x) => <g key={x.id} data-slot={wearById(x.id)?.slot} {...place(x.id, x.tweak, ctx)}>{x.art.render(ctx)}</g>)}
      </svg>
    );
  };

  return (
    <span data-dressed="" className={cn("relative inline-flex align-bottom", className)} style={{ aspectRatio: `${c.w} / ${c.h}` }}>
      {layer("back")}
      <Image
        src={c.src}
        alt={alt ?? c.name}
        width={c.w}
        height={c.h}
        priority={priority}
        draggable={false}
        className={cn("relative h-full w-auto select-none object-contain", imgClassName)}
      />
      {layer("front")}
    </span>
  );
}
