"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BedDouble, Check, Circle, Coffee, Cookie, Flag, Flashlight, Gem, Heart, Package, Popcorn, Shell as ShellIcon, Sparkles, Sprout, Star, ToyBrick, UtensilsCrossed, Wind } from "lucide-react";
import { MochitoFigure } from "@/components/mochito-figure";
import { PuppyArt } from "@/components/puppy-art";
import { finishBeach, finishChore, finishKite, finishSleepover } from "@/lib/mochito-actions";
import {
  CASTLE, CHORES, FORT_PICK, FORT_THINGS, KITE_COLORS, KITE_TRIES, SHADOWS, SHEETS, SHELLS, SHELL_IDS, SNACKS, TAILS, WAVES, WAVE_MS, beachOf, choresOf, kiteGain, shadowStory, socksOf, windAt,
  type Beach, type CastleBase, type CastleExtra, type ChoreId, type Chores, type FortThing, type Kite, type Shadow, type Shell, type Snack, type Tail,
} from "@/lib/mochito-extra-6";
import { rng, shuffle } from "@/lib/game/engine";
import type { Groom } from "@/lib/mochito-extra";
import { FRIENDS, type Friend } from "@/lib/mochito-play";
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

// ── Volar barrilete ─────────────────────────────────────────────────

function KiteArt({ a, b, tail, className }: { a: string; b: string; tail: Tail; className?: string }) {
  const len = tail === "larga" ? 5 : 3;
  return (
    <svg viewBox="0 0 60 110" className={className} aria-hidden>
      <polygon points="30,2 56,34 30,70 4,34" fill={a} stroke="rgb(0 0 0 / 0.3)" strokeWidth="1.5" />
      <polygon points="30,2 56,34 30,34" fill={b} />
      <polygon points="30,34 4,34 30,70" fill={b} />
      <line x1="30" y1="2" x2="30" y2="70" stroke="rgb(0 0 0 / 0.35)" strokeWidth="1.2" />
      <line x1="4" y1="34" x2="56" y2="34" stroke="rgb(0 0 0 / 0.35)" strokeWidth="1.2" />
      <path d={`M30 70 ${Array.from({ length: len }, (_, i) => `Q ${i % 2 ? 22 : 38} ${76 + i * 7} 30 ${80 + i * 7}`).join(" ")}`} fill="none" stroke="#5a4a42" strokeWidth="1.5" />
      {Array.from({ length: len }, (_, i) => <rect key={i} x="26" y={77 + i * 7} width="8" height="4" rx="1" fill={i % 2 ? a : b} />)}
    </svg>
  );
}

/** El barrilete: lo armas (colores y cola) y lo vuelas soltando hilo cuando sopla fuerte. */
export function KiteScene({ day, kite, look, onLine, onClose }: { day: string; kite?: Kite; look: Look; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [a, setA] = useState<string>(KITE_COLORS[0].h);
  const [b, setB] = useState<string>(KITE_COLORS[1].h);
  const [tail, setTail] = useState<Tail>("larga");
  const [phase, setPhase] = useState<"armar" | "volar" | "fin">("armar");
  const [t, setT] = useState(0);
  const [height, setHeight] = useState(10);
  const [tries, setTries] = useState(0);
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState<{ coins: number; record: boolean } | null>(null);
  const t0 = useRef(0);
  const first = kite?.last !== day;

  useEffect(() => {
    if (phase !== "volar") return;
    t0.current = Date.now();
    const id = setInterval(() => setT(Date.now() - t0.current), 50);
    return () => clearInterval(id);
  }, [phase]);

  const wind = windAt(day, t);
  const good = TAILS[tail].good;

  async function land(h: number) {
    setPhase("fin");
    const r = await finishKite(h);
    setResult({ coins: r.coins, record: r.record });
    sfx("success");
    onLine(doneLine(r, h >= 100 ? `¡Llegó a ${h} metros! Ya estaba entre las nubes.` : `Lo bajamos despacito. Llegó a ${h} metros.`));
  }
  function release() {
    if (phase !== "volar") return;
    const g = kiteGain(wind, tail);
    const h = Math.max(0, height + g);
    setHeight(h);
    const n = tries + 1;
    setTries(n);
    if (g > 4) { setMsg(`¡Buen viento! Subió ${g} metros.`); sfx("coin"); } else if (g > 0) { setMsg("Subió un poquito. Espera a que sople más fuerte."); sfx("click"); } else { setMsg(`Sin viento se cae: bajó ${-g} metros.`); sfx("sad"); }
    if (n >= KITE_TRIES) void land(h);
  }

  if (phase === "armar") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">Arma tu barrilete. Elige dos colores y la cola. La cola larga es más fácil de volar; la corta sube más con viento fuerte.</p>
        <div className="flex items-center justify-center rounded-3xl bg-sky-100 py-3 dark:bg-sky-950"><KiteArt a={a} b={b} tail={tail} className="h-36" /></div>
        <p className="text-sm font-semibold">Color de afuera</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Color de afuera">
          {KITE_COLORS.map((c) => <button key={c.n} type="button" aria-pressed={a === c.h} aria-label={c.n} onClick={() => { setA(c.h); sfx("click"); }} className={cn("size-11 rounded-full border-4 active:scale-[0.97]", a === c.h ? "border-foreground" : "border-transparent")} style={{ background: c.h }} />)}
        </div>
        <p className="text-sm font-semibold">Color de adentro</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Color de adentro">
          {KITE_COLORS.map((c) => <button key={c.n} type="button" aria-pressed={b === c.h} aria-label={c.n} onClick={() => { setB(c.h); sfx("click"); }} className={cn("size-11 rounded-full border-4 active:scale-[0.97]", b === c.h ? "border-foreground" : "border-transparent")} style={{ background: c.h }} />)}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Cola">
          {(Object.keys(TAILS) as Tail[]).map((k) => <button key={k} type="button" aria-pressed={tail === k} onClick={() => { setTail(k); sfx("click"); }} className={cn(chip, tail === k ? "border-primary bg-primary/10" : "border-border")}>{TAILS[k].name}</button>)}
        </div>
        {!first && <p className="text-sm text-muted-foreground">Hoy ya volamos (lo más alto: {kite?.best ?? 0} m). Puedes volarlo otra vez, pero las monedas son del primer vuelo del día.</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setPhase("volar"); setMsg("Cuando la flecha esté en lo verde, suelta hilo."); sfx("click"); }} className={cn(btn, "bg-primary text-primary-foreground")}>¡A volar!</button>
          <button type="button" onClick={onClose} className={cn(btn, "bg-secondary")}>Salir</button>
        </div>
      </div>
    );
  }

  const top = Math.max(4, 70 - Math.min(height, 150) * 0.44);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" aria-live="polite">Altura: <b>{height} m</b> · Te quedan {KITE_TRIES - tries} jalones{phase === "fin" ? "" : "."}</p>
      <div className="relative h-60 overflow-hidden rounded-3xl bg-gradient-to-b from-sky-300 to-sky-100 dark:from-sky-900 dark:to-sky-950">
        {[{ l: 8, t: 10 }, { l: 60, t: 6 }, { l: 34, t: 18 }].map((c) => <span key={c.l} className="absolute block h-6 w-16 rounded-full bg-white/80 dark:bg-white/30" style={{ left: `${c.l}%`, top: `${c.t}%` }} aria-hidden />)}
        <span className="absolute bottom-0 left-0 right-0 block h-8 bg-[#7cc576]" aria-hidden />
        <span className="absolute bottom-3 left-[12%] block h-20" aria-hidden><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
        <svg className="absolute inset-0 h-full w-full" aria-hidden><line x1="22%" y1="78%" x2="62%" y2={`${top + 10}%`} stroke="#5a4a42" strokeWidth="1" /></svg>
        <motion.span className="absolute left-[56%] block h-24" style={{ top: `${top}%` }} animate={reduce || phase === "fin" ? undefined : { transform: ["rotate(-6deg)", "rotate(6deg)", "rotate(-6deg)"] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
          <KiteArt a={a} b={b} tail={tail} className="h-full" />
        </motion.span>
      </div>
      {phase === "volar" && (
        <>
          <div className="relative h-8 overflow-hidden rounded-full bg-secondary" role="meter" aria-label="Fuerza del viento" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(wind * 100)}>
            <span className="absolute inset-y-0 block bg-amber-300/70" style={{ left: `${(good - 0.25) * 100}%`, width: `${25}%` }} aria-hidden />
            <span className="absolute inset-y-0 right-0 block bg-emerald-400/80" style={{ left: `${good * 100}%` }} aria-hidden />
            <span className="absolute inset-y-0 block w-1.5 -translate-x-1/2 rounded-full bg-foreground" style={{ left: `${wind * 100}%` }} aria-hidden />
            <Wind className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          </div>
          <p className="text-sm font-semibold" aria-live="polite">{msg}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={release} className={cn(btn, "min-h-14 bg-primary px-8 text-base text-primary-foreground")}>Soltar hilo</button>
            <button type="button" onClick={() => void land(height)} className={cn(btn, "bg-secondary")}>Bajarlo ya</button>
          </div>
        </>
      )}
      {phase === "fin" && (
        <>
          <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">
            Llegó a {height} metros.{result?.record ? " ¡Es tu récord!" : ""}{result && result.coins > 0 ? ` Ganaste ${result.coins} ${result.coins === 1 ? "moneda" : "monedas"}.` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setPhase("armar"); setHeight(10); setTries(0); setMsg(""); setResult(null); }} className={cn(btn, "bg-secondary")}>Volar otra vez</button>
            <button type="button" onClick={onClose} className={cn(btn, "bg-secondary")}>Volver</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Día de playa ────────────────────────────────────────────────────

const SHELL_ICON: Record<Shell, typeof Star> = { almeja: ShellIcon, caracol: ShellIcon, abanico: ShellIcon, piedra: Circle, estrella: Star, perla: Gem };

function CastleArt({ base, towers, extra }: { base: CastleBase | null; towers: number; extra: CastleExtra[] }) {
  return (
    <div className="relative flex h-32 w-52 items-end justify-center" aria-hidden>
      {extra.includes("foso") && <span className="absolute bottom-0 h-4 w-52 rounded-full bg-sky-400/70" />}
      {base && <span className={cn("relative z-10 mb-2 block h-14 w-36 bg-[#e8c98f]", base === "redonda" ? "rounded-t-full" : "rounded-t-md")} />}
      {base && Array.from({ length: towers }, (_, i) => {
        const left = towers === 1 ? 50 : towers === 2 ? [28, 72][i] : [22, 50, 78][i];
        return (
          <span key={i} className="absolute z-20 block w-8 bg-[#dcb878]" style={{ left: `${left}%`, bottom: 48, height: i === 1 && towers === 3 ? 48 : 36, transform: "translateX(-50%)" }}>
            <span className="absolute -top-2 left-0 right-0 flex justify-between"><span className="block size-2 bg-[#dcb878]" /><span className="block size-2 bg-[#dcb878]" /><span className="block size-2 bg-[#dcb878]" /></span>
            {extra.includes("bandera") && i === Math.floor(towers / 2) && <Flag className="absolute -top-8 left-1/2 size-6 -translate-x-1/4 text-[#d6453d]" />}
          </span>
        );
      })}
      {base && extra.includes("conchas") && <span className="absolute bottom-4 z-20 flex gap-3">{[0, 1, 2].map((k) => <ShellIcon key={k} className="size-4 text-[#f6a98a]" />)}</span>}
      {base && <span className="absolute bottom-2 z-20 block h-6 w-5 rounded-t-full bg-[#b9925a]" />}
    </div>
  );
}

/** La playa: primero un castillo de arena por partes y luego juntar lo que deja cada ola. Una vez al día. */
export function BeachScene({ day, beach, look, onLine, onClose }: { day: string; beach?: Beach; look: Look; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const done = beach?.last === day;
  const waves = beachOf(day);
  const [phase, setPhase] = useState<"castillo" | "olas" | "fin">("castillo");
  const [base, setBase] = useState<CastleBase | null>(null);
  const [towers, setTowers] = useState(0);
  const [extra, setExtra] = useState<CastleExtra[]>([]);
  const [wave, setWave] = useState(0);
  const [left, setLeft] = useState(WAVE_MS);
  const [got, setGot] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [coins, setCoins] = useState(0);
  const ends = useRef(0);

  useEffect(() => {
    if (phase !== "olas") return;
    ends.current = Date.now() + WAVE_MS;
    const id = setInterval(() => {
      const l = ends.current - Date.now();
      setLeft(Math.max(0, l));
      if (l <= 0) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [phase, wave]);

  const found = got.map((id) => waves.flat().find((s) => s.id === id)!.kind);
  async function nextWave() {
    if (wave + 1 < WAVES) { setWave(wave + 1); setLeft(WAVE_MS); setMsg("¡Ahí viene otra ola!"); sfx("click"); return; }
    setPhase("fin");
    const r = await finishBeach(found);
    setCoins(r?.coins ?? 0);
    sfx("success");
    onLine(doneLine(r, `¡Qué día de playa! Juntamos ${found.length} cosas del mar.`));
  }
  useEffect(() => { if (phase === "olas" && left <= 0) { const id = setTimeout(() => void nextWave(), 300); return () => clearTimeout(id); } });

  const collection = (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Tu colección del mar">
      {SHELL_IDS.map((s) => {
        const n = (beach?.shells?.[s] ?? 0) + (phase === "fin" && !done ? found.filter((x) => x === s).length : 0);
        const I = SHELL_ICON[s];
        return (
          <span key={s} className={cn("flex flex-col items-center gap-1 rounded-2xl bg-card p-2 text-center text-xs", !n && "opacity-50")}>
            <I className="size-7" style={{ color: n ? "#7a5a48" : undefined }} aria-hidden fill={n ? SHELLS[s].color : "none"} strokeWidth={1.6} />
            <span className="font-semibold">{n ? SHELLS[s].name : "???"}</span>
            {n > 0 && <span className="text-muted-foreground">×{n}</span>}
          </span>
        );
      })}
    </div>
  );

  if (done && phase === "castillo") {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Hoy ya fuimos a la playa. Esta es tu colección; mañana el mar trae más.</p>
        {collection}
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }
  if (phase === "castillo") {
    const toggle = (x: CastleExtra) => setExtra((e) => (e.includes(x) ? e.filter((y) => y !== x) : [...e, x]));
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">Primero, un castillo de arena. Hazlo por partes: la base, las torres y los adornos.</p>
        <div className="flex justify-center rounded-3xl bg-gradient-to-b from-sky-200 via-sky-100 to-[#f3dfb0] pt-4 dark:from-sky-900 dark:via-sky-950 dark:to-[#6b5a3a]"><CastleArt base={base} towers={towers} extra={extra} /></div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Base">{(Object.keys(CASTLE.base) as CastleBase[]).map((k) => <button key={k} type="button" aria-pressed={base === k} onClick={() => { setBase(k); if (!towers) setTowers(1); sfx("click"); }} className={cn(chip, base === k ? "border-primary bg-primary/10" : "border-border")}>Base {CASTLE.base[k].toLowerCase()}</button>)}</div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Torres">{([1, 2, 3] as const).map((k) => <button key={k} type="button" disabled={!base} aria-pressed={towers === k} onClick={() => { setTowers(k); sfx("click"); }} className={cn(chip, towers === k ? "border-primary bg-primary/10" : "border-border", "disabled:opacity-50")}>{CASTLE.torres[k]}</button>)}</div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Adornos">{(Object.keys(CASTLE.extra) as CastleExtra[]).map((k) => <button key={k} type="button" disabled={!base} aria-pressed={extra.includes(k)} onClick={() => { toggle(k); sfx("click"); }} className={cn(chip, extra.includes(k) ? "border-primary bg-primary/10" : "border-border", "disabled:opacity-50")}>{CASTLE.extra[k]}</button>)}</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!base} onClick={() => { setPhase("olas"); setMsg("Baja la ola… ¡rápido, junta lo que dejó!"); sfx("success"); onLine("¡Qué castillo! Ahora vamos a la orilla a buscar conchitas."); }} className={cn(btn, "bg-primary text-primary-foreground disabled:opacity-50")}>Listo, a la orilla</button>
          <button type="button" onClick={onClose} className={cn(btn, "bg-secondary")}>Salir</button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" aria-live="polite">{phase === "olas" ? `Ola ${wave + 1} de ${WAVES} · Se la lleva el mar en ${Math.ceil(left / 1000)} s · Juntaste ${got.length}` : `Juntaste ${got.length} cosas del mar.`}</p>
      {phase === "olas" && (
        <div className="relative h-56 overflow-hidden rounded-3xl bg-[#f3dfb0] dark:bg-[#6b5a3a]">
          <motion.span key={`ola${wave}`} className="absolute inset-x-0 top-0 block h-full bg-sky-400/70" initial={reduce ? { transform: "translateY(-75%)" } : { transform: "translateY(-10%)" }} animate={{ transform: "translateY(-75%)" }} transition={{ duration: 0.8, ease: EASE_OUT }} aria-hidden />
          <span className="absolute bottom-2 right-2 block h-20" aria-hidden><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
          {waves[wave].map((s) => {
            if (got.includes(s.id)) return null;
            const I = SHELL_ICON[s.kind];
            return (
              <motion.button key={s.id} type="button" aria-label={SHELLS[s.kind].name} onClick={() => { setGot((g) => [...g, s.id]); setMsg(SHELLS[s.kind].rare ? `¡Una ${SHELLS[s.kind].name.toLowerCase()}! Esa es rara.` : `${SHELLS[s.kind].name}.`); sfx(SHELLS[s.kind].rare ? "cash" : "coin"); }} className="absolute flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/50 active:scale-[0.97]" style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.5, ease: EASE_OUT }}>
                <I className="size-8" style={{ color: "#7a5a48" }} fill={SHELLS[s.kind].color} strokeWidth={1.6} aria-hidden />
              </motion.button>
            );
          })}
        </div>
      )}
      {msg && phase === "olas" && <p className="text-sm font-semibold">{msg}</p>}
      {phase === "olas" && <button type="button" onClick={() => void nextWave()} className={cn(btn, "self-start bg-secondary")}>{wave + 1 < WAVES ? "Siguiente ola" : "Terminar"}</button>}
      {phase === "fin" && (
        <>
          <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">¡Día de playa! {coins > 0 ? `Ganaste ${coins} ${coins === 1 ? "moneda" : "monedas"}.` : "Mañana el mar trae más."}</p>
          {collection}
          <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
        </>
      )}
    </div>
  );
}

// ── Pijamada ────────────────────────────────────────────────────────

const THING_ICON: Record<FortThing, typeof Star> = { almohadas: BedDouble, lucecitas: Sparkles, cobijas: Package, peluches: Heart, banderines: Flag };
const SNACK_ICON: Record<Snack, typeof Star> = { palomitas: Popcorn, chocolate: Coffee, galletas: Cookie };

/** Pijamada: invitas a un amigo, arman la casita de sábanas, eligen botana y cuentan un cuento de linterna. Una al día. */
export function SleepoverScene({ done, friends, look, onLine, onClose }: { done: boolean; friends: Friend[]; look: Look; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const list = friends.length ? friends : FRIENDS.slice(0, 3);
  const [step, setStep] = useState<"amigo" | "casita" | "botana" | "cuento" | "noche">("amigo");
  const [friend, setFriend] = useState<Friend | null>(null);
  const [sheet, setSheet] = useState<string>(SHEETS[0].h);
  const [things, setThings] = useState<FortThing[]>([]);
  const [snack, setSnack] = useState<Snack | null>(null);
  const [shadow, setShadow] = useState<Shadow | null>(null);
  const [line, setLine] = useState(0);

  if (done && step === "amigo") {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Anoche hubo pijamada y todavía tenemos sueño. Mañana podemos invitar a alguien más.</p>
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }

  const story = shadow && friend ? shadowStory(shadow, friend.name) : [];
  const dark = step === "cuento" || step === "noche";
  const fort = (
    <div className={cn("relative flex h-48 items-end justify-center overflow-hidden rounded-3xl", dark ? "bg-[#1f2340]" : "bg-[#f7ecd9] dark:bg-[#3a3346]")}>
      {step === "cuento" && <motion.span className="absolute left-1/2 top-3 block h-24 w-28 -translate-x-1/2 rounded-full bg-yellow-100/30" animate={reduce ? undefined : { opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} aria-hidden />}
      <svg viewBox="0 0 200 120" className="absolute bottom-0 h-40 w-64" aria-hidden>
        <polygon points="100,8 190,118 10,118" fill={sheet} opacity={dark ? 0.55 : 0.9} />
        <polygon points="100,8 120,118 80,118" fill={dark ? "#14172b" : "#3a2a22"} opacity="0.5" />
      </svg>
      {things.includes("banderines") && <span className="absolute left-1/2 top-6 flex -translate-x-1/2 gap-2" aria-hidden>{["#d6453d", "#f6c744", "#3f74c4", "#4a9a5b"].map((c) => <span key={c} className="block size-0 border-x-[6px] border-t-[10px] border-x-transparent" style={{ borderTopColor: c }} />)}</span>}
      {things.includes("lucecitas") && <span className="absolute left-1/2 top-14 flex -translate-x-1/2 gap-3" aria-hidden>{[0, 1, 2, 3, 4].map((k) => <span key={k} className="block size-2 rounded-full bg-yellow-300 shadow-[0_0_8px_#fde047]" />)}</span>}
      <span className="absolute bottom-1 left-[30%] block h-20" aria-hidden><MochitoFigure outfit={look.outfit} groom={look.groom} sleeping={step === "noche"} /></span>
      {friend && <span className={cn("absolute bottom-1 right-[28%] block size-16", step === "noche" && "opacity-70")} aria-hidden><PuppyArt friend={friend} /></span>}
      {things.includes("almohadas") && <span className="absolute bottom-1 left-[46%] block h-4 w-10 rounded-full bg-white" aria-hidden />}
      {things.includes("peluches") && <Heart className="absolute bottom-2 right-[18%] size-6 text-[#e27aa3]" fill="#e27aa3" aria-hidden />}
      {step === "noche" && <span className="absolute right-4 top-3 text-2xl font-heading text-white/80" aria-hidden>z z z</span>}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {step !== "amigo" && fort}
      {step === "amigo" && (
        <>
          <p className="text-sm">¿A quién invitamos a dormir? Su familia ya dio permiso.</p>
          <div className="grid grid-cols-3 gap-2">
            {list.map((f) => (
              <button key={f.id} type="button" onClick={() => { setFriend(f); setStep("casita"); sfx("door"); onLine(`¡${f.name} trajo su almohada! Vamos a armar la casita.`); }} className="flex flex-col items-center gap-1 rounded-3xl border-2 border-border bg-card p-2 text-sm font-semibold active:scale-[0.97]">
                <span className="block size-14"><PuppyArt friend={f} /></span>{f.name}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Salir</button>
        </>
      )}
      {step === "casita" && (
        <>
          <p className="text-sm">Elige la sábana y {FORT_PICK} cosas para la casita ({things.length} de {FORT_PICK}).</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Sábana">
            {SHEETS.map((s) => <button key={s.n} type="button" aria-pressed={sheet === s.h} onClick={() => { setSheet(s.h); sfx("click"); }} className={cn(chip, sheet === s.h ? "border-foreground" : "border-transparent")} style={{ background: s.h, color: "#2b2622" }}>{s.n}</button>)}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Cosas para la casita">
            {(Object.keys(FORT_THINGS) as FortThing[]).map((k) => {
              const on = things.includes(k);
              const I = THING_ICON[k];
              return <button key={k} type="button" aria-pressed={on} disabled={!on && things.length >= FORT_PICK} onClick={() => { setThings((t) => (on ? t.filter((x) => x !== k) : [...t, k])); sfx("click"); }} className={cn(chip, "flex items-center gap-1.5 disabled:opacity-50", on ? "border-primary bg-primary/10" : "border-border")}><I className="size-4" aria-hidden /> {FORT_THINGS[k]}</button>;
            })}
          </div>
          <button type="button" disabled={things.length < FORT_PICK} onClick={() => { setStep("botana"); sfx("success"); }} className={cn(btn, "self-start bg-primary text-primary-foreground disabled:opacity-50")}>¡Quedó lista!</button>
        </>
      )}
      {step === "botana" && (
        <>
          <p className="text-sm">¿Qué comemos antes del cuento?</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SNACKS) as Snack[]).map((k) => { const I = SNACK_ICON[k]; return <button key={k} type="button" onClick={() => { setSnack(k); setStep("cuento"); sfx("serve"); onLine(`¡Mmm, ${SNACKS[k]}! Ahora apaguen la luz…`); }} className={cn(chip, "flex items-center gap-1.5 border-border capitalize")}><I className="size-4" aria-hidden /> {SNACKS[k]}</button>; })}
          </div>
        </>
      )}
      {step === "cuento" && !shadow && (
        <>
          <p className="text-sm">Cuento de linterna. ¿Qué sombra aparece en la pared?</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SHADOWS) as Shadow[]).map((k) => <button key={k} type="button" onClick={() => { setShadow(k); setLine(0); sfx("click"); }} className={cn(chip, "flex items-center gap-1.5 border-border")}><Flashlight className="size-4" aria-hidden /> {SHADOWS[k][0].toUpperCase() + SHADOWS[k].slice(1)}</button>)}
          </div>
        </>
      )}
      {step === "cuento" && shadow && (
        <>
          <motion.p key={line} className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm" initial={reduce ? false : { opacity: 0, transform: "translateY(6px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: 0.25, ease: EASE_OUT }} aria-live="polite">{story[line]}</motion.p>
          {line + 1 < story.length ? (
            <button type="button" onClick={() => { setLine(line + 1); sfx("click"); }} className={cn(btn, "self-start bg-primary text-primary-foreground")}>¿Y luego?</button>
          ) : (
            <button type="button" onClick={async () => { setStep("noche"); const r = await finishSleepover(friend!.id, SNACKS[snack!]); sfx("success"); onLine(doneLine(r, `Buenas noches, ${friend!.name}. ¡Fue la mejor pijamada!`)); }} className={cn(btn, "self-start bg-primary text-primary-foreground")}><Flashlight className="mr-1.5 inline size-4" aria-hidden />Apagar la linterna</button>
          )}
        </>
      )}
      {step === "noche" && (
        <>
          <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Se quedaron dormidos. Ahora {friend?.name} y Mochito son todavía más unidos.</p>
          <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
        </>
      )}
    </div>
  );
}

// ── Ayudar en casa ──────────────────────────────────────────────────

const CHORE_ICON: Record<ChoreId, typeof Star> = { cama: BedDouble, regar: Sprout, platos: UtensilsCrossed, juguetes: ToyBrick, ropa: Heart, basura: Package };
const SOCK: Record<string, string> = { Rojo: "#d6453d", Azul: "#3f74c4", Amarillo: "#f6c744", Verde: "#4a9a5b" };

function ChoreTask({ id, day, onDone }: { id: ChoreId; day: string; onDone: () => void }) {
  const reduce = useReducedMotion();
  const c = CHORES[id];
  const items: readonly string[] = c.items;
  const [order] = useState(() => shuffle([...items], rng(`${day}:${id}`)));
  const [next, setNext] = useState(0);
  const [taps, setTaps] = useState<number[]>(() => items.map(() => 0));
  const [socks] = useState(() => socksOf(day));
  const [open, setOpen] = useState<number[]>([]);
  const [paired, setPaired] = useState<number[]>([]);
  const [msg, setMsg] = useState<string>(c.hint);
  const [shake, setShake] = useState(0);
  const need = "taps" in c ? c.taps : 0;

  function tapOrder(x: string) {
    if (x !== items[next]) { setMsg(`Todavía no. ${c.hint}`); setShake((s) => s + 1); sfx("sad"); return; }
    const n = next + 1;
    setNext(n); setMsg(`¡Bien! ${x}.`); sfx("coin");
    if (n >= items.length) onDone();
  }
  function tapMany(i: number) {
    if (taps[i] >= need) return;
    const t = taps.map((v, k) => (k === i ? v + 1 : v));
    setTaps(t); sfx(t[i] >= need ? "coin" : "click");
    if (t.every((v) => v >= need)) onDone();
  }
  function tapSock(i: number) {
    if (paired.includes(i) || open.includes(i)) return;
    if (!open.length) { setOpen([i]); sfx("click"); return; }
    const j = open[0];
    if (socks[i] === socks[j]) {
      const p = [...paired, i, j];
      setPaired(p); setOpen([]); setMsg(`¡Par ${socks[i].toLowerCase()}!`); sfx("coin");
      if (p.length >= socks.length) onDone();
    } else { setOpen([j, i]); setMsg("Esos no son del mismo color."); sfx("sad"); setTimeout(() => setOpen([]), 700); }
  }

  return (
    <div className="flex flex-col gap-3">
      <motion.p key={shake} className="text-sm font-semibold" aria-live="polite" initial={reduce || !shake ? false : { transform: "translateX(-4px)" }} animate={{ transform: "translateX(0px)" }} transition={{ duration: 0.2, ease: EASE_OUT }}>{msg}</motion.p>
      {c.kind === "orden" && (
        <div className="flex flex-wrap gap-2">
          {order.map((x) => { const ok = items.indexOf(x) < next; return <button key={x} type="button" disabled={ok} onClick={() => tapOrder(x)} className={cn(chip, "flex items-center gap-1.5", ok ? "border-emerald-500 bg-emerald-500/10" : "border-border")}>{ok && <Check className="size-4" aria-hidden />}{x}</button>; })}
        </div>
      )}
      {c.kind === "toques" && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {items.map((x, i) => (
            <button key={x} type="button" onClick={() => tapMany(i)} aria-label={`${x}: ${taps[i]} de ${need}`} className={cn("flex min-h-20 flex-col items-center justify-center gap-1 rounded-3xl border-2 p-2 text-sm font-semibold active:scale-[0.97]", taps[i] >= need ? "border-emerald-500 bg-emerald-500/10" : "border-border bg-card")}>
              {x}
              <span className="flex gap-1" aria-hidden>{Array.from({ length: need }, (_, k) => <span key={k} className={cn("block size-2.5 rounded-full", k < taps[i] ? (id === "regar" ? "bg-sky-500" : "bg-emerald-500") : "bg-muted")} />)}</span>
            </button>
          ))}
        </div>
      )}
      {c.kind === "parejas" && (
        <div className="grid grid-cols-4 gap-2">
          {socks.map((col, i) => {
            const up = open.includes(i) || paired.includes(i);
            return (
              <button key={i} type="button" disabled={paired.includes(i)} onClick={() => tapSock(i)} aria-label={up ? `Calcetín ${col.toLowerCase()}` : "Calcetín volteado"} className={cn("flex aspect-square items-center justify-center rounded-2xl border-2 active:scale-[0.97]", paired.includes(i) ? "border-emerald-500 opacity-60" : "border-border bg-card")}>
                {up ? <span className="relative block h-10 w-6" aria-hidden><span className="absolute left-0 top-0 block h-8 w-4 rounded-t-md" style={{ background: SOCK[col] }} /><span className="absolute bottom-0 left-0 block h-3 w-6 rounded-full" style={{ background: SOCK[col] }} /></span> : <span className="block size-6 rounded-full bg-muted" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Ayudar en casa: cuatro tareas del día, cada una con sus pasitos. Una estrella por tarea. */
export function ChoresScene({ day, chores, onLine, onClose }: { day: string; chores?: Chores; onLine: (s: string) => void; onClose: () => void }) {
  const today = choresOf(day);
  const [done, setDone] = useState<ChoreId[]>(chores?.day === day ? chores.done ?? [] : []);
  const [doing, setDoing] = useState<ChoreId | null>(null);
  const stars = (chores?.stars ?? 0) + done.length - (chores?.day === day ? chores.done?.length ?? 0 : 0);

  async function finish(id: ChoreId) {
    const d = [...done, id];
    setDone(d); setDoing(null);
    const r = await finishChore(id);
    sfx("success");
    onLine(doneLine(r, r?.all ? "¡Hicimos todas las tareas de hoy! La casa quedó brillando." : `¡Listo! ${CHORES[id].name}. Una estrella más.`));
  }

  if (doing) {
    return (
      <div className="flex flex-col gap-3">
        <p className="font-heading text-xl">{CHORES[doing].name}</p>
        <ChoreTask key={doing} id={doing} day={day} onDone={() => void finish(doing)} />
        <button type="button" onClick={() => setDoing(null)} className={cn(btn, "self-start bg-secondary")}>Luego la hago</button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">Las tareas de hoy. Cada una da una estrella y una moneda; si haces las {today.length}, hay premio extra. Estrellas: <b>{stars}</b>.</p>
      <ul className="flex flex-col gap-2">
        {today.map((id) => {
          const I = CHORE_ICON[id];
          const ok = done.includes(id);
          return (
            <li key={id}>
              <button type="button" disabled={ok} onClick={() => { setDoing(id); sfx("click"); }} className={cn("flex min-h-14 w-full items-center gap-3 rounded-3xl border-2 p-3 text-left text-sm font-semibold active:scale-[0.97]", ok ? "border-emerald-500 bg-emerald-500/10" : "border-border bg-card")}>
                <I className="size-6 text-primary" aria-hidden /> {CHORES[id].name}
                {ok && <Star className="ml-auto size-5 text-amber-500" fill="currentColor" aria-label="Hecha" />}
              </button>
            </li>
          );
        })}
      </ul>
      {done.length >= today.length && <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">¡Todo listo por hoy! Mañana hay otras tareas.</p>}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
    </div>
  );
}
