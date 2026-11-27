"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Brush, Bug, Check, Coins, Minus, Plus, Shovel, ShoppingBasket, Trophy } from "lucide-react";
import { MochitoFigure } from "@/components/mochito-figure";
import { PuppyArt } from "@/components/puppy-art";
import { finishDig, finishMarket, finishPicnic, finishRace } from "@/lib/mochito-actions";
import {
  BASKET, CART_COLORS, DIG_LAYERS, DIG_SIZE, DINOS, DINO_PARTS, GOODS, LANES, PAY_COINS, PICNIC_FOODS, PICNIC_MS, PUSH_MS, RACE_MS, ROCK_FALL, STALLS, STALL_IDS, WHEELS,
  antPos, antProgress, antsOf, changeOptions, digOf, marketOf, marketTotal, nextPart, raceTime, rivalsOf, rocksOf,
  type Derby, type Dig, type PicnicFood, type Stall, type Wheel,
} from "@/lib/mochito-extra-7";
import type { Groom } from "@/lib/mochito-extra";
import { FRIENDS, type Friend } from "@/lib/mochito-play";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
type Done = { after: number; before: number; medals: string[]; sticker: { name: string } | null } | null | undefined;
const btn = "min-h-11 rounded-2xl px-5 text-sm font-semibold active:scale-[0.97]";
const chip = "min-h-11 rounded-full border-2 px-4 text-sm font-semibold active:scale-[0.97]";
type Look = { outfit?: Record<string, string>; groom?: Groom | null };
const friendOf = (id: string) => FRIENDS.find((f) => f.id === id) ?? FRIENDS[0];

function doneLine(r: Done, base: string) {
  if (!r) return base;
  if (r.after > r.before) return `${base} ¡Y subí al nivel ${r.after}!`;
  if (r.medals.length) return `${base} ¡Y gané la medalla «${r.medals[0]}»!`;
  if (r.sticker) return `${base} Me gané la pegatina «${r.sticker.name}».`;
  return base;
}

// ── Ir al mercado ───────────────────────────────────────────────────

/** El mercado: busca lo de la lista en los puestos, paga con monedas y elige el vuelto. Una vez al día. */
export function MarketScene({ day, done, onLine, onClose }: { day: string; done: boolean; onLine: (s: string) => void; onClose: () => void }) {
  const list = marketOf(day);
  const total = marketTotal(list);
  const [stall, setStall] = useState<Stall>("fruta");
  const [bag, setBag] = useState<string[]>([]);
  const [msg, setMsg] = useState("Busca en los puestos lo que dice la lista.");
  const [step, setStep] = useState<"compras" | "pagar" | "vuelto" | "fin">("compras");
  const [given, setGiven] = useState<number[]>([]);
  const [coins, setCoins] = useState(0);
  const paid = given.reduce((a, b) => a + b, 0);
  const change = paid - total;

  if (done && step === "compras") {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Hoy ya fuimos al mercado. La despensa está llena. Mañana hay otra lista.</p>
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }

  function take(id: string) {
    const g = GOODS.find((x) => x.id === id)!;
    if (bag.includes(id)) { setMsg(`Ya tienes ${g.name.toLowerCase()} en la bolsa.`); sfx("click"); return; }
    if (!list.some((x) => x.id === id)) { setMsg(`${g.name}: eso no está en la lista.`); sfx("sad"); return; }
    const b = [...bag, id];
    setBag(b); setMsg(`¡${g.name} a la bolsa! Cuesta ${g.price}.`); sfx("coin");
    if (b.length >= list.length) { setStep("pagar"); setMsg(""); onLine("¡Ya tenemos todo! Ahora hay que pagar."); }
  }
  async function answer(v: number) {
    const right = v === change;
    setMsg(right ? `¡Exacto! Te dieron ${change} de vuelto.` : `Casi. El vuelto era ${change}: diste ${paid} y costaba ${total}.`);
    sfx(right ? "success" : "sad");
    setStep("fin");
    const r = await finishMarket(list.map((g) => g.name), right);
    setCoins(r?.coins ?? 0);
    onLine(doneLine(r, right ? "¡Qué buenas cuentas! Yo cargo la bolsa." : "Bueno, la próxima contamos con calma. Yo cargo la bolsa."));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-3xl bg-[#fff8e8] p-3 text-sm text-[#3a2a22] dark:bg-[#3a3346] dark:text-foreground">
        <p className="mb-1 font-semibold">Lista de compras</p>
        <ul className="grid grid-cols-2 gap-1">
          {list.map((g) => <li key={g.id} className={cn("flex items-center gap-1.5", bag.includes(g.id) && "text-muted-foreground line-through")}>{bag.includes(g.id) ? <Check className="size-4 text-emerald-600" aria-label="Ya está" /> : <span className="block size-4 rounded border-2 border-current" aria-hidden />}{g.name}</li>)}
        </ul>
      </div>
      {step === "compras" && (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Puestos">
            {STALL_IDS.map((s) => <button key={s} type="button" aria-pressed={stall === s} onClick={() => { setStall(s); sfx("click"); }} className={cn(chip, stall === s ? "text-white" : "border-border")} style={stall === s ? { background: STALLS[s].color, borderColor: STALLS[s].color } : undefined}>{STALLS[s].name}</button>)}
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-3xl p-2" style={{ background: `${STALLS[stall].color}22` }}>
            {GOODS.filter((g) => g.stall === stall).map((g) => (
              <button key={g.id} type="button" onClick={() => take(g.id)} className={cn("flex min-h-14 items-center justify-between gap-2 rounded-2xl bg-card px-3 text-sm font-semibold active:scale-[0.97]", bag.includes(g.id) && "opacity-50")}>
                {g.name}<span className="flex items-center gap-1 text-muted-foreground"><Coins className="size-4" aria-hidden />{g.price}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {step === "pagar" && (
        <>
          <p className="text-sm">Todo cuesta <b>{total}</b>. Toca las monedas para pagar. Diste: <b>{paid}</b>.</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Monedas">
            {PAY_COINS.map((c) => <button key={c} type="button" onClick={() => { setGiven((g) => [...g, c]); sfx("coin"); }} className="flex size-14 items-center justify-center rounded-full border-4 border-amber-500 bg-amber-300 font-heading text-lg text-[#5a3b0a] active:scale-[0.97]" aria-label={`Moneda de ${c}`}>{c}</button>)}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={paid < total} onClick={() => { setStep("vuelto"); sfx("cash"); }} className={cn(btn, "bg-primary text-primary-foreground disabled:opacity-50")}>{paid < total ? `Faltan ${total - paid}` : "Pagar"}</button>
            <button type="button" disabled={!given.length} onClick={() => setGiven([])} className={cn(btn, "bg-secondary disabled:opacity-50")}>Recoger mis monedas</button>
          </div>
        </>
      )}
      {step === "vuelto" && (
        <>
          <p className="text-sm">Diste {paid} y costaba {total}. ¿Cuánto te tienen que regresar de vuelto?</p>
          <div className="flex flex-wrap gap-2">{changeOptions(day, change).map((v) => <button key={v} type="button" onClick={() => void answer(v)} className={cn(chip, "min-w-16 border-border font-heading text-lg")}>{v}</button>)}</div>
        </>
      )}
      {msg && <p className="text-sm font-semibold" aria-live="polite">{msg}</p>}
      {step === "fin" && <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">¡Compras hechas! Ganaste {coins} monedas.</p>}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>{step === "fin" ? "Volver" : "Salir"}</button>
    </div>
  );
}

// ── Excavar fósiles ─────────────────────────────────────────────────

function Museum({ found }: { found: number }) {
  return (
    <div className="flex flex-col gap-2">
      {DINOS.map((d, k) => {
        const have = Math.max(0, Math.min(DINO_PARTS.length, found - k * DINO_PARTS.length));
        if (k > 0 && have === 0 && found < k * DINO_PARTS.length) return null;
        return (
          <div key={d.id} className="rounded-3xl bg-card p-3">
            <p className="text-sm font-semibold">{d.name} · {have} de {DINO_PARTS.length}{have === DINO_PARTS.length ? " · ¡Completo!" : ""}</p>
            <ul className="mt-2 grid grid-cols-3 gap-1.5 text-xs">
              {DINO_PARTS.map((p, i) => <li key={p} className={cn("rounded-xl px-2 py-1.5 text-center", i < have ? "font-semibold" : "bg-muted text-muted-foreground")} style={i < have ? { background: `${d.color}55` } : undefined}>{i < have ? p : "???"}</li>)}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/** Excavar: con el pincel quitas la arena despacito; la pala es rápida pero puede romper el fósil. Una pieza al día. */
export function DigScene({ day, dig, onLine, onClose }: { day: string; dig?: Dig; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const done = dig?.last === day;
  const fossil = digOf(day);
  const [np] = useState(() => nextPart(dig?.found ?? 0));
  const [layers, setLayers] = useState<number[]>(() => Array(DIG_SIZE * DIG_SIZE).fill(DIG_LAYERS));
  const [tool, setTool] = useState<"pincel" | "pala">("pala");
  const [cracks, setCracks] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [msg, setMsg] = useState("La pala quita toda la arena de una vez. El pincel va despacito y no rompe nada.");

  if (np.done && !finished) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">¡El museo está completo! Encontraste los {DINOS.length} dinosaurios.</p>
        <Museum found={dig?.found ?? 0} />
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }
  if (done && !finished) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Hoy ya excavamos. Mira el museo; mañana buscamos la siguiente pieza.</p>
        <Museum found={dig?.found ?? 0} />
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }

  async function dug(i: number) {
    if (finished || !layers[i]) return;
    const isF = fossil.includes(i);
    const next = tool === "pala" ? 0 : layers[i] - 1;
    const l = layers.map((v, k) => (k === i ? next : v));
    setLayers(l);
    let c = cracks;
    if (isF && tool === "pala") { c = [...cracks, i]; setCracks(c); setMsg("¡Crac! La pala le pegó al fósil. Ahí mejor con el pincel."); sfx("sad"); }
    else if (isF && next === 1) { setMsg("Se siente algo duro aquí abajo… ¡con cuidado!"); sfx("click"); }
    else if (isF && next === 0) { setMsg("¡Apareció un pedazo de hueso!"); sfx("coin"); }
    else sfx("click");
    if (fossil.every((f) => l[f] === 0)) {
      setFinished(true);
      const r = await finishDig(c.length);
      sfx("success");
      onLine(doneLine(r, r?.done ? `¡${r.dino} está completo! Vamos a ponerlo en el museo.` : `¡Es ${r?.part.toLowerCase() ?? "una pieza"} de ${np.dino?.name}! Al museo.`));
    }
  }

  const sand = ["#e9c48f", "#d9ab6c", "#a8805a"];
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">Hoy buscamos: <b>{DINO_PARTS[np.part].toLowerCase()} de {np.dino?.name}</b>. Está escondido en tres casillas juntas.</p>
      <div className="flex gap-2" role="group" aria-label="Herramienta">
        <button type="button" aria-pressed={tool === "pala"} onClick={() => setTool("pala")} className={cn(chip, "flex items-center gap-1.5", tool === "pala" ? "border-primary bg-primary/10" : "border-border")}><Shovel className="size-4" aria-hidden /> Pala</button>
        <button type="button" aria-pressed={tool === "pincel"} onClick={() => setTool("pincel")} className={cn(chip, "flex items-center gap-1.5", tool === "pincel" ? "border-primary bg-primary/10" : "border-border")}><Brush className="size-4" aria-hidden /> Pincel</button>
      </div>
      <div className="mx-auto grid w-full max-w-xs gap-1 rounded-3xl bg-[#8a6a4a] p-2" style={{ gridTemplateColumns: `repeat(${DIG_SIZE}, minmax(0, 1fr))` }} role="grid" aria-label="Arena para excavar">
        {layers.map((v, i) => {
          const isF = fossil.includes(i);
          const cracked = cracks.includes(i);
          return (
            <button key={i} type="button" role="gridcell" disabled={!v || finished} onClick={() => void dug(i)} aria-label={`Casilla ${i + 1}${v === 0 ? (isF ? ": hueso" : ": vacía") : v === 1 && isF ? ": algo duro" : ""}`} className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg active:scale-[0.97]" style={{ background: v ? sand[DIG_LAYERS - v] : sand[2] }}>
              {v === 1 && isF && <span className="absolute inset-2 block rounded-full bg-[#f4ead8]/40" aria-hidden />}
              {v === 0 && isF && (
                <motion.span className="flex h-full w-full items-center justify-center" initial={reduce ? false : { opacity: 0, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ duration: 0.25, ease: EASE_OUT }} aria-hidden>
                  <span className={cn("block h-1/3 w-4/5 rounded-full bg-[#f4ead8]", cracked && "bg-[linear-gradient(115deg,#f4ead8_45%,#6b4a32_47%,#6b4a32_52%,#f4ead8_54%)]")} />
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-sm font-semibold" aria-live="polite">{msg}</p>
      {finished && (
        <>
          <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">{cracks.length ? `Salió con ${cracks.length} ${cracks.length === 1 ? "rajadita" : "rajaditas"}, pero en el museo lo pegan.` : "¡Salió perfecto, sin una rajadita!"}</p>
          <Museum found={(dig?.found ?? 0) + (dig?.last === day ? 0 : 1)} />
        </>
      )}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>{finished ? "Volver" : "Salir"}</button>
    </div>
  );
}

// ── Picnic en el parque ─────────────────────────────────────────────

const MANTEL = ["#e2457a", "#3f74c4", "#4a9a5b"];

/** El picnic: llenas la canasta, invitas amigos y espantas a las hormigas antes de que se lleven la comida. Uno al día. */
export function PicnicScene({ day, done, friends, look, onLine, onClose }: { day: string; done: boolean; friends: Friend[]; look: Look; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const list = friends.length ? friends : FRIENDS.slice(0, 3);
  const [ants] = useState(() => antsOf(day));
  const [step, setStep] = useState<"canasta" | "hormigas" | "fin">("canasta");
  const [foods, setFoods] = useState<PicnicFood[]>([]);
  const [guests, setGuests] = useState<string[]>([]);
  const [cloth, setCloth] = useState(MANTEL[0]);
  const [t, setT] = useState(0);
  const [shoo, setShoo] = useState<number[]>([]);
  const [stolen, setStolen] = useState<number[]>([]);
  const [coins, setCoins] = useState(0);
  const t0 = useRef(0);
  const shooRef = useRef<number[]>([]);
  const stolenRef = useRef<number[]>([]);

  useEffect(() => {
    if (step !== "hormigas") return;
    t0.current = Date.now();
    const id = setInterval(() => {
      const v = Date.now() - t0.current;
      setT(v);
      const arrived = ants.filter((a) => antProgress(a, v) >= 1 && !shooRef.current.includes(a.id) && !stolenRef.current.includes(a.id)).map((a) => a.id);
      if (arrived.length) { stolenRef.current = [...stolenRef.current, ...arrived]; setStolen(stolenRef.current); sfx("sad"); }
      const leftNow = Math.max(0, BASKET - stolenRef.current.length);
      if (v >= PICNIC_MS || leftNow === 0) {
        clearInterval(id);
        setStep("fin");
        void finishPicnic(guests, leftNow).then((r) => { setCoins(r?.coins ?? 0); sfx("success"); onLine(doneLine(r, leftNow === BASKET ? "¡Ni una hormiga se llevó nada! Qué picnic tan rico." : leftNow ? `Las hormigas se llevaron un poquito, pero nos quedó ${leftNow === 1 ? "una cosa" : `${leftNow} cosas`} para comer.` : "Las hormigas se llevaron todo… ¡pero qué risa!")); });
      }
    }, 50);
    return () => clearInterval(id);
  }, [step, ants, guests, onLine]);

  const left = Math.max(0, BASKET - stolen.length);

  if (done && step === "canasta") {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Hoy ya hicimos picnic. Todavía estoy lleno. Mañana otro.</p>
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }
  if (step === "canasta") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">Llena la canasta con {BASKET} cosas ({foods.length} de {BASKET}) e invita hasta 2 amigos.</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Comida">
          {(Object.keys(PICNIC_FOODS) as PicnicFood[]).map((k) => { const on = foods.includes(k); return <button key={k} type="button" aria-pressed={on} disabled={!on && foods.length >= BASKET} onClick={() => { setFoods((f) => (on ? f.filter((x) => x !== k) : [...f, k])); sfx("click"); }} className={cn(chip, "disabled:opacity-50", on ? "border-primary bg-primary/10" : "border-border")}>{PICNIC_FOODS[k]}</button>; })}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Mantel">
          {MANTEL.map((c, i) => <button key={c} type="button" aria-pressed={cloth === c} aria-label={["Mantel rojo", "Mantel azul", "Mantel verde"][i]} onClick={() => setCloth(c)} className={cn("size-11 rounded-xl border-4 active:scale-[0.97]", cloth === c ? "border-foreground" : "border-transparent")} style={{ background: `repeating-conic-gradient(${c} 0 25%, #fff 0 50%) 0 0 / 16px 16px` }} />)}
        </div>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Invitados">
          {list.map((f) => { const on = guests.includes(f.id); return (
            <button key={f.id} type="button" aria-pressed={on} disabled={!on && guests.length >= 2} onClick={() => { setGuests((g) => (on ? g.filter((x) => x !== f.id) : [...g, f.id])); sfx("click"); }} className={cn("flex flex-col items-center gap-1 rounded-3xl border-2 p-2 text-sm font-semibold active:scale-[0.97] disabled:opacity-50", on ? "border-primary bg-primary/10" : "border-border bg-card")}>
              <span className="block size-12"><PuppyArt friend={f} /></span>{f.name}
            </button>
          ); })}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={foods.length < BASKET} onClick={() => { setStep("hormigas"); sfx("success"); onLine("¡A comer! Oye… ¿eso que viene es una hormiga?"); }} className={cn(btn, "bg-primary text-primary-foreground disabled:opacity-50")}><ShoppingBasket className="mr-1.5 inline size-4" aria-hidden />Tender el mantel</button>
          <button type="button" onClick={onClose} className={cn(btn, "bg-secondary")}>Salir</button>
        </div>
      </div>
    );
  }
  const shown = foods.slice(0, left);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" aria-live="polite">{step === "hormigas" ? `Toca las hormigas para espantarlas · Quedan ${Math.max(0, Math.ceil((PICNIC_MS - t) / 1000))} s · Comida: ${left} de ${BASKET}` : `Se salvaron ${left} de ${BASKET} cosas.`}</p>
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-[#9fdcb4] dark:bg-[#2f5a3c]">
        <span className="absolute left-1/2 top-1/2 block size-[44%] -translate-x-1/2 -translate-y-1/2 rounded-2xl" style={{ background: `repeating-conic-gradient(${cloth} 0 25%, #fff 0 50%) 0 0 / 22px 22px` }} aria-hidden />
        <span className="absolute left-1/2 top-1/2 flex w-[40%] -translate-x-1/2 -translate-y-1/2 flex-wrap justify-center gap-1" aria-hidden>
          {shown.map((f) => <span key={f} className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#3a2a22]">{PICNIC_FOODS[f]}</span>)}
        </span>
        <span className="absolute bottom-1 left-1 block h-16" aria-hidden><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
        {guests.map((id, k) => <span key={id} className={cn("absolute bottom-1 block size-12", k ? "right-14" : "right-1")} aria-hidden><PuppyArt friend={friendOf(id)} /></span>)}
        {step === "hormigas" && ants.map((a) => {
          if (t < a.at || shoo.includes(a.id) || stolen.includes(a.id)) return null;
          const p = antPos(a, t);
          return (
            <button key={a.id} type="button" aria-label="Hormiga" onPointerDown={(e) => { e.preventDefault(); shooRef.current = [...shooRef.current, a.id]; setShoo(shooRef.current); sfx("coin"); }} className="absolute flex size-11 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded-full" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}>
              <motion.span initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, ease: EASE_OUT }} className="block" style={{ transform: `rotate(${(a.angle * 180) / Math.PI + 180}deg)` }}><Bug className="size-6 text-[#2b1d14]" fill="#5a3b2e" aria-hidden /></motion.span>
            </button>
          );
        })}
      </div>
      {step === "fin" && <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">¡Picnic terminado! Espantaste {shoo.length} hormigas. Ganaste {coins} monedas.</p>}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>{step === "fin" ? "Volver" : "Salir"}</button>
    </div>
  );
}

// ── Carrera de carritos ─────────────────────────────────────────────

function CartArt({ color, num, wheel }: { color: string; num: number; wheel: Wheel }) {
  const r = wheel === "chicas" ? 7 : wheel === "medianas" ? 9 : 11;
  return (
    <svg viewBox="0 0 80 50" className="h-full w-full" aria-hidden>
      <rect x="8" y="12" width="64" height="22" rx="4" fill={color} stroke="rgb(0 0 0 / 0.3)" strokeWidth="1.5" />
      <rect x="14" y="16" width="18" height="12" rx="2" fill="#f4ead8" />
      <circle cx="56" cy="23" r="8" fill="#fff" />
      <text x="56" y="27.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2b2622">{num}</text>
      <circle cx="20" cy={46 - r} r={r} fill="#2b2622" /><circle cx="20" cy={46 - r} r={r / 2.5} fill="#bbb" />
      <circle cx="60" cy={46 - r} r={r} fill="#2b2622" /><circle cx="60" cy={46 - r} r={r / 2.5} fill="#bbb" />
    </svg>
  );
}

/** La carrera: armas tu carrito, empujas en la salida y esquivas piedras en la bajada. Paga la primera de cada semana. */
export function DerbyScene({ week, derby, friendIds, look, onLine, onClose }: { week: string; derby?: Derby; friendIds: string[]; look: Look; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [wheel, setWheel] = useState<Wheel>(derby?.cart?.wheel ?? "medianas");
  const [color, setColor] = useState<string>(derby?.cart?.color ?? CART_COLORS[0]);
  const [num, setNum] = useState(derby?.cart?.num ?? 7);
  const [phase, setPhase] = useState<"armar" | "empujar" | "bajada" | "meta">("armar");
  const [t, setT] = useState(0);
  const [taps, setTaps] = useState(0);
  const [lane, setLane] = useState(1);
  const [hits, setHits] = useState(0);
  const [result, setResult] = useState<{ time: number; place: number; coins: number; first: boolean } | null>(null);
  const t0 = useRef(0);
  const laneRef = useRef(1);
  const seen = useRef<number[]>([]);
  const hitsRef = useRef(0);
  const tapsRef = useRef(0);
  const sent = useRef(false);
  const [rocks] = useState(() => rocksOf(week));
  const [rivals] = useState(() => rivalsOf(week, friendIds.length >= 3 ? friendIds : FRIENDS.map((f) => f.id)));
  const first = derby?.week !== week;

  useEffect(() => {
    if (phase !== "empujar" && phase !== "bajada") return;
    t0.current = Date.now();
    const id = setInterval(() => {
      const v = Date.now() - t0.current;
      setT(v);
      if (phase === "empujar" && v >= PUSH_MS) { clearInterval(id); setPhase("bajada"); return; }
      if (phase === "bajada") {
        for (const r of rocks) {
          if (seen.current.includes(r.id) || v < r.at + ROCK_FALL * 0.86) continue;
          seen.current = [...seen.current, r.id];
          if (r.lane === laneRef.current) { hitsRef.current += 1; setHits(hitsRef.current); sfx("sad"); }
        }
        if (v >= RACE_MS) { clearInterval(id); setPhase("meta"); }
      }
    }, 40);
    return () => clearInterval(id);
  }, [phase, rocks]);

  useEffect(() => {
    if (phase !== "meta" || result || sent.current) return;
    sent.current = true;
    const time = raceTime(tapsRef.current, hitsRef.current, wheel);
    const place = 1 + rivals.filter((r) => r.time < time).length;
    void finishRace(week, place, time, { wheel, color, num }).then((r) => {
      setResult({ time, place, coins: r.coins, first: r.first });
      sfx(place === 1 ? "success" : "coin");
      onLine(doneLine(r, place === 1 ? `¡Primer lugar con ${time} segundos! ¡Ganamos!` : `Llegamos en ${place}.º lugar con ${time} segundos. ¡La próxima ganamos!`));
    });
  }, [phase, result, rivals, week, wheel, color, num, onLine]);

  function move(d: -1 | 1) { const l = Math.max(0, Math.min(LANES - 1, laneRef.current + d)); laneRef.current = l; setLane(l); sfx("click"); }
  function reset() { setPhase("armar"); setT(0); setTaps(0); tapsRef.current = 0; setHits(0); hitsRef.current = 0; seen.current = []; setLane(1); laneRef.current = 1; setResult(null); sent.current = false; }

  if (phase === "armar") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">Arma tu carrito para la bajada de la semana. {first ? "La primera carrera de la semana da monedas." : "Esta semana ya corriste; puedes correr otra vez por diversión."}</p>
        <div className="mx-auto h-24 w-40"><CartArt color={color} num={num} wheel={wheel} /></div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Ruedas">
          {(Object.keys(WHEELS) as Wheel[]).map((w) => <button key={w} type="button" aria-pressed={wheel === w} onClick={() => { setWheel(w); sfx("click"); }} className={cn(chip, wheel === w ? "border-primary bg-primary/10" : "border-border")}>{WHEELS[w].name}</button>)}
        </div>
        <p className="text-xs text-muted-foreground">{WHEELS[wheel].note}.</p>
        <div className="flex flex-wrap items-center gap-2">
          {CART_COLORS.map((c) => <button key={c} type="button" aria-pressed={color === c} aria-label="Color" onClick={() => setColor(c)} className={cn("size-11 rounded-full border-4 active:scale-[0.97]", color === c ? "border-foreground" : "border-transparent")} style={{ background: c }} />)}
          <span className="ml-2 flex items-center gap-1 text-sm font-semibold">
            Número
            <button type="button" aria-label="Número menos" onClick={() => setNum((n) => (n <= 1 ? 9 : n - 1))} className="flex size-11 items-center justify-center rounded-full bg-secondary active:scale-[0.97]"><Minus className="size-4" aria-hidden /></button>
            <span className="w-5 text-center font-heading text-lg">{num}</span>
            <button type="button" aria-label="Número más" onClick={() => setNum((n) => (n >= 9 ? 1 : n + 1))} className="flex size-11 items-center justify-center rounded-full bg-secondary active:scale-[0.97]"><Plus className="size-4" aria-hidden /></button>
          </span>
        </div>
        <p className="text-sm">Rivales: {rivals.map((r) => friendOf(r.id).name).join(", ")}.{derby?.best ? ` Tu mejor tiempo: ${derby.best} s.` : ""}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setPhase("empujar"); sfx("gong"); onLine("¡En sus marcas! Empuja fuerte en la salida."); }} className={cn(btn, "bg-primary text-primary-foreground")}>A la salida</button>
          <button type="button" onClick={onClose} className={cn(btn, "bg-secondary")}>Salir</button>
        </div>
      </div>
    );
  }
  if (phase === "empujar") {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-semibold" aria-live="polite">¡Toca rápido para empujar! {Math.max(0, Math.ceil((PUSH_MS - t) / 1000))} s · Empujones: {taps}</p>
        <div className="h-24 w-40"><CartArt color={color} num={num} wheel={wheel} /></div>
        <button type="button" onPointerDown={(e) => { e.preventDefault(); tapsRef.current += 1; setTaps(tapsRef.current); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tapsRef.current += 1; setTaps(tapsRef.current); } }} className="flex size-32 touch-none items-center justify-center rounded-full bg-primary font-heading text-2xl text-primary-foreground active:scale-[0.97]">¡Empuja!</button>
      </div>
    );
  }
  if (phase === "bajada") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold" aria-live="polite">Esquiva las piedras · Piedras que pegaste: {hits}</p>
        <div className="relative mx-auto h-72 w-full max-w-xs overflow-hidden rounded-3xl bg-[#c9b18a]" onKeyDown={(e) => { if (e.key === "ArrowLeft") move(-1); if (e.key === "ArrowRight") move(1); }} tabIndex={0} role="application" aria-label="La bajada. Usa las flechas para cambiar de carril.">
          {[1, 2].map((k) => <span key={k} className="absolute inset-y-0 block w-0 border-l-2 border-dashed border-white/60" style={{ left: `${(k * 100) / LANES}%` }} aria-hidden />)}
          {rocks.map((r) => {
            const p = (t - r.at) / ROCK_FALL;
            if (p < 0 || p > 1.1) return null;
            return <span key={r.id} className="absolute block size-10 -translate-x-1/2 rounded-[40%] bg-[#6b6560]" style={{ left: `${((r.lane + 0.5) * 100) / LANES}%`, top: `${p * 88 - 8}%` }} aria-hidden />;
          })}
          <motion.span data-cart={lane} className="absolute bottom-2 left-0 flex h-14 justify-center" style={{ width: `${100 / LANES}%` }} initial={false} animate={{ transform: `translateX(${lane * 100}%)` }} transition={{ duration: reduce ? 0 : 0.12, ease: EASE_OUT }} aria-hidden>
            <span className="block h-full w-20"><CartArt color={color} num={num} wheel={wheel} /></span>
          </motion.span>
        </div>
        <div className="flex justify-center gap-3">
          <button type="button" aria-label="Carril de la izquierda" onClick={() => move(-1)} className="flex size-16 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><ArrowLeft className="size-7" aria-hidden /></button>
          <button type="button" aria-label="Carril de la derecha" onClick={() => move(1)} className="flex size-16 items-center justify-center rounded-2xl bg-secondary active:scale-[0.97]"><ArrowRight className="size-7" aria-hidden /></button>
        </div>
      </div>
    );
  }
  const board = result ? [...rivals.map((r) => ({ name: friendOf(r.id).name, time: r.time, me: false })), { name: "Mochito", time: result.time, me: true }].sort((a, b) => a.time - b.time) : [];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <span className="block h-20" aria-hidden><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
        {result?.place === 1 && <Trophy className="size-12 text-amber-500" aria-hidden />}
      </div>
      {result ? (
        <>
          <ol className="flex flex-col gap-1 text-sm">
            {board.map((b, i) => <li key={b.name} className={cn("flex justify-between rounded-2xl px-3 py-2", b.me ? "bg-primary/15 font-semibold" : "bg-card")}><span>{i + 1}.º {b.name}</span><span>{b.time} s</span></li>)}
          </ol>
          <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Empujones: {taps} · Piedras: {hits}. {result.first ? `Ganaste ${result.coins} monedas.` : "Esta fue por diversión: las monedas son de la primera carrera de la semana."}</p>
        </>
      ) : <p className="text-sm">Llegando a la meta…</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={reset} className={cn(btn, "bg-secondary")}>Correr otra vez</button>
        <button type="button" onClick={onClose} className={cn(btn, "bg-secondary")}>Volver</button>
      </div>
    </div>
  );
}
