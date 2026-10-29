"use client";

import { useEffect, useRef, useState } from "react";
import { Candy, Cherry, Cookie, Droplet, Egg, Milk, ShoppingBasket, Sparkles, Undo2, Wheat, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import {
  CATCH_BAD, CATCH_GOOD, CATCH_MS, CHANGE_ROUNDS, DENOMS, catchScore, catchSpec, changeRound, sumOf, type ChangeRound,
} from "@/lib/game/minigames";
import { sfx } from "@/lib/sfx";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";

// ---------- Atrapa ingredientes ----------

const ICONS: Record<string, typeof Egg> = { harina: Wheat, huevo: Egg, azúcar: Candy, mantequilla: Droplet, fresa: Cherry, chocolate: Cookie, leche: Milk, canela: Sparkles };
interface Falling { id: number; name: string; good: boolean; x: number; y: number }

export function CatchGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const spec = catchSpec(play.level);
  const arena = useRef<HTMLDivElement>(null);
  const [round, setRound] = useState(0);
  const [items, setItems] = useState<Falling[]>([]);
  const [basket, setBasket] = useState(0.5);
  const [left, setLeft] = useState(CATCH_MS);
  const [stats, setStats] = useState({ caught: 0, spawned: 0, bad: 0 });
  const [over, setOver] = useState(false);
  const basketRef = useRef(0.5);
  basketRef.current = basket;

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
        const pool = good ? CATCH_GOOD : CATCH_BAD;
        local.push({ id: nextId++, name: pool[Math.floor(rnd() * pool.length)], good, x: 0.08 + rnd() * 0.84, y: -0.08 });
        if (good) s.spawned++;
      }
      const next: Falling[] = [];
      for (const it of local) {
        const y = it.y + (spec.speed * dt) / 1000;
        if (y >= 0.84 && y < 0.95 && Math.abs(it.x - basketRef.current) < 0.12) {
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

  function moveTo(clientX: number) {
    const r = arena.current?.getBoundingClientRect();
    if (!r) return;
    setBasket(Math.min(0.92, Math.max(0.08, (clientX - r.left) / r.width)));
  }
  function again() { setOver(false); setItems([]); setStats({ caught: 0, spawned: 0, bad: 0 }); setLeft(CATCH_MS); setRound((n) => n + 1); }
  const score = catchScore(stats.caught, stats.spawned, stats.bad);

  return (
    <section aria-labelledby="g-atrapa" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-atrapa" className="text-3xl">Atrapa ingredientes</h2>
      <p className="text-muted-foreground">Mueve la canasta con el dedo, el mouse o las flechas. Atrapa ingredientes y esquiva lo que no va en un pastel.</p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-live="polite">
        <span>Tiempo: <span className="tabular-nums">{Math.ceil(left / 1000)} s</span></span>
        <span>Atrapados: <span className="tabular-nums">{stats.caught}</span></span>
        <span className="text-destructive">Errores: <span className="tabular-nums">{stats.bad}</span></span>
      </div>
      <div
        ref={arena}
        tabIndex={0}
        role="application"
        aria-label="Zona de juego. Usa las flechas izquierda y derecha para mover la canasta."
        className="relative h-[26rem] touch-none select-none overflow-hidden rounded-[2rem] bg-gradient-to-b from-card to-secondary outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
        onPointerMove={(e) => moveTo(e.clientX)}
        onPointerDown={(e) => moveTo(e.clientX)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") { e.preventDefault(); setBasket((b) => Math.max(0.08, b - 0.07)); }
          if (e.key === "ArrowRight") { e.preventDefault(); setBasket((b) => Math.min(0.92, b + 0.07)); }
        }}
      >
        {items.map((it) => {
          const Icon = it.good ? ICONS[it.name] ?? Sparkles : X;
          return (
            <span key={it.id} className={cn("absolute flex -translate-x-1/2 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow", it.good ? "bg-card text-foreground" : "bg-destructive text-white")} style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%` }}>
              <Icon className="size-4" aria-hidden /> {it.name}
            </span>
          );
        })}
        <span className="absolute bottom-3 flex h-12 w-24 -translate-x-1/2 items-center justify-center rounded-b-[1.5rem] rounded-t-md bg-primary text-primary-foreground shadow-lg" style={{ left: `${basket * 100}%` }} aria-hidden>
          <ShoppingBasket className="size-6" />
        </span>
      </div>
      {over ? (
        <Result game="atrapa" play={play} score={score} onAgain={again} onExit={onExit} detail={`Atrapaste ${stats.caught} de ${stats.spawned} ingredientes, con ${stats.bad} ${stats.bad === 1 ? "error" : "errores"}.`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}

// ---------- Cuenta el cambio ----------

export function ChangeGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const fmt = useMoney();
  const [rounds, setRounds] = useState<ChangeRound[]>(() => { const r = rngFor(play, true); return Array.from({ length: CHANGE_ROUNDS }, () => changeRound(r, play.level)); });
  const [i, setI] = useState(0);
  const [given, setGiven] = useState<number[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const done = results.length === CHANGE_ROUNDS;
  const cur = rounds[Math.min(i, rounds.length - 1)];
  const total = sumOf(given);
  const denoms = play.level === "facil" ? DENOMS.filter((d) => d >= 1) : DENOMS;

  function give() {
    const ok = Math.abs(total - cur.change) < 0.001;
    sfx(ok ? "cash" : "sad");
    setFlash(ok ? "ok" : "bad");
    setResults((r) => [...r, ok]);
    setGiven([]);
    setTimeout(() => setFlash(null), 700);
    setI((n) => n + 1);
  }
  function again() { const r = rngFor(play, false); setRounds(Array.from({ length: CHANGE_ROUNDS }, () => changeRound(r, play.level))); setI(0); setGiven([]); setResults([]); }
  const right = results.filter(Boolean).length;

  return (
    <section aria-labelledby="g-cambio" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-cambio" className="text-3xl">Cuenta el cambio</h2>
      <p className="text-muted-foreground">El cliente paga con un billete. Arma el vuelto exacto tocando monedas y billetes.</p>
      {!done && (
        <>
          <div className={cn("flex flex-col gap-2 rounded-3xl border bg-card p-5", flash === "ok" && "border-primary", flash === "bad" && "border-destructive")}>
            <p className="text-sm font-semibold text-muted-foreground">Cliente {i + 1} de {CHANGE_ROUNDS}</p>
            <p className="text-lg">Compra algo de <span className="font-heading text-2xl">{fmt(cur.price)}</span> y paga con <span className="font-heading text-2xl">{fmt(cur.paid)}</span>.</p>
            <p aria-live="polite" className="text-sm">Vuelto que llevas: <span className="font-semibold tabular-nums">{fmt(total)}</span></p>
            <ul className="flex min-h-10 flex-wrap gap-1.5" aria-label="Vuelto">
              {given.map((g, k) => <li key={k} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold tabular-nums">{fmt(g)}</li>)}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Monedas y billetes">
            {denoms.map((d) => (
              <button key={d} type="button" onClick={() => { sfx("coin"); setGiven((g) => [...g, d]); }} className={cn("flex min-h-12 min-w-16 items-center justify-center rounded-2xl border-2 px-3 font-semibold tabular-nums", d < 5 ? "rounded-full border-[var(--gold)] bg-[color-mix(in_oklch,var(--gold)_25%,transparent)]" : "border-primary/40 bg-card")}>
                {fmt(d)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="h-12 rounded-2xl px-6 text-base" disabled={given.length === 0} onClick={give}>Dar vuelto</Button>
            <Button variant="outline" className="h-12 rounded-2xl" disabled={given.length === 0} onClick={() => setGiven((g) => g.slice(0, -1))}><Undo2 aria-hidden /> Quitar el último</Button>
            <Button variant="ghost" className="h-12 rounded-2xl" onClick={onExit}>Salir</Button>
          </div>
          {results.length > 0 && <p className="text-sm font-semibold">{results.at(-1) ? "¡Exacto!" : `No era: el vuelto correcto era ${fmt(rounds[results.length - 1].change)}.`}</p>}
        </>
      )}
      {done && <Result game="cambio" play={play} score={right / CHANGE_ROUNDS} onAgain={again} onExit={onExit} detail={`Diste el vuelto exacto ${right} de ${CHANGE_ROUNDS} veces.`} />}
    </section>
  );
}
