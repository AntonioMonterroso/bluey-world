"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Bandage, BookOpen, Check, Droplet, Flashlight, Moon, Pill, Shirt, Stethoscope, Thermometer, Trophy, type LucideIcon } from "lucide-react";
import { MochitoFigure } from "@/components/mochito-figure";
import { ThingArt } from "@/components/mochito-things";
import { PuppyArt } from "@/components/puppy-art";
import { goTo } from "@/lib/mochito-goto";
import { enterShow, mochitoVet, readStory } from "@/lib/mochito-actions";
import { AILMENTS, RIBBONS, SHOW_CATEGORY, STORIES, VET_DOCTOR, VET_TOOLS, judgeShow, ribbonFor, showJudges, showTotal, showWeek, storyOfDay, vetSteps, type Ailment, type JudgeScore, type Ribbon, type Story, type VetTool, type Weather } from "@/lib/mochito-more";
import { FRIENDS, TRICKS } from "@/lib/mochito-play";
import type { Groom } from "@/lib/mochito-extra";
import { TRICK_MOVES } from "@/lib/mochito-moves";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
type Done = { after: number; before: number; medals: string[]; sticker: { name: string } | null } | null | undefined;
const btn = "min-h-11 rounded-2xl px-5 text-sm font-semibold active:scale-[0.97]";

const TOOL_ICON: Record<VetTool, LucideIcon> = { estetoscopio: Stethoscope, lampara: Flashlight, termometro: Thermometer, gotas: Droplet, venda: Bandage, vitamina: Pill };
const doctor = FRIENDS.find((f) => f.id === VET_DOCTOR)!;

/** Cómo terminó: nivel, medalla o pegatina. */
function doneLine(r: Done, base: string) {
  if (!r) return base;
  if (r.after > r.before) return `${base} ¡Y subí al nivel ${r.after}!`;
  if (r.medals.length) return `${base} ¡Y gané la medalla «${r.medals[0]}»!`;
  if (r.sticker) return `${base} Me gané la pegatina «${r.sticker.name}».`;
  return base;
}

// ── Veterinario ─────────────────────────────────────────────────────

/** La visita con la doctora Pimienta: te pide un instrumento a la vez y tú se lo pasas. */
export function VetScene({ ailment, outfit, onLine, onClose }: { ailment: Ailment | null; outfit?: Record<string, string>; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const steps = vetSteps(ailment);
  const [i, setI] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [wrong, setWrong] = useState<{ tool: VetTool; n: number } | null>(null);
  const done = i >= steps.length;
  const step = steps[Math.min(i, steps.length - 1)];

  async function hand(tool: VetTool) {
    if (done) return;
    if (tool !== step.tool) {
      sfx("click");
      setWrong({ tool, n: (wrong?.n ?? 0) + 1 });
      setNote(`${VET_TOOLS.find((t) => t.id === tool)!.that}. Necesito ${VET_TOOLS.find((t) => t.id === step.tool)!.the}.`);
      return;
    }
    setWrong(null);
    setNote(step.done);
    const next = i + 1;
    setI(next);
    if (next < steps.length) { sfx("coin"); return; }
    sfx("success");
    const r = await mochitoVet(ailment ? AILMENTS[ailment].name : undefined);
    onLine(doneLine(r, ailment ? "¡Ya me siento mucho mejor! Gracias por llevarme." : "¡Pasé mi chequeo! La doctora dice que me cuidas muy bien."));
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold" aria-live="polite">{done ? "¡Listo! Mochito está sanito." : `Paso ${i + 1} de ${steps.length}${ailment ? ` · ${AILMENTS[ailment].name}` : " · Chequeo de la semana"}`}</p>
      <div className="relative flex h-44 items-end justify-between overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-50 to-teal-100 px-4 pb-2 dark:from-emerald-950 dark:to-teal-950">
        <div className="absolute inset-x-0 bottom-0 h-8 bg-white/70 dark:bg-white/10" aria-hidden />
        <div className="relative z-10 flex flex-col items-center">
          <span className="relative block size-24">
            <PuppyArt friend={doctor} />
            <span className="absolute right-1 top-0 flex size-6 items-center justify-center rounded-full border-2 border-white bg-[#d6453d] text-sm font-bold text-white" aria-hidden>+</span>
          </span>
          <span className="text-xs font-semibold">Dra. Pimienta</span>
        </div>
        <motion.p key={`${i}-${note}`} className="relative z-10 mb-14 max-w-[45%] rounded-3xl rounded-bl-md bg-card px-3 py-2 text-sm leading-snug text-pretty shadow-sm" initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ duration: 0.2, ease: EASE_OUT }}>
          {done ? "¡Está sanísimo! Aquí tiene su pegatina por portarse tan bien." : note && i > 0 && !wrong ? `${note} ${step.ask}` : note && wrong ? note : step.ask}
        </motion.p>
        <motion.span className="relative z-10 block h-32" initial={false} animate={done && !reduce ? { transform: ["translateY(0px)", "translateY(-14px)", "translateY(0px)"] } : undefined} transition={{ duration: 0.5, ease: EASE_OUT }} style={{ transformOrigin: "50% 100%" }}>
          <MochitoFigure outfit={outfit} />
        </motion.span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="group" aria-label="Instrumentos">
        {VET_TOOLS.map((t) => {
          const Icon = TOOL_ICON[t.id];
          const shook = wrong?.tool === t.id && !reduce;
          return (
            <motion.button
              key={shook ? `${t.id}-${wrong!.n}` : t.id}
              type="button"
              disabled={done}
              onClick={() => void hand(t.id)}
              initial={false}
              animate={shook ? { transform: ["translateX(0px)", "translateX(-4px)", "translateX(4px)", "translateX(0px)"] } : undefined}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-border bg-card text-xs font-semibold active:scale-[0.97] disabled:opacity-50"
            >
              <Icon className="size-6 text-primary" aria-hidden /> {t.name}
            </motion.button>
          );
        })}
      </div>
      <button type="button" onClick={onClose} className={cn(btn, "self-start", done ? "bg-primary text-primary-foreground" : "bg-secondary")}>{done ? "Volver" : "Dejarlo para después"}</button>
    </div>
  );
}

// ── Cuento para dormir ──────────────────────────────────────────────

/** Elige un cuento, léelo página por página y Mochito se duerme abrazando su juguete. */
export function StoryScene({ now, read, toy, outfit, onLine, onClose }: { now: number; read?: string[]; toy?: string; outfit?: Record<string, string>; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const today = storyOfDay(now);
  const [story, setStory] = useState<Story | null>(null);
  const [page, setPage] = useState(0);
  const [asleep, setAsleep] = useState(false);
  const list = [today, ...STORIES.filter((s) => s.id !== today.id)];

  async function finish() {
    setAsleep(true);
    sfx("success");
    const r = await readStory(story!);
    onLine(doneLine(r, "Zzz… qué bonito cuento… buenas noches…"));
  }

  if (!story) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">¿Qué cuento le lees hoy?</p>
        <ul className="flex flex-col gap-2">
          {list.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => { setStory(s); setPage(0); sfx("click"); onLine("¡Un cuento! Ya me acomodé. Léelo despacito."); }} className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-2 text-left active:scale-[0.97]">
                <BookOpen className="size-5 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1 font-semibold">{s.title}</span>
                {s.id === today.id && <span className="rounded-full bg-[var(--gold)] px-2 py-0.5 text-[11px] font-semibold">El de hoy</span>}
                {read?.includes(s.id) && <Check className="size-4 shrink-0 text-primary" aria-label="Ya lo leyeron" />}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }

  const last = page === story.pages.length - 1;
  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex min-h-56 flex-col gap-3 overflow-hidden rounded-3xl bg-[#26244a] p-4 text-white">
        <Moon className="absolute right-4 top-4 size-6 fill-amber-200 text-amber-200" aria-hidden />
        {[12, 28, 46, 70, 84].map((x, k) => <span key={x} aria-hidden className="absolute size-1 rounded-full bg-white/70" style={{ left: `${x}%`, top: `${10 + (k % 3) * 9}%` }} />)}
        <h3 className="pr-8 font-heading text-lg">{story.title}</h3>
        {asleep ? (
          <div className="flex flex-1 items-end justify-center gap-1">
            <span className="block h-28"><MochitoFigure outfit={outfit} sleeping /></span>
            {toy && <motion.span className="mb-2 block h-12 w-14" initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateX(12px)" }} animate={{ opacity: 1, transform: "translateX(0px)" }} transition={{ duration: 0.5, ease: EASE_OUT }}><ThingArt id={toy} /></motion.span>}
          </div>
        ) : (
          <motion.p key={page} className="text-lg leading-relaxed text-pretty" initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(6px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: 0.35, ease: EASE_OUT }}>
            {story.pages[page]}
          </motion.p>
        )}
        {!asleep && (
          <div className="mt-auto flex justify-center gap-1.5" aria-label={`Página ${page + 1} de ${story.pages.length}`}>
            {story.pages.map((_, k) => <span key={k} className={cn("h-1.5 rounded-full transition-[width,background-color] duration-200", k === page ? "w-5 bg-amber-200" : "w-1.5 bg-white/40")} />)}
          </div>
        )}
      </div>
      {asleep ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">Mochito se quedó dormido{toy ? " abrazando su juguete" : ""}.</p>
          <button type="button" onClick={onClose} className={cn(btn, "bg-primary text-primary-foreground")}>Apagar la luz</button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className={cn(btn, "bg-secondary disabled:opacity-50")}>Anterior</button>
          <button type="button" onClick={() => { sfx("click"); if (last) void finish(); else setPage((p) => p + 1); }} className={cn(btn, "bg-primary text-primary-foreground")}>{last ? "Buenas noches" : "Siguiente"}</button>
          <button type="button" onClick={() => setStory(null)} className={cn(btn, "bg-secondary")}>Otro cuento</button>
        </div>
      )}
    </div>
  );
}

// ── Concurso de perritos ────────────────────────────────────────────

/** Un listón de concurso (roseta) del color que ganó. */
export function RibbonArt({ ribbon, className }: { ribbon: Ribbon; className?: string }) {
  const c = RIBBONS[ribbon].color;
  return (
    <svg viewBox="0 0 60 80" className={cn("h-full w-auto", className)} aria-hidden>
      <path d="M22 40 L14 76 L22 70 L28 78 L30 44 Z" fill={c} stroke="rgb(0 0 0 / 0.25)" strokeWidth="1" />
      <path d="M38 40 L46 76 L38 70 L32 78 L30 44 Z" fill={c} stroke="rgb(0 0 0 / 0.25)" strokeWidth="1" />
      {Array.from({ length: 12 }, (_, k) => <ellipse key={k} cx="30" cy="12" rx="7" ry="12" fill={c} stroke="rgb(0 0 0 / 0.2)" strokeWidth="0.8" transform={`rotate(${k * 30} 30 28)`} />)}
      <circle cx="30" cy="28" r="12" fill="#fffaf0" stroke="rgb(0 0 0 / 0.2)" strokeWidth="1" />
      <path d="M30 20 l2.4 5 5.4 0.6 -4 3.7 1.1 5.3 -4.9 -2.7 -4.9 2.7 1.1 -5.3 -4 -3.7 5.4 -0.6 Z" fill={c} />
    </svg>
  );
}

/** El concurso de la semana: lo vistes, eliges un truco, desfila y los jueces (sus amigos) le dan listón. */
export function ShowScene({ now, outfit, groom, tricks, clean, love, metFriends, result, onLine, onClose }: {
  now: number; outfit?: Record<string, string>; groom?: Groom | null; tricks: string[]; clean: number; love: number; metFriends: string[];
  result?: { week: string; ribbon: string; total: number }; onLine: (s: string) => void; onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const week = showWeek(now);
  const judgesIds = showJudges(metFriends.length >= 3 ? metFriends : FRIENDS.map((f) => f.id), week);
  const outfitCount = Object.values(outfit ?? {}).filter(Boolean).length + (groom ? 1 : 0);
  const learned = TRICKS.filter((t) => tricks.includes(t.id));
  const [trick, setTrick] = useState<string | null>(learned.at(-1)?.id ?? null);
  const [phase, setPhase] = useState<"prep" | "walk" | "scores">("prep");
  const [scores, setScores] = useState<JudgeScore[] | null>(null);
  const already = result?.week === week;

  async function go() {
    setPhase("walk");
    sfx("door");
    const t = TRICKS.find((x) => x.id === trick);
    const s = judgeShow({ outfitCount, trickLevel: t?.level ?? null, clean, love }, judgesIds, week);
    setScores(s);
    setTimeout(async () => {
      setPhase("scores");
      const total = showTotal(s);
      const ribbon = ribbonFor(total);
      sfx(ribbon === "azul" ? "cash" : "success");
      const r = await enterShow(week, ribbon, total);
      onLine(doneLine(r, ribbon === "azul" ? `¡Primer lugar! ¡Gané el listón azul y ${RIBBONS.azul.coins} monedas!` : `Gané el ${RIBBONS[ribbon].name.toLowerCase()} y ${RIBBONS[ribbon].coins} monedas. ¡La próxima semana vamos por el azul!`));
    }, reduce ? 300 : 2400);
  }

  if (already && phase === "prep") {
    const rb = result!.ribbon as Ribbon;
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4 rounded-3xl bg-secondary/60 p-4">
          <span className="block h-20"><RibbonArt ribbon={rb} /></span>
          <div>
            <p className="font-semibold">{RIBBONS[rb].name} · {RIBBONS[rb].place}</p>
            <p className="text-sm text-muted-foreground">Sacó {result!.total} de 30 puntos esta semana. El próximo concurso abre el lunes.</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }

  const total = scores ? showTotal(scores) : 0;
  const ribbon = ribbonFor(total);
  const moving = trick ? TRICK_MOVES[trick] : null;
  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-48 overflow-hidden rounded-3xl bg-gradient-to-b from-violet-100 to-rose-50 dark:from-violet-950 dark:to-rose-950">
        <div className="absolute inset-x-0 bottom-0 h-10 bg-[repeating-linear-gradient(90deg,#d6453d_0_20px,#f3c8c4_20px_40px)] opacity-70" aria-hidden />
        <div className="absolute right-2 top-2 flex gap-1">
          {judgesIds.map((id, k) => {
            const f = FRIENDS.find((x) => x.id === id)!;
            const sc = scores?.[k];
            return (
              <div key={id} className="flex w-14 flex-col items-center">
                <span className="block size-12"><PuppyArt friend={f} /></span>
                <span className="text-[10px] font-semibold leading-tight">{f.name}</span>
                {phase === "scores" && sc && (
                  <motion.span className="mt-0.5 rounded-lg bg-card px-1.5 text-sm font-bold tabular-nums shadow" initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ duration: 0.3, delay: reduce ? 0 : k * 0.06, ease: EASE_OUT }}>{sc.points}</motion.span>
                )}
              </div>
            );
          })}
        </div>
        <motion.div
          className="absolute bottom-3 left-0 h-28"
          initial={false}
          animate={phase === "prep" ? { transform: "translateX(8px)" } : reduce ? { transform: "translateX(40%)" } : { transform: ["translateX(8px)", "translateX(110px)", "translateX(110px)"] }}
          transition={{ duration: phase === "prep" ? 0 : 1.6, ease: EASE_OUT }}
        >
          <motion.span className="block h-full" style={{ transformOrigin: "50% 100%" }} initial={false} animate={phase !== "prep" && moving && !reduce ? { transform: moving } : undefined} transition={{ duration: 0.9, delay: 1.5, ease: EASE_OUT }}>
            <MochitoFigure outfit={outfit} groom={groom} />
          </motion.span>
        </motion.div>
      </div>

      {phase === "prep" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-3xl bg-secondary/60 p-3 text-sm">
            <span><span className="font-semibold">Estilo:</span> trae {outfitCount} {outfitCount === 1 ? "prenda" : "prendas"}{groom ? " (contando su peinado)" : ""}{outfitCount < 4 ? ". Con 4 o más luce mejor." : ". ¡Muy elegante!"}</span>
            <Link href="/vestuario" onClick={() => goTo("vestir")} className={cn(btn, "flex items-center gap-1.5 bg-card")}><Shirt className="size-4" aria-hidden /> Vestirlo</Link>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold">¿Qué truco hace en la pasarela?</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {learned.length === 0 && <p className="text-sm text-muted-foreground">Todavía no sabe trucos. Enséñale uno en la pestaña Trucos para ganar más puntos.</p>}
              {learned.map((t) => (
                <button key={t.id} type="button" role="radio" aria-checked={trick === t.id} onClick={() => setTrick(t.id)} className={cn("min-h-11 rounded-full border-2 px-4 text-sm font-semibold active:scale-[0.97]", trick === t.id ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary")}>{t.name}</button>
              ))}
            </div>
          </fieldset>
          <p className="text-xs text-muted-foreground">Los jueces miran el estilo, el truco y la simpatía (que esté limpio y consentido). Se concursa una vez por semana.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void go()} className={cn(btn, "flex items-center gap-1.5 bg-primary text-primary-foreground")}><Trophy className="size-4" aria-hidden /> ¡A la pasarela!</button>
            <button type="button" onClick={onClose} className={cn(btn, "bg-secondary")}>Volver</button>
          </div>
        </>
      )}
      {phase === "walk" && <p className="text-sm font-semibold" aria-live="polite">Mochito desfila… los jueces anotan…</p>}
      {phase === "scores" && scores && (
        <>
          <ul className="flex flex-col gap-2">
            {scores.map((s) => (
              <li key={s.judge} className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-3 py-2 text-sm">
                <span className="w-20 shrink-0 font-semibold">{SHOW_CATEGORY[s.category]}</span>
                <span className="min-w-0 flex-1">{FRIENDS.find((f) => f.id === s.judge)!.name}: «{s.says}»</span>
                <span className="font-bold tabular-nums">{s.points}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-4 rounded-3xl border-2 border-[var(--gold)] bg-card p-3">
            <span className="block h-20"><RibbonArt ribbon={ribbon} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{RIBBONS[ribbon].name} · {RIBBONS[ribbon].place}</p>
              <p className="text-sm text-muted-foreground">{total} de 30 puntos · +{RIBBONS[ribbon].coins} monedas</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Volver a casa</button>
        </>
      )}
    </div>
  );
}

// ── El clima del paseo ──────────────────────────────────────────────

/** Lo que se ve en el cielo del paseo: sol, lluvia, viento u hojas. */
export function WeatherLayer({ weather }: { weather: Weather }) {
  const reduce = useReducedMotion();
  if (weather === "sol") {
    return (
      <motion.svg viewBox="0 0 60 60" className="pointer-events-none absolute right-3 top-2 size-14" aria-hidden animate={reduce ? undefined : { transform: ["rotate(0deg)", "rotate(360deg)"] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
        {Array.from({ length: 10 }, (_, k) => <path key={k} d="M30 3 V11" stroke="#f6c13a" strokeWidth="3" strokeLinecap="round" transform={`rotate(${k * 36} 30 30)`} />)}
        <circle cx="30" cy="30" r="13" fill="#f6c744" />
      </motion.svg>
    );
  }
  if (weather === "lluvia") {
    return (
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-slate-500/25" />
        {[10, 24, 70].map((x) => <span key={x} className="absolute top-1 h-7 w-16 rounded-full bg-slate-300 dark:bg-slate-600" style={{ left: `${x}%` }} />)}
        {Array.from({ length: 22 }, (_, k) => (
          <motion.span
            key={k}
            className="absolute top-0 h-3 w-0.5 rounded-full bg-sky-500/70"
            style={{ left: `${(k * 4.6 + 3) % 100}%` }}
            initial={{ transform: "translateY(-10px) rotate(12deg)" }}
            animate={reduce ? { transform: `translateY(${40 + (k % 5) * 20}px) rotate(12deg)` } : { transform: ["translateY(-10px) rotate(12deg)", "translateY(170px) rotate(12deg)"] }}
            transition={{ duration: 0.9, repeat: reduce ? 0 : Infinity, delay: (k % 7) * 0.13, ease: "linear" }}
          />
        ))}
        <span className="absolute bottom-2 left-[30%] h-2 w-14 rounded-full bg-sky-300/70" />
        <span className="absolute bottom-3 left-[74%] h-2 w-10 rounded-full bg-sky-300/70" />
      </div>
    );
  }
  const leaves = weather === "hojas";
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: leaves ? 10 : 7 }, (_, k) => (
        <motion.span
          key={k}
          className={cn("absolute block", leaves ? "h-2.5 w-3.5 rounded-[60%_10%_60%_10%]" : "h-0.5 w-10 rounded-full bg-white/80 dark:bg-white/40")}
          style={{ top: `${8 + ((k * 13) % 60)}%`, left: leaves ? `${(k * 11) % 95}%` : "-15%", background: leaves ? ["#e0782f", "#c9472f", "#e7b416"][k % 3] : undefined }}
          initial={false}
          animate={reduce ? undefined : leaves
            ? { transform: ["translate(0px, -30px) rotate(0deg)", "translate(24px, 60px) rotate(140deg)", "translate(-6px, 130px) rotate(260deg)"] }
            : { transform: ["translateX(0px)", "translateX(560px)"] }}
          transition={{ duration: leaves ? 3.2 + (k % 3) * 0.6 : 1.6 + (k % 3) * 0.4, repeat: Infinity, delay: k * 0.35, ease: "linear" }}
        />
      ))}
    </div>
  );
}
