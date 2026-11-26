"use client";

import { useEffect, useRef, useState } from "react";
import { Apple, Bone, Carrot, Cookie, Drumstick, Grape, Candy, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DressedImage } from "@/components/dressed-image";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import { useProfile } from "@/lib/db/profile";
import { mochitoDo } from "@/lib/mochito-actions";
import { CATCH_MS, DOG_BAD, DOG_GOOD, catchScore, catchSpec } from "@/lib/game/minigames";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Bone> = { hueso: Bone, galleta: Cookie, zanahoria: Carrot, manzana: Apple, pollo: Drumstick, chocolate: Candy, uvas: Grape, cebolla: CircleDot };
interface Falling { id: number; name: string; good: boolean; x: number; y: number }

/** Mochito atrapa premios de perro y esquiva lo que le hace daño. Al terminar queda contento (sube su diversión). */
export function MochitoGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const { profile } = useProfile();
  const spec = catchSpec(play.level);
  const arena = useRef<HTMLDivElement>(null);
  const [round, setRound] = useState(0);
  const [items, setItems] = useState<Falling[]>([]);
  const [dog, setDog] = useState(0.5);
  const [left, setLeft] = useState(CATCH_MS);
  const [stats, setStats] = useState({ caught: 0, spawned: 0, bad: 0 });
  const [over, setOver] = useState(false);
  const dogRef = useRef(0.5);
  useEffect(() => { dogRef.current = dog; }, [dog]);

  useEffect(() => {
    let rnd = rngFor(play, round === 0);
    let raf = 0;
    let last = performance.now();
    let spawnIn = 400;
    let elapsed = 0;
    let nextId = 1;
    let local: Falling[] = [];
    const s = { caught: 0, spawned: 0, bad: 0 };
    const loop = (t: number) => {
      const dt = Math.min(64, t - last);
      last = t;
      elapsed += dt;
      spawnIn -= dt;
      if (spawnIn <= 0 && elapsed < CATCH_MS - 800) {
        spawnIn = spec.every * (0.7 + rnd() * 0.6);
        const good = rnd() > spec.bad;
        const pool = good ? DOG_GOOD : DOG_BAD;
        local.push({ id: nextId++, name: pool[Math.floor(rnd() * pool.length)], good, x: 0.08 + rnd() * 0.84, y: -0.08 });
        if (good) s.spawned++;
      }
      const next: Falling[] = [];
      for (const it of local) {
        const y = it.y + (spec.speed * dt) / 1000;
        if (y >= 0.74 && y < 0.92 && Math.abs(it.x - dogRef.current) < 0.12) {
          if (it.good) { s.caught++; sfx("coin"); } else { s.bad++; sfx("sad"); }
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

  useEffect(() => { if (over) void mochitoDo("game"); }, [over]);

  function moveTo(clientX: number) {
    const r = arena.current?.getBoundingClientRect();
    if (!r) return;
    setDog(Math.min(0.9, Math.max(0.1, (clientX - r.left) / r.width)));
  }
  function again() { setOver(false); setItems([]); setStats({ caught: 0, spawned: 0, bad: 0 }); setLeft(CATCH_MS); setRound((n) => n + 1); }
  const score = catchScore(stats.caught, stats.spawned, stats.bad);

  return (
    <section aria-labelledby="g-mochito" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-mochito" className="text-3xl">Galletas para Mochito</h2>
      <p className="text-muted-foreground">
        Mueve a Mochito con el dedo, el mouse o las flechas. Atrapa huesos, galletas y fruta, y esquiva el chocolate, las uvas y la cebolla: a los perros les hacen daño.
      </p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-live="polite">
        <span>Tiempo: <span className="tabular-nums">{Math.ceil(left / 1000)} s</span></span>
        <span>Atrapados: <span className="tabular-nums">{stats.caught}</span></span>
        <span className="text-destructive">Errores: <span className="tabular-nums">{stats.bad}</span></span>
      </div>
      <div
        ref={arena}
        tabIndex={0}
        role="application"
        aria-label="Zona de juego. Usa las flechas izquierda y derecha para mover a Mochito."
        className="relative h-[26rem] touch-none select-none overflow-hidden rounded-[2rem] bg-gradient-to-b from-card to-secondary outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
        onPointerMove={(e) => moveTo(e.clientX)}
        onPointerDown={(e) => moveTo(e.clientX)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") { e.preventDefault(); setDog((b) => Math.max(0.1, b - 0.07)); }
          if (e.key === "ArrowRight") { e.preventDefault(); setDog((b) => Math.min(0.9, b + 0.07)); }
        }}
      >
        {items.map((it) => {
          const Icon = ICONS[it.name] ?? Cookie;
          return (
            <span key={it.id} className={cn("absolute flex -translate-x-1/2 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow", it.good ? "bg-card text-foreground" : "bg-destructive text-white")} style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%` }}>
              <Icon className="size-4" aria-hidden /> {it.name}
            </span>
          );
        })}
        <span className="absolute bottom-2 h-24 -translate-x-1/2" style={{ left: `${dog * 100}%` }} aria-hidden>
          <DressedImage char="mochito" outfit={profile.mochito_outfit} alt="" className="h-full" />
        </span>
      </div>
      {over ? (
        <Result game="mochito" play={play} score={score} onAgain={again} onExit={onExit} detail={`Mochito atrapó ${stats.caught} de ${stats.spawned} premios, con ${stats.bad} ${stats.bad === 1 ? "error" : "errores"}. ¡Quedó feliz de jugar contigo!`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}
