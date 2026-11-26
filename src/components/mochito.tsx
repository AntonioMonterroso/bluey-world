"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Bell, Bone, Cookie, Gamepad2, Hand, Heart, Moon, Shirt, Smile, Sparkles, UtensilsCrossed } from "lucide-react";
import { DressedImage } from "@/components/dressed-image";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { updateProfile, useProfile } from "@/lib/db/profile";
import { useJournal } from "@/lib/journal";
import { useOrders } from "@/lib/kitchen";
import { MOOD_LABEL, actionLine, mochitoNews, mochitoSays, mochitoState, type MochitoMood } from "@/lib/mochito";
import { useRecurring } from "@/lib/money";
import { sfx } from "@/lib/sfx";
import { useTimers } from "@/lib/timers";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const DANCE = ["translateY(0px) rotate(-6deg)", "translateY(-12px) rotate(0deg)", "translateY(0px) rotate(6deg)", "translateY(-12px) rotate(0deg)", "translateY(0px) rotate(-6deg)"];
const MOOD_ICON: Record<MochitoMood, typeof Moon> = { sueno: Moon, hambre: UtensilsCrossed, aburrido: Gamepad2, feliz: Heart, contento: Smile };
const pickOf = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** Deja dicho a qué pantalla va Mochito (el juego o el vestidor) para que se abra directo ahí. */
export const MOCHITO_GOTO = "bw-mochito-goto";
const goTo = (where: "juego" | "vestir") => { try { sessionStorage.setItem(MOCHITO_GOTO, where); } catch {} };

/** ¿Venimos del rincón de Mochito a esta pantalla? */
export function cameFromMochito(where: "juego" | "vestir") {
  try { return window.location.hash === "#mochito" || sessionStorage.getItem(MOCHITO_GOTO) === where; } catch { return false; }
}
/** Ya se usó el aviso: la próxima vez que entres a esa pantalla abre normal. */
export function useClearMochitoGoto() {
  useEffect(() => { try { sessionStorage.removeItem(MOCHITO_GOTO); } catch {} }, []);
}

/** ¿Mochito acompaña? (se puede esconder en Ajustes). */
export function useMochitoOn() {
  const { profile } = useProfile();
  return profile.mochito !== false;
}

/** Lo que Mochito te recuerda ahora (temporizadores, pagos, pedidos y diario). */
export function useMochitoNews(now: number) {
  const timers = useTimers();
  const payments = useRecurring();
  const orders = useOrders();
  const journal = useJournal();
  const fmt = useMoney();
  if (!timers || !payments || !orders || !journal || !now) return [];
  return mochitoNews({ timers, payments, orders, journal, fmt }, now);
}

/** Mochito, el perrito que siempre va junto a tu personaje. Tocarlo abre su rincón: cariños, comida, juego, ropa y avisos. */
export function Mochito({ className, style, interactive = true, dance = false }: {
  className?: string; style?: React.CSSProperties; interactive?: boolean; dance?: boolean;
}) {
  const on = useMochitoOn();
  const { profile } = useProfile();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [taps, setTaps] = useState(0);
  const news = useMochitoNews(interactive ? now : 0);

  if (!on) return null;

  const img = <DressedImage char="mochito" outfit={profile.mochito_outfit} alt="" className="h-full" imgClassName="drop-shadow-sm" />;
  if (!interactive) return <div className={cn("pointer-events-none", className)} style={style} aria-hidden>{img}</div>;

  const state = mochitoState(profile.mochito_care, now);
  const MoodIcon = MOOD_ICON[state.mood];
  const urgent = news.some((n) => n.urgent);
  const badge = news.length > 0;

  return (
    <div className={cn("relative inline-block", className)} style={style}>
      <motion.button
        type="button"
        aria-label={`Abrir el rincón de Mochito. Está ${MOOD_LABEL[state.mood].toLowerCase()}${badge ? `, tiene ${news.length} ${news.length === 1 ? "aviso" : "avisos"}` : ""}`}
        onClick={() => { setNow(Date.now()); setTaps((n) => n + 1); setOpen(true); sfx("click"); }}
        style={{ transformOrigin: "50% 100%" }}
        className="h-full cursor-pointer rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        animate={reduce ? undefined : { transform: dance ? DANCE : ["rotate(-2deg)", "rotate(2deg)", "rotate(-2deg)"] }}
        transition={{ duration: dance ? 0.6 : 2.6, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
      >
        <motion.span
          key={taps}
          className="block h-full"
          initial={taps && !reduce ? { transform: "translateY(0px)" } : false}
          animate={{ transform: ["translateY(0px)", "translateY(-18px)", "translateY(0px)"] }}
          transition={{ duration: taps && !reduce ? 0.45 : 0, ease: EASE_OUT }}
        >
          {img}
        </motion.span>
      </motion.button>
      <span aria-hidden className={cn("pointer-events-none absolute -top-1 right-0 flex size-6 items-center justify-center rounded-full shadow", badge ? (urgent ? "bg-destructive text-white" : "bg-primary text-primary-foreground") : "bg-card text-primary")}>
        {badge ? <span className="text-[11px] font-bold tabular-nums">{news.length}</span> : <MoodIcon className="size-3.5" />}
      </span>
      <MochitoPanel open={open} onOpenChange={setOpen} now={now} news={news} />
    </div>
  );
}

function Bar({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Heart }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-center justify-between text-xs font-semibold">
        <span className="flex items-center gap-1"><Icon className="size-3.5 text-primary" aria-hidden /> {label}</span>
        <span className="tabular-nums text-muted-foreground">{value} %</span>
      </p>
      <div className="h-2.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%`, transition: "width 400ms cubic-bezier(0.23, 1, 0.32, 1)" }} />
      </div>
    </div>
  );
}

function MochitoPanel({ open, onOpenChange, now, news }: { open: boolean; onOpenChange: (o: boolean) => void; now: number; news: ReturnType<typeof useMochitoNews> }) {
  const { profile } = useProfile();
  const reduce = useReducedMotion();
  const care = profile.mochito_care ?? {};
  const state = mochitoState(care, now);
  const [line, setLine] = useState<string | null>(null);
  const [hearts, setHearts] = useState(0);
  const said = line ?? (news[0]?.text ?? mochitoSays(state.mood, new Date(now).getHours(), (now % 997) / 997));

  async function pet() {
    setHearts((n) => n + 1);
    sfx("success");
    setLine(pickOf(actionLine.petted));
    await updateProfile({ mochito_care: { ...care, petted: Date.now() } });
  }
  async function feed() {
    if (mochitoState(care, Date.now()).full) { setLine(pickOf(actionLine.full)); return; }
    sfx("coin");
    setLine(pickOf(actionLine.fed));
    await updateProfile({ mochito_care: { ...care, fed: Date.now() } });
  }
  function talk() { setLine(mochitoSays(state.mood, new Date().getHours(), Math.random())); sfx("click"); }

  const action = "flex min-h-20 flex-col items-center justify-center gap-1 rounded-3xl border-2 border-border bg-card p-3 text-sm font-semibold transition-[border-color] duration-150 hover:border-primary active:scale-[0.97]";

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setLine(null); }}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] p-5 pb-8">
        <SheetHeader className="p-0">
          <SheetTitle className="font-heading text-2xl">Mochito</SheetTitle>
          <SheetDescription className="text-sm">Está <span className="font-semibold text-foreground">{MOOD_LABEL[state.mood].toLowerCase()}</span>. Cuídalo y te acompaña más contento.</SheetDescription>
        </SheetHeader>

        <div className="flex items-end gap-3">
          <button type="button" onClick={() => void pet()} aria-label="Acariciar a Mochito" className="relative h-32 shrink-0 cursor-pointer rounded-3xl active:scale-[0.97]">
            <DressedImage char="mochito" outfit={profile.mochito_outfit} alt="" className="h-full" />
            {hearts > 0 && (
              <motion.span
                key={hearts}
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-2 text-primary"
                initial={{ opacity: 1, transform: "translate(-50%, 0px) scale(0.95)" }}
                animate={{ opacity: 0, transform: "translate(-50%, -40px) scale(1.2)" }}
                transition={{ duration: reduce ? 0.4 : 0.8, ease: EASE_OUT }}
              >
                <Heart className="size-7 fill-current" />
              </motion.span>
            )}
          </button>
          <p aria-live="polite" className="mb-6 min-w-0 flex-1 rounded-3xl rounded-bl-md bg-secondary px-4 py-3 text-base leading-snug text-pretty">{said}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-3xl bg-secondary/60 p-3">
          <Bar label="Barriga" value={state.belly} icon={Bone} />
          <Bar label="Cariño" value={state.love} icon={Heart} />
          <Bar label="Diversión" value={state.fun} icon={Gamepad2} />
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          <button type="button" className={action} onClick={() => void pet()}><Hand className="size-6 text-primary" aria-hidden /> Acariciar</button>
          <button type="button" className={action} onClick={() => void feed()}><Cookie className="size-6 text-primary" aria-hidden /> Galleta</button>
          <Link href="/jugar/sala" className={action} onClick={() => { goTo("juego"); onOpenChange(false); }}><Gamepad2 className="size-6 text-primary" aria-hidden /> Jugar</Link>
          <Link href="/vestuario" className={action} onClick={() => { goTo("vestir"); onOpenChange(false); }}><Shirt className="size-6 text-primary" aria-hidden /> Vestir</Link>
          <button type="button" className={action} onClick={talk}><Sparkles className="size-6 text-primary" aria-hidden /> Otra frase</button>
        </div>

        <section aria-labelledby="mochito-avisos" className="flex flex-col gap-2">
          <h3 id="mochito-avisos" className="flex items-center gap-1.5 text-sm font-semibold"><Bell className="size-4 text-primary" aria-hidden /> Te recuerdo</h3>
          {news.length === 0 ? (
            <p className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">Todo en orden por ahora. Si viene un pago, un pedido o suena un temporizador, te aviso aquí.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {news.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} onClick={() => onOpenChange(false)} className={cn("flex min-h-12 items-center gap-2 rounded-2xl border-2 px-4 py-2 text-sm font-semibold", n.urgent ? "border-destructive/40 bg-destructive/10" : "border-transparent bg-secondary/60")}>
                    <span className={cn("size-2 shrink-0 rounded-full", n.urgent ? "bg-destructive" : "bg-primary")} aria-hidden />
                    {n.text}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button type="button" onClick={() => { onOpenChange(false); void updateProfile({ mochito: false }); }} className="min-h-11 self-start text-sm font-semibold text-muted-foreground underline underline-offset-4">
          Esconder a Mochito (vuelve desde Ajustes)
        </button>
      </SheetContent>
    </Sheet>
  );
}
