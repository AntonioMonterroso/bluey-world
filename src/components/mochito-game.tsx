"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Apple, Bone, Carrot, Cookie, Drumstick, Grape, Candy, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DressedImage } from "@/components/dressed-image";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import { useProfile } from "@/lib/db/profile";
import { mochitoDo } from "@/lib/mochito-actions";
import { CATCH_MS, DOG_BAD, DOG_GOOD, catchScore, catchSpec } from "@/lib/game/minigames";
import { DOG_WHY, LANES, WANT_EVERY_MS, catchPoints, laneOf, laneX } from "@/lib/mochito-extra-2";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Bone> = { hueso: Bone, galleta: Cookie, zanahoria: Carrot, manzana: Apple, pollo: Drumstick, chocolate: Candy, uvas: Grape, cebolla: CircleDot };
interface Falling { id: number; name: string; good: boolean; lane: number; y: number }

/** Mochito atrapa premios de perro en tres carriles y esquiva lo que le hace daño. Lo que pide vale doble. */
export function MochitoGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const { profile } = useProfile();
  const spec = catchSpec(play.level);
  const arena = useRef<HTMLDivElement>(null);
  const [round, setRound] = useState(0);
  const [items, setItems] = useState<Falling[]>([]);
  const [lane, setLane] = useState(1);
  const [left, setLeft] = useState(CATCH_MS);
  const [stats, setStats] = useState({ caught: 0, spawned: 0, bad: 0, points: 0, possible: 0 });
  const [want, setWant] = useState(DOG_GOOD[0]);
  const [why, setWhy] = useState("");
  const [over, setOver] = useState(false);
  const laneRef = useRef(1);
  useEffect(() => { laneRef.current = lane; }, [lane]);

  useEffect(() => {
    let rnd = rngFor(play, round === 0);
    let raf = 0;
    let last = performance.now();
    let spawnIn = 400;
    let elapsed = 0;
    let nextId = 1;
    let local: Falling[] = [];
    const s = { caught: 0, spawned: 0, bad: 0, points: 0, possible: 0 };
    let wantNow = "";
    let wantIn = 0;
    const loop = (t: number) => {
      const dt = Math.min(64, t - last);
      last = t;
      elapsed += dt;
      spawnIn -= dt;
      wantIn -= dt;
      if (wantIn <= 0) {
        wantIn = WANT_EVERY_MS;
        const others = DOG_GOOD.filter((g) => g !== wantNow);
        wantNow = others[Math.floor(rnd() * others.length)];
        setWant(wantNow);
      }
      if (spawnIn <= 0 && elapsed < CATCH_MS - 800) {
        spawnIn = spec.every * (0.7 + rnd() * 0.6);
        const good = rnd() > spec.bad;
        const pool = good ? (rnd() < 0.45 ? [wantNow] : DOG_GOOD) : DOG_BAD;
        const name = pool[Math.floor(rnd() * pool.length)];
        local.push({ id: nextId++, name, good, lane: Math.floor(rnd() * LANES) % LANES, y: -0.08 });
        if (good) { s.spawned++; s.possible += catchPoints(name, wantNow); }
      }
      const next: Falling[] = [];
      for (const it of local) {
        const y = it.y + (spec.speed * dt) / 1000;
        if (y >= 0.74 && y < 0.92 && it.lane === laneRef.current) {
          if (it.good) { s.caught++; s.points += catchPoints(it.name, wantNow); sfx(it.name === wantNow ? "cash" : "coin"); }
          else { s.bad++; sfx("sad"); setWhy(DOG_WHY[it.name] ?? ""); }
          continue;
        }
        if (y < 1.05) next.push({ ...it, y });
      }
      local = next;
      setItems(local);
      setStats({ ...s });
      setLeft(Math.max(0, CATCH_MS - elapsed));
      if (elapsed >= CATCH_MS) { setOver(true); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); rnd = () => 0; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  useEffect(() => { if (over) void mochitoDo("game", { game: "Galletas para Mochito" }); }, [over]);

  function moveTo(clientX: number) {
    const r = arena.current?.getBoundingClientRect();
    if (!r) return;
    setLane(laneOf((clientX - r.left) / r.width));
  }
  function again() { setOver(false); setItems([]); setWhy(""); setStats({ caught: 0, spawned: 0, bad: 0, points: 0, possible: 0 }); setLeft(CATCH_MS); setRound((n) => n + 1); }
  const score = catchScore(stats.points, stats.possible, stats.bad);
  const WantIcon = ICONS[want] ?? Cookie;

  return (
    <section aria-labelledby="g-mochito" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-mochito" className="text-3xl">Galletas para Mochito</h2>
      <p className="text-muted-foreground">
        Mochito corre en tres carriles: toca un carril, usa las flechas o los botones. Atrapa huesos, galletas y fruta (lo que pide vale doble) y esquiva el chocolate, las uvas y la cebolla: a los perros les hacen daño.
      </p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-live="polite">
        <span>Tiempo: <span className="tabular-nums">{Math.ceil(left / 1000)} s</span></span>
        <span>Atrapados: <span className="tabular-nums">{stats.caught}</span></span>
        <span className="text-destructive">Errores: <span className="tabular-nums">{stats.bad}</span></span>
        <span className="flex items-center gap-1 rounded-full bg-[var(--gold)] px-3 py-0.5 text-foreground">Ahora quiere: <WantIcon className="size-4" aria-hidden /> {want}</span>
      </div>
      {why && <p className="rounded-2xl bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive" role="status">¡Eso no! {why}</p>}
      <div
        ref={arena}
        tabIndex={0}
        role="application"
        aria-label="Zona de juego. Usa las flechas izquierda y derecha para mover a Mochito."
        className="relative h-[26rem] touch-none select-none overflow-hidden rounded-[2rem] bg-gradient-to-b from-card to-secondary outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
        onPointerMove={(e) => { if (e.buttons || e.pointerType !== "mouse") moveTo(e.clientX); }}
        onPointerDown={(e) => moveTo(e.clientX)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") { e.preventDefault(); setLane((b) => Math.max(0, b - 1)); }
          if (e.key === "ArrowRight") { e.preventDefault(); setLane((b) => Math.min(LANES - 1, b + 1)); }
        }}
      >
        {Array.from({ length: LANES - 1 }, (_, k) => <span key={k} className="absolute inset-y-0 w-0.5 bg-border" style={{ left: `${((k + 1) / LANES) * 100}%` }} aria-hidden />)}
        {items.map((it) => {
          const Icon = ICONS[it.name] ?? Cookie;
          return (
            <span key={it.id} className={cn("absolute flex -translate-x-1/2 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow", it.good ? (it.name === want ? "bg-[var(--gold)] text-foreground" : "bg-card text-foreground") : "bg-destructive text-white")} style={{ left: `${laneX(it.lane) * 100}%`, top: `${it.y * 100}%` }}>
              <Icon className="size-4" aria-hidden /> {it.name}
            </span>
          );
        })}
        <span className="absolute bottom-2 h-24 -translate-x-1/2 transition-[left] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ left: `${laneX(lane) * 100}%` }} aria-hidden>
          <DressedImage char="mochito" outfit={profile.mochito_outfit} alt="" className="h-full" />
        </span>
      </div>
      {over ? (
        <Result game="mochito" play={play} score={score} onAgain={again} onExit={onExit} detail={`Mochito atrapó ${stats.caught} de ${stats.spawned} premios (${stats.points} puntos), con ${stats.bad} ${stats.bad === 1 ? "error" : "errores"}. ¡Quedó feliz de jugar contigo!`} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-label="Carril de la izquierda" onClick={() => setLane((b) => Math.max(0, b - 1))} className="flex size-14 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><ArrowLeft className="size-6" aria-hidden /></button>
          <button type="button" aria-label="Carril de la derecha" onClick={() => setLane((b) => Math.min(LANES - 1, b + 1))} className="flex size-14 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><ArrowRight className="size-6" aria-hidden /></button>
          <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}
