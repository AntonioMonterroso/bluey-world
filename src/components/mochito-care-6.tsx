"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Cake, Check, Gift as GiftIcon, Hammer, Lock, PackageOpen, Sparkles, Target } from "lucide-react";
import { MochitoFigure } from "@/components/mochito-figure";
import { PuppyArt } from "@/components/puppy-art";
import { brushTeeth, buildTree, celebrateFriend, finishFair, gatherTree } from "@/lib/mochito-actions";
import {
  BRUSH_STROKES, COTTON_SPINS, FAIR_COINS, FAIR_SHOTS, FRIEND_BDAYS, GIFTS, GIFT_IDS, MATS, MAT_IDS, TEETH_STREAK, TEETH_ZONES, TREE_PARTS,
  canBuild, fairHit, fairKey, fairPrize, fairTol, friendBdays, nextFriendBday, nextPart, teethDone,
  type Fair, type Gift, type Mat, type Teeth, type TreeHouse,
} from "@/lib/mochito-extra-4";
import { sweep } from "@/lib/mochito-extra-2";
import type { Groom } from "@/lib/mochito-extra";
import { FRIENDS } from "@/lib/mochito-play";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
type Done = { after: number; before: number; medals: string[]; sticker: { name: string } | null } | null | undefined;
const btn = "min-h-11 rounded-2xl px-5 text-sm font-semibold active:scale-[0.97]";
const chip = "min-h-11 rounded-full border-2 px-4 text-sm font-semibold active:scale-[0.97]";
type Look = { outfit?: Record<string, string>; groom?: Groom | null };
const elapsed = (from: number) => Date.now() - from;
const qty = (m: Mat, n: number) => `${n} ${n === 1 ? ({ tablas: "tabla", clavos: "clavo", cuerda: "cuerda", pintura: "bote de pintura" } as const)[m] : ({ tablas: "tablas", clavos: "clavos", cuerda: "cuerdas", pintura: "botes de pintura" } as const)[m]}`;
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function doneLine(r: Done, base: string) {
  if (!r) return base;
  if (r.after > r.before) return `${base} ¡Y subí al nivel ${r.after}!`;
  if (r.medals.length) return `${base} ¡Y gané la medalla «${r.medals[0]}»!`;
  if (r.sticker) return `${base} Me gané la pegatina «${r.sticker.name}».`;
  return base;
}

// ── Dientes ─────────────────────────────────────────────────────────

/** Su boquita abierta: los dientes de cada lado se ponen blancos mientras los cepillas. */
function MouthArt({ clean, foam }: { clean: number[]; foam: boolean }) {
  const tooth = (k: number) => {
    const c = clean[Math.floor(k / 3)] ?? 0;
    return `rgb(${Math.round(232 + 23 * c)} ${Math.round(214 + 41 * c)} ${Math.round(150 + 105 * c)})`;
  };
  return (
    <svg viewBox="0 0 160 90" className="h-full w-full" aria-hidden>
      <path d="M10 30 Q80 -6 150 30 Q148 82 80 86 Q12 82 10 30 Z" fill="#c9763f" />
      <path d="M24 34 Q80 10 136 34 Q132 72 80 76 Q28 72 24 34 Z" fill="#7a2f3a" />
      <ellipse cx="80" cy="62" rx="30" ry="10" fill="#e2627a" />
      {Array.from({ length: 9 }, (_, k) => {
        const x = 34 + k * 11.5;
        const y = 30 - Math.sin((k / 8) * Math.PI) * 9;
        return <path key={k} d={`M${x} ${y} h9 l-1 12 q-3.5 3 -7 0 Z`} fill={tooth(k)} stroke="rgb(0 0 0 / 0.15)" strokeWidth="0.6" />;
      })}
      {foam && [40, 62, 84, 104, 122].map((x, k) => <circle key={x} cx={x} cy={46 + (k % 2) * 6} r={4 + (k % 3)} fill="#ffffff" opacity="0.85" />)}
    </svg>
  );
}

/** Cepillarle los dientes: pasta, cepillar cada lado y enjuagar. Una vez al día; los días seguidos hacen racha. */
export function TeethScene({ teeth, now, onLine, onClose }: { teeth?: Teeth; now: number; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const done = teethDone(teeth, now);
  const [step, setStep] = useState<"pasta" | "cepillar" | "enjuagar" | "listo">("pasta");
  const [strokes, setStrokes] = useState([0, 0, 0]);
  const [zone, setZone] = useState(0);
  const [wiggle, setWiggle] = useState(0);
  const clean = strokes.map((n) => n / BRUSH_STROKES);

  function brush() {
    const n = [...strokes];
    n[zone] = Math.min(BRUSH_STROKES, n[zone] + 1);
    setStrokes(n);
    setWiggle((w) => w + 1);
    sfx("click");
    if (n[zone] >= BRUSH_STROKES) {
      if (zone + 1 < TEETH_ZONES.length) { setZone(zone + 1); onLine(`¡Listos ${TEETH_ZONES[zone].name.toLowerCase()}! Ahora ${TEETH_ZONES[zone + 1].name.toLowerCase()}.`); }
      else { setStep("enjuagar"); onLine("¡Todos brillan! Falta enjuagar."); }
    }
  }
  async function rinse() {
    setStep("listo");
    sfx("success");
    const r = await brushTeeth();
    const streak = r?.streak ?? 1;
    onLine(doneLine(r, r?.bonus ? `¡${streak} días seguidos! La doctora Pimienta dice que tengo la sonrisa más limpia del parque.` : streak > 1 ? `¡Fresquito! Llevamos ${streak} días seguidos.` : "¡Fresquito! Mañana otra vez, ¿sí?"));
  }

  if (done && step === "pasta") {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Hoy ya tiene los dientes limpios. Racha: {teeth?.streak ?? 1} {teeth?.streak === 1 ? "día" : "días seguidos"} (la mejor: {teeth?.best ?? 1}). Mañana otra vez.</p>
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }
  const left = TEETH_STREAK - ((teeth?.streak ?? 0) % TEETH_STREAK);
  return (
    <div className="flex flex-col gap-3">
      <motion.div key={wiggle} className="mx-auto h-40 w-full max-w-xs" initial={false} animate={wiggle && !reduce ? { transform: ["translateX(0px)", "translateX(-4px)", "translateX(4px)", "translateX(0px)"] } : undefined} transition={{ duration: 0.18, ease: EASE_OUT }}>
        <MouthArt clean={clean} foam={step === "cepillar" && strokes.some((n) => n > 0)} />
      </motion.div>
      <ol className="flex flex-wrap gap-2 text-xs" aria-label="Pasos">
        {["Pasta", ...TEETH_ZONES.map((z) => z.name), "Enjuagar"].map((t, k) => {
          const ok = k === 0 ? step !== "pasta" : k <= 3 ? strokes[k - 1] >= BRUSH_STROKES : step === "listo";
          return <li key={t} className={cn("flex items-center gap-1 rounded-full px-3 py-1", ok ? "bg-primary text-primary-foreground" : "bg-secondary")}>{ok && <Check className="size-3.5" aria-hidden />}{t}</li>;
        })}
      </ol>
      {step === "pasta" && <><p className="text-sm">Pasta especial para perro (la de personas no, le hace daño). Un poquito, del tamaño de un chícharo.</p><button type="button" onClick={() => { setStep("cepillar"); sfx("click"); onLine("Sabe a pollito. ¡Me gusta!"); }} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Poner pasta</button></>}
      {step === "cepillar" && <><p className="text-sm font-semibold" aria-live="polite">{TEETH_ZONES[zone].name}: {strokes[zone]} de {BRUSH_STROKES}</p><button type="button" onClick={brush} className="min-h-14 self-start rounded-2xl bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-[0.97]">Cepillar</button></>}
      {step === "enjuagar" && <button type="button" onClick={() => void rinse()} className={cn(btn, "self-start bg-sky-600 text-white")}>Enjuagar</button>}
      {step === "listo" && <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">¡Dientes limpios! {left === TEETH_STREAK ? "Completaste una racha de 7 días." : `Faltan ${left} ${left === 1 ? "día" : "días"} seguidos para que la doctora lo felicite.`}</p>}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
    </div>
  );
}

// ── Casita del árbol ────────────────────────────────────────────────

export function TreeArt({ built, className }: { built: string[]; className?: string }) {
  const has = (id: string) => built.includes(id);
  const wood = "#b98250";
  const line = "rgb(0 0 0 / 0.25)";
  return (
    <svg viewBox="0 0 200 160" className={cn("h-full w-full", className)} aria-hidden>
      <rect x="0" y="0" width="200" height="160" fill="#d6ecfb" />
      <rect x="0" y="140" width="200" height="20" fill="#7cc576" />
      <path d="M92 160 L96 70 L104 70 L110 160 Z" fill="#7a4a24" />
      <path d="M98 100 L70 80 M104 92 L134 74" stroke="#7a4a24" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="100" cy="46" rx="80" ry="40" fill="#4a9a5b" />
      <ellipse cx="60" cy="56" rx="34" ry="24" fill="#5bb06a" /><ellipse cx="142" cy="54" rx="34" ry="24" fill="#5bb06a" />
      {has("piso") && <rect x="58" y="92" width="84" height="8" fill={wood} stroke={line} />}
      {has("paredes") && <rect x="64" y="62" width="72" height="30" fill="#d9a066" stroke={line} />}
      {has("paredes") && <path d="M94 92 V74 Q100 68 106 74 V92 Z" fill="#6b4422" />}
      {has("techo") && <path d="M56 64 L100 38 L144 64 Z" fill="#d6453d" stroke={line} />}
      {has("ventana") && <><rect x="114" y="70" width="14" height="12" fill="#bfe3f7" stroke="#fff" strokeWidth="1.5" /><path d="M121 70 V82" stroke="#fff" strokeWidth="1" /></>}
      {has("escalera") && <g stroke="#8a5a2e" strokeWidth="2"><path d="M70 100 L64 140 M80 100 L76 140" />{[108, 116, 124, 132].map((y) => <path key={y} d={`M${69 - (y - 100) * 0.13} ${y} H${79 - (y - 100) * 0.1}`} />)}</g>}
      {has("columpio") && <g><path d="M140 80 V122 M156 80 V122" stroke="#c9b48a" strokeWidth="1.2" /><path d="M134 80 H162" stroke="#7a4a24" strokeWidth="4" /><rect x="136" y="122" width="24" height="4" fill={wood} /></g>}
      {has("bandera") && <g><path d="M100 38 V18" stroke="#5a3b2e" strokeWidth="1.5" /><path d="M100 18 L116 22 L100 27 Z" fill="#f6c744" /></g>}
    </svg>
  );
}

/** La casita del árbol: un día juntas materiales, y cada día construyes una parte. */
export function TreeScene({ tree, today, look, onLine, onClose }: { tree?: TreeHouse; today: string; look: Look; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [hop, setHop] = useState(0);
  const built = tree?.built ?? [];
  const part = nextPart(tree);
  const gathered = tree?.gathered === today;
  const builtToday = tree?.builtDay === today;

  async function gather() {
    sfx("coin");
    const got = await gatherTree();
    if (!got) return;
    const list = MAT_IDS.filter((m) => (got[m] ?? 0) > 0).map((m) => qty(m, got[m] ?? 0)).join(", ");
    onLine(`¡Encontramos ${list}! Yo cargué una tabla con la boca.`);
  }
  async function build() {
    if (!part) return;
    setHop((h) => h + 1);
    sfx("success");
    const r = await buildTree(part.id);
    onLine(doneLine(r, r?.done ? "¡Terminamos la casita del árbol! Es la más bonita del mundo." : `¡Ya tiene ${part.name.toLowerCase()}! Mañana seguimos.`));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-3xl">
        <TreeArt built={built} className="block" />
        <motion.span key={hop} className="absolute bottom-[3%] left-[4%] block h-[40%]" initial={false} animate={hop && !reduce ? { transform: ["translateY(0px)", "translateY(-12px)", "translateY(0px)"] } : undefined} transition={{ duration: 0.4, ease: EASE_OUT }} aria-hidden>
          <MochitoFigure outfit={look.outfit} groom={look.groom} />
        </motion.span>
      </div>
      <p className="text-sm font-semibold">{built.length} de {TREE_PARTS.length} partes construidas.</p>
      <ul className="flex flex-wrap gap-2 text-sm" aria-label="Materiales">
        {MAT_IDS.map((m) => <li key={m} className="rounded-full bg-secondary px-3 py-1">{MATS[m]}: <span className="font-semibold tabular-nums">{tree?.mats?.[m as Mat] ?? 0}</span></li>)}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={gathered} onClick={() => void gather()} className={cn(btn, "flex items-center gap-1.5 bg-primary text-primary-foreground disabled:bg-secondary disabled:text-muted-foreground")}><PackageOpen className="size-4" aria-hidden /> {gathered ? "Ya juntaron hoy" : "Juntar materiales"}</button>
      </div>
      {part ? (
        <div className="flex flex-col gap-2 rounded-3xl border-2 border-border bg-card p-3">
          <p className="text-sm"><span className="font-semibold">Sigue: {part.name}.</span> Necesita {(Object.entries(part.need) as [Mat, number][]).map(([m, n]) => qty(m, n)).join(", ")}.</p>
          <button type="button" disabled={builtToday || !canBuild(tree, part)} onClick={() => void build()} className={cn(btn, "flex items-center gap-1.5 self-start bg-primary text-primary-foreground disabled:bg-secondary disabled:text-muted-foreground")}>
            {builtToday ? "Mañana construimos otra parte" : canBuild(tree, part) ? <><Hammer className="size-4" aria-hidden /> Construir</> : <><Lock className="size-4" aria-hidden /> Faltan materiales</>}
          </button>
        </div>
      ) : (
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">¡La casita del árbol está terminada! Mochito sube todas las tardes a ver el atardecer.</p>
      )}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
    </div>
  );
}

// ── Feria ───────────────────────────────────────────────────────────

export function PrizeShelf({ fair }: { fair?: Fair }) {
  const p = fair?.prizes ?? [];
  if (!p.length) return null;
  return (
    <section aria-labelledby="premios" className="flex flex-col gap-2 rounded-3xl border bg-card p-3">
      <h3 id="premios" className="text-sm font-semibold">Premios de la feria</h3>
      <ul className="flex flex-wrap gap-2 text-sm">{p.map((x, k) => <li key={k} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1"><Sparkles className="size-3.5 text-primary" aria-hidden /> {x}</li>)}</ul>
    </section>
  );
}

type FairStep = "rueda" | "algodon" | "tiro" | "premio";

/** La feria del mes: rueda de la fortuna, algodón de azúcar y tiro al blanco por un peluche. */
export function FairScene({ fair, now, look, onLine, onClose }: { fair?: Fair; now: number; look: Look; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const key = fairKey(now);
  const done = fair?.last === key;
  const [step, setStep] = useState<FairStep>("rueda");
  const [spinning, setSpinning] = useState(false);
  const [rode, setRode] = useState(false);
  const [cotton, setCotton] = useState(0);
  const [shots, setShots] = useState<boolean[]>([]);
  const [t, setT] = useState(0);
  const t0 = useRef(0);
  const tol = fairTol("normal");
  useEffect(() => {
    if (step !== "tiro") return;
    t0.current = Date.now();
    const id = setInterval(() => setT(Date.now() - t0.current), 30);
    return () => clearInterval(id);
  }, [step]);
  const target = sweep(t, 1400);
  const hits = shots.filter(Boolean).length;
  const prize = fairPrize(hits, key);

  function ride() {
    setSpinning(true);
    sfx("click");
    onLine("¡Estamos hasta arriba! Desde aquí se ve mi casita.");
    setTimeout(() => { setSpinning(false); setRode(true); }, reduce ? 200 : 2400);
  }
  function spin() {
    const n = cotton + 1;
    setCotton(n); sfx("click");
    if (n >= COTTON_SPINS) onLine("¡Algodón de azúcar para ti! Yo nomás lo huelo.");
  }
  function shoot() {
    const hit = fairHit(sweep(elapsed(t0.current), 1400), tol);
    const n = [...shots, hit];
    setShots(n);
    sfx(hit ? "coin" : "sad");
    if (n.length >= FAIR_SHOTS) setTimeout(() => void win(n.filter(Boolean).length), 500);
  }
  async function win(h: number) {
    setStep("premio");
    const p = fairPrize(h, key);
    sfx("success");
    const r = await finishFair(p.name, p.size === "grande");
    onLine(doneLine(r, `¡Ganamos ${p.name.toLowerCase()}! Y ${FAIR_COINS} monedas.`));
  }

  if (done && step === "rueda") {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Este mes ya fuimos a la feria. Regresa el mes que viene.</p>
        <PrizeShelf fair={fair} />
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-52 overflow-hidden rounded-3xl bg-gradient-to-b from-[#ffd9a8] to-[#ffeccf] dark:from-[#5a3a2a] dark:to-[#3a2a22]">
        {step === "rueda" && (
          <motion.svg viewBox="0 0 100 100" className="absolute right-4 top-2 size-48" initial={false} animate={spinning && !reduce ? { transform: "rotate(360deg)" } : { transform: "rotate(0deg)" }} transition={{ duration: spinning ? 2.4 : 0, ease: [0.45, 0, 0.55, 1] }} aria-hidden>
            <circle cx="50" cy="50" r="42" fill="none" stroke="#8a5a2e" strokeWidth="2" />
            {Array.from({ length: 8 }, (_, k) => { const a = (k / 8) * Math.PI * 2; return <g key={k}><path d={`M50 50 L${50 + Math.cos(a) * 42} ${50 + Math.sin(a) * 42}`} stroke="#8a5a2e" strokeWidth="1.2" /><rect x={50 + Math.cos(a) * 42 - 5} y={50 + Math.sin(a) * 42 - 4} width="10" height="8" rx="2" fill={["#d6453d", "#3f74c4", "#f6c744", "#5bb06a"][k % 4]} /></g>; })}
            <circle cx="50" cy="50" r="5" fill="#6b4422" />
          </motion.svg>
        )}
        {step === "algodon" && (
          <svg viewBox="0 0 100 100" className="absolute right-8 top-4 size-44" aria-hidden>
            <path d="M50 96 L46 50 H54 Z" fill="#f2e3c6" stroke="rgb(0 0 0 / 0.2)" />
            {Array.from({ length: cotton }, (_, k) => <circle key={k} cx={50 + ((k % 3) - 1) * (6 + k * 2)} cy={44 - k * 5} r={10 + k * 3} fill="#f6a5c8" opacity="0.85" />)}
          </svg>
        )}
        {step === "tiro" && (
          <div className="absolute inset-x-6 top-6 h-24" aria-hidden>
            <span className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-[#d6453d]/50" />
            <span className="absolute top-4 flex size-16 -translate-x-1/2 items-center justify-center rounded-full border-[6px] border-[#d6453d] bg-white" style={{ left: `${target * 100}%` }}><span className="size-5 rounded-full bg-[#d6453d]" /></span>
          </div>
        )}
        {step === "premio" && <motion.span className="absolute right-8 top-6 flex size-32 items-center justify-center rounded-full bg-card text-center text-sm font-semibold shadow" initial={reduce ? false : { opacity: 0, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ duration: 0.35, ease: EASE_OUT }}><GiftIcon className="mr-1 size-5 text-primary" aria-hidden />{prize.name}</motion.span>}
        <span className="absolute bottom-2 left-3 block h-32" aria-hidden><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
      </div>
      <div className="flex flex-col gap-2" aria-live="polite">
        {step === "rueda" && (rode ? (
          <button type="button" onClick={() => setStep("algodon")} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Ir por algodón de azúcar</button>
        ) : (
          <button type="button" disabled={spinning} onClick={ride} className={cn(btn, "self-start bg-primary text-primary-foreground disabled:opacity-60")}>{spinning ? "Dando la vuelta…" : "Subir a la rueda de la fortuna"}</button>
        ))}
        {step === "algodon" && (cotton >= COTTON_SPINS ? (
          <button type="button" onClick={() => setStep("tiro")} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Ir al tiro al blanco</button>
        ) : (
          <><p className="text-sm font-semibold">Gira la varita para hacer el algodón ({cotton} de {COTTON_SPINS}).</p><button type="button" onClick={spin} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Girar</button></>
        ))}
        {step === "tiro" && (
          <>
            <p className="text-sm font-semibold">Tira cuando el blanco pase por la línea roja. Tiros: {shots.length} de {FAIR_SHOTS} · Le diste a {hits}.</p>
            <button type="button" disabled={shots.length >= FAIR_SHOTS} onClick={shoot} className="flex min-h-14 items-center gap-2 self-start rounded-2xl bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-[0.97] disabled:opacity-60"><Target className="size-5" aria-hidden /> ¡Tirar!</button>
          </>
        )}
        {step === "premio" && <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Le diste al blanco {hits} de {FAIR_SHOTS} veces. Premio: {prize.name.toLowerCase()}{prize.size === "grande" ? " (¡el grande!)" : ""}.</p>}
      </div>
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>{step === "premio" ? "Volver" : "Salir de la feria"}</button>
    </div>
  );
}

// ── Cumpleaños de sus amigos ────────────────────────────────────────

const friendOf = (id: string) => FRIENDS.find((f) => f.id === id) ?? FRIENDS[0];
const mdText = (md: string) => { const [m, d] = md.split("-").map(Number); return `${d} de ${MONTHS[m - 1]}`; };

/** Los cumpleaños de los perritos del parque: se festejan ese día o en la semana. */
export function FriendBdayScene({ now, done, onLine, onClose }: { now: number; done?: Record<string, number>; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const list = friendBdays(now, done);
  const next = nextFriendBday(now, done);
  const [sel, setSel] = useState<string | null>(null);
  const [gift, setGift] = useState<Gift | null>(null);
  const [res, setRes] = useState<{ id: string; fav: boolean; gift: Gift } | null>(null);
  const cur = list.find((b) => b.id === sel);

  async function celebrate() {
    if (!cur || !gift) return;
    sfx("success");
    const r = await celebrateFriend(cur.id, cur.year, gift);
    const f = friendOf(cur.id);
    setRes({ id: cur.id, fav: !!r?.fav, gift });
    setSel(null);
    onLine(doneLine(r, r?.fav ? `¡${f.name} brincó de gusto! Era justo lo que quería.` : `¡Le cantamos las mañanitas a ${f.name}! Le encantó su regalo.`));
  }

  return (
    <div className="flex flex-col gap-3">
      {res && (
        <motion.div className="flex items-center gap-3 rounded-3xl bg-[#fff3d6] p-3 text-[#3a2a22] dark:bg-card dark:text-foreground" initial={reduce ? false : { opacity: 0, transform: "translateY(8px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: 0.3, ease: EASE_OUT }}>
          <span className="block size-16 shrink-0"><PuppyArt friend={friendOf(res.id)} /></span>
          <p className="text-sm">Le cantaron las mañanitas a {friendOf(res.id).name} y le dieron {GIFTS[res.gift].toLowerCase()}. {res.fav ? "¡Era su regalo favorito!" : `Su favorito era otro: ${GIFTS[FRIEND_BDAYS[res.id].likes].toLowerCase()}. Igual le encantó.`}</p>
        </motion.div>
      )}
      {list.length === 0 ? (
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Hoy no es el cumpleaños de nadie. {next ? `El que sigue es el de ${friendOf(next.id).name}: ${next.days === 0 ? "¡hoy!" : next.days === 1 ? "mañana" : `en ${next.days} días`}.` : ""}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">¡Hay cumpleaños para festejar!</p>
          <ul className="flex flex-col gap-2">
            {list.map((b) => (
              <li key={b.id}>
                <button type="button" aria-pressed={sel === b.id} onClick={() => { setSel(b.id); setGift(null); sfx("click"); }} className={cn("flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 bg-card p-2 text-left text-sm active:scale-[0.97]", sel === b.id ? "border-primary" : "border-border")}>
                  <span className="block size-10 shrink-0"><PuppyArt friend={friendOf(b.id)} /></span>
                  <span><span className="block font-semibold">{friendOf(b.id).name}</span>{b.late === 0 ? "¡Es hoy!" : `Fue hace ${b.late} ${b.late === 1 ? "día" : "días"}: cumpleaños atrasado.`}</span>
                  <Cake className="ml-auto size-6 text-primary" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {cur && (
        <div className="flex flex-col gap-2 rounded-3xl border-2 border-border bg-card p-3">
          <p className="text-sm"><span className="font-semibold">Pista:</span> {FRIEND_BDAYS[cur.id].hint}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Regalo">
            {GIFT_IDS.map((g) => <button key={g} type="button" role="radio" aria-checked={gift === g} onClick={() => setGift(g)} className={cn(chip, gift === g ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary")}>{GIFTS[g]}</button>)}
          </div>
          <button type="button" disabled={!gift} onClick={() => void celebrate()} className={cn(btn, "self-start bg-primary text-primary-foreground disabled:opacity-50")}>Cantar las mañanitas y dar el regalo</button>
        </div>
      )}
      <section aria-labelledby="calendario" className="flex flex-col gap-2">
        <h3 id="calendario" className="text-sm font-semibold">Calendario de cumpleaños</h3>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FRIENDS.map((f) => (
            <li key={f.id} className="flex items-center gap-2 rounded-2xl bg-secondary/60 p-2 text-xs">
              <span className="block size-8 shrink-0"><PuppyArt friend={f} /></span>
              <span><span className="block font-semibold">{f.name}</span>{mdText(FRIEND_BDAYS[f.id].md)}</span>{done?.[f.id] === new Date(now).getFullYear() && <Check className="ml-auto size-4 text-primary" aria-label="Ya se festejó" />}
            </li>
          ))}
        </ul>
      </section>
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
    </div>
  );
}
