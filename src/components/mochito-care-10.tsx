"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Egg, Milk, Sparkles, Star, Telescope, Waves } from "lucide-react";
import { MochitoFigure } from "@/components/mochito-figure";
import { finishCarWash, finishFarm, finishNight, finishPool } from "@/lib/mochito-actions";
import {
  CAR_TOOLS, FARM_FOODS, FARM_FOOD_IDS, FLOATIES, LENS_R, MILK_TAPS, MOON_PHASES, NESTS, POOL_START, RINGS, SCRUBS, SHOOTING_MS, SKY_H, SKY_IDS, SKY_THINGS, SKY_W,
  boardPos, skyName, carDone, carOf, diveStars, eggsOf, farmOf, inLens, moonLit, moonPhase, poolAir, ringsOf, shootingOf, skyOf, swimCost, washApply,
  type CarTool, type FarmFood, type Floatie, type Pool, type SkyBook, type SkyThing, type Zone,
} from "@/lib/mochito-extra-8";
import { rng } from "@/lib/game/engine";
import type { Groom } from "@/lib/mochito-extra";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
type Done = { after: number; before: number; medals: string[]; sticker: { name: string } | null } | null | undefined;
const btn = "min-h-11 rounded-2xl px-5 text-sm font-semibold active:scale-[0.97]";
const chip = "min-h-11 rounded-full border-2 px-4 text-sm font-semibold active:scale-[0.97]";
type Look = { outfit?: Record<string, string>; groom?: Groom | null };

function doneLine(r: Done, base: string) {
  if (!r) return base;
  if (r.after > r.before) return `${base} ¡Y subí al nivel ${r.after}!`;
  if (r.medals.length) return `${base} ¡Y gané la medalla «${r.medals[0]}»!`;
  if (r.sticker) return `${base} Me gané la pegatina «${r.sticker.name}».`;
  return base;
}

function DoneToday({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">{text}</p>
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
    </div>
  );
}

// ── Visitar la granja ───────────────────────────────────────────────

const FOOD_HINT: Record<FarmFood, string> = {
  maiz: "algo amarillo, en granitos",
  pasto: "algo verde que crece en el suelo del campo",
  zanahoria: "algo naranja y larguito",
  manzana: "una fruta roja y redonda",
  hojas: "algo verde y crujiente, de ensalada",
};
const FOOD_COLOR: Record<FarmFood, string> = { maiz: "#f2c94c", pasto: "#5aa04a", zanahoria: "#ef8a2e", manzana: "#d6453d", hojas: "#9fd27a" };

function AnimalArt({ id, color }: { id: string; color: string }) {
  const spots = id === "vaca";
  return (
    <svg viewBox="0 0 60 44" className="h-full w-full" aria-hidden>
      <ellipse cx="28" cy="26" rx="20" ry="12" fill={spots ? "#fffaf0" : color} stroke="rgb(0 0 0 / 0.25)" />
      {spots && <><ellipse cx="22" cy="22" rx="6" ry="4" fill={color} /><ellipse cx="34" cy="30" rx="5" ry="3" fill={color} /></>}
      <circle cx="48" cy="18" r="9" fill={spots ? "#fffaf0" : color} stroke="rgb(0 0 0 / 0.25)" />
      <circle cx="51" cy="16" r="1.4" fill="#2b2622" />
      {id === "gallina" && <path d="M46 9 l2 -4 l2 4 l2 -4 l1 5" fill="#d6453d" />}
      {id === "gallina" && <path d="M56 18 l5 2 l-5 2 z" fill="#f2c94c" />}
      {id === "cerdito" && <ellipse cx="56" cy="20" rx="3.5" ry="2.6" fill="#e88f88" />}
      {(id === "cabrita" || id === "vaca") && <path d="M44 10 l-2 -6 M52 10 l2 -6" stroke="#8a7560" strokeWidth="2" strokeLinecap="round" />}
      {id === "caballo" && <path d="M40 12 q4 -6 8 -3 l-2 8" fill="#5b3a1f" />}
      <path d="M16 36 v6 M24 37 v6 M34 37 v6 M42 36 v6" stroke="rgb(0 0 0 / 0.45)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** La granja: dale a cada animal lo que pide, junta los huevos y ordeña. Una vez al día. */
export function FarmScene({ day, done, onLine, onClose }: { day: string; done: boolean; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [animals] = useState(() => farmOf(day));
  const [eggs] = useState(() => eggsOf(day));
  const [step, setStep] = useState<"comer" | "huevos" | "leche" | "fin">("comer");
  const [k, setK] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [msg, setMsg] = useState("");
  const [opened, setOpened] = useState<number[]>([]);
  const [milk, setMilk] = useState(0);
  const [coins, setCoins] = useState(0);

  if (done && step === "comer") return <DoneToday text="Hoy ya fuimos a la granja. Los animales están panzones y contentos. Mañana volvemos." onClose={onClose} />;

  const a = animals[Math.min(k, animals.length - 1)];
  function feed(f: FarmFood) {
    if (f !== a.wants) { setMistakes((m) => m + 1); setMsg(`${a.name} mueve la cabeza: eso no. Quiere ${FOOD_HINT[a.wants]}.`); sfx("sad"); return; }
    sfx("coin");
    if (k + 1 >= animals.length) { setMsg(""); setStep("huevos"); onLine("¡Todos comieron! Ahora busquemos huevos en el gallinero."); return; }
    setMsg(`¡A ${a.name.replace(/^(La|El) /, (s) => s.toLowerCase())} le encantó!`); setK(k + 1);
  }
  const found = opened.filter((i) => eggs.nests.includes(i)).length;
  function open(i: number) {
    if (opened.includes(i)) return;
    const next = [...opened, i];
    setOpened(next);
    sfx(eggs.nests.includes(i) ? (eggs.golden === i ? "success" : "coin") : "click");
    if (next.filter((x) => eggs.nests.includes(x)).length >= eggs.nests.length) setTimeout(() => { setStep("leche"); onLine("¡Los encontramos todos! Falta ordeñar a la vaca."); }, 500);
  }
  function squeeze() {
    if (step !== "leche") return;
    const m = milk + 1;
    setMilk(m); sfx("click");
    if (m >= MILK_TAPS) {
      setStep("fin");
      const golden = eggs.golden !== null;
      void finishFarm(eggs.nests.length, golden, mistakes === 0).then((r) => { setCoins(r?.coins ?? 0); sfx("success"); onLine(doneLine(r, golden ? "¡Una cubeta de leche y un huevo dorado! Qué día en la granja." : "¡Una cubeta llena de leche! Qué día en la granja.")); });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {step === "comer" && (
        <>
          <p className="text-sm" aria-live="polite">Animal {k + 1} de {animals.length}. {msg}</p>
          <div className="flex items-center gap-3 rounded-3xl bg-[#cfe9b8] p-3 dark:bg-[#2f4a2a]">
            <motion.span key={a.id} initial={reduce ? false : { opacity: 0, transform: "translateX(-12px)" }} animate={{ opacity: 1, transform: "translateX(0px)" }} transition={{ duration: 0.3, ease: EASE_OUT }} className="block h-20 w-28 shrink-0"><AnimalArt id={a.id} color={a.color} /></motion.span>
            <p className="rounded-2xl bg-white/90 px-3 py-2 text-sm text-[#3a2a22]"><b>{a.name}</b> dice: «Tengo hambre. Quiero {FOOD_HINT[a.wants]}.»</p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Comida">
            {FARM_FOOD_IDS.map((f) => (
              <button key={f} type="button" onClick={() => feed(f)} className={cn(chip, "flex items-center gap-2 border-border bg-card")}>
                <span className="block size-4 rounded-full" style={{ background: FOOD_COLOR[f] }} aria-hidden />{FARM_FOODS[f]}
              </button>
            ))}
          </div>
        </>
      )}
      {step === "huevos" && (
        <>
          <p className="text-sm" aria-live="polite">Busca en los nidos. Hoy hay {eggs.nests.length} huevos · Encontrados: {found}</p>
          <div className="grid grid-cols-3 gap-2 rounded-3xl bg-[#e8cf9d] p-3 dark:bg-[#5a4526]" role="group" aria-label="Nidos">
            {Array.from({ length: NESTS }, (_, i) => {
              const o = opened.includes(i), egg = eggs.nests.includes(i), gold = eggs.golden === i;
              return (
                <button key={i} type="button" disabled={o} onClick={() => open(i)} aria-label={o ? (egg ? (gold ? "Huevo dorado" : "Huevo") : "Nido vacío") : `Nido ${i + 1}`} className="flex aspect-[4/3] items-end justify-center rounded-2xl bg-[#b98a4c] pb-2 active:scale-[0.97] disabled:active:scale-100">
                  {o && egg && <motion.span initial={reduce ? false : { opacity: 0, transform: "translateY(6px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: 0.25, ease: EASE_OUT }}><Egg className="size-9" style={{ color: gold ? "#d9a21b" : "#fffaf0" }} fill={gold ? "#f6d36b" : "#fffaf0"} aria-hidden /></motion.span>}
                  {o && !egg && <span className="text-xs font-semibold text-white/90">vacío</span>}
                  {!o && <span className="block h-3 w-3/4 rounded-full bg-[#8a5a2e]" aria-hidden />}
                </button>
              );
            })}
          </div>
        </>
      )}
      {(step === "leche" || step === "fin") && (
        <>
          <p className="text-sm" aria-live="polite">{step === "leche" ? `Toca la cubeta para ordeñar (${milk} de ${MILK_TAPS}).` : `¡Listo! Juntaste ${eggs.nests.length} huevos y una cubeta de leche. Ganaste ${coins} monedas.`}</p>
          <button type="button" disabled={step !== "leche"} onClick={squeeze} aria-label="Ordeñar" className="relative mx-auto flex h-36 w-32 items-end justify-center overflow-hidden rounded-b-[40px] rounded-t-xl border-4 border-[#9aa3ad] bg-[#dfe5ea] active:scale-[0.97] disabled:active:scale-100 dark:bg-[#3b434b]">
            <motion.span className="absolute inset-x-0 bottom-0 block h-full origin-bottom bg-white" animate={{ transform: `scaleY(${milk / MILK_TAPS})` }} transition={{ duration: 0.15, ease: EASE_OUT }} aria-hidden />
            <Milk className="relative mb-3 size-8 text-[#7d8791]" aria-hidden />
          </button>
        </>
      )}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>{step === "fin" ? "Volver" : "Salir"}</button>
    </div>
  );
}

// ── Noche de estrellas ──────────────────────────────────────────────

const andList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`);

function MoonArt({ now }: { now: number }) {
  const { lit, waxing } = moonLit(now);
  const r = 20, cx = 25, cy = 25;
  const rx = r * Math.abs(1 - 2 * lit);
  const d = waxing
    ? `M${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx} ${cy + r} A${rx} ${r} 0 0 ${lit > 0.5 ? 1 : 0} ${cx} ${cy - r}Z`
    : `M${cx} ${cy - r} A${r} ${r} 0 0 0 ${cx} ${cy + r} A${rx} ${r} 0 0 ${lit > 0.5 ? 0 : 1} ${cx} ${cy - r}Z`;
  return (
    <svg viewBox="0 0 50 50" className="h-full w-full" aria-hidden>
      <circle cx={cx} cy={cy} r={r} fill="#3a4266" />
      {lit > 0.02 && <path d={d} fill="#fff3c4" />}
    </svg>
  );
}

function SkyThingArt({ id, x, y }: { id: SkyThing; x: number; y: number }) {
  const c = SKY_THINGS[id].color;
  if (id === "saturno") return <g><ellipse cx={x} cy={y} rx="5.5" ry="1.6" fill="none" stroke="#c9b27a" strokeWidth="0.9" /><circle cx={x} cy={y} r="2.8" fill={c} /></g>;
  if (id === "jupiter") return <g><circle cx={x} cy={y} r="3.6" fill={c} /><path d={`M${x - 3.4} ${y - 1} h6.8 M${x - 3.2} ${y + 1.2} h6.4`} stroke="#a8754a" strokeWidth="0.7" /></g>;
  if (id === "cometa") return <g><path d={`M${x} ${y} L${x - 9} ${y - 5} L${x - 8} ${y - 2} Z`} fill={c} opacity="0.6" /><circle cx={x} cy={y} r="1.8" fill="#fff" /></g>;
  if (id === "satelite") return <g><rect x={x - 1.2} y={y - 1.2} width="2.4" height="2.4" fill={c} /><rect x={x - 5} y={y - 0.8} width="3" height="1.6" fill="#5b7bb8" /><rect x={x + 2} y={y - 0.8} width="3" height="1.6" fill="#5b7bb8" /></g>;
  return <circle cx={x} cy={y} r={id === "venus" ? 2.4 : 2.6} fill={c} />;
}

/** La noche de estrellas: ve la luna de hoy, busca tres cosas con el telescopio y atrapa estrellas fugaces. Una vez al día. */
export function NightScene({ day, now, sky, onLine, onClose }: { day: string; now: number; sky?: SkyBook; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const done = sky?.last === day;
  const [phase] = useState(() => moonPhase(now));
  const [things] = useState(() => skyOf(day));
  const [dots] = useState(() => { const r = rng(`puntitos:${day}`); return Array.from({ length: 40 }, () => ({ x: r() * SKY_W, y: r() * SKY_H, s: 0.2 + r() * 0.4 })); });
  const [shooting] = useState(() => shootingOf(day));
  const [step, setStep] = useState<"luna" | "telescopio" | "fugaces" | "fin">("luna");
  const [lens, setLens] = useState({ x: SKY_W / 2, y: SKY_H / 2 });
  const [found, setFound] = useState<SkyThing[]>([]);
  const [t, setT] = useState(0);
  const [caught, setCaught] = useState<number[]>([]);
  const [coins, setCoins] = useState(0);
  const svg = useRef<SVGSVGElement>(null);
  const caughtRef = useRef<number[]>([]);
  const foundRef = useRef<SkyThing[]>([]);
  const sent = useRef(false);

  useEffect(() => {
    if (step !== "fugaces") return;
    const t0 = Date.now();
    const id = setInterval(() => {
      const v = Date.now() - t0;
      setT(v);
      if (v >= SHOOTING_MS) {
        clearInterval(id);
        setStep("fin");
        if (sent.current) return;
        sent.current = true;
        const w = caughtRef.current.length;
        void finishNight(foundRef.current, w, phase).then((r) => { setCoins(r?.coins ?? 0); sfx("success"); onLine(doneLine(r, w ? `Pedí ${w === 1 ? "un deseo" : `${w} deseos`}. No te digo cuáles… bueno, todos eran galletas.` : "Las estrellas fugaces van rapidísimo. ¡Mañana atrapamos una!")); });
      }
    }, 40);
    return () => clearInterval(id);
  }, [step, phase, onLine]);

  if (done && step === "luna") {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Hoy ya miramos el cielo. Las estrellas también tienen que descansar. Mañana vemos otra vez.</p>
        <SkyNotebook sky={sky} />
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }

  function aim(e: React.PointerEvent<SVGSVGElement>) {
    const r = svg.current?.getBoundingClientRect();
    if (!r) return;
    setLens({ x: Math.round(((e.clientX - r.left) / r.width) * SKY_W), y: Math.round(((e.clientY - r.top) / r.height) * SKY_H) });
  }
  function nudge(dx: number, dy: number) { setLens((l) => ({ x: Math.max(0, Math.min(SKY_W, l.x + dx)), y: Math.max(0, Math.min(SKY_H, l.y + dy)) })); sfx("click"); }
  function spot(id: SkyThing) {
    if (foundRef.current.includes(id)) return;
    foundRef.current = [...foundRef.current, id];
    setFound(foundRef.current); sfx("coin");
    onLine(`¡Mira! Es ${skyName(id)}, ${SKY_THINGS[id].note}.`);
    if (foundRef.current.length >= things.length) setTimeout(() => { setStep("fugaces"); onLine("¡Ahí viene una estrella fugaz! Tócala para pedir un deseo."); }, 900);
  }

  return (
    <div className="flex flex-col gap-3">
      {step === "luna" && (
        <>
          <div className="flex items-center gap-4 rounded-3xl bg-[#1d2545] p-4 text-[#e8ecff]">
            <span className="block size-24 shrink-0"><MoonArt now={now} /></span>
            <p className="text-sm">Hoy en el cielo hay <b>{MOON_PHASES[phase].toLowerCase()}</b>. {phase === 0 ? "Casi no se ve: está entre la Tierra y el Sol." : phase === 4 ? "Está toda redonda e iluminada." : phase < 4 ? "Cada noche se ve un poquito más." : "Cada noche se ve un poquito menos."}</p>
          </div>
          <button type="button" onClick={() => { setStep("telescopio"); sfx("click"); onLine("Toca el cielo para mover el telescopio. Busca tres cosas escondidas."); }} className={cn(btn, "self-start bg-primary text-primary-foreground")}><Telescope className="mr-1.5 inline size-4" aria-hidden />Mirar con el telescopio</button>
        </>
      )}
      {(step === "telescopio" || step === "fugaces" || step === "fin") && (
        <>
          <p className="text-sm" aria-live="polite">{step === "telescopio" ? `Toca el cielo para apuntar y toca lo que aparezca en el círculo · Encontraste ${found.length} de ${things.length}` : step === "fugaces" ? `Toca las estrellas fugaces · Deseos: ${caught.length} · Quedan ${Math.max(0, Math.ceil((SHOOTING_MS - t) / 1000))} s` : `Encontraste ${andList(found.map(skyName))} y pediste ${caught.length} ${caught.length === 1 ? "deseo" : "deseos"}. Ganaste ${coins} monedas.`}</p>
          <div className="relative mx-auto w-full max-w-md">
            <svg ref={svg} viewBox={`0 0 ${SKY_W} ${SKY_H}`} className="block w-full touch-none rounded-3xl bg-[#121a36]" onPointerDown={step === "telescopio" ? aim : undefined} role="group" aria-label="Cielo de noche">
              <defs>
                <clipPath id="lente"><circle cx={lens.x} cy={lens.y} r={LENS_R} /></clipPath>
                <mask id="oscuro"><rect width={SKY_W} height={SKY_H} fill="white" /><circle cx={lens.x} cy={lens.y} r={LENS_R} fill="black" /></mask>
              </defs>
              {dots.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#cfd8ff" opacity="0.7" />)}
              <g clipPath={step === "telescopio" ? "url(#lente)" : undefined}>
                {things.map((o) => (found.includes(o.id) || step === "telescopio") && (
                  <g key={o.id} role={step === "telescopio" && inLens(lens, o) ? "button" : undefined} tabIndex={step === "telescopio" && inLens(lens, o) && !found.includes(o.id) ? 0 : undefined} aria-label={SKY_THINGS[o.id].name} onPointerDown={(e) => { if (step !== "telescopio" || !inLens(lens, o)) return; e.stopPropagation(); spot(o.id); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); spot(o.id); } }} className={step === "telescopio" ? "cursor-pointer" : undefined}>
                    <circle cx={o.x} cy={o.y} r="6" fill="transparent" />
                    <SkyThingArt id={o.id} x={o.x} y={o.y} />
                    {found.includes(o.id) && <circle cx={o.x} cy={o.y} r="6.5" fill="none" stroke="#f6d36b" strokeWidth="0.6" />}
                  </g>
                ))}
              </g>
              {step === "telescopio" && <><rect width={SKY_W} height={SKY_H} fill="#05081a" opacity="0.6" mask="url(#oscuro)" pointerEvents="none" /><circle cx={lens.x} cy={lens.y} r={LENS_R} fill="none" stroke="#9fb0e8" strokeWidth="0.8" pointerEvents="none" /></>}
            </svg>
            {step === "fugaces" && shooting.map((s) => {
              const p = (t - s.at) / s.dur;
              if (p < 0 || p > 1 || caught.includes(s.id)) return null;
              const x = s.x + p * 28, y = s.y + p * 14;
              return (
                <button key={s.id} type="button" aria-label="Estrella fugaz" onPointerDown={(e) => { e.preventDefault(); caughtRef.current = [...caughtRef.current, s.id]; setCaught(caughtRef.current); sfx("coin"); }} className="absolute flex size-12 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center" style={{ left: `${(x / SKY_W) * 100}%`, top: `${(y / SKY_H) * 100}%` }}>
                  <motion.span initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15, ease: EASE_OUT }}><Star className="size-6 text-[#fff3c4]" fill="#fff3c4" aria-hidden /></motion.span>
                </button>
              );
            })}
          </div>
          {step === "telescopio" && (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Mover el telescopio">
              <button type="button" aria-label="Mover a la izquierda" onClick={() => nudge(-8, 0)} className={cn(chip, "border-border")}><ArrowLeft className="size-4" aria-hidden /></button>
              <button type="button" aria-label="Mover arriba" onClick={() => nudge(0, -8)} className={cn(chip, "border-border")}><ArrowUp className="size-4" aria-hidden /></button>
              <button type="button" aria-label="Mover abajo" onClick={() => nudge(0, 8)} className={cn(chip, "border-border")}><ArrowDown className="size-4" aria-hidden /></button>
              <button type="button" aria-label="Mover a la derecha" onClick={() => nudge(8, 0)} className={cn(chip, "border-border")}><ArrowRight className="size-4" aria-hidden /></button>
            </div>
          )}
          {step === "fin" && <SkyNotebook sky={{ ...sky, seen: { ...sky?.seen, ...Object.fromEntries(found.map((id) => [id, (sky?.seen?.[id] ?? 0) + 1])) } }} />}
        </>
      )}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>{step === "fin" ? "Volver" : "Salir"}</button>
    </div>
  );
}

function SkyNotebook({ sky }: { sky?: SkyBook }) {
  const seen = SKY_IDS.filter((id) => (sky?.seen?.[id] ?? 0) > 0);
  return (
    <section aria-labelledby="cuaderno-cielo" className="flex flex-col gap-2">
      <h3 id="cuaderno-cielo" className="text-sm font-semibold">Cuaderno del cielo <span className="font-normal text-muted-foreground">({seen.length} de {SKY_IDS.length})</span></h3>
      <ul className="grid grid-cols-3 gap-2">
        {SKY_IDS.map((id) => {
          const on = seen.includes(id);
          return (
            <li key={id} className={cn("flex flex-col items-center gap-1 rounded-2xl p-2 text-center text-xs font-semibold", on ? "bg-[#1d2545] text-[#e8ecff]" : "bg-secondary/60 text-muted-foreground")}>
              <svg viewBox="0 0 20 14" className="h-8 w-12" aria-hidden>{on ? <SkyThingArt id={id} x={10} y={7} /> : <text x="10" y="10" textAnchor="middle" fontSize="8" fill="currentColor">?</text>}</svg>
              {on ? SKY_THINGS[id].name : "Sin ver"}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── Ir a la piscina ─────────────────────────────────────────────────

const FLOATIE_COLOR: Record<Floatie, string> = { pato: "#f6c744", dona: "#ef7fa6", sandia: "#4a9a5b" };

function RingArt({ color }: { color: string }) {
  return <svg viewBox="0 0 20 20" className="h-full w-full" aria-hidden><circle cx="10" cy="10" r="7" fill="none" stroke={color} strokeWidth="3.2" /></svg>;
}

/** La piscina: elige flotador, échate un clavado y saca los aros del fondo antes de que se acabe el aire. Una vez al día. */
export function PoolScene({ day, pool, look, onLine, onClose }: { day: string; pool?: Pool; look: Look; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const done = pool?.last === day;
  const [rings] = useState(() => ringsOf(day));
  const [air] = useState(() => poolAir(rings));
  const [step, setStep] = useState<"flotador" | "trampolin" | "buceo" | "fin">("flotador");
  const [floatie, setFloatie] = useState<Floatie>(pool?.floatie ?? "pato");
  const [t, setT] = useState(0);
  const [stars, setStars] = useState(0);
  const [at, setAt] = useState(POOL_START);
  const [used, setUsed] = useState(0);
  const [got, setGot] = useState<number[]>([]);
  const [coins, setCoins] = useState(0);
  const sent = useRef(false);

  useEffect(() => {
    if (step !== "trampolin" || stars) return;
    const t0 = Date.now();
    const id = setInterval(() => setT(Date.now() - t0), 30);
    return () => clearInterval(id);
  }, [step, stars]);

  if (done && step === "flotador") return <DoneToday text="Hoy ya nadamos. Todavía tengo las orejas mojadas. Mañana otra zambullida." onClose={onClose} />;

  function end(n: number) {
    if (sent.current) return;
    sent.current = true;
    setStep("fin");
    void finishPool(n, stars, floatie).then((r) => { setCoins(r?.coins ?? 0); sfx("success"); onLine(doneLine(r, n >= RINGS ? "¡Saqué todos los aros! Soy un buzo de verdad." : `Saqué ${n} ${n === 1 ? "aro" : "aros"}. ¡Uf, qué rico el agua!`)); });
  }
  function dive() {
    const s = diveStars(boardPos(t));
    setStars(s); sfx(s === 3 ? "success" : "coin");
    onLine(s === 3 ? "¡Splash perfecto! Ni salpiqué." : s === 2 ? "¡Buen clavado!" : "¡Panzazo! Jajaja, pero fue divertido.");
    setTimeout(() => { setStep("buceo"); onLine("Toca los aros para ir por ellos. Cuidado con el aire: lo lejos y lo hondo gasta más."); }, 900);
  }
  function swim(id: number) {
    const r = rings.find((x) => x.id === id)!;
    const c = swimCost(at, r);
    if (c > air - used) { sfx("sad"); onLine("¡Ese está muy lejos para el aire que me queda! Mejor busca uno más cerca."); return; }
    const nu = used + c, ng = [...got, id];
    setUsed(nu); setGot(ng); setAt({ x: r.x, y: r.y }); sfx("coin");
    const left = rings.filter((x) => !ng.includes(x.id));
    if (!left.length || left.every((x) => swimCost(r, x) > air - nu)) setTimeout(() => end(ng.length), 500);
  }
  const airLeft = Math.max(0, air - used);

  return (
    <div className="flex flex-col gap-3">
      {step === "flotador" && (
        <>
          <p className="text-sm">¿Qué flotador llevamos?</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Flotador">
            {(Object.keys(FLOATIES) as Floatie[]).map((f) => (
              <button key={f} type="button" aria-pressed={floatie === f} onClick={() => { setFloatie(f); sfx("click"); }} className={cn(chip, "flex items-center gap-2", floatie === f ? "border-primary bg-primary/10" : "border-border")}>
                <span className="block size-5 rounded-full border-4" style={{ borderColor: FLOATIE_COLOR[f] }} aria-hidden />{FLOATIES[f]}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { setStep("trampolin"); sfx("click"); onLine("Toca «¡Salta!» cuando la marca esté en el centro, en lo verde."); }} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Ir al trampolín</button>
        </>
      )}
      {step === "trampolin" && (
        <>
          <p className="text-sm" aria-live="polite">{stars ? `${"★".repeat(stars)}${"☆".repeat(3 - stars)} ¡Al agua!` : "La marca sube y baja. Salta cuando esté en lo verde."}</p>
          <div className="relative mx-auto h-8 w-full max-w-sm overflow-hidden rounded-full bg-[#f2d0a4] dark:bg-[#5a4526]" aria-hidden>
            <span className="absolute inset-y-0 left-[30%] w-[40%] bg-[#f6c744]/70" />
            <span className="absolute inset-y-0 left-[42%] w-[16%] bg-[#4a9a5b]" />
            <span className="absolute inset-y-0 left-0 block w-full" style={{ transform: `translateX(${boardPos(t) * 100}%)` }}><span className="block h-full w-1.5 -translate-x-1/2 bg-[#2b2622]" /></span>
          </div>
          <button type="button" disabled={!!stars} onClick={dive} className={cn(btn, "self-start bg-primary text-primary-foreground disabled:opacity-50")}><Waves className="mr-1.5 inline size-4" aria-hidden />¡Salta!</button>
        </>
      )}
      {(step === "buceo" || step === "fin") && (
        <>
          <p className="text-sm" aria-live="polite">{step === "buceo" ? `Aros: ${got.length} de ${RINGS} · Aire: ${Math.round((airLeft / air) * 100)} %` : `¡Afuera! Sacaste ${got.length} de ${RINGS} aros. Ganaste ${coins} monedas.`}</p>
          <div className="h-3 w-full overflow-hidden rounded-full bg-secondary" aria-hidden><motion.span className="block h-full origin-left bg-[#5fb2e6]" animate={{ transform: `scaleX(${airLeft / air})` }} transition={{ duration: 0.3, ease: EASE_OUT }} /></div>
          <div className="relative mx-auto aspect-[5/3] w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-[#8fd3f4] to-[#2f78b7]">
            {rings.map((r) => !got.includes(r.id) && (
              <button key={r.id} type="button" disabled={step !== "buceo"} aria-label={`Aro ${r.id + 1}`} onClick={() => swim(r.id)} className="absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center active:scale-[0.97]" style={{ left: `${r.x}%`, top: `${(r.y / 60) * 100}%` }}>
                <span className="block size-8"><RingArt color={r.color} /></span>
              </button>
            ))}
            <motion.span className="pointer-events-none absolute inset-0 block" initial={false} animate={{ transform: `translate(${at.x}%, ${(at.y / 60) * 100}%)` }} transition={{ duration: reduce ? 0 : 0.45, ease: EASE_OUT }} aria-hidden>
              <span className="absolute left-0 top-0 block h-14 w-14 -translate-x-1/2 -translate-y-1/2"><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
            </motion.span>
          </div>
          {step === "buceo" && <button type="button" onClick={() => end(got.length)} className={cn(btn, "self-start bg-secondary")}>Subir a respirar</button>}
        </>
      )}
      {step !== "buceo" && <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>{step === "fin" ? "Volver" : "Salir"}</button>}
    </div>
  );
}

// ── Lavar el carro ──────────────────────────────────────────────────

const ZONE_LOOK: Record<Zone["s"], string> = { 0: "bg-[#8a6a45]/55", 1: "bg-[#5fb2e6]/45", 2: "bg-white/80", 3: "bg-[#5fb2e6]/25", 4: "bg-transparent" };
const ZONE_NAME = ["el cofre", "el techo", "la cajuela", "la puerta de adelante", "la puerta de atrás", "la defensa"];
const STATE_NAME = ["sucia", "mojada", "con jabón", "enjuagada", "seca y brillante"];

/** Lavar el carro: moja, enjabona, talla las manchas, enjuaga y seca cada parte. Una vez al día. */
export function CarWashScene({ day, done, onLine, onClose }: { day: string; done: boolean; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [zones, setZones] = useState<Zone[]>(() => carOf(day));
  const [spots] = useState(() => carOf(day).filter((z) => z.spot).length);
  const [tool, setTool] = useState<CarTool>("manguera");
  const [mistakes, setMistakes] = useState(0);
  const [msg, setMsg] = useState("Primero, moja todo el carro con la manguera.");
  const [fin, setFin] = useState(false);
  const [coins, setCoins] = useState(0);
  const sent = useRef(false);

  if (done && !fin) return <DoneToday text="Hoy ya lavamos el carro. ¡Mira cómo brilla! Mañana se vuelve a ensuciar, seguro." onClose={onClose} />;

  function use(i: number) {
    if (fin) return;
    const r = washApply(zones, tool, i);
    setMsg(r.msg);
    if (!r.ok) { setMistakes((m) => m + 1); sfx("sad"); return; }
    setZones(r.zones); sfx(r.zones[i].s === 4 ? "coin" : "click");
    if (carDone(r.zones) && !sent.current) {
      sent.current = true;
      setFin(true);
      void finishCarWash(spots, mistakes).then((x) => { setCoins(x?.coins ?? 0); sfx("success"); onLine(doneLine(x, "¡El carro quedó como nuevo! Hasta me veo reflejado.")); });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" aria-live="polite">{fin ? `¡Brillante! Le quitaste ${spots} manchas${mistakes ? "" : " sin un solo error"}. Ganaste ${coins} monedas.` : msg}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Herramienta">
        {(Object.keys(CAR_TOOLS) as CarTool[]).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={tool === k} onClick={() => { setTool(k); sfx("click"); }} className={cn(chip, tool === k ? "border-primary bg-primary/10" : "border-border")}>{CAR_TOOLS[k]}</button>
        ))}
      </div>
      <div className="relative mx-auto aspect-[2/1] w-full max-w-md">
        <svg viewBox="0 0 200 100" className="absolute inset-0 h-full w-full" aria-hidden>
          <path d="M18 70 V52 Q20 44 34 42 L58 22 Q64 16 76 16 H128 Q138 16 146 24 L166 42 Q184 44 186 54 V70 Z" fill="#c0392b" />
          <path d="M66 26 Q70 22 78 22 H98 V42 H50 Z M104 22 H126 Q134 22 140 28 L152 42 H104 Z" fill="#cfe6f5" />
          <circle cx="52" cy="72" r="14" fill="#2b2622" /><circle cx="52" cy="72" r="6" fill="#bbb" />
          <circle cx="152" cy="72" r="14" fill="#2b2622" /><circle cx="152" cy="72" r="6" fill="#bbb" />
        </svg>
        <div className="absolute inset-x-[8%] bottom-[22%] top-[14%] grid grid-cols-3 grid-rows-2 gap-1">
          {zones.map((z, i) => (
            <button key={i} type="button" disabled={fin} onClick={() => use(i)} aria-label={`${ZONE_NAME[i]}: ${STATE_NAME[z.s]}${z.spot ? `, con mancha (faltan ${z.spot} talladas)` : ""}`} className={cn("relative flex items-center justify-center rounded-xl transition-[background-color] duration-200 active:scale-[0.97]", ZONE_LOOK[z.s])}>
              {z.spot > 0 && <span className="block rounded-full bg-[#5a3b1e]" style={{ width: `${10 + z.spot * 6}px`, height: `${8 + z.spot * 5}px` }} aria-hidden />}
              {z.s === 2 && <span className="absolute right-1 top-1 flex gap-0.5" aria-hidden><span className="block size-2 rounded-full border border-[#9fc6e0] bg-white" /><span className="block size-1.5 rounded-full border border-[#9fc6e0] bg-white" /></span>}
              {z.s === 4 && <motion.span initial={reduce ? false : { opacity: 0, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ duration: 0.2, ease: EASE_OUT }}><Sparkles className="size-5 text-[#fff3c4]" aria-hidden /></motion.span>}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Orden: manguera para mojar → jabón → esponja en las manchas ({SCRUBS} talladas cada una) → manguera para enjuagar → toalla.</p>
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>{fin ? "Volver" : "Salir"}</button>
    </div>
  );
}
