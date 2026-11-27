"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DressedImage } from "@/components/dressed-image";
import { MochitoFigure } from "@/components/mochito-figure";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import { ThingArt } from "@/components/mochito-things";
import { PuppyArt } from "@/components/puppy-art";
import { useProfile } from "@/lib/db/profile";
import { mochitoDo } from "@/lib/mochito-actions";
import { BUBBLE_MS, BUBBLE_POINTS, LOTERIA_BOARD, bubbleScore, bubbleSpec, loteriaEvery, loteriaGame, loteriaScore, type LoteriaCard } from "@/lib/mochito-life";
import { FRIENDS } from "@/lib/mochito-play";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// ---------- Atrapa burbujas ----------

interface Bubble { id: number; x: number; y: number; gold: boolean; seed: number }

/** Burbujas de jabón suben flotando: tócalas y Mochito brinca a reventarlas. Las doradas valen más. */
export function BubbleGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const { profile } = useProfile();
  const reduce = useReducedMotion();
  const spec = bubbleSpec(play.level);
  const [round, setRound] = useState(0);
  const [items, setItems] = useState<Bubble[]>([]);
  const [dog, setDog] = useState({ x: 0.5, n: 0 });
  const [stats, setStats] = useState({ got: 0, possible: 0, popped: 0, gold: 0 });
  const [left, setLeft] = useState(BUBBLE_MS);
  const [over, setOver] = useState(false);
  const local = useRef<Bubble[]>([]);
  const s = useRef({ got: 0, possible: 0, popped: 0, gold: 0 });

  useEffect(() => {
    let rnd = rngFor(play, round === 0);
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let spawnIn = 300;
    let nextId = 1;
    local.current = [];
    s.current = { got: 0, possible: 0, popped: 0, gold: 0 };
    const loop = (t: number) => {
      const dt = Math.min(64, t - last);
      last = t;
      elapsed += dt;
      spawnIn -= dt;
      if (spawnIn <= 0 && elapsed < BUBBLE_MS - 1500) {
        spawnIn = spec.every * (0.7 + rnd() * 0.6);
        const gold = rnd() < spec.gold;
        local.current.push({ id: nextId++, x: 0.1 + rnd() * 0.8, y: 1.05, gold, seed: rnd() * 6 });
        s.current.possible += gold ? BUBBLE_POINTS.gold : BUBBLE_POINTS.normal;
      }
      local.current = local.current.map((b) => ({ ...b, y: b.y - (spec.speed * (b.gold ? 1.25 : 1) * dt) / 1000 })).filter((b) => b.y > -0.12);
      setItems(local.current);
      setStats({ ...s.current });
      setLeft(Math.max(0, BUBBLE_MS - elapsed));
      if (elapsed >= BUBBLE_MS) { setOver(true); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); rnd = () => 0; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  useEffect(() => { if (over) void mochitoDo("game", { game: "Atrapa burbujas" }); }, [over]);

  function pop(b: Bubble) {
    if (over || !local.current.some((x) => x.id === b.id)) return;
    local.current = local.current.filter((x) => x.id !== b.id);
    s.current.got += b.gold ? BUBBLE_POINTS.gold : BUBBLE_POINTS.normal;
    s.current.popped++;
    if (b.gold) s.current.gold++;
    setItems(local.current);
    setStats({ ...s.current });
    setDog((d) => ({ x: Math.min(0.88, Math.max(0.12, b.x)), n: d.n + 1 }));
    sfx(b.gold ? "coin" : "click");
  }
  function again() { setOver(false); setItems([]); setLeft(BUBBLE_MS); setRound((n) => n + 1); }

  return (
    <section aria-labelledby="g-burbujas" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-burbujas" className="text-3xl">Atrapa burbujas</h2>
      <p className="text-muted-foreground">Toca las burbujas antes de que se vayan volando: Mochito brinca a reventarlas. Las doradas valen {BUBBLE_POINTS.gold} puntos.</p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold" aria-live="polite">
        <span>Tiempo: <span className="tabular-nums">{Math.ceil(left / 1000)} s</span></span>
        <span>Puntos: <span className="tabular-nums">{stats.got}</span></span>
        <span>Doradas: <span className="tabular-nums">{stats.gold}</span></span>
      </div>
      <div className="relative h-[24rem] touch-none select-none overflow-hidden rounded-[2rem] bg-gradient-to-b from-sky-100 to-emerald-50 dark:from-sky-950 dark:to-emerald-950" aria-label="Zona de burbujas">
        {items.map((b) => (
          <button
            key={b.id}
            type="button"
            onPointerDown={(e) => { e.preventDefault(); pop(b); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pop(b); } }}
            aria-label={b.gold ? "Burbuja dorada" : "Burbuja"}
            className={cn("absolute size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2", b.gold ? "border-amber-300 bg-[radial-gradient(circle_at_30%_30%,#fff8d6,#f6c744_70%)] shadow-[0_0_12px_rgb(246_199_68/0.6)]" : "border-white/90 bg-[radial-gradient(circle_at_30%_30%,rgb(255_255_255/0.95),rgb(173_216_255/0.35)_60%,rgb(255_182_230/0.3))]")}
            style={{ left: `${(b.x + (reduce ? 0 : Math.sin(b.y * 7 + b.seed) * 0.03)) * 100}%`, top: `${b.y * 100}%` }}
          />
        ))}
        <motion.span
          key={dog.n}
          className="pointer-events-none absolute bottom-2 block h-24 -translate-x-1/2"
          style={{ left: `${dog.x * 100}%`, transformOrigin: "50% 100%" }}
          initial={false}
          animate={dog.n && !reduce ? { transform: ["translateY(0px)", "translateY(-36px)", "translateY(0px)"] } : undefined}
          transition={{ duration: 0.4, ease: EASE_OUT }}
        >
          <MochitoFigure outfit={profile.mochito_outfit} />
        </motion.span>
      </div>
      {over ? (
        <Result game="burbujas" play={play} score={bubbleScore(stats.got, stats.possible)} onAgain={again} onExit={onExit} detail={`Reventaste ${stats.popped} burbujas (${stats.gold} doradas) y sumaste ${stats.got} puntos. Mochito dice: «¡Huelo a jabón de coco!»`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}

// ---------- Lotería de Mochito ----------

const POSE: Record<string, { transform?: string; festive?: "cumple"; sleeping?: boolean }> = {
  feliz: {}, girado: { transform: "scaleX(-1)" }, sentado: { transform: "translateY(6%) scaleY(0.88)" }, saltando: { transform: "translateY(-6%) rotate(-8deg)" },
  dormido: { sleeping: true }, fiesta: { festive: "cumple" },
};

/** El dibujo de una carta de lotería. */
function CardFace({ card, outfit }: { card: LoteriaCard; outfit?: Record<string, string> }) {
  const [kind, key] = card.id.split(":");
  if (kind === "amigo") {
    const f = FRIENDS.find((x) => x.id === key)!;
    return <span className="block h-[70%] w-[70%]"><PuppyArt friend={f} /></span>;
  }
  if (kind === "pet") return <span className="block h-[55%] w-[80%]"><ThingArt id={card.id} /></span>;
  if (kind === "icon") return <Cookie className="size-1/2 text-[#a8703f]" aria-hidden />;
  const p = POSE[key] ?? {};
  return (
    <span className="block h-[78%]" style={{ transform: p.transform, transformOrigin: "50% 100%" }}>
      {p.festive || p.sleeping ? <MochitoFigure outfit={outfit} festive={p.festive} sleeping={p.sleeping} /> : <DressedImage char="mochito" outfit={outfit} alt="" className="h-full" />}
    </span>
  );
}

/** Mochito canta las cartas y tú las marcas en tu tabla hasta llenarla. */
export function LoteriaGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const { profile } = useProfile();
  const reduce = useReducedMotion();
  const every = loteriaEvery(play.level);
  const [game, setGame] = useState(() => loteriaGame(rngFor(play, true)));
  const [called, setCalled] = useState(0);
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [shake, setShake] = useState<{ id: string; n: number } | null>(null);
  const [round, setRound] = useState(0);
  const full = marked.size >= LOTERIA_BOARD;
  const [ended, setEnded] = useState(false);
  const over = full || ended;

  useEffect(() => {
    if (over) return;
    const id = setInterval(() => {
      setCalled((c) => {
        if (c >= game.calls.length) { setEnded(true); return c; }
        sfx("click");
        return c + 1;
      });
    }, every);
    return () => clearInterval(id);
  }, [over, every, game, round]);

  useEffect(() => { if (over) void mochitoDo("game", { game: "Lotería de Mochito" }); }, [over]);

  const calledSet = new Set(game.calls.slice(0, called).map((c) => c.id));
  const current = called > 0 ? game.calls[called - 1] : null;

  function mark(c: LoteriaCard) {
    if (over || marked.has(c.id)) return;
    if (!calledSet.has(c.id)) { sfx("sad"); setWrong((w) => w + 1); setShake({ id: c.id, n: (shake?.n ?? 0) + 1 }); return; }
    sfx("coin");
    setMarked((m) => new Set([...m, c.id]));
  }
  function again() {
    setGame(loteriaGame(rngFor(play, false)));
    setCalled(0); setMarked(new Set()); setWrong(0); setShake(null); setEnded(false); setRound((r) => r + 1);
  }

  return (
    <section aria-labelledby="g-loteria" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-loteria" className="text-3xl">Lotería de Mochito</h2>
      <p className="text-muted-foreground">Mochito canta las cartas. Si la tienes en tu tabla, márcala; puedes marcar también las que ya cantó. ¡Llena toda tu tabla!</p>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
        <span>Marcadas: <span className="tabular-nums">{marked.size} de {LOTERIA_BOARD}</span></span>
        <span>Cantadas: <span className="tabular-nums">{called} de {game.calls.length}</span></span>
        <span className="text-destructive">Errores: <span className="tabular-nums">{wrong}</span></span>
      </div>
      <div className="flex items-center gap-3 rounded-[2rem] bg-secondary/60 p-3">
        <span className="h-20 shrink-0"><MochitoFigure outfit={profile.mochito_outfit} /></span>
        {current ? (
          <motion.div key={current.id} className="flex min-w-0 flex-1 items-center gap-3" initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ duration: 0.25, ease: EASE_OUT }}>
            <span className="flex h-24 w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-xl border-4 border-[#f2e3c6] bg-card shadow"><CardFace card={current} outfit={profile.mochito_outfit} /></span>
            <p aria-live="polite" className="min-w-0 flex-1 rounded-3xl rounded-bl-md bg-card px-3 py-2 text-sm font-semibold leading-snug">{current.verse}</p>
          </motion.div>
        ) : (
          <p className="text-sm font-semibold">¡Corre y se va! Ya empiezo a cantar…</p>
        )}
      </div>
      <ul className="grid grid-cols-4 gap-2 rounded-[1.5rem] border-4 border-[#f2e3c6] bg-[#fffaf0] p-2 dark:bg-card">
        {game.board.map((c) => {
          const on = marked.has(c.id);
          const shook = shake?.id === c.id && !reduce;
          return (
            <li key={`${round}-${c.id}`}>
              <motion.button
                key={shook ? `s${shake!.n}` : "q"}
                type="button"
                onClick={() => mark(c)}
                aria-label={`${c.name}${on ? ", marcada" : ""}`}
                aria-pressed={on}
                initial={false}
                animate={shook ? { transform: ["translateX(0px)", "translateX(-5px)", "translateX(5px)", "translateX(0px)"] } : undefined}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                className="relative flex aspect-[3/4] w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-border bg-card active:scale-[0.97]"
              >
                <CardFace card={c} outfit={profile.mochito_outfit} />
                <span className="absolute inset-x-0 bottom-0 truncate bg-card/90 px-1 text-[10px] font-semibold leading-4">{c.name}</span>
                {on && <span aria-hidden className="absolute inset-0 flex items-center justify-center"><span className="size-9 rounded-full border-4 border-[#a8703f] bg-[#c9965f]/80 shadow" /></span>}
              </motion.button>
            </li>
          );
        })}
      </ul>
      {over ? (
        <Result game="loteria" play={play} score={loteriaScore(marked.size, wrong)} onAgain={again} onExit={onExit} detail={full ? `¡Lotería! Llenaste tu tabla con ${wrong} ${wrong === 1 ? "error" : "errores"}.` : `Marcaste ${marked.size} de ${LOTERIA_BOARD}. Mochito dice: «¡La próxima llenamos la tabla!»`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}
