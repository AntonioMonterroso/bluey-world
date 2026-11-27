"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Heart, Mail, MailOpen, Snowflake, Tent, X } from "lucide-react";
import { MochitoFigure } from "@/components/mochito-figure";
import { PuppyArt } from "@/components/puppy-art";
import { adoptBuddy, buddyCare, finishCamp, finishStand, replyLetter } from "@/lib/mochito-actions";
import {
  BUDDY_STAGES, CAMP_COINS, CONSTELLATIONS, DRINKS, DRINK_IDS, FIRE_HOLD_MS, LETTERS, PETS, PET_KINDS, STAKES, STAND_COIN_PER, STAND_ORDERS, STICKS, TOAST_TURNS,
  buddyStage, buddyToday, campKey, campStars, daysToLetter, letterOf, orderOk, orderText, standOrders,
  type Buddy, type Camp, type Constellation, type Drink, type Mail as MailBox, type PetKind,
} from "@/lib/mochito-extra-3";
import type { Groom } from "@/lib/mochito-extra";
import { FRIENDS } from "@/lib/mochito-play";
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

// ── Su mascota ──────────────────────────────────────────────────────

/** La mascota de Mochito dibujada (60×60). */
export function BuddyArt({ kind, className }: { kind: PetKind; className?: string }) {
  const c = PETS[kind].color;
  const line = "rgb(0 0 0 / 0.3)";
  const eyes = (x1: number, x2: number, y: number) => <><circle cx={x1} cy={y} r="2" fill="#2a2320" /><circle cx={x2} cy={y} r="2" fill="#2a2320" /><circle cx={x1 + 0.6} cy={y - 0.6} r="0.6" fill="#fff" /><circle cx={x2 + 0.6} cy={y - 0.6} r="0.6" fill="#fff" /></>;
  return (
    <svg viewBox="0 0 60 60" className={cn("h-full w-full overflow-visible", className)} aria-hidden>
      {kind === "gatito" && <>
        <path d="M44 50 Q56 44 52 30" stroke={c} strokeWidth="4" fill="none" strokeLinecap="round" />
        <ellipse cx="32" cy="46" rx="15" ry="10" fill={c} stroke={line} />
        <path d="M18 22 L20 8 L28 17 Z M42 22 L40 8 L32 17 Z" fill={c} stroke={line} />
        <circle cx="30" cy="26" r="13" fill={c} stroke={line} />
        {eyes(25, 35, 25)}
        <path d="M28 30 L30 32 L32 30 Z" fill="#e2457a" /><path d="M18 30 H8 M18 32 L9 35 M42 30 H52 M42 32 L51 35" stroke="#7a5a3a" strokeWidth="0.6" />
        <path d="M24 22 L26 19 M30 21 L30 18 M36 22 L34 19" stroke="#c97a30" strokeWidth="1.4" />
      </>}
      {kind === "pollito" && <>
        <ellipse cx="30" cy="40" rx="17" ry="15" fill={c} stroke={line} />
        <circle cx="30" cy="22" r="11" fill={c} stroke={line} />
        <path d="M28 10 Q30 4 32 10" stroke={c} strokeWidth="3" fill="none" />
        {eyes(26, 34, 21)}
        <path d="M27 25 L33 25 L30 29 Z" fill="#f08a24" />
        <path d="M14 38 Q8 34 12 44" fill="#e8c12c" /><path d="M46 38 Q52 34 48 44" fill="#e8c12c" />
        <path d="M24 55 V58 M36 55 V58" stroke="#f08a24" strokeWidth="2" />
      </>}
      {kind === "conejito" && <>
        <ellipse cx="22" cy="10" rx="4.5" ry="12" fill={c} stroke={line} /><ellipse cx="38" cy="10" rx="4.5" ry="12" fill={c} stroke={line} />
        <ellipse cx="22" cy="10" rx="2" ry="8" fill="#f2b8c6" /><ellipse cx="38" cy="10" rx="2" ry="8" fill="#f2b8c6" />
        <ellipse cx="30" cy="45" rx="15" ry="12" fill={c} stroke={line} />
        <circle cx="46" cy="48" r="4" fill="#ffffff" stroke={line} />
        <circle cx="30" cy="27" r="12" fill={c} stroke={line} />
        {eyes(25, 35, 26)}
        <ellipse cx="30" cy="31" rx="2" ry="1.4" fill="#e2457a" />
      </>}
      {kind === "tortuguita" && <>
        <ellipse cx="12" cy="40" rx="7" ry="6" fill="#9ccf8a" stroke={line} />
        {eyes(10, 14, 38)}
        <ellipse cx="18" cy="50" rx="4" ry="3" fill="#9ccf8a" /><ellipse cx="44" cy="50" rx="4" ry="3" fill="#9ccf8a" />
        <path d="M14 46 Q30 18 50 46 Z" fill={c} stroke={line} />
        <path d="M24 42 L28 32 L36 32 L40 42 Z" fill="#4f8f4a" /><path d="M20 46 H48" stroke={line} />
      </>}
    </svg>
  );
}

/** Su mascota: adoptarla y cuidarla todos los días (comer y jugar). */
export function BuddyScene({ buddy, now, look, onLine, onClose }: { buddy?: Buddy; now: number; look: Look; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [kind, setKind] = useState<PetKind>("gatito");
  const [name, setName] = useState("");
  const [hop, setHop] = useState(0);
  const t = buddyToday(buddy, now);

  async function adopt() {
    sfx("success");
    const r = await adoptBuddy(kind, name);
    onLine(doneLine(r, `¡Tengo un hermanito! Se llama ${name.trim() || PETS[kind].name}. Lo voy a cuidar mucho.`));
  }
  async function care(what: "fed" | "played") {
    if (!buddy) return;
    setHop((n) => n + 1);
    sfx(what === "fed" ? "coin" : "success");
    const r = await buddyCare(what);
    onLine(doneLine(r, what === "fed" ? `Le dimos ${PETS[buddy.kind].food} a ${buddy.name}. ¡No dejó nada!` : `${buddy.name} y yo ${PETS[buddy.kind].play}. ¡Qué divertido!`));
  }

  if (!buddy) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">Mochito quiere un hermanito. Elige cuál adoptar y ponle nombre: vivirá con él para siempre.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Mascota">
          {PET_KINDS.map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={cn("flex flex-col items-center gap-1 rounded-3xl border-2 bg-card p-3 text-sm font-semibold active:scale-[0.97]", kind === k ? "border-primary" : "border-border")}>
              <span className="block size-16"><BuddyArt kind={k} /></span>{PETS[k].name}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{PETS[kind].says}</p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="buddy-name" className="text-xs font-semibold">Su nombre</label>
          <input id="buddy-name" value={name} maxLength={14} onChange={(e) => setName(e.target.value)} placeholder={PETS[kind].name} className="h-11 rounded-2xl border bg-background px-3 text-base" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void adopt()} className={cn(btn, "bg-primary text-primary-foreground")}>Adoptar</button>
          <button type="button" onClick={onClose} className={cn(btn, "bg-secondary")}>Volver</button>
        </div>
      </div>
    );
  }
  const stage = buddyStage(buddy.hearts);
  const next = BUDDY_STAGES.find((s) => s.at > buddy.hearts);
  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex h-44 items-end justify-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 to-lime-100 p-3 dark:from-sky-950 dark:to-lime-950">
        <span className="block h-32" aria-hidden><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
        <motion.span key={hop} className="block size-20" initial={false} animate={hop && !reduce ? { transform: ["translateY(0px)", "translateY(-16px)", "translateY(0px)", "translateY(-8px)", "translateY(0px)"] } : undefined} transition={{ duration: 0.6, ease: EASE_OUT }} aria-hidden>
          <BuddyArt kind={buddy.kind} />
        </motion.span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold">{buddy.name}</span>
        <span className="text-muted-foreground">{PETS[buddy.kind].name} · {stage.name}</span>
        <span className="flex items-center gap-1 font-semibold"><Heart className="size-4 fill-[#e2457a] text-[#e2457a]" aria-hidden /> {buddy.hearts}{next ? ` (faltan ${next.at - buddy.hearts} para «${next.name}»)` : ""}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={t.fed} onClick={() => void care("fed")} className="min-h-14 rounded-2xl bg-primary px-3 text-sm font-semibold text-primary-foreground active:scale-[0.97] disabled:bg-secondary disabled:text-muted-foreground">{t.fed ? "Ya comió hoy" : "Darle de comer"}</button>
        <button type="button" disabled={t.played} onClick={() => void care("played")} className="min-h-14 rounded-2xl bg-primary px-3 text-sm font-semibold text-primary-foreground active:scale-[0.97] disabled:bg-secondary disabled:text-muted-foreground">{t.played ? "Ya jugaron hoy" : "Jugar juntos"}</button>
      </div>
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
    </div>
  );
}

// ── Cartas ──────────────────────────────────────────────────────────

const friendOf = (id: string) => FRIENDS.find((f) => f.id === id) ?? FRIENDS[0];

/** El buzón: cada dos días llega una carta de un amigo y tú eliges qué contestar. */
export function MailScene({ day, mail, friendIds, onLine, onClose }: { day: string; mail?: MailBox; friendIds: string[]; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const today = letterOf(day, friendIds.length ? friendIds : FRIENDS.map((f) => f.id));
  const saved = today ? mail?.[today.id] : undefined;
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const reply = answer ?? saved?.reply ?? null;
  const past = Object.entries(mail ?? {}).filter(([id, m]) => m.reply !== undefined && id !== today?.id).sort(([a], [b]) => b.localeCompare(a)).slice(0, 10);

  async function send(k: number) {
    if (!today) return;
    setAnswer(k);
    sfx("success");
    const r = await replyLetter(today.id, today.from, today.letter, k);
    onLine(doneLine(r, `¡Carta enviada! Seguro que a ${friendOf(today.from).name} le va a encantar.`));
  }

  return (
    <div className="flex flex-col gap-3">
      {!today ? (
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Hoy no llegó carta. {daysToLetter(day) === 1 ? "Mañana seguro llega una." : `Llega una en ${daysToLetter(day)} días.`}</p>
      ) : !open && reply === null ? (
        <button type="button" onClick={() => { setOpen(true); sfx("click"); onLine(`¡Una carta de ${friendOf(today.from).name}! ¿Me la lees?`); }} className="flex min-h-20 items-center gap-3 rounded-3xl border-2 border-primary bg-card p-4 text-left active:scale-[0.97]">
          <motion.span initial={false} animate={reduce ? undefined : { transform: ["rotate(0deg)", "rotate(-6deg)", "rotate(6deg)", "rotate(0deg)"] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.6, ease: EASE_OUT }} aria-hidden><Mail className="size-10 text-primary" /></motion.span>
          <span className="text-sm"><span className="block font-semibold">¡Llegó una carta!</span>De {friendOf(today.from).name}. Tócala para abrirla.</span>
        </button>
      ) : (
        <article className="flex flex-col gap-3 rounded-3xl border-2 border-[#e8dcc6] bg-[#fffaf0] p-4 text-[#3a2a22] dark:bg-card dark:text-foreground">
          <header className="flex items-center gap-2"><span className="block size-10"><PuppyArt friend={friendOf(today.from)} /></span><span className="text-sm font-semibold">Carta de {friendOf(today.from).name}</span><MailOpen className="ml-auto size-5 text-primary" aria-hidden /></header>
          <p className="text-base leading-relaxed">{LETTERS[today.letter].text}</p>
          {reply === null ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold">¿Qué le contestamos?</p>
              {LETTERS[today.letter].replies.map(([r], k) => <button key={k} type="button" onClick={() => void send(k)} className="min-h-12 rounded-2xl border-2 border-border bg-card px-3 py-2 text-left text-sm font-semibold active:scale-[0.97]">{r}</button>)}
            </div>
          ) : (
            <div className="flex flex-col gap-2 text-sm">
              <p><span className="font-semibold">Le contestamos:</span> «{LETTERS[today.letter].replies[reply][0]}»</p>
              <p className="rounded-2xl bg-secondary/60 px-3 py-2"><span className="font-semibold">{friendOf(today.from).name} respondió:</span> «{LETTERS[today.letter].replies[reply][1]}»</p>
            </div>
          )}
        </article>
      )}
      <section aria-labelledby="cajita" className="flex flex-col gap-2">
        <h3 id="cajita" className="text-sm font-semibold">La cajita de cartas</h3>
        {past.length === 0 ? (
          <p className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">Aquí se guardan las cartas que ya contestaron.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {past.map(([id, m]) => (
              <li key={id} className="flex items-start gap-2 rounded-2xl border bg-card p-2 text-sm">
                <span className="block size-8 shrink-0"><PuppyArt friend={friendOf(m.from)} /></span>
                <span className="min-w-0"><span className="font-semibold">{friendOf(m.from).name}:</span> {LETTERS[m.letter].text}<span className="block text-xs text-muted-foreground">Le contestaron: «{LETTERS[m.letter].replies[m.reply!][0]}»</span></span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
    </div>
  );
}

// ── Campamento ──────────────────────────────────────────────────────

export function SkyShelf({ camp }: { camp?: Camp }) {
  const seen = new Set(camp?.stars ?? []);
  return (
    <section aria-labelledby="cielo" className="flex flex-col gap-2 rounded-3xl border bg-card p-3">
      <h3 id="cielo" className="text-sm font-semibold">Constelaciones descubiertas <span className="font-normal text-muted-foreground">({seen.size} de {CONSTELLATIONS.length})</span></h3>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {CONSTELLATIONS.map((c) => (
          <li key={c.id} className="flex flex-col items-center gap-1 text-center">
            <svg viewBox="0 0 100 60" className={cn("h-12 w-full rounded-xl bg-[#1d2547]", !seen.has(c.id) && "opacity-30")} aria-hidden>
              {seen.has(c.id) && <path d={c.pts.map(([x, y], k) => `${k ? "L" : "M"}${x} ${y}`).join(" ")} stroke="#9fb4ff" strokeWidth="1" fill="none" />}
              {c.pts.map(([x, y], k) => <circle key={k} cx={x} cy={y} r="2" fill="#fff3c4" />)}
            </svg>
            <span className="text-[11px] leading-tight">{seen.has(c.id) ? c.name : "¿?"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

type CampStep = "tienda" | "lena" | "fogata" | "malvavisco" | "estrellas" | "fin";
const STAKE_AT: [number, number][] = [[22, 78], [48, 78], [26, 60], [44, 60]];
const STICK_AT: [number, number][] = [[62, 84], [78, 74], [88, 88], [70, 92], [56, 72]];

/** Campamento de noche (una vez por semana): tienda, leña, fogata, malvaviscos y una constelación nueva. */
export function CampScene({ camp, now, look, onLine, onClose }: { camp?: Camp; now: number; look: Look; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const key = campKey(now);
  const done = camp?.last === key;
  const [stars] = useState(() => campStars(key, camp?.stars ?? []));
  const C = CONSTELLATIONS.find((c) => c.id === stars)!;
  const closedShape = C.pts.length > 2 && C.pts[0][0] === C.pts.at(-1)![0] && C.pts[0][1] === C.pts.at(-1)![1];
  const unique = closedShape ? C.pts.slice(0, -1) : [...C.pts];
  const [step, setStep] = useState<CampStep>("tienda");
  const [stakes, setStakes] = useState<number[]>([]);
  const [sticks, setSticks] = useState<number[]>([]);
  const [fire, setFire] = useState(0);
  const [turns, setTurns] = useState(0);
  const [dots, setDots] = useState(0);
  const [miss, setMiss] = useState("");
  const holdT = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (holdT.current) clearInterval(holdT.current); }, []);

  function stake(i: number) {
    if (stakes.includes(i)) return;
    const n = [...stakes, i];
    setStakes(n); sfx("click");
    if (n.length >= STAKES) { onLine("¡Tienda lista! Yo me pido el lado de la almohada."); setTimeout(() => setStep("lena"), 400); }
  }
  function stick(i: number) {
    if (sticks.includes(i)) return;
    const n = [...sticks, i];
    setSticks(n); sfx("click");
    if (n.length >= STICKS) { onLine("Ya tenemos leña. Yo cargué el palito más grande."); setTimeout(() => setStep("fogata"), 400); }
  }
  function startFire() {
    const t0 = Date.now();
    holdT.current = setInterval(() => {
      const v = Math.min(1, (Date.now() - t0) / FIRE_HOLD_MS);
      setFire(v);
      if (v >= 1) { if (holdT.current) clearInterval(holdT.current); sfx("success"); onLine("¡Fuego! Qué calientito. No me acerco mucho, prometido."); setTimeout(() => setStep("malvavisco"), 500); }
    }, 50);
  }
  function stopFire() { if (holdT.current) clearInterval(holdT.current); setFire((f) => (f >= 1 ? 1 : 0)); }
  function turn() {
    const n = turns + 1;
    setTurns(n); sfx("click");
    if (n >= TOAST_TURNS) { onLine("¡Malvavisco doradito para ti! Para mí, una galleta de perro."); setTimeout(() => setStep("estrellas"), 500); }
  }
  async function star(k: number) {
    if (k !== dots) { setMiss(`Esa no. Busca la estrella ${dots + 1}.`); sfx("sad"); return; }
    setMiss("");
    const n = dots + 1;
    setDots(n); sfx("coin");
    if (n >= unique.length) {
      setStep("fin");
      const r = await finishCamp(stars as Constellation);
      sfx("success");
      onLine(doneLine(r, `¡Descubrimos «${C.name}»! Ganaste ${CAMP_COINS} monedas.`));
    }
  }

  if (done && step === "tienda") {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Esta semana ya acampamos. El próximo campamento es la semana que viene, con otra constelación.</p>
        <SkyShelf camp={camp} />
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[10/7] w-full select-none overflow-hidden rounded-3xl bg-gradient-to-b from-[#141a38] to-[#2c3566]">
        <svg viewBox="0 0 100 70" className="absolute inset-0 h-full w-full">
          {[[8, 8], [18, 14], [90, 6], [84, 18], [60, 6], [12, 30], [94, 34]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="0.6" fill="#fff" opacity="0.7" />)}
          <circle cx="86" cy="12" r="5" fill="#fff3c4" /><circle cx="88" cy="10.5" r="4.5" fill="#1a2148" />
          <path d="M0 70 V56 Q25 50 50 56 T100 54 V70 Z" fill="#1f3a2c" />
          {step === "estrellas" || step === "fin" ? (
            <g>
              {C.pts.slice(0, Math.max(1, dots)).map(([x, y], k, arr) => (k ? <path key={k} d={`M${arr[k - 1][0]} ${arr[k - 1][1] * 0.8} L${x} ${y * 0.8}`} stroke="#9fb4ff" strokeWidth="0.8" /> : null))}
              {unique.map(([x, y], k) => (
                <g key={k} role="button" tabIndex={0} aria-label={`Estrella ${k + 1}${k < dots ? ", unida" : ""}`} onClick={() => void star(k)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); void star(k); } }} className="cursor-pointer outline-none">
                  <circle cx={x} cy={y * 0.8} r="4.5" fill="transparent" />
                  <circle cx={x} cy={y * 0.8} r={k < dots ? 1.8 : 1.4} fill={k < dots ? "#fff3c4" : "#ffffff"} />
                  {step === "estrellas" && <text x={x + 2.6} y={y * 0.8 - 1.6} fontSize="3.4" fill="#cfd8ff">{k + 1}</text>}
                </g>
              ))}
              {dots >= unique.length && closedShape && <path d={`M${unique.at(-1)![0]} ${unique.at(-1)![1] * 0.8} L${C.pts[0][0]} ${C.pts[0][1] * 0.8}`} stroke="#9fb4ff" strokeWidth="0.8" />}
            </g>
          ) : null}
          {(step !== "tienda" || stakes.length > 0) && (
            <g opacity={step === "tienda" ? stakes.length / STAKES : 1}>
              <path d="M16 64 L35 36 L54 64 Z" fill="#e0533c" stroke="#7a2a20" strokeWidth="0.6" />
              <path d="M29 64 L35 48 L41 64 Z" fill="#7a2a20" />
            </g>
          )}
          {step === "tienda" && STAKE_AT.map(([x, y], i) => !stakes.includes(i) && (
            <g key={i} role="button" tabIndex={0} aria-label={`Clavar la estaca ${i + 1}`} onClick={() => stake(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stake(i); } }} className="cursor-pointer outline-none">
              <circle cx={x} cy={y * 0.7 + 6} r="5" fill="rgb(255 255 255 / 0.18)" />
              <path d={`M${x} ${y * 0.7 + 3} V${y * 0.7 + 9}`} stroke="#d9b98a" strokeWidth="1.6" />
            </g>
          ))}
          {step === "lena" && STICK_AT.map(([x, y], i) => !sticks.includes(i) && (
            <g key={i} role="button" tabIndex={0} aria-label={`Recoger el palito ${i + 1}`} onClick={() => stick(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stick(i); } }} className="cursor-pointer outline-none">
              <circle cx={x} cy={y * 0.7} r="5" fill="rgb(255 255 255 / 0.15)" />
              <path d={`M${x - 3.5} ${y * 0.7 + 1} L${x + 3.5} ${y * 0.7 - 1}`} stroke="#9a6532" strokeWidth="1.6" strokeLinecap="round" />
            </g>
          ))}
          {step !== "tienda" && step !== "lena" && (
            <g>
              <path d="M60 64 L72 60 M60 60 L72 64" stroke="#6b4422" strokeWidth="1.6" strokeLinecap="round" />
              {(fire >= 1 || step !== "fogata") && <motion.path d="M66 60 Q60 52 64 46 Q66 52 68 48 Q72 54 66 60 Z" fill="#f6a623" initial={false} animate={reduce ? undefined : { opacity: [0.85, 1, 0.85] }} transition={{ duration: 0.8, repeat: Infinity }} />}
              {(fire >= 1 || step !== "fogata") && <path d="M66 60 Q63 55 65 51 Q67 55 69 53 Q69 58 66 60 Z" fill="#fde68a" />}
            </g>
          )}
          {step === "malvavisco" && <g><path d="M48 44 L64 52" stroke="#a8703f" strokeWidth="0.8" /><rect x="44" y="41" width="6" height="5" rx="1.5" fill={["#ffffff", "#fbe8c8", "#f3cf8f", "#e2a95b", "#c98b4a"][turns]} stroke="rgb(0 0 0 / 0.3)" strokeWidth="0.3" /></g>}
        </svg>
        <span className="absolute bottom-[3%] left-[2%] block h-[34%]" aria-hidden><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
      </div>

      <div className="flex flex-col gap-2" aria-live="polite">
        {step === "tienda" && <p className="text-sm font-semibold">Toca las {STAKES} estacas para armar la tienda ({stakes.length} de {STAKES}).</p>}
        {step === "lena" && <p className="text-sm font-semibold">Recoge {STICKS} palitos para la fogata ({sticks.length} de {STICKS}).</p>}
        {step === "fogata" && (
          <>
            <p className="text-sm font-semibold">Mantén presionado para prender la fogata.</p>
            <button type="button" onPointerDown={(e) => { e.preventDefault(); startFire(); }} onPointerUp={stopFire} onPointerLeave={stopFire} onPointerCancel={stopFire} onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) startFire(); }} onKeyUp={stopFire} className="relative min-h-14 self-start touch-none select-none overflow-hidden rounded-2xl bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-[0.97]">
              <span className="absolute inset-y-0 left-0 bg-white/30" style={{ width: `${fire * 100}%` }} aria-hidden /><span className="relative">Prender…</span>
            </button>
          </>
        )}
        {step === "malvavisco" && (
          <>
            <p className="text-sm font-semibold">Gira el malvavisco para que se dore parejito ({turns} de {TOAST_TURNS}).</p>
            <button type="button" onClick={turn} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Girar</button>
          </>
        )}
        {step === "estrellas" && <p className="text-sm font-semibold">Une las estrellas en orden, de la 1 a la {unique.length}, para descubrir la constelación.</p>}
        {miss && <p className="text-sm font-semibold text-destructive" role="alert">{miss}</p>}
        {step === "fin" && <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm"><Tent className="mr-1 inline size-4 text-primary" aria-hidden /> ¡Descubrieron «{C.name}»! Mochito se quedó dormido viendo las estrellas.</p>}
      </div>
      {step === "fin" && <SkyShelf camp={{ ...camp, stars: [...new Set([...(camp?.stars ?? []), stars])] }} />}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>{step === "fin" || step === "tienda" ? "Volver" : "Dejarlo para después"}</button>
    </div>
  );
}

// ── Puesto de limonada ──────────────────────────────────────────────

function Cup({ drink, big, ice, className }: { drink?: Drink; big?: boolean; ice?: boolean; className?: string }) {
  const h = big ? 40 : 28;
  return (
    <svg viewBox="0 0 40 50" className={className} aria-hidden>
      <path d={`M${big ? 6 : 10} ${48 - h} L${big ? 34 : 30} ${48 - h} L${big ? 30 : 27} 48 L${big ? 10 : 13} 48 Z`} fill={drink ? DRINKS[drink].color : "rgb(255 255 255 / 0.4)"} stroke="rgb(0 0 0 / 0.3)" strokeWidth="1" />
      {ice && <><rect x="15" y={52 - h} width="5" height="5" fill="rgb(255 255 255 / 0.75)" transform={`rotate(12 17 ${54 - h})`} /><rect x="21" y={55 - h} width="5" height="5" fill="rgb(255 255 255 / 0.75)" /></>}
      <path d={`M24 ${46 - h} L30 ${38 - h}`} stroke="#e2457a" strokeWidth="1.6" />
    </svg>
  );
}

/** El puesto del día: cinco clientes, cada uno pide su bebida. Se cobra por cada pedido bien servido. */
export function StandScene({ day, done, look, onLine, onClose }: { day: string; done: boolean; look: Look; onLine: (s: string) => void; onClose: () => void }) {
  const who = FRIENDS.map((f) => f.id);
  const orders = standOrders(day, who);
  const [i, setI] = useState(0);
  const [g, setG] = useState<{ drink?: Drink; big?: boolean; ice?: boolean }>({});
  const [res, setRes] = useState<boolean[]>([]);
  const [shown, setShown] = useState<boolean | null>(null);
  const [closed, setClosed] = useState(false);
  const o = orders[Math.min(i, STAND_ORDERS - 1)];
  const f = friendOf(o.who);
  const ok = res.filter(Boolean).length;

  function serve() {
    const good = orderOk(o, g);
    setShown(good);
    setRes((r) => [...r, good]);
    sfx(good ? "cash" : "sad");
    onLine(good ? `¡${f.name} dice que está riquísima!` : `Uy, ${f.name} quería ${orderText(o).toLowerCase()}.`);
  }
  async function next() {
    setShown(null); setG({});
    if (i + 1 < STAND_ORDERS) { setI((n) => n + 1); return; }
    setClosed(true);
    const r = await finishStand(ok, STAND_ORDERS);
    sfx("success");
    onLine(doneLine(r, ok ? `¡Cerramos el puesto! Ganamos ${ok * STAND_COIN_PER} monedas.` : "Cerramos el puesto. Mañana nos sale mejor."));
  }

  if (done && !closed) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Hoy ya atendimos el puesto. Mañana abrimos otra vez con clientes nuevos.</p>
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex h-44 items-end justify-between overflow-hidden rounded-3xl bg-gradient-to-b from-amber-100 to-lime-100 px-4 pb-2 dark:from-amber-950 dark:to-lime-950">
        <div className="relative flex items-end" aria-hidden>
          <span className="block h-28"><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
          <span className="absolute -right-10 bottom-0 flex h-14 w-28 items-start justify-center rounded-t-lg bg-[#f6c744] pt-1 text-[11px] font-bold text-[#7a4a1d] shadow">LIMONADA</span>
        </div>
        {!closed && (
          <div className="flex items-end gap-2">
            <span className="mb-16 max-w-[9rem] rounded-2xl bg-card px-2 py-1 text-xs font-semibold shadow">{orderText(o)}, por favor</span>
            <span className="block size-20" aria-hidden><PuppyArt friend={f} /></span>
          </div>
        )}
      </div>
      {closed ? (
        <div className="flex flex-col gap-2 rounded-3xl bg-secondary/60 p-3 text-sm">
          <p className="font-semibold">¡Puesto cerrado! {ok} de {STAND_ORDERS} pedidos perfectos.</p>
          <p>Ganaste {ok * STAND_COIN_PER} monedas.</p>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold" aria-live="polite">Cliente {i + 1} de {STAND_ORDERS}: {f.name} pide {orderText(o).toLowerCase()}.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Cup drink={g.drink} big={g.big} ice={g.ice} className="h-20 w-16 shrink-0" />
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Bebida">
                {DRINK_IDS.map((d) => <button key={d} type="button" role="radio" aria-checked={g.drink === d} disabled={shown !== null} onClick={() => setG((x) => ({ ...x, drink: d }))} className={cn(chip, g.drink === d ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary")}>{DRINKS[d].name}</button>)}
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex gap-2" role="radiogroup" aria-label="Tamaño">
                  {[false, true].map((b) => <button key={String(b)} type="button" role="radio" aria-checked={g.big === b} disabled={shown !== null} onClick={() => setG((x) => ({ ...x, big: b }))} className={cn(chip, g.big === b ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary")}>{b ? "Grande" : "Chica"}</button>)}
                </div>
                <div className="flex gap-2" role="radiogroup" aria-label="Hielo">
                  {[true, false].map((b) => <button key={String(b)} type="button" role="radio" aria-checked={g.ice === b} disabled={shown !== null} onClick={() => setG((x) => ({ ...x, ice: b }))} className={cn(chip, "flex items-center gap-1", g.ice === b ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary")}><Snowflake className="size-4" aria-hidden /> {b ? "Con hielo" : "Sin hielo"}</button>)}
                </div>
              </div>
            </div>
          </div>
          {shown === null ? (
            <button type="button" disabled={!g.drink || g.big === undefined || g.ice === undefined} onClick={serve} className={cn(btn, "self-start bg-primary text-primary-foreground disabled:opacity-50")}>Servir</button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <p className={cn("flex items-center gap-1 rounded-2xl px-3 py-2 text-sm font-semibold", shown ? "bg-[#e3f3e6] text-[#1f5c2e] dark:bg-emerald-950 dark:text-emerald-200" : "bg-destructive/10 text-destructive")}>{shown ? <><Check className="size-4" aria-hidden /> ¡Justo lo que pidió!</> : <><X className="size-4" aria-hidden /> Quería {orderText(o).toLowerCase()}.</>}</p>
              <button type="button" onClick={() => void next()} className={cn(btn, "bg-primary text-primary-foreground")}>{i + 1 < STAND_ORDERS ? "Siguiente cliente" : "Cerrar el puesto"}</button>
            </div>
          )}
        </>
      )}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
    </div>
  );
}
