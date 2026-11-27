"use client";

import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, useReducedMotion } from "motion/react";
import { Camera, Download, Share2, Trash2, X } from "lucide-react";
import { DressedImage } from "@/components/dressed-image";
import { MochitoHome } from "@/components/mochito-things";
import { PuppyArt } from "@/components/puppy-art";
import { HouseArt } from "@/components/mochito-house";
import { db } from "@/lib/db/db";
import { useProfile } from "@/lib/db/profile";
import { deleteMochitoPhoto, saveMochitoPhoto } from "@/lib/mochito-actions";
import { friendsOf } from "@/lib/mochito-play";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

type Scene = "jardin" | "parque" | "local" | "estudio" | "fiesta";
const SCENES: { id: Scene; name: string; css: string }[] = [
  { id: "jardin", name: "Su casita", css: "linear-gradient(#d6ecfb 0 68%, #a5dcae 68% 100%)" },
  { id: "parque", name: "Parque", css: "linear-gradient(#cfe8fb 0 70%, #9fdcb4 70% 100%)" },
  { id: "local", name: "Local", css: "linear-gradient(#fbe3ea 0 72%, #d9a77c 72% 100%)" },
  { id: "estudio", name: "Estudio", css: "radial-gradient(circle at 50% 40%, #fff7e6, #f3d9a4)" },
  { id: "fiesta", name: "Fiesta", css: "linear-gradient(#efe4ff 0 75%, #c9b6f2 75% 100%)" },
];

/** Dibuja el fondo de la escena en el lienzo (igual que se ve en pantalla). */
function drawScene(ctx: CanvasRenderingContext2D, scene: Scene, w: number, h: number) {
  const band = (top: string, bottom: string, at: number) => {
    ctx.fillStyle = top; ctx.fillRect(0, 0, w, h * at);
    ctx.fillStyle = bottom; ctx.fillRect(0, h * at, w, h * (1 - at));
  };
  if (scene === "jardin") {
    band("#d6ecfb", "#a5dcae", 0.68);
  } else if (scene === "parque") {
    band("#cfe8fb", "#9fdcb4", 0.7);
    ctx.fillStyle = "#ffffff";
    for (const [x, y, r] of [[0.15, 0.18, 0.05], [0.2, 0.17, 0.06], [0.75, 0.12, 0.05], [0.8, 0.13, 0.04]]) { ctx.beginPath(); ctx.arc(w * x, h * y, w * r, 0, Math.PI * 2); ctx.fill(); }
  } else if (scene === "local") {
    band("#fbe3ea", "#d9a77c", 0.72);
    ctx.strokeStyle = "rgb(0 0 0 / 0.08)"; ctx.lineWidth = 2;
    for (let x = 0; x < w; x += w / 8) { ctx.beginPath(); ctx.moveTo(x, h * 0.72); ctx.lineTo(x, h); ctx.stroke(); }
  } else if (scene === "estudio") {
    const g = ctx.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h * 0.4, w * 0.7);
    g.addColorStop(0, "#fff7e6"); g.addColorStop(1, "#f3d9a4");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  } else {
    band("#efe4ff", "#c9b6f2", 0.75);
    const colors = ["#f28ab2", "#f6c453", "#7cc6f2", "#9be38c"];
    colors.forEach((c, i) => {
      const x = w * (0.12 + i * 0.25), y = h * (0.16 + (i % 2) * 0.06);
      ctx.strokeStyle = "rgb(0 0 0 / 0.25)"; ctx.beginPath(); ctx.moveTo(x, y + w * 0.05); ctx.lineTo(x, y + w * 0.16); ctx.stroke();
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, w * 0.04, w * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    });
  }
}

/** Copia un SVG con sus colores ya resueltos (variables del tema y clases), para poder dibujarlo en el lienzo. */
function svgToImage(svg: SVGSVGElement, w: number, h: number, pad: number): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const from = [svg, ...svg.querySelectorAll("*")];
  const to = [clone, ...clone.querySelectorAll("*")];
  from.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const t = to[i] as SVGElement;
    for (const prop of ["fill", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-opacity", "stroke-linecap", "stroke-linejoin", "stroke-dasharray"]) {
      const v = cs.getPropertyValue(prop);
      if (v) t.style.setProperty(prop, v);
    }
  });
  const vb = svg.viewBox.baseVal;
  if (vb && vb.width) {
    const px = vb.width * pad, py = vb.height * pad;
    clone.setAttribute("viewBox", `${vb.x - px} ${vb.y - py} ${vb.width + 2 * px} ${vb.height + 2 * py}`);
  }
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(w * (1 + 2 * pad)));
  clone.setAttribute("height", String(h * (1 + 2 * pad)));
  clone.removeAttribute("class");
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

/** Espera algo, pero no más de `ms` (si se pasa, sigue sin eso). */
const within = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]);

/** Toma la foto: fondo de la escena + todo lo que está en el escenario + la leyenda abajo. */
async function snapshot(stage: HTMLElement, scene: Scene, caption: string) {
  const sr = stage.getBoundingClientRect();
  const W = 720;
  const k = W / sr.width;
  const H = Math.round(sr.height * k);
  const BAR = 84;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H + BAR;
  const ctx = canvas.getContext("2d")!;
  drawScene(ctx, scene, W, H);
  const nodes = [...stage.querySelectorAll("img, svg")].filter((n) => !(n.parentElement?.closest("svg")));
  for (const n of nodes) {
    const r = n.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const x = (r.left - sr.left) * k, y = (r.top - sr.top) * k, w = r.width * k, h = r.height * k;
    if (n instanceof HTMLImageElement) {
      if (!(n.complete && n.naturalWidth)) await within(n.decode().catch(() => undefined), 1500);
      if (n.complete && n.naturalWidth) ctx.drawImage(n, x, y, w, h);
    } else if (n instanceof SVGSVGElement) {
      const pad = 0.25;
      const img = await within(svgToImage(n, w, h, pad).catch(() => null), 1500);
      if (img) ctx.drawImage(img, x - w * pad, y - h * pad, w * (1 + 2 * pad), h * (1 + 2 * pad));
    }
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, H, W, BAR);
  ctx.fillStyle = "#3b2a2a";
  ctx.font = "600 30px Georgia, serif";
  ctx.fillText(caption, 28, H + 50);
  return canvas.toDataURL("image/jpeg", 0.88);
}

const dateLabel = (ms: number) => new Date(ms).toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" });

export function PhotoTab({ level, onLine }: { level: number; onLine: (s: string) => void }) {
  const { profile } = useProfile();
  const reduce = useReducedMotion();
  const photos = useLiveQuery(() => db.mochito_photos.orderBy("at").reverse().toArray(), []);
  const stage = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<Scene>("parque");
  const [withFriends, setWithFriends] = useState(true);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(0);
  const [view, setView] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const friends = friendsOf(profile.mochito_friends).slice(0, 2);

  async function shoot() {
    if (!stage.current || busy) return;
    setBusy(true);
    sfx("click");
    setFlash((n) => n + 1);
    try {
      const data = await snapshot(stage.current, scene, `Mochito · Nivel ${level} · ${dateLabel(Date.now())}`);
      const r = await saveMochitoPhoto(data, scene);
      onLine(r.medals.length ? `¡Una medalla por las fotos! Es «${r.medals[0]}».` : "¡Clic! Salí guapísimo. Guárdala bien.");
      sfx("success");
    } catch {
      onLine("Uy, la foto no salió. ¿Probamos otra vez?");
    } finally {
      setBusy(false);
    }
  }

  const current = photos?.find((p) => p.id === view) ?? null;
  async function share() {
    if (!current) return;
    try {
      const blob = await (await fetch(current.data)).blob();
      const file = new File([blob], `mochito-${current.id}.jpg`, { type: "image/jpeg" });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "Mochito" });
      else onLine("Este dispositivo no deja compartir directo. Descárgala y compártela desde tus fotos.");
    } catch { /* la persona canceló */ }
  }

  return (
    <div role="tabpanel" className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Fondo de la foto">
        {SCENES.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={scene === s.id} onClick={() => setScene(s.id)} className={cn("min-h-11 rounded-full border-2 px-4 text-sm font-semibold active:scale-[0.97]", scene === s.id ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary")}>
            {s.name}
          </button>
        ))}
        {friends.length > 0 && (
          <label className="flex min-h-11 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-semibold">
            <input type="checkbox" checked={withFriends} onChange={(e) => setWithFriends(e.target.checked)} className="size-4 accent-[var(--primary)]" /> Con sus amigos
          </label>
        )}
      </div>

      <div ref={stage} className="relative flex h-56 items-end justify-center gap-2 overflow-hidden rounded-3xl pb-4" style={{ background: SCENES.find((s) => s.id === scene)!.css }}>
        {scene === "jardin" && <span className="absolute bottom-3 left-2 h-32 w-36"><HouseArt house={profile.mochito_house} /></span>}
        {withFriends && friends[0] && <span className="mb-1 h-20 w-20"><PuppyArt friend={friends[0]} /></span>}
        <div className="h-40 px-8">
          <MochitoHome home={profile.mochito_home}>
            <DressedImage char="mochito" outfit={profile.mochito_outfit} alt="" className="h-full" />
          </MochitoHome>
        </div>
        {withFriends && friends[1] && <span className="mb-1 h-20 w-20"><PuppyArt friend={friends[1]} /></span>}
        {flash > 0 && (
          <motion.span key={flash} aria-hidden className="pointer-events-none absolute inset-0 bg-white" initial={{ opacity: reduce ? 0.4 : 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }} />
        )}
      </div>
      <button type="button" disabled={busy} onClick={() => void shoot()} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 font-semibold text-primary-foreground active:scale-[0.97] disabled:opacity-60">
        <Camera className="size-5" aria-hidden /> {busy ? "Tomando la foto…" : "Tomar foto"}
      </button>

      <section aria-labelledby="album" className="flex flex-col gap-2">
        <h3 id="album" className="text-sm font-semibold">Álbum ({photos?.length ?? 0})</h3>
        <p className="text-xs text-muted-foreground">Las fotos se guardan solo en este dispositivo. Descárgalas para tenerlas en tu galería.</p>
        {photos && photos.length > 0 ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => { setView(p.id); setConfirm(false); }} aria-label={`Ver la foto del ${dateLabel(p.at)}`} className={cn("block w-full overflow-hidden rounded-2xl border-2 active:scale-[0.97]", view === p.id ? "border-primary" : "border-transparent")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.data} alt="" className="aspect-square w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">Todavía no hay fotos. Elige un fondo y toma la primera.</p>
        )}
      </section>

      {current && (
        <div className="flex flex-col gap-3 rounded-3xl border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">{dateLabel(current.at)}</p>
            <button type="button" onClick={() => setView(null)} aria-label="Cerrar la foto" className="flex size-11 items-center justify-center rounded-full bg-secondary active:scale-[0.97]"><X className="size-5" aria-hidden /></button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.data} alt={`Foto de Mochito del ${dateLabel(current.at)}`} className="w-full rounded-2xl" />
          <div className="flex flex-wrap gap-2">
            <a href={current.data} download={`mochito-${current.id}.jpg`} className="flex min-h-11 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-[0.97]"><Download className="size-4" aria-hidden /> Descargar</a>
            <button type="button" onClick={() => void share()} className="flex min-h-11 items-center gap-2 rounded-2xl border-2 border-primary px-4 text-sm font-semibold active:scale-[0.97]"><Share2 className="size-4" aria-hidden /> Compartir</button>
            {confirm ? (
              <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                ¿Borrar esta foto?
                <button type="button" onClick={() => { void deleteMochitoPhoto(current.id); setView(null); setConfirm(false); }} className="min-h-11 rounded-2xl bg-destructive px-4 text-white active:scale-[0.97]">Sí, borrar</button>
                <button type="button" onClick={() => setConfirm(false)} className="min-h-11 rounded-2xl bg-secondary px-4 active:scale-[0.97]">No</button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirm(true)} className="flex min-h-11 items-center gap-2 rounded-2xl bg-secondary px-4 text-sm font-semibold active:scale-[0.97]"><Trash2 className="size-4" aria-hidden /> Borrar</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
