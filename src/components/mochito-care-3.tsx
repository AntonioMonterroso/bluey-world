"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Brush, Car, Check, Coins, Droplet, Gift, Lock, MapPin, PartyPopper, Scissors, Shirt, Shovel, Sprout, Star, Wind } from "lucide-react";
import { MochitoFigure } from "@/components/mochito-figure";
import { PuppyArt } from "@/components/puppy-art";
import { harvestSeed, plantSeed, saveGroom, takeTrip, throwParty, spendBasket, waterSeed } from "@/lib/mochito-actions";
import {
  BALLOONS, CAKES, DRY_MS, GROOM_COLORS, GROOM_DAYS, GROOM_STEPS, HAIRDOS, KNOTS, PARTY_COINS, PLACES, PLACE_IDS, PLOTS, SEEDS, SEED_IDS, TOPPERS, TRIP_COINS, TUFTS,
  daysToWeekend, isWeekend, partyCandles, plotGrowth, seedsFor, tripKey,
  type Groom, type Hairdo, type Place, type Plot, type Seed, type mochitoParty,
} from "@/lib/mochito-extra";
import { dayKey } from "@/lib/game/engine";
import type { Friend } from "@/lib/mochito-play";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
type Done = { after: number; before: number; medals: string[]; sticker: { name: string } | null } | null | undefined;
const btn = "min-h-11 rounded-2xl px-5 text-sm font-semibold active:scale-[0.97]";
const chip = "min-h-11 rounded-full border-2 px-4 text-sm font-semibold active:scale-[0.97]";

function doneLine(r: Done, base: string) {
  if (!r) return base;
  if (r.after > r.before) return `${base} ¡Y subí al nivel ${r.after}!`;
  if (r.medals.length) return `${base} ¡Y gané la medalla «${r.medals[0]}»!`;
  if (r.sticker) return `${base} Me gané la pegatina «${r.sticker.name}».`;
  return base;
}

// ── Jardín ──────────────────────────────────────────────────────────

/** Cómo se ve la plantita según cuánto ha crecido. */
export function PlantArt({ seed, stage, className }: { seed: Seed; stage: 0 | 1 | 2 | 3; className?: string }) {
  const c = SEEDS[seed].color;
  const leaf = "#5bb06a";
  const line = "rgb(0 0 0 / 0.25)";
  return (
    <svg viewBox="0 0 60 60" className={cn("h-full w-full overflow-visible", className)} aria-hidden>
      <ellipse cx="30" cy="52" rx="24" ry="7" fill="#7a5235" />
      {stage === 0 && <ellipse cx="30" cy="48" rx="4" ry="2.6" fill="#c9a06a" stroke={line} strokeWidth="0.6" />}
      {stage >= 1 && <path d={`M30 50 L30 ${stage === 1 ? 38 : 24}`} stroke={leaf} strokeWidth="3" strokeLinecap="round" />}
      {stage >= 1 && <path d={`M30 ${stage === 1 ? 42 : 36} Q22 ${stage === 1 ? 36 : 28} 18 ${stage === 1 ? 40 : 32} Q24 ${stage === 1 ? 44 : 38} 30 ${stage === 1 ? 42 : 36} Z`} fill={leaf} />}
      {stage >= 1 && <path d={`M30 ${stage === 1 ? 40 : 32} Q38 ${stage === 1 ? 34 : 24} 42 ${stage === 1 ? 38 : 28} Q36 ${stage === 1 ? 42 : 34} 30 ${stage === 1 ? 40 : 32} Z`} fill={leaf} />}
      {stage === 3 && SEEDS[seed].kind === "flor" && (
        <g transform="translate(30 18)">
          {[0, 60, 120, 180, 240, 300].map((a) => <ellipse key={a} cx="0" cy={seed === "girasol" ? -8 : -6} rx={seed === "girasol" ? 4 : 5} ry={seed === "girasol" ? 7 : 8} fill={c} stroke={line} strokeWidth="0.6" transform={`rotate(${a})`} />)}
          <circle r={seed === "girasol" ? 6 : 4} fill={seed === "girasol" ? "#7a5235" : "#f6c744"} />
        </g>
      )}
      {stage === 3 && seed === "zanahoria" && <path d="M23 38 Q30 35 37 38 L30 58 Z" fill={c} stroke={line} strokeWidth="0.6" />}
      {stage === 3 && seed === "calabaza" && <ellipse cx="30" cy="42" rx="13" ry="9" fill={c} stroke={line} strokeWidth="0.8" />}
      {stage === 3 && (seed === "fresa" || seed === "tomate") && [[22, 30], [38, 28], [30, 38]].map(([x, y]) => <circle key={x} cx={x} cy={y} r={seed === "fresa" ? 4 : 5.5} fill={c} stroke={line} strokeWidth="0.6" />)}
    </svg>
  );
}

/** Su jardín: siembra, riega cada día y cosecha. Lo cosechado va a la canasta. */
export function GardenScene({ now, garden, basket, level, friends, outfit, groom, onLine, onClose }: {
  now: number; garden?: (Plot | null)[]; basket?: Record<string, number>; level: number; friends: Friend[]; outfit?: Record<string, string>; groom?: Groom | null;
  onLine: (s: string) => void; onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const [choosing, setChoosing] = useState<number | null>(null);
  const [dig, setDig] = useState(0);
  const plots = Array.from({ length: PLOTS }, (_, i) => garden?.[i] ?? null);
  const can = seedsFor(level);
  const inBasket = SEED_IDS.filter((s) => (basket?.[s] ?? 0) > 0);

  async function sow(i: number, s: Seed) {
    setChoosing(null);
    setDig((n) => n + 1);
    sfx("click");
    await plantSeed(i, s);
    onLine(`¡Yo escarbo el hoyito! Ya sembramos ${SEEDS[s].name.toLowerCase()}. Hay que regarlas ${SEEDS[s].days} días.`);
  }
  async function water(i: number) {
    sfx("coin");
    await waterSeed(i);
    onLine("Glu, glu, glu. ¡Qué fresquita el agua! Mañana la regamos otra vez.");
  }
  async function harvest(i: number, s: Seed) {
    sfx("success");
    const r = await harvestSeed(i);
    onLine(doneLine(r, `¡Cosechamos ${SEEDS[s].one}! Está en la canasta.`));
  }
  async function give(s: Seed, friend?: Friend) {
    sfx("success");
    const r = await spendBasket(s, friend?.id);
    const base = friend ? `Le llevamos ${SEEDS[s].one} a ${friend.name}. ¡Movió la cola de gusto!` : SEEDS[s].kind === "comida" ? `¡Ñam! ${SEEDS[s].one[0].toUpperCase()}${SEEDS[s].one.slice(1)} de nuestro jardín sabe mejor.` : `Huele rico… ¡achís! Gracias por ${SEEDS[s].one}.`;
    onLine(doneLine(r, base));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex items-end gap-3 overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 to-lime-100 p-3 dark:from-sky-950 dark:to-lime-950">
        <motion.span key={dig} className="block h-24 shrink-0" style={{ transformOrigin: "50% 100%" }} initial={false} animate={dig && !reduce ? { transform: ["rotate(0deg)", "rotate(-8deg)", "rotate(8deg)", "rotate(-6deg)", "rotate(0deg)"] } : undefined} transition={{ duration: 0.6, ease: EASE_OUT }}>
          <MochitoFigure outfit={outfit} groom={groom} />
        </motion.span>
        <ul className="grid flex-1 grid-cols-2 gap-2">
          {plots.map((p, i) => {
            const g = p ? plotGrowth(p, now) : null;
            return (
              <li key={i} className="flex flex-col items-center gap-1 rounded-2xl bg-card/80 p-2 text-center">
                <span className="block h-14 w-16">{p && g ? <PlantArt seed={p.seed} stage={g.stage} /> : <PlantArt seed="zanahoria" stage={0} className="opacity-40" />}</span>
                <span className="text-xs font-semibold leading-tight">{p && g ? (g.ready ? SEEDS[p.seed].ready : `${SEEDS[p.seed].name} · ${g.watered} de ${g.need} días`) : "Parcela vacía"}</span>
                {!p ? (
                  <button type="button" onClick={() => setChoosing(choosing === i ? null : i)} aria-expanded={choosing === i} className="flex min-h-11 items-center gap-1 rounded-2xl bg-primary px-3 text-xs font-semibold text-primary-foreground active:scale-[0.97]"><Shovel className="size-4" aria-hidden /> Sembrar</button>
                ) : g!.ready ? (
                  <button type="button" onClick={() => void harvest(i, p.seed)} className="flex min-h-11 items-center gap-1 rounded-2xl bg-[var(--gold)] px-3 text-xs font-semibold text-foreground active:scale-[0.97]"><Sprout className="size-4" aria-hidden /> Cosechar</button>
                ) : (
                  <button type="button" disabled={g!.wateredToday} onClick={() => void water(i)} className="flex min-h-11 items-center gap-1 rounded-2xl bg-sky-600 px-3 text-xs font-semibold text-white active:scale-[0.97] disabled:bg-secondary disabled:text-muted-foreground">
                    <Droplet className="size-4" aria-hidden /> {g!.wateredToday ? "Regada hoy" : "Regar"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {choosing !== null && (
        <div className="flex flex-col gap-2 rounded-3xl bg-secondary/60 p-3">
          <p className="text-sm font-semibold">¿Qué sembramos en la parcela {choosing + 1}?</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SEED_IDS.map((s) => {
              const ok = can.includes(s);
              return (
                <button key={s} type="button" disabled={!ok} onClick={() => void sow(choosing, s)} className="flex min-h-14 items-center gap-2 rounded-2xl border-2 border-border bg-card px-3 text-left text-sm font-semibold active:scale-[0.97] disabled:opacity-50">
                  <span className="block size-9 shrink-0">{ok ? <PlantArt seed={s} stage={3} /> : <Lock className="m-2 size-5 text-muted-foreground" aria-hidden />}</span>
                  <span className="leading-tight">{SEEDS[s].name}<span className="block text-xs font-normal text-muted-foreground">{ok ? `${SEEDS[s].days} días de agua` : `Desde el nivel ${SEEDS[s].level}`}</span></span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <section aria-labelledby="canasta" className="flex flex-col gap-2">
        <h3 id="canasta" className="text-sm font-semibold">La canasta</h3>
        {inBasket.length === 0 ? (
          <p className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">Todavía está vacía. Lo que coseches aparece aquí: la comida se la das a Mochito y las flores se las regalas a sus amigos.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {inBasket.map((s) => (
              <li key={s} className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-border bg-card p-2">
                <span className="block size-10 shrink-0"><PlantArt seed={s} stage={3} /></span>
                <span className="min-w-0 flex-1 text-sm font-semibold">{SEEDS[s].name} <span className="tabular-nums text-muted-foreground">× {basket![s]}</span></span>
                <button type="button" onClick={() => void give(s)} className={cn(btn, "bg-primary px-3 text-primary-foreground")}>{SEEDS[s].kind === "comida" ? "Dárselo a Mochito" : "Para Mochito"}</button>
                {SEEDS[s].kind === "flor" && friends.slice(0, 3).map((f) => (
                  <button key={f.id} type="button" onClick={() => void give(s, f)} className={cn(btn, "flex items-center gap-1 bg-secondary px-3")}>
                    <span className="block size-6"><PuppyArt friend={f} /></span> {f.name}
                  </button>
                ))}
              </li>
            ))}
          </ul>
        )}
      </section>
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
    </div>
  );
}

// ── Peluquería ──────────────────────────────────────────────────────

/** La peluquería: cepillar los nudos, cortar los mechones, secar y elegir peinado. */
export function SalonScene({ outfit, groom, onLine, onClose }: { outfit?: Record<string, string>; groom?: Groom | null; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [knots, setKnots] = useState<number[]>(KNOTS.map((_, i) => i));
  const [tufts, setTufts] = useState<number[]>(TUFTS.map((_, i) => i));
  const [dry, setDry] = useState(0);
  const [style, setStyle] = useState<Hairdo>(groom?.style ?? "mono");
  const [color, setColor] = useState(groom?.color ?? GROOM_COLORS[0]);
  const [done, setDone] = useState(false);
  const holding = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const s = GROOM_STEPS[Math.min(step, GROOM_STEPS.length - 1)];

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function brush(i: number) {
    const left = knots.filter((k) => k !== i);
    setKnots(left);
    sfx(left.length ? "click" : "coin");
    if (!left.length) { onLine("¡Ya no tengo nudos! Se siente suavecito."); setStep(1); }
  }
  function cut(i: number) {
    const left = tufts.filter((k) => k !== i);
    setTufts(left);
    sfx(left.length ? "click" : "coin");
    if (!left.length) { onLine("Chic, chic. ¡Quedé parejito!"); setStep(2); }
  }
  function startDry() {
    if (step !== 2) return;
    holding.current = performance.now() - (dry * DRY_MS);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      if (holding.current === null) return;
      const v = Math.min(1, (performance.now() - holding.current) / DRY_MS);
      setDry(v);
      if (v >= 1) { stopDry(); sfx("coin"); onLine("¡Fuuuu! Quedé esponjadito como nube."); setStep(3); }
    }, 60);
  }
  function stopDry() {
    holding.current = null;
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
  }
  async function finish() {
    const name = HAIRDOS.find((h) => h.id === style)!.name;
    setDone(true);
    sfx("success");
    const r = await saveGroom({ style, color, day: dayKey(Date.now()) }, name);
    onLine(doneLine(r, `¡Me encanta mi ${name.toLowerCase()}! Me dura ${GROOM_DAYS} días.`));
  }

  const preview = step >= 3 ? { style, color } : null;
  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-wrap gap-1.5 text-xs font-semibold" aria-label="Pasos">
        {GROOM_STEPS.map((g, i) => (
          <li key={g.id} className={cn("flex items-center gap-1 rounded-full px-3 py-1", i < step || done ? "bg-primary text-primary-foreground" : i === step ? "bg-[var(--gold)] text-foreground" : "bg-secondary text-muted-foreground")}>
            {(i < step || done) && <Check className="size-3.5" aria-hidden />} {g.name}
          </li>
        ))}
      </ol>
      <p className="text-sm font-semibold" aria-live="polite">{done ? "¡Listo! Mochito salió de la peluquería guapísimo." : s.ask}</p>
      <div className="relative flex h-64 items-end justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-pink-50 to-violet-100 dark:from-pink-950 dark:to-violet-950">
        <div className="absolute inset-x-0 bottom-0 h-10 bg-[repeating-linear-gradient(90deg,#ffffff_0_24px,#e8dff5_24px_48px)] opacity-70 dark:opacity-20" aria-hidden />
        <motion.span className="relative z-10 mb-2 block h-56" initial={false} animate={done && !reduce ? { transform: ["translateY(0px)", "translateY(-16px)", "translateY(0px)"] } : undefined} transition={{ duration: 0.5, ease: EASE_OUT }} style={{ transformOrigin: "50% 100%" }}>
          <MochitoFigure outfit={outfit} groom={preview}>
            {step === 2 && dry > 0 && <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-white/30" style={{ opacity: dry }} />}
            {step < 2 && (
              <svg viewBox="0 0 100 143" className="absolute inset-0 h-full w-full overflow-visible">
                {step === 0 && knots.map((i) => (
                  <g key={i} role="button" tabIndex={0} aria-label={`Nudo ${i + 1}`} className="cursor-pointer outline-none" onClick={() => brush(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); brush(i); } }}>
                    <circle cx={KNOTS[i].x} cy={KNOTS[i].y} r="9" fill="transparent" />
                    <path d={`M${KNOTS[i].x - 4} ${KNOTS[i].y} q2 -5 4 0 t4 0 M${KNOTS[i].x - 3} ${KNOTS[i].y + 3} q3 -4 6 0`} stroke="#a77b3b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                    {!reduce && <circle cx={KNOTS[i].x} cy={KNOTS[i].y} r="6.5" fill="none" stroke="#a77b3b" strokeOpacity="0.5" strokeDasharray="2 2" />}
                  </g>
                ))}
                {step === 1 && tufts.map((i) => (
                  <g key={i} role="button" tabIndex={0} aria-label={`Mechón ${i + 1}`} className="cursor-pointer outline-none" onClick={() => cut(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cut(i); } }}>
                    <circle cx={TUFTS[i].x} cy={TUFTS[i].y} r="9" fill="transparent" />
                    <path d={`M${TUFTS[i].x - 3} ${TUFTS[i].y + 2} l-3 -8 M${TUFTS[i].x} ${TUFTS[i].y + 2} l0 -9 M${TUFTS[i].x + 3} ${TUFTS[i].y + 2} l3 -8`} stroke="#e9c46a" strokeWidth="2.4" strokeLinecap="round" />
                    <path d={`M${TUFTS[i].x - 3} ${TUFTS[i].y + 2} l-3 -8 M${TUFTS[i].x} ${TUFTS[i].y + 2} l0 -9 M${TUFTS[i].x + 3} ${TUFTS[i].y + 2} l3 -8`} stroke="rgb(0 0 0 / 0.25)" strokeWidth="0.5" strokeLinecap="round" fill="none" />
                  </g>
                ))}
              </svg>
            )}
          </MochitoFigure>
        </motion.span>
        <span className="absolute left-3 top-3 flex size-11 items-center justify-center rounded-full bg-card shadow-sm" aria-hidden>
          {step === 0 ? <Brush className="size-6 text-primary" /> : step === 1 ? <Scissors className="size-6 text-primary" /> : step === 2 ? <Wind className="size-6 text-primary" /> : <Star className="size-6 text-primary" />}
        </span>
      </div>

      {step === 2 && (
        <div className="flex flex-col gap-2">
          <div className="h-3 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label="Secado" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(dry * 100)}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${dry * 100}%` }} />
          </div>
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); startDry(); }}
            onPointerUp={stopDry}
            onPointerLeave={stopDry}
            onPointerCancel={stopDry}
            onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && holding.current === null) { e.preventDefault(); startDry(); } }}
            onKeyUp={stopDry}
            className={cn(btn, "flex touch-none select-none items-center justify-center gap-2 self-start bg-primary text-primary-foreground")}
          >
            <Wind className="size-5" aria-hidden /> Mantén presionado para secar
          </button>
        </div>
      )}

      {step >= 3 && !done && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Peinado">
            {HAIRDOS.map((h) => (
              <button key={h.id} type="button" role="radio" aria-checked={style === h.id} onClick={() => { setStyle(h.id); sfx("click"); }} className={cn(chip, style === h.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
                {h.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
            {GROOM_COLORS.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Color ${GROOM_COLORS.indexOf(c) + 1}`} onClick={() => setColor(c)} className={cn("size-11 rounded-full border-4 active:scale-[0.97]", color === c ? "border-foreground" : "border-card")} style={{ background: c }} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {step >= 3 && !done && <button type="button" onClick={() => void finish()} className={cn(btn, "bg-primary text-primary-foreground")}>¡Así quedó!</button>}
        <button type="button" onClick={() => { stopDry(); onClose(); }} className={cn(btn, done ? "bg-primary text-primary-foreground" : "bg-secondary")}>{done ? "Volver" : "Salir de la peluquería"}</button>
      </div>
    </div>
  );
}

// ── Viajes ──────────────────────────────────────────────────────────

/** El paisaje de cada lugar. */
export function PlaceArt({ place, className }: { place: Place; className?: string }) {
  const p = PLACES[place];
  return (
    <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMax slice" className={cn("h-full w-full", className)} aria-hidden>
      <rect width="160" height="90" fill={p.sky} />
      {place === "playa" && (<><circle cx="128" cy="26" r="12" fill="#f6a623" /><rect y="46" width="160" height="18" fill="#3f8fd0" /><path d="M0 50 Q10 46 20 50 T40 50 T60 50 T80 50 T100 50 T120 50 T140 50 T160 50" stroke="#ffffff" strokeWidth="1.5" fill="none" /><rect y="62" width="160" height="28" fill={p.ground} /></>)}
      {place === "lago" && (<><path d="M10 58 L40 18 L70 58 Z" fill="#7f8fa6" /><path d="M60 58 L96 10 L132 58 Z" fill="#6b7c94" /><path d="M88 22 L96 10 L104 22 Z" fill="#ffffff" /><rect y="56" width="160" height="34" fill={p.ground} /><path d="M70 72 L96 72 L92 78 L74 78 Z" fill="#ffffff" /></>)}
      {place === "volcan" && (<><path d="M20 90 L80 20 L140 90 Z" fill={p.ground} /><path d="M70 32 L80 20 L90 32 Z" fill="#4a3d38" /><circle cx="78" cy="12" r="6" fill="#d8d8d8" /><circle cx="88" cy="6" r="5" fill="#e6e6e6" /><ellipse cx="30" cy="50" rx="16" ry="5" fill="#ffffff" /><ellipse cx="132" cy="44" rx="18" ry="5" fill="#ffffff" /></>)}
      {place === "bosque" && (<><rect y="62" width="160" height="28" fill={p.ground} />{[14, 44, 74, 104, 134].map((x, k) => <path key={x} d={`M${x} ${66 - (k % 2) * 6} L${x + 14} ${20 + (k % 2) * 8} L${x + 28} ${66 - (k % 2) * 6} Z`} fill={k % 2 ? "#2f6b3a" : "#3d7f46"} />)}<path d="M0 80 Q40 74 80 80 T160 78" stroke="#7cc6f2" strokeWidth="4" fill="none" /></>)}
      {place === "finca" && (<><rect y="56" width="160" height="34" fill={p.ground} />{[16, 52, 88, 124].map((x) => <g key={x}><ellipse cx={x + 10} cy="54" rx="16" ry="14" fill="#3d7f46" />{[[-4, -4], [6, 2], [14, -6], [2, 8]].map(([dx, dy]) => <circle key={`${dx}${dy}`} cx={x + 10 + dx} cy={54 + dy} r="2" fill="#d6453d" />)}</g>)}<circle cx="136" cy="18" r="10" fill="#f6c744" /></>)}
      {place === "ciudad" && (<><rect y="64" width="160" height="26" fill={p.ground} /><rect x="40" y="20" width="80" height="46" fill="#f2c94c" /><path d="M64 66 L64 46 Q80 30 96 46 L96 66 Z" fill={p.sky} /><circle cx="80" cy="30" r="6" fill="#ffffff" stroke="#7a5a3a" strokeWidth="1" /><path d="M80 30 L80 26 M80 30 L83 31" stroke="#7a5a3a" strokeWidth="1" /><rect x="8" y="40" width="28" height="26" fill="#e88b6a" /><rect x="124" y="36" width="30" height="30" fill="#7cb4d6" /></>)}
    </svg>
  );
}

/** Los recuerdos que trajo de sus viajes (en «Sus cosas»). */
export function SouvenirShelf({ places }: { places?: Record<string, number> }) {
  const have = PLACE_IDS.filter((p) => (places?.[p] ?? 0) > 0);
  return (
    <section aria-labelledby="recuerdos" className="flex flex-col gap-2">
      <h3 id="recuerdos" className="text-sm font-semibold">Recuerdos de viaje · {have.length} de {PLACE_IDS.length}</h3>
      <ul className="grid grid-cols-3 gap-2">
        {PLACE_IDS.map((p) => {
          const ok = have.includes(p);
          return (
            <li key={p} className={cn("flex flex-col items-center gap-1 overflow-hidden rounded-2xl border-2 pb-2 text-center text-xs font-semibold", ok ? "border-[var(--gold)] bg-card" : "border-dashed border-border bg-secondary/40 text-muted-foreground")}>
              <span className={cn("block h-12 w-full", !ok && "opacity-30 grayscale")}><PlaceArt place={p} /></span>
              {ok ? PLACES[p].souvenir : "¿?"}
              <span className="font-normal text-muted-foreground">{PLACES[p].name}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** El viaje del fin de semana: elige el lugar, van en carro y te cuenta tres momentos. */
export function TripScene({ now, trips, outfit, groom, onLine, onClose }: {
  now: number; trips?: { last?: string; places?: Record<string, number> }; outfit?: Record<string, string>; groom?: Groom | null; onLine: (s: string) => void; onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const weekend = isWeekend(now);
  const went = trips?.last === tripKey(now);
  const [place, setPlace] = useState<Place | null>(null);
  const [phase, setPhase] = useState<"car" | "moment" | "done">("car");
  const [moment, setMoment] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const arrived = useRef(false);

  function go(p: Place) {
    arrived.current = false;
    setPlace(p); setPhase("car"); setMoment(0); setResult(null);
    sfx("door");
    onLine(`¡Nos vamos ${PLACES[p].to}! Ya me puse junto a la ventana.`);
    setTimeout(arrive, reduce ? 300 : 2600);
  }
  function arrive() {
    if (arrived.current) return;
    arrived.current = true;
    setPhase("moment");
    sfx("success");
  }
  async function next() {
    if (!place) return;
    if (moment < 2) { setMoment((m) => m + 1); sfx("click"); return; }
    setPhase("done");
    sfx("cash");
    const r = await takeTrip(place);
    const base = `¡Qué buen viaje! Traje ${PLACES[place].souvenir.toLowerCase()} para mi repisa.${r ? ` Y ganamos ${TRIP_COINS} monedas.` : ""}`;
    setResult(base);
    onLine(doneLine(r, base));
  }

  if (!place) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">
          {went ? "Ya viajaron este fin de semana. El próximo sábado hay otro viaje." : weekend ? "¡Es fin de semana! ¿A dónde llevamos a Mochito?" : daysToWeekend(now) === 1 ? "Los viajes son el sábado o el domingo. ¡Mañana ya es sábado!" : `Los viajes son el sábado o el domingo. Faltan ${daysToWeekend(now)} días.`}
        </p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PLACE_IDS.map((p) => {
            const been = (trips?.places?.[p] ?? 0) > 0;
            return (
              <li key={p}>
                <button type="button" disabled={!weekend || went} onClick={() => go(p)} className="flex w-full flex-col overflow-hidden rounded-2xl border-2 border-border bg-card text-left text-sm font-semibold active:scale-[0.97] disabled:opacity-60">
                  <span className="block h-16 w-full"><PlaceArt place={p} /></span>
                  <span className="flex items-center gap-1 px-2 py-1.5"><MapPin className="size-4 shrink-0 text-primary" aria-hidden /> <span className="flex-1">{PLACES[p].name}</span>{been && <Check className="size-4 text-primary" aria-label="Ya fueron" />}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <SouvenirShelf places={trips?.places} />
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }

  const info = PLACES[place];
  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-56 overflow-hidden rounded-3xl">
        {phase === "car" ? (
          <div className="relative h-full bg-sky-100 dark:bg-sky-950">
            <div className="absolute inset-x-0 bottom-0 h-14 bg-[#6b6b72]" aria-hidden />
            <div className="absolute inset-x-0 bottom-6 h-1 bg-[repeating-linear-gradient(90deg,#ffffff_0_20px,transparent_20px_40px)]" aria-hidden />
            <motion.div
              className="absolute bottom-6 left-0 flex h-28 items-end"
              initial={{ transform: "translateX(-40%)" }}
              animate={{ transform: "translateX(260%)" }}
              transition={{ duration: reduce ? 0.2 : 2.6, ease: [0.45, 0, 0.55, 1] }}
              onAnimationComplete={arrive}
            >
              <span className="relative block h-24 w-40">
                <span className="absolute bottom-6 left-10 block h-16"><MochitoFigure outfit={outfit} groom={groom} /></span>
                <Car className="absolute inset-x-0 bottom-0 size-40 fill-[#d6453d] text-[#7a2420]" aria-hidden />
              </span>
            </motion.div>
            <p className="absolute left-3 top-3 rounded-full bg-card px-3 py-1 text-xs font-semibold">Camino {info.to}…</p>
          </div>
        ) : (
          <>
            <PlaceArt place={place} className="absolute inset-0" />
            <motion.span key={moment} className="absolute bottom-2 left-4 block h-32" initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(8px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: 0.35, ease: EASE_OUT }}>
              <MochitoFigure outfit={outfit} groom={groom} />
            </motion.span>
            <motion.p key={`t${moment}-${phase}`} className="absolute right-3 top-3 max-w-[62%] rounded-3xl rounded-bl-md bg-card px-3 py-2 text-sm leading-snug text-pretty shadow-sm" initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ duration: 0.2, ease: EASE_OUT }}>
              {phase === "done" ? (result ?? "…") : info.moments[moment]}
            </motion.p>
          </>
        )}
      </div>
      {phase === "moment" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">{info.name} · {moment + 1} de 3</span>
          <button type="button" onClick={() => void next()} className={cn(btn, "ml-auto bg-primary text-primary-foreground")}>{moment < 2 ? "Siguiente" : "Traer un recuerdo"}</button>
        </div>
      )}
      {phase === "done" && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold"><Gift className="size-5 text-primary" aria-hidden /> {info.souvenir} · está en «Sus cosas»</p>
          <button type="button" onClick={onClose} className={cn(btn, "ml-auto bg-primary text-primary-foreground")}>Volver a casa</button>
        </div>
      )}
    </div>
  );
}

// ── Fiesta ──────────────────────────────────────────────────────────

type PartyInfo = NonNullable<ReturnType<typeof mochitoParty>>;
const partyName = (p: PartyInfo) => (p.kind === "cumple" ? `cumpleaños (${p.age} ${p.age === 1 ? "año" : "años"})` : `cumplemés (${p.months} ${p.months === 1 ? "mes" : "meses"})`);

function Balloon({ x, c, d }: { x: number; c: string; d: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg viewBox="0 0 20 40" className="absolute top-2 h-14 w-7" style={{ left: `${x}%` }} aria-hidden initial={false} animate={reduce ? undefined : { transform: ["translateY(0px)", "translateY(-5px)", "translateY(0px)"] }} transition={{ duration: 2.6, delay: d, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}>
      <ellipse cx="10" cy="10" rx="8" ry="10" fill={c} stroke="rgb(0 0 0 / 0.2)" strokeWidth="0.6" />
      <path d="M10 20 Q8 28 11 34 Q9 37 10 40" stroke="#7a7a7a" strokeWidth="0.6" fill="none" />
    </motion.svg>
  );
}

function CakeArt({ color, topper, candles, lit }: { color: string; topper: string; candles: number; lit: boolean[] }) {
  const line = "rgb(0 0 0 / 0.25)";
  const n = Math.max(1, candles);
  return (
    <svg viewBox="0 0 80 64" className="h-full w-full overflow-visible" aria-hidden>
      <ellipse cx="40" cy="60" rx="34" ry="4" fill="#e6e0d6" />
      <rect x="12" y="32" width="56" height="26" rx="5" fill={color} stroke={line} strokeWidth="0.8" />
      <path d="M12 38 Q19 44 26 38 T40 38 T54 38 T68 38" stroke="#ffffff" strokeWidth="3" fill="none" />
      {topper === "hueso" && <path d="M33 30 L47 30 M31 28 a2 2 0 1 0 0 4 M49 28 a2 2 0 1 1 0 4" stroke="#f5efe4" strokeWidth="3.4" strokeLinecap="round" />}
      {topper === "corazon" && <path d="M40 31 C 35 27, 33 23, 36 21 C 38 20, 40 22, 40 23 C 40 22, 42 20, 44 21 C 47 23, 45 27, 40 31 Z" fill="#e2457a" />}
      {topper === "patita" && <g fill="#7a5235"><ellipse cx="40" cy="28" rx="4" ry="3" /><circle cx="35" cy="23" r="1.6" /><circle cx="38.5" cy="21" r="1.6" /><circle cx="42" cy="21" r="1.6" /><circle cx="45" cy="23" r="1.6" /></g>}
      {Array.from({ length: n }, (_, k) => {
        const x = 16 + ((k + 0.5) * 48) / n;
        return (
          <g key={k}>
            <rect x={x - 1.2} y="22" width="2.4" height="10" fill={k % 2 ? "#7cc6f2" : "#f28ab2"} />
            {lit[k] && <path d={`M${x} 15 Q${x + 2.6} 19 ${x} 22 Q${x - 2.6} 19 ${x} 15 Z`} fill="#f6a623" />}
          </g>
        );
      })}
    </svg>
  );
}

/** Su fiesta: decora, invita a sus amigos, elige el pastel, sopla las velas y abre los regalos. */
export function PartyScene({ party, nextIn, done, friends, outfit, groom, onLine, onClose }: {
  party: PartyInfo | null; nextIn: number | null; done: boolean; friends: Friend[]; outfit?: Record<string, string>; groom?: Groom | null;
  onLine: (s: string) => void; onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<"globos" | "amigos" | "pastel" | "velas" | "regalos" | "fin">("globos");
  const [balloons, setBalloons] = useState(BALLOONS[0].id);
  const [guests, setGuests] = useState<string[]>(friends.slice(0, 3).map((f) => f.id));
  const [cake, setCake] = useState(CAKES[0].id);
  const [topper, setTopper] = useState(TOPPERS[0].id);
  const candles = party ? partyCandles(party) : 1;
  const [lit, setLit] = useState<boolean[]>(() => Array(Math.max(1, candles)).fill(true));
  const [opened, setOpened] = useState<number[]>([]);
  const [prize, setPrize] = useState<{ coins: number; sticker: string | null; wear: string | null } | null>(null);
  const [blow, setBlow] = useState(0);
  const [doneBefore] = useState(done);

  if (!party || doneBefore) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-3xl bg-secondary/60 p-4">
          <PartyPopper className="size-8 shrink-0 text-primary" aria-hidden />
          <p className="text-sm">
            {doneBefore ? "¡Ya celebramos hoy! Fue la mejor fiesta." : nextIn === null ? "Su fiesta llega cuando cumpla su primer mes contigo. Cada mes, el mismo día que llegó, hay «cumplemés»." : `Su próxima fiesta es en ${nextIn} ${nextIn === 1 ? "día" : "días"}. Cada mes, el mismo día que llegó, celebramos su cumplemés; y cada año, su cumpleaños.`}
          </p>
        </div>
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }

  const colors = BALLOONS.find((b) => b.id === balloons)!.colors;
  const guestF = friends.filter((f) => guests.includes(f.id));
  const cakeC = CAKES.find((c) => c.id === cake)!.color;

  function blowOut() {
    const i = lit.lastIndexOf(true);
    if (i < 0) return;
    const next = lit.map((v, k) => (k >= i - Math.max(0, Math.ceil(lit.length / 3) - 1) ? false : v));
    setLit(next);
    setBlow((n) => n + 1);
    sfx("click");
    if (!next.some(Boolean)) { sfx("success"); onLine("¡Pedí mi deseo! Es secreto, pero tiene que ver con paseos."); setStep("regalos"); }
  }
  async function openGift(k: number) {
    if (opened.includes(k)) return;
    setOpened((o) => [...o, k]);
    sfx("cash");
    if (prize) return;
    const r = await throwParty(partyName(party!), guestF.map((f) => f.name));
    const p = { coins: r?.coins ?? PARTY_COINS, sticker: r?.sticker?.name ?? null, wear: r?.wear ?? null };
    setPrize(p);
    onLine(doneLine(r, "¡Gracias por mi fiesta! Es el mejor día."));
  }
  const giftText = (k: number) => !prize ? "…" : k === 0 ? `${prize.coins} monedas` : k === 1 ? (prize.sticker ? `Pegatina: ${prize.sticker}` : "Un abrazo de todos") : prize.wear ? `Ropa nueva: ${prize.wear}` : "Un hueso de juguete y 10 monedas más";

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">¡Hoy es su {partyName(party)}!</p>
      <div className="relative h-56 overflow-hidden rounded-3xl bg-gradient-to-b from-amber-50 to-rose-100 dark:from-amber-950 dark:to-rose-950">
        {[6, 20, 70, 86].map((x, k) => <Balloon key={x} x={x} c={colors[k % colors.length]} d={k * 0.4} />)}
        <svg viewBox="0 0 100 12" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-6 w-full" aria-hidden>
          <path d="M0 1 Q50 9 100 1" stroke="#7a7a7a" strokeWidth="0.4" fill="none" />
          {Array.from({ length: 9 }, (_, k) => <path key={k} d={`M${6 + k * 11} ${2 + Math.sin((k + 0.5) / 9 * Math.PI) * 5} l3 6 l3 -6 Z`} fill={colors[k % colors.length]} />)}
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-10 bg-white/70 dark:bg-white/10" aria-hidden />
        <span className="absolute bottom-2 left-2 block h-32"><MochitoFigure outfit={outfit} groom={groom} festive="cumple" /></span>
        <span className="absolute bottom-3 left-1/2 block h-20 w-28 -translate-x-1/2">
          <motion.span key={blow} className="block h-full w-full" initial={false} animate={blow && !reduce ? { transform: ["translateX(0px)", "translateX(-2px)", "translateX(2px)", "translateX(0px)"] } : undefined} transition={{ duration: 0.25, ease: EASE_OUT }}>
            {step !== "globos" && step !== "amigos" && <CakeArt color={cakeC} topper={topper} candles={candles} lit={lit} />}
          </motion.span>
        </span>
        <span className="absolute bottom-2 right-2 flex items-end gap-0.5">
          {guestF.map((f) => <span key={f.id} className="block size-14"><PuppyArt friend={f} /></span>)}
        </span>
      </div>

      {step === "globos" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">Primero, a decorar. ¿De qué color son los globos?</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Globos">
            {BALLOONS.map((b) => (
              <button key={b.id} type="button" role="radio" aria-checked={balloons === b.id} onClick={() => { setBalloons(b.id); sfx("click"); }} className={cn(chip, "flex items-center gap-1.5", balloons === b.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
                <span className="flex" aria-hidden>{b.colors.map((c) => <span key={c} className="-ml-1 size-3.5 rounded-full border border-black/20 first:ml-0" style={{ background: c }} />)}</span> {b.name}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setStep("amigos")} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Listo, ahora los invitados</button>
        </div>
      )}
      {step === "amigos" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">{friends.length ? "¿A quién invitamos? Hasta tres amigos." : "Todavía no tiene amigos del parque. ¡Sácalo a pasear para conocer perritos! Hoy celebra contigo."}</p>
          <div className="flex flex-wrap gap-2">
            {friends.map((f) => {
              const on = guests.includes(f.id);
              return (
                <button key={f.id} type="button" aria-pressed={on} disabled={!on && guests.length >= 3} onClick={() => setGuests((g) => (on ? g.filter((x) => x !== f.id) : [...g, f.id]))} className={cn(chip, "flex items-center gap-1.5 disabled:opacity-50", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
                  <span className="block size-7"><PuppyArt friend={f} /></span> {f.name}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => setStep("pastel")} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Ahora el pastel</button>
        </div>
      )}
      {step === "pastel" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">Pastel para perritos (nada de chocolate). ¿De qué es y qué lleva arriba?</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Pastel">
            {CAKES.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={cake === c.id} onClick={() => setCake(c.id)} className={cn(chip, "flex items-center gap-1.5", cake === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
                <span className="size-3.5 rounded-full border border-black/20" style={{ background: c.color }} aria-hidden /> {c.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Adorno">
            {TOPPERS.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={topper === t.id} onClick={() => setTopper(t.id)} className={cn(chip, topper === t.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>{t.name}</button>
            ))}
          </div>
          <button type="button" onClick={() => { setStep("velas"); onLine(`¡Mira! ${candles} ${candles === 1 ? "velita" : "velitas"}. Ayúdame a soplar.`); }} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Encender las velas</button>
        </div>
      )}
      {step === "velas" && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm">Cántale las mañanitas y luego sopla hasta apagarlas todas.</p>
          <button type="button" onClick={blowOut} className={cn(btn, "flex items-center gap-2 bg-primary text-primary-foreground")}><Wind className="size-5" aria-hidden /> Soplar</button>
        </div>
      )}
      {(step === "regalos" || step === "fin") && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">¡Regalos! Toca cada caja para abrirla.</p>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((k) => {
              const open = opened.includes(k);
              return (
                <button key={k} type="button" onClick={() => void openGift(k)} disabled={open} className={cn("flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 text-center text-xs font-semibold active:scale-[0.97]", open ? "border-[var(--gold)] bg-card" : "border-border bg-card")}>
                  {open ? (k === 0 ? <Coins className="size-7 text-primary" aria-hidden /> : k === 1 ? <Star className="size-7 text-primary" aria-hidden /> : <Shirt className="size-7 text-primary" aria-hidden />) : <Gift className="size-8 text-primary" aria-hidden />}
                  {open ? giftText(k) : "Abrir"}
                </button>
              );
            })}
          </div>
          {opened.length === 3 && <button type="button" onClick={onClose} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Terminar la fiesta</button>}
        </div>
      )}
      {step !== "regalos" && step !== "fin" && <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Dejarla para después</button>}
    </div>
  );
}

