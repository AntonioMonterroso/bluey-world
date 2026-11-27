"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Anchor, Apple, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bell, Bike, Bird, Bone, Cake, Car, Carrot, Cat, Cookie, Crown, Dog, Drum, Fish, Flower2, Gift, Guitar, Heart, House, Key,
  Rabbit, Rocket, Sailboat, Shirt, Snail, Star, TreePine, Turtle, Umbrella,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MochitoFigure } from "@/components/mochito-figure";
import { REGIONS } from "@/components/mochito-games-7";
import { PuppyArt } from "@/components/puppy-art";
import { DEFAULT_PLAY, Result, rngFor, type Play } from "@/components/mini-games";
import { useProfile } from "@/lib/db/profile";
import { mochitoDo } from "@/lib/mochito-actions";
import { groomActive } from "@/lib/mochito-extra";
import {
  CAN_H, CAN_W, DRUMS, DRUM_GOAL, SHADOW_ROUNDS, TRAIN_GOAL, aimX, aimY, ballX, bolosScore, bolosSpec, bowlKnock, bumped, canHit, canSettle, canTower, canTurn, drumScore, drumSeq,
  drumSpec, inGutter, latasScore, latasSpec, numbersScore, pinRack, shadowRound, shadowScore, sweep, trainBone, trainScore, trainSpec, trainStart, trainStep, type Dir4, type Train,
} from "@/lib/mochito-extra-2";
import { FRIENDS } from "@/lib/mochito-play";
import { drum, sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function useLook() {
  const { profile } = useProfile();
  const [now] = useState(() => Date.now());
  return { outfit: profile.mochito_outfit, groom: groomActive(profile.mochito_groom, now) ? profile.mochito_groom : null };
}

/** Un reloj que avanza mientras `on` (para las miras que van y vienen). */
function useClock(on: boolean) {
  const [t, setT] = useState(0);
  const t0 = useRef(0);
  useEffect(() => {
    if (!on) return;
    t0.current = Date.now();
    const id = setInterval(() => setT(Date.now() - t0.current), 30);
    return () => clearInterval(id);
  }, [on]);
  return { t, since: () => Date.now() - t0.current };
}

// ---------- Colorea por números ----------

const INK = "#3a2a22";
const sw = { stroke: INK, strokeWidth: 2.6, strokeLinejoin: "round" as const };
type NPic = { name: string; palette: { name: string; hex: string }[]; regions: { id: string; name: string; n: number; at: [number, number]; el: (f: string) => React.ReactElement }[]; overlay?: React.ReactElement };

const MOCHITO_N: Record<string, [number, [number, number]]> = {
  cielo: [1, [60, 40]], sol: [2, [248, 52]], pasto: [3, [40, 278]], cola: [4, [60, 154]], anca: [4, [70, 242]], cuerpo: [4, [78, 206]], mancha: [5, [104, 197]],
  "pata-1": [4, [123, 252]], "pata-2": [4, [153, 252]], collar: [6, [137, 172]], cabeza: [4, [164, 90]], "oreja-1": [5, [119, 126]], "oreja-2": [5, [209, 122]],
  hocico: [7, [191, 145]], nariz: [8, [170, 130]], placa: [2, [161, 187]], pelota: [6, [246, 251]],
};
const PICS: NPic[] = [
  {
    name: "Mochito en el parque",
    palette: [
      { name: "Celeste", hex: "#9fd3f2" }, { name: "Amarillo", hex: "#f6c744" }, { name: "Verde", hex: "#7cc576" }, { name: "Café claro", hex: "#d9a066" },
      { name: "Café oscuro", hex: "#8a5a2e" }, { name: "Rojo", hex: "#e0533c" }, { name: "Crema", hex: "#f6e2bf" }, { name: "Negro", hex: "#3a2a22" },
    ],
    regions: REGIONS.map((r) => ({ id: r.id, name: r.name, n: MOCHITO_N[r.id][0], at: MOCHITO_N[r.id][1], el: r.el })),
    overlay: (
      <g pointerEvents="none">
        <path d="M226 240 Q246 252 268 244 M232 266 Q246 254 262 268" stroke={INK} strokeWidth="2" fill="none" />
        <circle cx="150" cy="110" r="5.5" fill={INK} /><circle cx="186" cy="110" r="5.5" fill={INK} />
        <path d="M170 135 V146 M160 147 Q170 156 180 147" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  {
    name: "Su casita",
    palette: [
      { name: "Celeste", hex: "#9fd3f2" }, { name: "Amarillo", hex: "#f6c744" }, { name: "Verde", hex: "#7cc576" }, { name: "Rojo", hex: "#d6453d" },
      { name: "Café", hex: "#8a5a2e" }, { name: "Crema", hex: "#f6e2bf" }, { name: "Azul", hex: "#3f74c4" },
    ],
    regions: [
      { id: "cielo", name: "El cielo", n: 1, at: [36, 40], el: (f) => <rect x="0" y="0" width="300" height="205" fill={f} /> },
      { id: "sol", name: "El sol", n: 2, at: [250, 52], el: (f) => <circle cx="250" cy="50" r="24" fill={f} {...sw} /> },
      { id: "pasto", name: "El pasto", n: 3, at: [32, 280], el: (f) => <path d="M0 200 Q150 186 300 200 V300 H0 Z" fill={f} {...sw} /> },
      { id: "camino", name: "El caminito", n: 6, at: [160, 285], el: (f) => <path d="M128 300 L142 230 L158 230 L192 300 Z" fill={f} {...sw} /> },
      { id: "chimenea", name: "La chimenea", n: 5, at: [199, 90], el: (f) => <rect x="190" y="70" width="18" height="40" fill={f} {...sw} /> },
      { id: "pared", name: "La pared", n: 6, at: [96, 214], el: (f) => <rect x="70" y="122" width="160" height="108" fill={f} {...sw} /> },
      { id: "techo", name: "El techo", n: 4, at: [150, 104], el: (f) => <path d="M56 126 L150 58 L244 126 Z" fill={f} {...sw} /> },
      { id: "puerta", name: "La puerta", n: 5, at: [150, 204], el: (f) => <path d="M134 230 V186 Q150 170 166 186 V230 Z" fill={f} {...sw} /> },
      { id: "ventana-1", name: "Una ventana", n: 7, at: [104, 158], el: (f) => <rect x="88" y="142" width="32" height="30" rx="3" fill={f} {...sw} /> },
      { id: "ventana-2", name: "La otra ventana", n: 7, at: [196, 158], el: (f) => <rect x="180" y="142" width="32" height="30" rx="3" fill={f} {...sw} /> },
      { id: "tronco", name: "El tronco", n: 5, at: [259, 208], el: (f) => <rect x="252" y="176" width="14" height="50" fill={f} {...sw} /> },
      { id: "copa", name: "El árbol", n: 3, at: [259, 152], el: (f) => <circle cx="259" cy="152" r="28" fill={f} {...sw} /> },
    ],
  },
];

/** Colorea por números: cada número es un color. Si te equivocas de número, no se pinta. */
export function NumbersGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const [pic, setPic] = useState(() => Math.floor(rngFor(play, true)() * PICS.length) % PICS.length);
  const P = PICS[pic];
  const [color, setColor] = useState(1);
  const [fills, setFills] = useState<Record<string, number>>({});
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState<{ id: string; k: number } | null>(null);
  const [msg, setMsg] = useState("");
  const done = P.regions.every((r) => fills[r.id]);
  const hint = play.level === "facil";
  const weight = play.level === "dificil" ? 1.5 : 1;

  useEffect(() => { if (done) void mochitoDo("game", { game: "Colorea por números" }); }, [done]);

  function paint(id: string, n: number) {
    if (fills[id] || done) return;
    if (n !== color) {
      setMistakes((m) => m + 1);
      setShake((x) => ({ id, k: (x?.k ?? 0) + 1 }));
      setMsg(`Esa parte lleva el ${n}, y tienes el ${color}.`);
      sfx("sad");
      return;
    }
    setMsg("");
    setFills((f) => ({ ...f, [id]: n }));
    sfx("click");
  }
  function again() { setPic((p) => (p + 1) % PICS.length); setFills({}); setMistakes(0); setMsg(""); setColor(1); }
  const left = P.regions.filter((r) => !fills[r.id] && r.n === color).length;

  return (
    <section aria-labelledby="g-numeros" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-numeros" className="text-3xl">Colorea por números</h2>
      <p className="text-muted-foreground">Elige un número y pinta las partes que lo tienen. {hint ? "En fácil se marcan las partes del número que elegiste." : "Si te equivocas de número, no se pinta."}</p>
      <p className="text-sm font-semibold" aria-live="polite">{P.name} · {Object.keys(fills).length} de {P.regions.length} partes{mistakes ? ` · ${mistakes} ${mistakes === 1 ? "error" : "errores"}` : ""}{!done && left === 0 && Object.keys(fills).length ? " · ya pintaste todo ese número, elige otro" : ""}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Números y colores">
        {P.palette.map((c, k) => (
          <button key={c.hex} type="button" role="radio" aria-checked={color === k + 1} aria-label={`${k + 1}: ${c.name}`} onClick={() => setColor(k + 1)} className={cn("flex size-12 items-center justify-center rounded-full border-4 font-heading text-lg active:scale-[0.97]", color === k + 1 ? "border-primary" : "border-card shadow")} style={{ background: c.hex, color: k + 1 === 8 || c.name === "Azul" || c.name.startsWith("Café") ? "#fff" : INK }}>{k + 1}</button>
        ))}
      </div>
      <svg viewBox="0 0 300 300" className="aspect-square w-full max-w-md rounded-3xl border-4 border-[#f2e3c6] bg-white" role="group" aria-label="Dibujo para colorear por números">
        {P.regions.map((r) => {
          const f = fills[r.id];
          const on = hint && !f && r.n === color;
          return (
            <motion.g
              key={`${r.id}-${shake?.id === r.id ? shake.k : 0}`}
              role="button"
              tabIndex={0}
              aria-label={`${r.name}, número ${r.n}${f ? ", pintada" : ""}`}
              onClick={() => paint(r.id, r.n)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); paint(r.id, r.n); } }}
              className="cursor-pointer outline-none focus-visible:opacity-80"
              animate={shake?.id === r.id && !reduce ? { transform: ["translateX(0px)", "translateX(-3px)", "translateX(3px)", "translateX(0px)"] } : undefined}
              transition={{ duration: 0.25, ease: EASE_OUT }}
            >
              {r.el(f ? P.palette[f - 1].hex : on ? "#fff4c2" : "#ffffff")}
            </motion.g>
          );
        })}
        {P.overlay}
        <g pointerEvents="none">
          {P.regions.filter((r) => !fills[r.id]).map((r) => (
            <text key={r.id} x={r.at[0]} y={r.at[1] + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#6b5b52">{r.n}</text>
          ))}
        </g>
      </svg>
      {msg && !done && <p className="text-sm font-semibold text-destructive" role="alert">{msg}</p>}
      {done ? (
        <Result game="numeros" play={play} score={numbersScore(mistakes * weight, P.regions.length)} onAgain={again} onExit={onExit} detail={`¡Quedó igualito! Pintaste las ${P.regions.length} partes${mistakes ? ` con ${mistakes} ${mistakes === 1 ? "error" : "errores"}` : " sin un solo error"}.`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}

// ---------- Parejas de sombras ----------

const THINGS = [
  { name: "hueso", Icon: Bone, c: "#f2e3c6" }, { name: "perrito", Icon: Dog, c: "#d9a066" }, { name: "pescado", Icon: Fish, c: "#6fb3e0" }, { name: "galleta", Icon: Cookie, c: "#e0b07a" },
  { name: "manzana", Icon: Apple, c: "#e0533c" }, { name: "zanahoria", Icon: Carrot, c: "#f08a24" }, { name: "paraguas", Icon: Umbrella, c: "#9b7fd1" }, { name: "corona", Icon: Crown, c: "#f6c744" },
  { name: "pajarito", Icon: Bird, c: "#7cc6f2" }, { name: "gato", Icon: Cat, c: "#c9a27a" }, { name: "flor", Icon: Flower2, c: "#e27aa3" }, { name: "casa", Icon: House, c: "#c8473d" },
  { name: "pino", Icon: TreePine, c: "#4a9a5b" }, { name: "carro", Icon: Car, c: "#3f74c4" }, { name: "estrella", Icon: Star, c: "#f6c744" }, { name: "corazón", Icon: Heart, c: "#e2457a" },
  { name: "regalo", Icon: Gift, c: "#5bb06a" }, { name: "pastel", Icon: Cake, c: "#f28ab2" }, { name: "bici", Icon: Bike, c: "#d6453d" }, { name: "camisa", Icon: Shirt, c: "#4fb3a9" },
  { name: "conejo", Icon: Rabbit, c: "#e9d3c0" }, { name: "ancla", Icon: Anchor, c: "#5b6b8a" }, { name: "llave", Icon: Key, c: "#d9a53a" }, { name: "campana", Icon: Bell, c: "#f6c744" },
  { name: "barquito", Icon: Sailboat, c: "#3f74c4" }, { name: "cohete", Icon: Rocket, c: "#d6453d" }, { name: "caracol", Icon: Snail, c: "#e9b9a0" }, { name: "tortuga", Icon: Turtle, c: "#5bb06a" }, { name: "guitarra", Icon: Guitar, c: "#a8703f" },
];

/** Une cada cosa con su sombra: toca la cosa y luego su sombra. */
export function ShadowGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const [rnd, setRnd] = useState(() => rngFor(play, true));
  const [round, setRound] = useState(0);
  const [cur, setCur] = useState(() => shadowRound(rnd, play.level, THINGS.length));
  const [sel, setSel] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [total, setTotal] = useState(0);
  const [bad, setBad] = useState<{ i: number; k: number } | null>(null);
  const [over, setOver] = useState(false);
  const roundDone = matched.length === cur.items.length;

  useEffect(() => { if (over) void mochitoDo("game", { game: "Parejas de sombras" }); }, [over]);

  function tapShadow(i: number) {
    if (sel === null || matched.includes(i)) return;
    if (i === sel) {
      setMatched((m) => [...m, i]);
      setSel(null);
      setTotal((t) => t + 1);
      sfx("coin");
    } else {
      setMistakes((m) => m + 1);
      setBad((x) => ({ i, k: (x?.k ?? 0) + 1 }));
      sfx("sad");
    }
  }
  function next() {
    if (round + 1 >= SHADOW_ROUNDS) { setOver(true); return; }
    setRound((r) => r + 1);
    setCur(shadowRound(rnd, play.level, THINGS.length));
    setMatched([]);
    setSel(null);
  }
  function again() { const r = rngFor(play, false); setRnd(() => r); setRound(0); setCur(shadowRound(r, play.level, THINGS.length)); setMatched([]); setSel(null); setMistakes(0); setTotal(0); setOver(false); }

  return (
    <section aria-labelledby="g-sombras" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-sombras" className="text-3xl">Parejas de sombras</h2>
      <p className="text-muted-foreground">Toca una cosa de arriba y luego su sombra. {cur.shadows.length > cur.items.length ? "Ojo: hay sombras de más que no son de nadie." : ""}</p>
      <p className="text-sm font-semibold" aria-live="polite">Ronda {Math.min(round + 1, SHADOW_ROUNDS)} de {SHADOW_ROUNDS} · {matched.length} de {cur.items.length} parejas{mistakes ? ` · ${mistakes} ${mistakes === 1 ? "error" : "errores"}` : ""}</p>
      {!over && (
        <>
          <div className="flex flex-wrap justify-center gap-3" role="group" aria-label="Cosas">
            {cur.items.map((i) => {
              const T = THINGS[i];
              const done = matched.includes(i);
              return (
                <button key={i} type="button" disabled={done} aria-pressed={sel === i} aria-label={T.name} onClick={() => { setSel(i); sfx("click"); }} className={cn("flex size-20 items-center justify-center rounded-3xl border-4 bg-card active:scale-[0.97]", sel === i ? "border-primary" : done ? "border-[#5bb06a] opacity-50" : "border-border")}>
                  <T.Icon className="size-12" style={{ color: "#3a2a22" }} fill={T.c} strokeWidth={1.6} aria-hidden />
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap justify-center gap-3 rounded-3xl bg-secondary/60 p-3" role="group" aria-label="Sombras">
            {cur.shadows.map((i) => {
              const T = THINGS[i];
              const done = matched.includes(i);
              return (
                <motion.button
                  key={`${i}-${bad?.i === i ? bad.k : 0}`}
                  type="button"
                  disabled={done || sel === null}
                  aria-label={done ? `Sombra de ${T.name}, ya unida` : "Una sombra"}
                  onClick={() => tapShadow(i)}
                  className={cn("flex size-20 items-center justify-center rounded-3xl border-4 bg-[#eef0f4] active:scale-[0.97] dark:bg-slate-700", done ? "border-[#5bb06a]" : "border-transparent")}
                  animate={bad?.i === i && !reduce ? { transform: ["translateX(0px)", "translateX(-6px)", "translateX(6px)", "translateX(0px)"] } : undefined}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                >
                  {done ? <T.Icon className="size-12" style={{ color: "#3a2a22" }} fill={T.c} strokeWidth={1.6} aria-hidden /> : <T.Icon className="size-12" style={{ color: "#2b2b33" }} fill="#2b2b33" strokeWidth={2.6} aria-hidden />}
                </motion.button>
              );
            })}
          </div>
          {roundDone ? (
            <Button className="h-12 w-fit rounded-2xl px-6 text-base" onClick={next}>{round + 1 >= SHADOW_ROUNDS ? "Ver resultado" : "Siguiente ronda"}</Button>
          ) : (
            <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
          )}
        </>
      )}
      {over && <Result game="sombras" play={play} score={shadowScore(mistakes, total)} onAgain={again} onExit={onExit} detail={`Uniste ${total} parejas${mistakes ? ` con ${mistakes} ${mistakes === 1 ? "error" : "errores"}` : " sin equivocarte"}. Mochito dice: «¡Yo también tengo sombra y me sigue a todos lados!»`} />}
    </section>
  );
}

// ---------- Tumba latas ----------

const CAN_COLORS = ["#d6453d", "#3f74c4", "#f6c744", "#5bb06a", "#e27aa3", "#f08a24"];
type CanPhase = "x" | "y" | "vuela" | "visto";

/** Apunta (de lado y de alto) y lanza la pelota para tumbar la torre. Cada torre tiene unas cuantas pelotas. */
export function CansGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const look = useLook();
  const spec = latasSpec(play.level);
  const cans = canTower(spec.rows);
  const [tower, setTower] = useState(0);
  const [up, setUp] = useState(() => cans.map(() => true));
  const [balls, setBalls] = useState(spec.balls);
  const [phase, setPhase] = useState<CanPhase>("x");
  const [ax, setAx] = useState(0.5);
  const [ay, setAy] = useState(0.05);
  const [down, setDown] = useState(0);
  const [msg, setMsg] = useState("");
  const [over, setOver] = useState(false);
  const clock = useClock(phase === "x" || phase === "y");
  const s = sweep(clock.t, spec.period);
  const liveX = phase === "x" ? aimX(s) : ax;
  const liveY = phase === "y" ? aimY(s, spec.rows) : spec.vertical ? ay : CAN_H / 2;
  const standing = up.filter(Boolean).length;

  useEffect(() => { if (over) void mochitoDo("game", { game: "Tumba latas" }); }, [over]);

  function fix() {
    if (phase === "x") {
      const x = aimX(sweep(clock.since(), spec.period));
      setAx(x);
      sfx("click");
      if (spec.vertical) { setPhase("y"); return; }
      throwAt(x, CAN_H / 2);
    } else if (phase === "y") {
      const y = aimY(sweep(clock.since(), spec.period), spec.rows);
      setAy(y);
      throwAt(ax, y);
    }
  }
  function throwAt(x: number, y: number) {
    setPhase("vuela");
    setAy(y);
    sfx("click");
    setTimeout(() => {
      const hit = canHit(cans, up, x, y);
      if (hit === null) { setMsg("¡Fallaste! Pasó de largo."); sfx("sad"); }
      else {
        const after = canSettle(cans, up.map((v, i) => v && i !== hit));
        const n = up.filter(Boolean).length - after.filter(Boolean).length;
        setUp(after);
        setDown((d) => d + n);
        setMsg(n >= 3 ? `¡Pum! Tumbaste ${n} latas de un golpe.` : n === 1 ? "¡Una lata menos!" : `¡Tumbaste ${n} latas!`);
        sfx(n >= 3 ? "cash" : "coin");
      }
      setBalls((b) => b - 1);
      setPhase("visto");
    }, reduce ? 100 : 450);
  }
  function next() {
    setMsg("");
    if (standing > 0 && balls > 0) { setPhase("x"); return; }
    if (tower + 1 >= spec.towers) { setOver(true); return; }
    setTower((t) => t + 1);
    setUp(cans.map(() => true));
    setBalls(spec.balls);
    setPhase("x");
  }
  function again() { setTower(0); setUp(cans.map(() => true)); setBalls(spec.balls); setDown(0); setMsg(""); setPhase("x"); setOver(false); }
  const toPct = (y: number) => 14 + (y / CAN_H) * (10 / 70) * 100;

  return (
    <section aria-labelledby="g-latas" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-latas" className="text-3xl">Tumba latas</h2>
      <p className="text-muted-foreground">La mira va y viene: toca «Fijar» para apuntar {spec.vertical ? "de lado y luego de alto" : "de lado"}. Si le pegas a una lata de abajo, se caen las de arriba.</p>
      <p className="text-sm font-semibold" aria-live="polite">Torre {Math.min(tower + 1, spec.towers)} de {spec.towers} · Pelotas: {balls} · Latas tumbadas: {down}</p>
      <div className="relative aspect-[10/7] w-full select-none overflow-hidden rounded-[2rem] bg-gradient-to-b from-sky-100 to-lime-100 dark:from-sky-950 dark:to-lime-950">
        <div className="absolute inset-x-[8%] bottom-[6%] h-[8%] rounded-t-xl bg-[#a8703f]" aria-hidden />
        {cans.map((k, i) => (
          <motion.span
            key={`${tower}-${i}`}
            className="absolute block rounded-md border-2 border-black/20"
            style={{ left: `${(k.x - CAN_W / 2) * 100 + 0.5}%`, width: `${CAN_W * 100 - 1}%`, bottom: `${toPct(k.y)}%`, height: `${(10 / 70) * 100}%`, background: `linear-gradient(90deg, ${CAN_COLORS[i % CAN_COLORS.length]} 0 70%, rgb(255 255 255 / 0.35) 70% 80%, ${CAN_COLORS[i % CAN_COLORS.length]} 80%)` }}
            initial={false}
            animate={up[i] ? { transform: "translateY(0px) rotate(0deg)", opacity: 1 } : reduce ? { opacity: 0.15 } : { transform: `translateY(${-30 - k.r * 10}px) translateX(${(i % 2 ? 1 : -1) * 30}px) rotate(${(i % 2 ? 1 : -1) * 100}deg)`, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            aria-hidden
          />
        ))}
        {(phase === "x" || phase === "y") && (
          <>
            <span className="absolute inset-y-[10%] w-0.5 -translate-x-1/2 bg-primary/70" style={{ left: `${liveX * 100}%` }} aria-hidden />
            {phase === "y" && <span className="absolute inset-x-[8%] h-0.5 bg-primary/70" style={{ bottom: `${toPct(liveY)}%` }} aria-hidden />}
            <span className="absolute size-5 -translate-x-1/2 translate-y-1/2 rounded-full border-4 border-primary" style={{ left: `${liveX * 100}%`, bottom: `${toPct(liveY)}%` }} aria-hidden />
          </>
        )}
        {phase === "vuela" && (
          <motion.span className="absolute size-6 -translate-x-1/2 rounded-full bg-[#f6f0e4] shadow" style={{ left: `${ax * 100}%`, bottom: `${toPct(liveY)}%` }} initial={reduce ? false : { transform: "translateY(120px) scale(1.6)" }} animate={{ transform: "translateY(0px) scale(1)" }} transition={{ duration: 0.4, ease: EASE_OUT }} aria-hidden />
        )}
        <span className="absolute bottom-0 left-[2%] block h-[38%]" aria-hidden><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
        {msg && <p className="absolute right-3 top-3 max-w-[60%] rounded-3xl bg-card px-3 py-2 text-sm font-semibold shadow-sm">{msg}</p>}
      </div>
      {over ? (
        <Result game="latas" play={play} score={latasScore(down, cans.length * spec.towers)} onAgain={again} onExit={onExit} detail={`Tumbaste ${down} de ${cans.length * spec.towers} latas. Mochito trajo todas las pelotas de regreso.`} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {phase === "x" || phase === "y" ? (
            <Button className="h-14 rounded-2xl px-8 text-base" onClick={fix}>{phase === "x" ? (spec.vertical ? "Fijar de lado" : "¡Lanzar!") : "Fijar de alto y lanzar"}</Button>
          ) : phase === "visto" ? (
            <Button className="h-14 rounded-2xl px-8 text-base" onClick={next}>{standing > 0 && balls > 0 ? "Otra pelota" : tower + 1 >= spec.towers ? "Ver resultado" : standing === 0 ? "¡Torre tumbada! Siguiente" : "Siguiente torre"}</Button>
          ) : null}
          <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Bolos ----------

type BowlPhase = "apunta" | "efecto" | "fuerza" | "rueda" | "visto";

/** Boliche en el parque: apunta, elige el efecto y la fuerza. Dos tiros por turno. */
export function BowlingGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const spec = bolosSpec(play.level);
  const pins = pinRack(spec.rows);
  const lane = useRef<HTMLDivElement>(null);
  const [rnd, setRnd] = useState(() => rngFor(play, true));
  const [frame, setFrame] = useState(0);
  const [roll, setRoll] = useState(0);
  const [up, setUp] = useState(() => pins.map(() => true));
  const [phase, setPhase] = useState<BowlPhase>("apunta");
  const [x0, setX0] = useState(0.5);
  const [curve, setCurve] = useState(0);
  const [path, setPath] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [msg, setMsg] = useState("");
  const [over, setOver] = useState(false);
  const clock = useClock(phase === "apunta" || phase === "fuerza");
  const s = sweep(clock.t, spec.period);
  const aim = 0.2 + s * 0.6;

  useEffect(() => { if (over) void mochitoDo("game", { game: "Bolos en el parque" }); }, [over]);

  function fixAim() { setX0(0.2 + sweep(clock.since(), spec.period) * 0.6); setPhase("efecto"); sfx("click"); }
  function pickCurve(c: number) { setCurve(c); setPhase("fuerza"); sfx("click"); }
  function bowl() {
    const power = sweep(clock.since(), spec.period);
    const b = bumped(x0, curve, spec.bumpers);
    const r = lane.current?.getBoundingClientRect();
    const w = r?.width ?? 300;
    const h = r?.height ?? 500;
    const pts: string[] = [];
    let gutter = false;
    for (let y = 0; y <= 1.0001; y += 0.1) {
      let x = ballX(b.x0, b.curve, y);
      if (!spec.bumpers && inGutter(x)) gutter = true;
      if (gutter) x = x < 0.5 ? 0.04 : 0.96;
      pts.push(`translate(${(x - b.x0) * w}px, ${-y * h * 0.92}px)`);
    }
    setPath(pts);
    setPhase("rueda");
    sfx("click");
    const knocked = bowlKnock(pins, up, b.x0, b.curve, power, rnd);
    setTimeout(() => {
      const next = up.map((v, i) => v && !knocked.includes(i));
      setUp(next);
      setTotal((t) => t + knocked.length);
      const all = next.every((v) => !v);
      setMsg(all && roll === 0 ? "¡CHUZA! Todos los pinos de un tiro." : all ? "¡Semipleno! Tumbaste los que quedaban." : knocked.length === 0 ? (gutter ? "Se fue al canal." : "No tumbó ninguno.") : `Tumbaste ${knocked.length} ${knocked.length === 1 ? "pino" : "pinos"}.`);
      sfx(all ? "cash" : knocked.length ? "coin" : "sad");
      setPhase("visto");
    }, reduce ? 150 : 1100);
  }
  function next() {
    setMsg("");
    const cleared = up.every((v) => !v);
    if (roll === 0 && !cleared) { setRoll(1); setPhase("apunta"); return; }
    if (frame + 1 >= spec.frames) { setOver(true); return; }
    setFrame((f) => f + 1); setRoll(0); setUp(pins.map(() => true)); setPhase("apunta");
  }
  function again() { setRnd(() => rngFor(play, false)); setFrame(0); setRoll(0); setUp(pins.map(() => true)); setTotal(0); setMsg(""); setPhase("apunta"); setOver(false); }

  return (
    <section aria-labelledby="g-bolos" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-bolos" className="text-3xl">Bolos en el parque</h2>
      <p className="text-muted-foreground">Primero fija dónde sale la bola, luego elige el efecto (curva) y al final la fuerza. Con más fuerza, los pinos se tumban unos a otros.{spec.bumpers ? " En fácil hay barreras: la bola no cae al canal." : ""}</p>
      <p className="text-sm font-semibold" aria-live="polite">Turno {Math.min(frame + 1, spec.frames)} de {spec.frames} · Tiro {roll + 1} de 2 · Pinos tumbados: {total}</p>
      <div className="mx-auto flex w-full max-w-xs flex-col gap-2">
        <div ref={lane} className="relative aspect-[3/5] w-full select-none overflow-hidden rounded-[1.5rem] border-x-[10px] border-[#8a8f98] bg-[repeating-linear-gradient(90deg,#e8c592_0_12px,#dfb57d_12px_24px)] dark:border-slate-600">
          {spec.bumpers && <><span className="absolute inset-y-0 left-0 w-1.5 bg-[#5bb06a]" aria-hidden /><span className="absolute inset-y-0 right-0 w-1.5 bg-[#5bb06a]" aria-hidden /></>}
          {pins.map((p, i) => (
            <motion.span
              key={`${frame}-${i}`}
              className="absolute block aspect-square w-[9%] -translate-x-1/2 translate-y-1/2"
              style={{ left: `${p.x * 100}%`, bottom: `${p.y * 100}%` }}
              initial={false}
              animate={up[i] ? { opacity: 1, transform: "translate(-50%, 50%) rotate(0deg)" } : reduce ? { opacity: 0.15 } : { opacity: 0, transform: `translate(-50%, 0%) rotate(${i % 2 ? 90 : -90}deg)` }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              aria-hidden
            >
              <svg viewBox="0 0 20 20" className="h-full w-full"><circle cx="10" cy="10" r="8.5" fill="#ffffff" stroke="rgb(0 0 0 / 0.3)" /><circle cx="10" cy="10" r="4" fill="#d6453d" /></svg>
            </motion.span>
          ))}
          {(phase === "apunta" || phase === "efecto" || phase === "fuerza") && (
            <>
              <span className="absolute bottom-[4%] block aspect-square w-[13%] -translate-x-1/2 rounded-full bg-[#3f74c4] shadow" style={{ left: `${(phase === "apunta" ? aim : x0) * 100}%` }} aria-hidden />
              {phase !== "apunta" && (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                  <path d={Array.from({ length: 11 }, (_, k) => `${k ? "L" : "M"}${ballX(x0, phase === "efecto" ? 0 : curve, k / 10) * 100} ${96 - (k / 10) * 92}`).join(" ")} stroke="rgb(255 255 255 / 0.8)" strokeWidth="0.8" strokeDasharray="2 2" fill="none" />
                </svg>
              )}
            </>
          )}
          {phase === "rueda" && (
            <motion.span
              className="absolute bottom-[4%] block aspect-square w-[13%] -translate-x-1/2 rounded-full bg-[#3f74c4] shadow"
              style={{ left: `${x0 * 100}%` }}
              initial={{ transform: path[0] }}
              animate={reduce ? { transform: path[path.length - 1] } : { transform: path }}
              transition={{ duration: reduce ? 0.1 : 1, ease: "linear" }}
              aria-hidden
            />
          )}
          {msg && <p className="absolute inset-x-3 top-3 rounded-3xl bg-card px-3 py-2 text-center text-sm font-semibold shadow-sm">{msg}</p>}
        </div>
        {phase === "fuerza" && (
          <div className="h-5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label="Fuerza" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(s * 100)}>
            <span className="block h-full bg-primary" style={{ width: `${s * 100}%` }} />
          </div>
        )}
      </div>
      {over ? (
        <Result game="bolos" play={play} score={bolosScore(total, pins.length * spec.frames)} onAgain={again} onExit={onExit} detail={`Tumbaste ${total} de ${pins.length * spec.frames} pinos. Mochito los volvió a parar todos con la nariz.`} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {phase === "apunta" && <Button className="h-14 rounded-2xl px-8 text-base" onClick={fixAim}>Fijar el lugar</Button>}
          {phase === "efecto" && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Efecto">
              <Button className="h-14 rounded-2xl px-5 text-base" onClick={() => pickCurve(-1)}><ArrowLeft className="size-5" aria-hidden /> Curva</Button>
              <Button className="h-14 rounded-2xl px-5 text-base" onClick={() => pickCurve(0)}><ArrowUp className="size-5" aria-hidden /> Derecho</Button>
              <Button className="h-14 rounded-2xl px-5 text-base" onClick={() => pickCurve(1)}>Curva <ArrowRight className="size-5" aria-hidden /></Button>
            </div>
          )}
          {phase === "fuerza" && <Button className="h-14 rounded-2xl px-8 text-base" onClick={bowl}>¡Tirar!</Button>}
          {phase === "visto" && <Button className="h-14 rounded-2xl px-8 text-base" onClick={next}>{roll === 0 && !up.every((v) => !v) ? "Segundo tiro" : frame + 1 >= spec.frames ? "Ver resultado" : "Siguiente turno"}</Button>}
          <Button variant="outline" className="ml-auto h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
        </div>
      )}
    </section>
  );
}

// ---------- Tren de huesos ----------

const KEY_DIR: Record<string, Dir4> = { ArrowUp: "arriba", ArrowDown: "abajo", ArrowLeft: "izq", ArrowRight: "der" };

/** Mochito avanza por el parque juntando huesos; por cada hueso se le suma un amiguito atrás. No choques. */
export function TrainGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const spec = trainSpec(play.level);
  const n = spec.n;
  const [rnd, setRnd] = useState(() => rngFor(play, true));
  const [train, setTrain] = useState<Train>(() => trainStart(n));
  const [bone, setBone] = useState(() => trainBone(rnd, n, trainStart(n).body));
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const want = useRef<Dir4[]>([]);
  const st = useRef({ train, bone });
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const won = train.bones >= TRAIN_GOAL;

  useEffect(() => { st.current = { train, bone }; }, [train, bone]);
  useEffect(() => { if (over) void mochitoDo("game", { game: "Tren de huesos" }); }, [over]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      let { train: t } = st.current;
      const { bone: b } = st.current;
      while (want.current.length) {
        const d = want.current.shift()!;
        if (canTurn(t.dir, d)) { t = { ...t, dir: d }; break; }
      }
      const r = trainStep(t, n, b, spec.wrap);
      st.current.train = r.train;
      setTrain(r.train);
      if (r.ate) {
        sfx("coin");
        const nb = trainBone(rnd, n, r.train.body);
        st.current.bone = nb;
        setBone(nb);
      }
      if (!r.train.alive || r.train.bones >= TRAIN_GOAL) { setRunning(false); setOver(true); sfx(r.train.alive ? "success" : "sad"); }
    }, spec.tick);
    return () => clearInterval(id);
  }, [running, n, spec.tick, spec.wrap, rnd]);

  function turn(d: Dir4) { if (!running && !over) setRunning(true); want.current = [...want.current, d].slice(-2); }
  function again() {
    const r = rngFor(play, false);
    setRnd(() => r);
    const t = trainStart(n);
    setTrain(t); setBone(trainBone(r, n, t.body)); want.current = []; setOver(false); setRunning(false);
  }
  const at = new Map(train.body.map((c, k) => [c, k]));

  return (
    <section aria-labelledby="g-tren" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-tren" className="text-3xl">Tren de huesos</h2>
      <p className="text-muted-foreground">Guía a Mochito con las flechas o deslizando el dedo. Cada hueso suma un amiguito al tren. {spec.wrap ? "En fácil puedes salir por un lado y entrar por el otro." : "No choques con las orillas"} ni con tu propio tren. Junta {TRAIN_GOAL} huesos.</p>
      <p className="text-sm font-semibold" aria-live="polite">Huesos: {train.bones} de {TRAIN_GOAL} · Amiguitos en el tren: {Math.max(0, train.body.length - 3)}</p>
      <div
        ref={board}
        tabIndex={0}
        role="application"
        aria-label="Parque del tren. Usa las flechas para mover a Mochito."
        onKeyDown={(e) => { const d = KEY_DIR[e.key]; if (d) { e.preventDefault(); turn(d); } }}
        onPointerDown={(e) => { swipe.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={(e) => {
          const s0 = swipe.current;
          swipe.current = null;
          if (!s0) return;
          const dx = e.clientX - s0.x;
          const dy = e.clientY - s0.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
          turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "der" : "izq") : dy > 0 ? "abajo" : "arriba");
        }}
        className="mx-auto grid aspect-square w-full max-w-md touch-none select-none gap-px overflow-hidden rounded-3xl border-4 border-[#5bb06a] bg-[#9fdcb4] outline-none focus-visible:ring-4 focus-visible:ring-ring/40 dark:bg-emerald-900"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: n * n }, (_, c) => {
          const k = at.get(c);
          return (
            <span key={c} className={cn("relative flex items-center justify-center", (Math.floor(c / n) + (c % n)) % 2 ? "bg-[#a9e2be] dark:bg-emerald-800" : "")} aria-hidden>
              {k === 0 ? (
                <span className={cn("flex size-[92%] items-center justify-center rounded-full bg-primary text-primary-foreground", !train.alive && "bg-destructive")}><Dog className="size-[70%]" /></span>
              ) : k !== undefined ? (
                k < 3 ? <span className="block size-[70%] rounded-full bg-primary/60" /> : <span className="block size-[96%]"><PuppyArt friend={FRIENDS[(k - 3) % FRIENDS.length]} /></span>
              ) : c === bone ? <Bone className="size-[80%] fill-[#f6f0e4] text-[#8a5a2e]" /> : null}
            </span>
          );
        })}
      </div>
      {over ? (
        <Result game="tren" play={play} score={trainScore(train.bones)} onAgain={again} onExit={onExit} detail={won ? `¡Juntaste los ${TRAIN_GOAL} huesos! El tren de amiguitos dio la vuelta al parque.` : `Juntaste ${train.bones} ${train.bones === 1 ? "hueso" : "huesos"} antes de chocar. Mochito dice: «¡Uy! Me distraje con una mariposa.»`} />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Flechas">
            <span />
            <button type="button" aria-label="Arriba" onClick={() => turn("arriba")} className="flex size-14 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><ArrowUp className="size-6" aria-hidden /></button>
            <span />
            <button type="button" aria-label="Izquierda" onClick={() => turn("izq")} className="flex size-14 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><ArrowLeft className="size-6" aria-hidden /></button>
            <button type="button" aria-label="Abajo" onClick={() => turn("abajo")} className="flex size-14 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><ArrowDown className="size-6" aria-hidden /></button>
            <button type="button" aria-label="Derecha" onClick={() => turn("der")} className="flex size-14 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><ArrowRight className="size-6" aria-hidden /></button>
          </div>
          <div className="flex flex-col gap-2">
            {!running && <Button className="h-12 rounded-2xl px-6 text-base" onClick={() => { setRunning(true); board.current?.focus(); }}>¡Arrancar!</Button>}
            <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
          </div>
        </div>
      )}
    </section>
  );
}

// ---------- Toca el tambor ----------

const DRUM_COLORS = [
  { name: "Rojo", hex: "#d6453d", lit: "#ff8a7a" }, { name: "Azul", hex: "#3f74c4", lit: "#8ab8ff" },
  { name: "Amarillo", hex: "#e3a72f", lit: "#ffe08a" }, { name: "Verde", hex: "#4a9a5b", lit: "#9ee0a8" },
];

/** Mochito toca una melodía en los tambores y tú la repites. Cada vez es una nota más larga. */
export function DrumGame({ onExit, play = DEFAULT_PLAY }: { onExit: () => void; play?: Play }) {
  const reduce = useReducedMotion();
  const look = useLook();
  const spec = drumSpec(play.level);
  const [rnd, setRnd] = useState(() => rngFor(play, true));
  const [seq, setSeq] = useState<number[]>(() => drumSeq(rnd, spec.start));
  const [lit, setLit] = useState<number | null>(null);
  const [turn, setTurn] = useState<"mochito" | "tu" | "fin">("mochito");
  const [pos, setPos] = useState(0);
  const [best, setBest] = useState(spec.start - 1);
  const [retries, setRetries] = useState(spec.retries);
  const [msg, setMsg] = useState("Escucha a Mochito…");
  const [round, setRound] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (turn !== "mochito") return;
    timers.current.forEach(clearTimeout);
    timers.current = [setTimeout(() => setLit(null), 120)];
    seq.forEach((d, k) => {
      timers.current.push(setTimeout(() => { setLit(d); drum(d); }, 700 + k * spec.gap));
      timers.current.push(setTimeout(() => setLit(null), 700 + k * spec.gap + spec.gap * 0.6));
    });
    timers.current.push(setTimeout(() => { setTurn("tu"); setPos(0); setMsg("¡Tu turno! Repite la melodía."); }, 700 + seq.length * spec.gap));
  }, [turn, seq, spec.gap, round]);
  useEffect(() => { if (turn === "fin") void mochitoDo("game", { game: "Toca el tambor" }); }, [turn]);

  function hit(d: number) {
    if (turn !== "tu") return;
    drum(d);
    setLit(d);
    timers.current.push(setTimeout(() => setLit((x) => (x === d ? null : x)), 180));
    if (seq[pos] !== d) {
      if (retries > 0) { setRetries((r) => r - 1); setMsg("¡Uy! Esa no era. Escucha otra vez."); sfx("sad"); setTurn("mochito"); setRound((r) => r + 1); return; }
      setMsg("Esa no era. ¡Pero qué bien tocaste!"); sfx("sad"); setTurn("fin"); return;
    }
    if (pos + 1 < seq.length) { setPos((p) => p + 1); return; }
    const len = seq.length;
    setBest(len);
    if (len >= DRUM_GOAL) { setMsg("¡Tocaste la melodía completa! Eres músico."); setTurn("fin"); sfx("success"); return; }
    setMsg(`¡Bien! ${len} notas. Ahora una más…`);
    sfx("coin");
    setSeq((s) => [...s, Math.floor(rnd() * DRUMS) % DRUMS]);
    setTurn("mochito");
  }
  function again() {
    const r = rngFor(play, false);
    setRnd(() => r);
    setSeq(drumSeq(r, spec.start)); setBest(spec.start - 1); setRetries(spec.retries); setMsg("Escucha a Mochito…"); setTurn("mochito"); setRound((r) => r + 1);
  }

  return (
    <section aria-labelledby="g-tambor" className="flex max-w-2xl flex-col gap-4">
      <h2 id="g-tambor" className="text-3xl">Toca el tambor</h2>
      <p className="text-muted-foreground">Mochito toca una melodía en los tambores de colores. Cuando termine, repítela en el mismo orden. Cada vez que aciertas, se alarga una nota.{spec.retries ? ` Si te equivocas, la vuelve a tocar (${spec.retries === 1 ? "una vez" : `${spec.retries} veces`}).` : ""}</p>
      <p className="text-sm font-semibold" aria-live="polite">{msg} · Notas: {seq.length}{turn === "tu" ? ` · Vas en la ${pos + 1}` : ""}</p>
      <div className="flex items-end gap-4">
        <motion.span className="block h-28 shrink-0" initial={false} animate={lit !== null && turn === "mochito" && !reduce ? { transform: ["translateY(0px)", "translateY(-8px)", "translateY(0px)"] } : undefined} transition={{ duration: 0.25, ease: EASE_OUT }} aria-hidden>
          <MochitoFigure outfit={look.outfit} groom={look.groom} />
        </motion.span>
        <div className="grid flex-1 grid-cols-2 gap-3" role="group" aria-label="Tambores">
          {DRUM_COLORS.map((c, d) => (
            <button
              key={c.name}
              type="button"
              aria-label={`Tambor ${c.name.toLowerCase()}`}
              disabled={turn !== "tu"}
              onPointerDown={(e) => { e.preventDefault(); hit(d); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hit(d); } }}
              className="flex aspect-square items-center justify-center rounded-full border-8 border-[#f2e3c6] shadow transition-[background-color] duration-100 active:scale-[0.97] disabled:cursor-default"
              style={{ background: lit === d ? c.lit : c.hex }}
            >
              <Drum className="size-1/2 text-white/80" aria-hidden />
            </button>
          ))}
        </div>
      </div>
      {turn === "fin" ? (
        <Result game="tambor" play={play} score={drumScore(best, spec.start)} onAgain={again} onExit={onExit} detail={`Tu melodía más larga fue de ${Math.max(0, best)} notas. Mochito movió la cola al ritmo todo el tiempo.`} />
      ) : (
        <Button variant="outline" className="h-12 w-fit rounded-2xl px-6 text-base" onClick={onExit}>Salir</Button>
      )}
    </section>
  );
}
