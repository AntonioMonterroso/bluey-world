"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Apple, Banana, Bone, Bot, Car, Check, CircleDot, Container, CupSoda, Droplets, FileText, Heart, Leaf, Milk, Moon, Newspaper, Package, Recycle, ShoppingBag, Volleyball, Wine,
} from "lucide-react";
import { MochitoFigure } from "@/components/mochito-figure";
import { PuppyArt } from "@/components/puppy-art";
import { BuddyArt } from "@/components/mochito-care-5";
import type { PetKind } from "@/lib/mochito-extra-3";
import { finishClean, finishDaycare, finishRepair, presentPlay } from "@/lib/mochito-actions";
import {
  BINS, BIN_IDS, ENDINGS, PROBLEMS, PUMP_MS, SCREWS, STAGES, STITCHES, TOYS, WANTS, daycareOf, playScript, playTitle, trashOf, workshopOf,
  type Bin, type Ending, type Problem, type Stage, type Theater, type Toy, type Want,
} from "@/lib/mochito-extra-5";
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

// ── Guardería ───────────────────────────────────────────────────────

const WANT_ICON: Record<Want, typeof Bone> = { comer: Bone, agua: Droplets, jugar: CircleDot, abrazo: Heart, dormir: Moon };
const WANT_HINT: Record<Want, string> = {
  comer: "mira su platito vacío y se relame",
  agua: "jadea y saca la lengüita",
  jugar: "mueve la cola y te trae un juguete",
  abrazo: "llora bajito y se te pega a las piernas",
  dormir: "bosteza y se le cierran los ojitos",
};

/** La guardería: tres cachorritos de los vecinos. Lee lo que hace cada uno y dale lo que necesita. */
export function DaycareScene({ day, done, onLine, onClose }: { day: string; done: boolean; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const pups = daycareOf(day);
  const [step, setStep] = useState(() => pups.map(() => 0));
  const [mistakes, setMistakes] = useState(0);
  const [msg, setMsg] = useState("");
  const [shake, setShake] = useState<{ i: number; k: number } | null>(null);
  const [finished, setFinished] = useState(false);
  const all = step.every((s) => s >= 3);

  function give(i: number, w: Want) {
    const p = pups[i];
    if (step[i] >= 3 || finished) return;
    const want = p.wants[step[i]];
    if (w !== want) {
      setMistakes((m) => m + 1);
      setShake((x) => ({ i, k: (x?.k ?? 0) + 1 }));
      setMsg(`${p.name} no quería eso. Fíjate: ${WANT_HINT[want]}.`);
      sfx("sad");
      return;
    }
    const n = [...step]; n[i] += 1;
    setStep(n);
    setMsg(`${p.name} ${WANTS[w].did}.`);
    sfx(w === "dormir" ? "success" : "coin");
  }
  async function handBack() {
    setFinished(true);
    const r = await finishDaycare(pups.map((p) => p.name), mistakes);
    sfx("cash");
    onLine(doneLine(r, `¡Regresaron las familias! Nos dejaron ${r?.coins ?? 0} monedas de propina${mistakes ? "" : " y dijeron que nadie los cuida mejor"}.`));
  }

  if (done && !finished) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Hoy ya cuidamos a los cachorritos. Mañana vienen otros.</p>
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">Los vecinos nos encargaron a sus cachorritos. Lee lo que hace cada uno y dale lo que necesita. Al final todos quieren dormir.</p>
      <ul className="grid gap-2 sm:grid-cols-3">
        {pups.map((p, i) => {
          const friend: Friend = { id: `cachorro-${i}`, name: p.name, coat: p.coat, ear: "#8a5a2e", says: "" };
          const asleep = step[i] >= 3;
          return (
            <motion.li key={`${p.name}-${shake?.i === i ? shake.k : 0}`} className={cn("flex flex-col gap-2 rounded-3xl border-2 bg-card p-3", asleep ? "border-primary/40" : "border-border")} animate={shake?.i === i && !reduce ? { transform: ["translateX(0px)", "translateX(-5px)", "translateX(5px)", "translateX(0px)"] } : undefined} transition={{ duration: 0.25, ease: EASE_OUT }}>
              <div className="flex items-center gap-2">
                <span className={cn("block size-14 shrink-0", asleep && "opacity-70")}><PuppyArt friend={friend} /></span>
                <span className="text-sm"><span className="block font-semibold">{p.name}</span>{asleep ? "Zzz… dormidito." : `${p.name} ${WANT_HINT[p.wants[step[i]]]}.`}</span>
              </div>
              {!asleep && (
                <div className="flex flex-wrap gap-1" role="group" aria-label={`Qué darle a ${p.name}`}>
                  {(Object.keys(WANTS) as Want[]).map((w) => { const I = WANT_ICON[w]; return <button key={w} type="button" aria-label={WANTS[w].name} title={WANTS[w].name} onClick={() => give(i, w)} className="flex size-11 items-center justify-center rounded-xl bg-secondary active:scale-[0.97]"><I className="size-5 text-primary" aria-hidden /></button>; })}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">{Math.min(step[i], 3)} de 3 cosas</p>
            </motion.li>
          );
        })}
      </ul>
      {msg && <p className="text-sm font-semibold" aria-live="polite">{msg}</p>}
      <p className="text-xs text-muted-foreground">Botones: hueso = comida, gota = agua, pelota = jugar, corazón = abrazo, luna = dormir.</p>
      {all && !finished && <button type="button" onClick={() => void handBack()} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Entregarlos a sus familias</button>}
      {finished && <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">¡Todos se fueron contentos!{mistakes ? ` Hubo ${mistakes} ${mistakes === 1 ? "confusión" : "confusiones"}, pero nada grave.` : " Sin una sola confusión."}</p>}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>{finished ? "Volver" : "Salir"}</button>
    </div>
  );
}

// ── Teatro de títeres ───────────────────────────────────────────────

const STAGE_BG: Record<Stage, string> = {
  bosque: "linear-gradient(#bfe3c8, #5bb06a)", castillo: "linear-gradient(#e7d9f5, #b9a3d9)", mar: "linear-gradient(#9fd3f2, #2d6fa8)", espacio: "linear-gradient(#141a38, #3a2f6b)",
};

/** El teatro: eliges escenario, personajes, el problema y el final; luego Mochito y sus amigos lo actúan. */
export function TheaterScene({ theater, friends, buddyName, buddyKind, look, onLine, onClose }: { theater?: Theater; friends: Friend[]; buddyName?: string; buddyKind?: PetKind; look: Look; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const pool = ["Mochito", ...(buddyName ? [buddyName] : []), ...(friends.length ? friends : FRIENDS).map((f) => f.name)];
  const [stage, setStage] = useState<Stage>("bosque");
  const [cast2, setCast2] = useState(pool[1] ?? "Panqué");
  const [problem, setProblem] = useState<Problem>("tesoro");
  const [ending, setEnding] = useState<Ending>("feliz");
  const [scene, setScene] = useState(-1);
  const [clap, setClap] = useState(false);
  const script = playScript(stage, ["Mochito", cast2], problem, ending);
  const friend2 = FRIENDS.find((f) => f.name === cast2);

  async function next() {
    if (scene + 1 < script.length) { setScene((n) => n + 1); sfx("click"); return; }
    setClap(true);
    sfx("success");
    const title = playTitle(stage, problem);
    const r = await presentPlay(title);
    onLine(doneLine(r, `¡Bravo! «${title}» fue un éxito.`));
  }
  const pick = (on: boolean) => cn(chip, on ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary");

  if (scene < 0) {
    return (
      <div className="flex flex-col gap-3">
        <fieldset className="flex flex-col gap-2"><legend className="mb-1 text-sm font-semibold">Escenario</legend><div className="flex flex-wrap gap-2">{(Object.keys(STAGES) as Stage[]).map((s) => <button key={s} type="button" aria-pressed={stage === s} onClick={() => setStage(s)} className={pick(stage === s)}>{STAGES[s][0].toUpperCase() + STAGES[s].slice(1)}</button>)}</div></fieldset>
        <fieldset className="flex flex-col gap-2"><legend className="mb-1 text-sm font-semibold">Actúa con Mochito</legend><div className="flex flex-wrap gap-2">{pool.slice(1).map((n) => <button key={n} type="button" aria-pressed={cast2 === n} onClick={() => setCast2(n)} className={pick(cast2 === n)}>{n}</button>)}</div></fieldset>
        <fieldset className="flex flex-col gap-2"><legend className="mb-1 text-sm font-semibold">¿Qué pasa?</legend><div className="flex flex-wrap gap-2">{(Object.keys(PROBLEMS) as Problem[]).map((p) => <button key={p} type="button" aria-pressed={problem === p} onClick={() => setProblem(p)} className={pick(problem === p)}>{PROBLEMS[p][0].toUpperCase() + PROBLEMS[p].slice(1)}</button>)}</div></fieldset>
        <fieldset className="flex flex-col gap-2"><legend className="mb-1 text-sm font-semibold">El final</legend><div className="flex flex-wrap gap-2">{(Object.keys(ENDINGS) as Ending[]).map((e) => <button key={e} type="button" aria-pressed={ending === e} onClick={() => setEnding(e)} className={pick(ending === e)}>{ENDINGS[e]}</button>)}</div></fieldset>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setScene(0); setClap(false); sfx("click"); onLine("¡Silencio, que ya empieza! Estoy un poquito nervioso."); }} className={cn(btn, "bg-primary text-primary-foreground")}>¡Que empiece la función!</button>
          <button type="button" onClick={onClose} className={cn(btn, "bg-secondary")}>Volver</button>
        </div>
        {(theater?.plays?.length ?? 0) > 0 && (
          <section aria-labelledby="obras" className="flex flex-col gap-1">
            <h3 id="obras" className="text-sm font-semibold">Obras presentadas ({theater!.plays!.length})</h3>
            <ul className="flex flex-col gap-1 text-sm">{[...theater!.plays!].reverse().slice(0, 5).map((p, k) => <li key={k} className="rounded-2xl bg-secondary/60 px-3 py-1.5">{p.title}</li>)}</ul>
          </section>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-56 overflow-hidden rounded-3xl border-[10px] border-[#a8332a]" style={{ background: STAGE_BG[stage] }}>
        <motion.span className="absolute inset-y-0 left-0 w-1/2 bg-[#c0392b]" initial={false} animate={{ transform: "translateX(-92%)" }} transition={{ duration: reduce ? 0 : 0.8, ease: EASE_OUT }} aria-hidden />
        <motion.span className="absolute inset-y-0 right-0 w-1/2 bg-[#c0392b]" initial={false} animate={{ transform: "translateX(92%)" }} transition={{ duration: reduce ? 0 : 0.8, ease: EASE_OUT }} aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-[#6b4422]" aria-hidden />
        <motion.span key={`a${scene}`} className="absolute bottom-4 left-[18%] block h-28" initial={false} animate={reduce ? undefined : { transform: ["translateY(0px)", "translateY(-10px)", "translateY(0px)"] }} transition={{ duration: 0.5, ease: EASE_OUT }} aria-hidden><MochitoFigure outfit={look.outfit} groom={look.groom} /></motion.span>
        <motion.span key={`b${scene}`} className="absolute bottom-4 right-[18%] block size-24" initial={false} animate={reduce ? undefined : { transform: ["translateY(0px)", "translateY(-8px)", "translateY(0px)"] }} transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.15 }} aria-hidden>{friend2 ? <PuppyArt friend={friend2} /> : buddyKind && cast2 === buddyName ? <BuddyArt kind={buddyKind} /> : <span className="flex h-full items-center justify-center rounded-full bg-card text-sm font-semibold">{cast2}</span>}</motion.span>
        {clap && <p className="absolute inset-x-0 top-3 text-center font-heading text-2xl text-white drop-shadow">¡Aplausos!</p>}
      </div>
      <p className="rounded-3xl bg-card px-4 py-3 text-base leading-relaxed shadow-sm" aria-live="polite"><span className="text-xs font-semibold text-muted-foreground">Escena {scene + 1} de {script.length}</span><br />{script[scene]}</p>
      {clap ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setScene(-1)} className={cn(btn, "bg-primary text-primary-foreground")}>Hacer otra obra</button>
          <button type="button" onClick={onClose} className={cn(btn, "bg-secondary")}>Volver</button>
        </div>
      ) : (
        <button type="button" onClick={() => void next()} className={cn(btn, "self-start bg-primary text-primary-foreground")}>{scene + 1 < script.length ? "Siguiente escena" : "Cerrar el telón"}</button>
      )}
    </div>
  );
}

// ── Limpiar el parque ───────────────────────────────────────────────

const TRASH_ICON: Record<string, typeof Bone> = {
  periodico: Newspaper, caja: Package, hoja: FileText, botella: Milk, bolsa: ShoppingBag, vaso: CupSoda, frasco: Container, botellav: Wine, platano: Banana, manzana: Apple, hojas: Leaf,
};

/** Limpiar el parque: toca una cosa tirada y luego el bote donde va. */
export function CleanScene({ day, done, look, onLine, onClose }: { day: string; done: boolean; look: Look; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const items = trashOf(day);
  const [sel, setSel] = useState<number | null>(null);
  const [gone, setGone] = useState<number[]>([]);
  const [ok, setOk] = useState(0);
  const [msg, setMsg] = useState("");
  const [finished, setFinished] = useState(false);

  async function toBin(b: Bin) {
    if (sel === null) { setMsg("Primero toca algo del parque."); return; }
    const it = items[sel];
    if (it.bin !== b) { setMsg(`${it.name}: ese no es su bote. Va en ${BINS[it.bin].name.toLowerCase()}.`); sfx("sad"); setSel(null); setGone((g) => [...g, sel]); await maybeEnd([...gone, sel], ok); return; }
    const n = ok + 1;
    setOk(n); setMsg(`¡Bien! ${it.name} va en ${BINS[b].name.toLowerCase()}.`); sfx("coin");
    setSel(null); setGone((g) => [...g, sel]);
    await maybeEnd([...gone, sel], n);
  }
  async function maybeEnd(g: number[], n: number) {
    if (g.length < items.length) return;
    setFinished(true);
    const r = await finishClean(n);
    sfx("success");
    onLine(doneLine(r, `¡El parque quedó limpiecito! Reciclamos bien ${n} de ${items.length} cosas.`));
  }

  if (done && !finished) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Hoy ya limpiamos el parque. Mañana habrá otras cosas que recoger.</p>
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">Toca algo que esté tirado y luego el bote donde va. Recogidas: {gone.length} de {items.length}.</p>
      <div className="relative h-56 overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 to-[#9fdcb4] dark:from-sky-950 dark:to-emerald-900">
        {finished && [12, 30, 52, 70, 88].map((x, k) => <span key={x} className="absolute bottom-3 block size-4 rounded-full" style={{ left: `${x}%`, background: ["#e2457a", "#f6c744", "#9b7fd1", "#f08a24", "#e27aa3"][k] }} aria-hidden />)}
        <span className="absolute bottom-2 left-2 block h-24" aria-hidden><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
        {items.map((it, i) => {
          if (gone.includes(i)) return null;
          const I = TRASH_ICON[it.id] ?? Package;
          return (
            <motion.button key={it.id} type="button" aria-label={it.name} aria-pressed={sel === i} onClick={() => { setSel(i); setMsg(it.name); sfx("click"); }} className={cn("absolute flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-card/90 shadow", sel === i && "ring-4 ring-primary")} style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%` }} initial={reduce ? false : { opacity: 0, transform: "translate(-50%, -50%) scale(0.95)" }} animate={{ opacity: 1, transform: "translate(-50%, -50%) scale(1)" }} transition={{ duration: 0.2, ease: EASE_OUT }}>
              <I className="size-7 text-[#5a4a42]" aria-hidden />
            </motion.button>
          );
        })}
      </div>
      {msg && <p className="text-sm font-semibold" aria-live="polite">{msg}</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Botes de reciclaje">
        {BIN_IDS.map((b) => <button key={b} type="button" disabled={finished} onClick={() => void toBin(b)} className="flex min-h-14 items-center justify-center gap-1.5 rounded-2xl px-3 text-sm font-semibold text-white active:scale-[0.97] disabled:opacity-50" style={{ background: BINS[b].color }}><Recycle className="size-4" aria-hidden /> {BINS[b].name}</button>)}
      </div>
      {finished && <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">¡Parque limpio! Reciclaste bien {ok} de {items.length}. Ganaste {ok} {ok === 1 ? "moneda" : "monedas"}.</p>}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>{finished ? "Volver" : "Salir"}</button>
    </div>
  );
}

// ── Taller de juguetes ──────────────────────────────────────────────

const TOY_ICON: Record<Toy, typeof Bone> = { peluche: Heart, carrito: Car, pelota: Volleyball, robot: Bot };
const COLORS = [{ n: "Rojo", h: "#d6453d" }, { n: "Azul", h: "#3f74c4" }, { n: "Amarillo", h: "#f6c744" }, { n: "Verde", h: "#5bb06a" }];

/** El taller: un amigo trae un juguete roto y lo arreglan en dos pasos. Uno al día. */
export function WorkshopScene({ day, done, friendIds, onLine, onClose }: { day: string; done: boolean; friendIds: string[]; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const job = workshopOf(day, friendIds.length ? friendIds : FRIENDS.map((f) => f.id));
  const toy = TOYS[job.toy];
  const f = friendOf(job.from);
  const [step, setStep] = useState(0);
  const [count, setCount] = useState(0);
  const [msg, setMsg] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [pump, setPump] = useState(0);
  const [finished, setFinished] = useState(false);
  const holdT = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (holdT.current) clearInterval(holdT.current); }, []);
  const Icon = TOY_ICON[job.toy];

  function advance() { setStep((s) => s + 1); setCount(0); setMsg(""); sfx("success"); }
  async function finish() {
    setFinished(true);
    const r = await finishRepair(job.toy, job.from);
    sfx("cash");
    onLine(doneLine(r, `¡${f.name} está feliz con su ${toy.name.toLowerCase()}! Dice que quedó como nuevo.`));
  }
  function tapCount(need: number, done1: string) {
    const n = count + 1;
    setCount(n); sfx("click");
    if (n >= need) { setMsg(done1); advance(); }
  }
  function startPump() {
    const t0 = Date.now();
    holdT.current = setInterval(() => {
      const v = Math.min(1, (Date.now() - t0) / PUMP_MS);
      setPump(v);
      if (v >= 1) { if (holdT.current) clearInterval(holdT.current); setMsg("¡Inflada y redondita!"); advance(); }
    }, 50);
  }
  function stopPump() { if (holdT.current) clearInterval(holdT.current); setPump((p) => (p >= 1 ? 1 : 0)); }

  if (done && !finished) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Hoy ya arreglamos un juguete. Mañana alguien más traerá otro.</p>
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }
  const wheelSizes = ["Chica", "Mediana", "Grande"];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-3xl bg-secondary/60 p-3">
        <span className="block size-14 shrink-0"><PuppyArt friend={f} /></span>
        <p className="text-sm"><span className="font-semibold">{f.name}</span> trajo su {toy.name.toLowerCase()}: {toy.broken}.</p>
      </div>
      <div className="relative flex h-40 items-center justify-center rounded-3xl bg-[#f6ead2] dark:bg-stone-800">
        <motion.span key={step} initial={reduce ? false : { opacity: 0.6, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: step >= 2 ? "scale(1.05)" : "scale(1)" }} transition={{ duration: 0.3, ease: EASE_OUT }}>
          <Icon className="size-24" style={{ color: step >= 2 || (job.toy === "pelota" && step === 1) ? (color ?? "#d6453d") : "#8a7a70" }} strokeWidth={1.4} aria-hidden />
        </motion.span>
        {step >= 2 && <Check className="absolute right-4 top-4 size-8 text-[#5bb06a]" aria-label="Arreglado" />}
      </div>
      <ol className="flex flex-wrap gap-2 text-xs" aria-label="Pasos">{toy.steps.map((s, k) => <li key={s} className={cn("flex items-center gap-1 rounded-full px-3 py-1", step > k ? "bg-primary text-primary-foreground" : "bg-secondary")}>{step > k && <Check className="size-3.5" aria-hidden />}{s}</li>)}</ol>
      {msg && <p className="text-sm font-semibold" aria-live="polite">{msg}</p>}

      {step === 0 && job.toy === "peluche" && <><p className="text-sm">Da {STITCHES} puntadas ({count} de {STITCHES}).</p><button type="button" onClick={() => tapCount(STITCHES, "¡Brazo cosido!")} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Dar una puntada</button></>}
      {step === 1 && job.toy === "peluche" && <ColorPick label="Color del moño" onPick={(c) => { setColor(c); advance(); }} />}

      {step === 0 && job.toy === "carrito" && (
        <><p className="text-sm">Mira las otras ruedas: son {wheelSizes[job.wheel].toLowerCase()}s. ¿Cuál le pones?</p>
          <div className="flex flex-wrap gap-2">{wheelSizes.map((w, k) => <button key={w} type="button" onClick={() => { if (k === job.wheel) { setMsg("¡Esa es! Le queda perfecta."); advance(); } else { setMsg(`Esa es ${w.toLowerCase()}; las demás son ${wheelSizes[job.wheel].toLowerCase()}s.`); sfx("sad"); } }} className={cn(chip, "border-transparent bg-secondary")}>{w}</button>)}</div></>
      )}
      {step === 1 && job.toy === "carrito" && <><p className="text-sm">Aprieta los {SCREWS} tornillos ({count} de {SCREWS}).</p><button type="button" onClick={() => tapCount(SCREWS, "¡Bien firme!")} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Apretar un tornillo</button></>}

      {step === 0 && job.toy === "pelota" && <><p className="text-sm">Busca el hoyito y ponle el parche.</p><button type="button" onClick={() => { setMsg("¡Parche puesto!"); advance(); }} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Poner el parche</button></>}
      {step === 1 && job.toy === "pelota" && (
        <><p className="text-sm">Mantén presionado para inflarla.</p>
          <button type="button" onPointerDown={(e) => { e.preventDefault(); startPump(); }} onPointerUp={stopPump} onPointerLeave={stopPump} onPointerCancel={stopPump} onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) startPump(); }} onKeyUp={stopPump} className="relative min-h-14 self-start touch-none select-none overflow-hidden rounded-2xl bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-[0.97]">
            <span className="absolute inset-y-0 left-0 bg-white/30" style={{ width: `${pump * 100}%` }} aria-hidden /><span className="relative">Inflar…</span>
          </button></>
      )}

      {step === 0 && job.toy === "robot" && (
        <><p className="text-sm">En la tapita dice: el lado <strong>+</strong> va {job.plus ? "arriba" : "abajo"}. ¿Cómo pones las pilas?</p>
          <div className="flex flex-wrap gap-2">{[true, false].map((up) => <button key={String(up)} type="button" onClick={() => { if (up === job.plus) { setMsg("¡Bip, bip! Ya prende."); advance(); } else { setMsg("Al revés no prende. Mira dónde va el +."); sfx("sad"); } }} className={cn(chip, "border-transparent bg-secondary")}>+ {up ? "arriba" : "abajo"}</button>)}</div></>
      )}
      {step === 1 && job.toy === "robot" && <ColorPick label="Color de la antena" onPick={(c) => { setColor(c); advance(); }} />}

      {step >= 2 && !finished && <button type="button" onClick={() => void finish()} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Devolvérselo a {f.name}</button>}
      {finished && <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">¡{f.name} se fue feliz con su {toy.name.toLowerCase()}!</p>}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>{finished ? "Volver" : "Salir"}</button>
    </div>
  );
}

function ColorPick({ label, onPick }: { label: string; onPick: (hex: string) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm">{label}</legend>
      <div className="flex flex-wrap gap-2">{COLORS.map((c) => <button key={c.h} type="button" aria-label={c.n} onClick={() => onPick(c.h)} className="size-11 rounded-full border-4 border-card shadow active:scale-[0.97]" style={{ background: c.h }} />)}</div>
    </fieldset>
  );
}
