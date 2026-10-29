"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Maximize2, RotateCw } from "lucide-react";
import { DressedImage } from "@/components/dressed-image";
import { parseWear, withTweak } from "@/lib/game/outfit";
import { cn } from "@/lib/utils";

type Outfit = Record<string, string>;
type Box = { left: number; top: number; width: number; height: number };
type Mode =
  | { kind: "move"; slot: string; value: string; px: number; py: number; k: number }
  | { kind: "scale"; slot: string; value: string; cx: number; cy: number; d0: number }
  | { kind: "rotate"; slot: string; value: string; cx: number; cy: number; a0: number }
  | { kind: "pinch"; slot: string; value: string; d0: number; a0: number };

const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay);
const angle = (ax: number, ay: number, bx: number, by: number) => (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;

/**
 * Probador interactivo: toca una prenda para elegirla y arrástrala; usa las asas para
 * agrandarla o girarla (o pellizca con dos dedos). También acepta prendas soltadas encima.
 */
export function WardrobeStage({
  charId, outfit, slot, onSelect, onChange, onDropItem, label,
}: {
  charId: string;
  outfit: Outfit;
  slot: string;
  onSelect: (slot: string) => void;
  onChange: (slot: string, value: string) => void;
  onDropItem: (itemId: string) => void;
  label: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const mode = useRef<Mode | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const [live, setLive] = useState<{ slot: string; value: string } | null>(null);
  const liveRef = useRef<{ slot: string; value: string } | null>(null); // lo último, aunque React no haya repintado
  const [box, setBox] = useState<Box | null>(null);
  const [dropping, setDropping] = useState(false);

  const shown: Outfit = live ? { ...outfit, [live.slot]: live.value } : outfit;
  const active = shown[slot];

  // Marco alrededor de la prenda elegida (se mide después de pintar).
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const g = stage?.querySelector<SVGGElement>(`g[data-slot="${slot}"]`);
    if (!stage || !g || !active) { setBox(null); return; }
    const s = stage.getBoundingClientRect();
    const r = g.getBoundingClientRect();
    setBox({ left: r.left - s.left, top: r.top - s.top, width: r.width, height: r.height });
  }, [slot, active, charId]);

  const unit = () => 100 / Math.max(1, stageRef.current?.querySelector<HTMLElement>("[data-dressed]")?.getBoundingClientRect().width ?? 1);
  const center = () => {
    const g = stageRef.current?.querySelector<SVGGElement>(`g[data-slot="${slot}"]`);
    const r = g?.getBoundingClientRect();
    return r ? { cx: r.left + r.width / 2, cy: r.top + r.height / 2 } : null;
  };

  /** La prenda puesta más pequeña bajo el dedo (así se puede tocar un lazo encima de un vestido). */
  function hit(x: number, y: number): string | null {
    const stage = stageRef.current;
    if (!stage) return null;
    let best: { slot: string; area: number } | null = null;
    for (const g of stage.querySelectorAll<SVGGElement>("g[data-slot]")) {
      const s = g.dataset.slot!;
      if (s === "back") continue;
      const r = g.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        const area = r.width * r.height;
        if (!best || area < best.area) best = { slot: s, area };
      }
    }
    return best?.slot ?? null;
  }

  function start(e: React.PointerEvent, handle?: "scale" | "rotate") {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* algunos navegadores no dejan capturar un segundo dedo */ }
    if (pointers.current.size === 2 && active) {
      const [a, b] = [...pointers.current.values()];
      mode.current = { kind: "pinch", slot, value: shown[slot], d0: dist(a.x, a.y, b.x, b.y), a0: angle(a.x, a.y, b.x, b.y) };
      return;
    }
    if (handle && active) {
      const c = center();
      if (!c) return;
      mode.current = handle === "scale"
        ? { kind: "scale", slot, value: active, ...c, d0: Math.max(8, dist(c.cx, c.cy, e.clientX, e.clientY)) }
        : { kind: "rotate", slot, value: active, ...c, a0: angle(c.cx, c.cy, e.clientX, e.clientY) };
      return;
    }
    const picked = hit(e.clientX, e.clientY) ?? (active ? slot : null);
    if (!picked || !shown[picked]) return;
    if (picked !== slot) onSelect(picked);
    mode.current = { kind: "move", slot: picked, value: shown[picked], px: e.clientX, py: e.clientY, k: unit() };
  }

  function move(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const m = mode.current;
    if (!m) return;
    const t = parseWear(m.value).tweak;
    let next: string;
    if (m.kind === "move") {
      next = withTweak(m.value, { x: Math.round((t.x + (e.clientX - m.px) * m.k) * 2) / 2, y: Math.round((t.y + (e.clientY - m.py) * m.k) * 2) / 2 });
    } else if (m.kind === "scale") {
      next = withTweak(m.value, { s: Math.round(t.s * (dist(m.cx, m.cy, e.clientX, e.clientY) / m.d0) * 100) / 100 });
    } else if (m.kind === "rotate") {
      next = withTweak(m.value, { r: Math.round(t.r + angle(m.cx, m.cy, e.clientX, e.clientY) - m.a0) });
    } else {
      if (pointers.current.size < 2) return;
      const [a, b] = [...pointers.current.values()];
      next = withTweak(m.value, { s: Math.round(t.s * (dist(a.x, a.y, b.x, b.y) / m.d0) * 100) / 100, r: Math.round(t.r + angle(a.x, a.y, b.x, b.y) - m.a0) });
    }
    liveRef.current = { slot: m.slot, value: next };
    setLive(liveRef.current);
  }

  function end(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) return;
    const m = mode.current;
    mode.current = null;
    const last = liveRef.current;
    if (m && last) onChange(m.slot, last.value); // se guarda una sola vez, al soltar
    liveRef.current = null;
    setLive(null);
  }

  return (
    <div
      ref={stageRef}
      tabIndex={0}
      aria-label={label}
      className={cn(
        "relative flex h-80 touch-none select-none items-center justify-center overflow-visible rounded-[2rem] bg-secondary p-6 outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
        dropping && "ring-4 ring-primary/50",
        Object.keys(outfit).length > 0 && "cursor-grab active:cursor-grabbing",
      )}
      onPointerDown={(e) => start(e)}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onDragOver={(e) => { if (e.dataTransfer.types.includes("text/wear")) { e.preventDefault(); setDropping(true); } }}
      onDragLeave={() => setDropping(false)}
      onDrop={(e) => { e.preventDefault(); setDropping(false); const id = e.dataTransfer.getData("text/wear"); if (id) onDropItem(id); }}
      onKeyDown={(e) => {
        if (!active) return;
        const t = parseWear(active).tweak;
        const step = e.shiftKey ? 2 : 0.5;
        const patch =
          e.key === "ArrowLeft" ? { x: t.x - step } : e.key === "ArrowRight" ? { x: t.x + step }
          : e.key === "ArrowUp" ? { y: t.y - step } : e.key === "ArrowDown" ? { y: t.y + step }
          : e.key === "+" ? { s: t.s + 0.05 } : e.key === "-" ? { s: t.s - 0.05 }
          : e.key === "[" ? { r: t.r - 5 } : e.key === "]" ? { r: t.r + 5 } : null;
        if (!patch) return;
        e.preventDefault();
        onChange(slot, withTweak(active, patch));
      }}
    >
      <DressedImage char={charId} outfit={shown} className="h-full" imgClassName="drop-shadow-sm" />

      {box && (
        <div aria-hidden className="pointer-events-none absolute rounded-xl border-2 border-dashed border-primary/70" style={{ left: box.left - 6, top: box.top - 6, width: box.width + 12, height: box.height + 12 }}>
          <button
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => { e.stopPropagation(); start(e, "rotate"); }}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            className="pointer-events-auto absolute -top-11 left-1/2 flex size-11 -translate-x-1/2 items-center justify-center"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"><RotateCw className="size-4" /></span>
          </button>
          <button
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => { e.stopPropagation(); start(e, "scale"); }}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            className="pointer-events-auto absolute -bottom-6 -right-6 flex size-11 items-center justify-center"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"><Maximize2 className="size-3.5" /></span>
          </button>
        </div>
      )}
    </div>
  );
}
