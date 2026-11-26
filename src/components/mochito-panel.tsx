"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Award, Bell, Bone, Coins, Cookie, Dog, Flower2, Footprints, Gamepad2, Hand, Heart, Home, Lock, Shirt, Sparkles, TreePine, Wand2 } from "lucide-react";
import { DressedImage } from "@/components/dressed-image";
import { goTo, type MochitoGoto } from "@/lib/mochito-goto";
import { MochitoHome, ThingArt } from "@/components/mochito-things";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { updateProfile, useProfile } from "@/lib/db/profile";
import { PET_ITEMS, owns, type ShopItem } from "@/lib/game/shop";
import { buyItem, useGame } from "@/lib/game/use-game";
import { MOOD_LABEL, actionLine, mochitoSays, mochitoState, type MochitoNews } from "@/lib/mochito";
import { mochitoDo, mochitoWalk, setMochitoThing } from "@/lib/mochito-actions";
import { EMPTY_STATS, MEDALS, TEACH_TRIES, TRICKS, earnedMedals, mochitoLevel, trickReady, walkedToday, type WalkFind } from "@/lib/mochito-play";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const pickOf = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** Cómo se mueve en cada truco. */
const TRICK_MOVES: Record<string, string[]> = {
  sentarse: ["translateY(0px) scaleY(1)", "translateY(6px) scaleY(0.9)", "translateY(6px) scaleY(0.9)", "translateY(0px) scaleY(1)"],
  pata: ["rotate(0deg)", "rotate(-10deg)", "rotate(-4deg)", "rotate(-10deg)", "rotate(0deg)"],
  girar: ["scaleX(1)", "scaleX(-1)", "scaleX(1)", "scaleX(-1)", "scaleX(1)"],
  saltar: ["translateY(0px)", "translateY(-44px)", "translateY(0px)", "translateY(-20px)", "translateY(0px)"],
  rodar: ["rotate(0deg)", "rotate(180deg)", "rotate(360deg)"],
  muerto: ["rotate(0deg)", "rotate(-80deg)", "rotate(-80deg)", "rotate(-80deg)", "rotate(0deg)"],
  bailar: ["translateY(0px) rotate(-8deg)", "translateY(-14px) rotate(0deg)", "translateY(0px) rotate(8deg)", "translateY(-14px) rotate(0deg)", "translateY(0px) rotate(-8deg)", "translateY(-14px) rotate(0deg)", "translateY(0px) rotate(0deg)"],
};

type Tab = "cuidar" | "trucos" | "medallas" | "cosas";
const TABS: { id: Tab; label: string; icon: typeof Heart }[] = [
  { id: "cuidar", label: "Cuidar", icon: Heart },
  { id: "trucos", label: "Trucos", icon: Wand2 },
  { id: "medallas", label: "Medallas", icon: Award },
  { id: "cosas", label: "Sus cosas", icon: Home },
];

const GAMES: { goto: MochitoGoto; name: string; icon: typeof Bone }[] = [
  { goto: "juego:mochito", name: "Galletas", icon: Cookie },
  { goto: "juego:pelota", name: "Pelota", icon: Dog },
  { goto: "juego:escondidas", name: "Escondidas", icon: Sparkles },
];

function Bar({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Heart }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-center justify-between gap-1 text-xs font-semibold">
        <span className="flex items-center gap-1 whitespace-nowrap"><Icon className="size-3.5 text-primary" aria-hidden /> {label}</span>
        <span className="hidden tabular-nums text-muted-foreground sm:inline">{value} %</span>
      </p>
      <div className="h-2.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%`, transition: "width 400ms cubic-bezier(0.23, 1, 0.32, 1)" }} />
      </div>
    </div>
  );
}

const action = "flex min-h-20 flex-col items-center justify-center gap-1 rounded-3xl border-2 border-border bg-card p-3 text-sm font-semibold transition-[border-color,opacity] duration-150 hover:border-primary active:scale-[0.97] disabled:opacity-50 disabled:hover:border-border";

export function MochitoPanel({ open, onOpenChange, now, news }: { open: boolean; onOpenChange: (o: boolean) => void; now: number; news: MochitoNews[] }) {
  const { profile } = useProfile();
  const g = useGame();
  const reduce = useReducedMotion();
  const care = profile.mochito_care ?? {};
  const stats = { ...EMPTY_STATS, ...profile.mochito_stats };
  const tricks = profile.mochito_tricks ?? [];
  const lvl = mochitoLevel(stats.xp);
  const state = mochitoState(care, now);
  const [tab, setTab] = useState<Tab>("cuidar");
  const [line, setLine] = useState<string | null>(null);
  const [hearts, setHearts] = useState(0);
  const [move, setMove] = useState<{ id: string; n: number } | null>(null);
  const [practice, setPractice] = useState<Record<string, number>>({});
  const [games, setGames] = useState(false);
  const [walk, setWalk] = useState<{ phase: "going" | "done"; find?: WalkFind } | null>(null);
  const walkRef = useRef<{ arrived: boolean; find?: WalkFind }>({ arrived: false });
  const said = line ?? (news[0]?.text ?? mochitoSays(state.mood, new Date(now).getHours(), (now % 997) / 997));

  async function after(kind: Parameters<typeof mochitoDo>[0], extra?: { trick?: string }) {
    const r = await mochitoDo(kind, extra);
    if (r.after > r.before) { sfx("success"); setLine(`¡Subí al nivel ${r.after}! ${TRICKS.some((t) => t.level === r.after) ? "Ya puedo aprender un truco nuevo." : "Gracias por cuidarme."}`); }
  }
  function pet() {
    setHearts((n) => n + 1);
    sfx("success");
    setLine(pickOf(actionLine.petted));
    void after("pet");
  }
  function feed() {
    if (mochitoState(care, Date.now()).full) { setLine(pickOf(actionLine.full)); return; }
    sfx("coin");
    setLine(pickOf(actionLine.fed));
    void after("treat");
  }
  function talk() { setLine(mochitoSays(state.mood, new Date().getHours(), Math.random())); sfx("click"); }
  async function goWalk() {
    walkRef.current = { arrived: false };
    setWalk({ phase: "going" });
    setLine("¡Paseo! ¡Paseo! Voy por mi correa.");
    sfx("door");
    const find = await mochitoWalk();
    walkRef.current.find = find;
    setWalk((w) => (w ? { ...w, find } : w));
    if (walkRef.current.arrived) tell(find);
  }
  function arrive() {
    walkRef.current.arrived = true;
    setWalk((w) => (w ? { ...w, phase: "done" } : w));
    if (walkRef.current.find) tell(walkRef.current.find);
  }
  function tell(find: WalkFind) {
    sfx(find.kind === "coins" ? "coin" : "success");
    setLine(find.text);
  }
  function doTrick(id: string) {
    const t = TRICKS.find((x) => x.id === id)!;
    setMove({ id, n: (move?.n ?? 0) + 1 });
    sfx("click");
    setLine(t.says);
  }
  function teach(id: string) {
    const n = (practice[id] ?? 0) + 1;
    setPractice({ ...practice, [id]: n });
    setMove({ id, n: (move?.n ?? 0) + 1 });
    if (n < TEACH_TRIES) { sfx("click"); setLine(n === 1 ? "Mmm… ¿así? Otra vez, despacito." : "¡Casi! Una vez más y me sale."); return; }
    sfx("success");
    setLine(`¡Aprendí a ${TRICKS.find((x) => x.id === id)!.name.toLowerCase()}! Dame una galleta, ¿sí?`);
    void after("trick", { trick: id });
  }

  const walked = walkedToday(stats, now) && !walk;
  const medalsHave = new Set(earnedMedals({ stats, tricks, level: lvl.level, things: [profile.mochito_home?.bed, profile.mochito_home?.bowl, profile.mochito_home?.toy].filter(Boolean).length }).map((m) => m.id));
  const moving = move ? TRICK_MOVES[move.id] : null;

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setLine(null); setGames(false); setWalk(null); setTab("cuidar"); } }}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] p-5 pb-8">
        <SheetHeader className="p-0">
          <SheetTitle className="font-heading text-2xl">Mochito · Nivel {lvl.level}</SheetTitle>
          <SheetDescription className="text-sm">Está <span className="font-semibold text-foreground">{MOOD_LABEL[state.mood].toLowerCase()}</span>. Cuídalo, enséñale trucos y sácalo a pasear.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-1">
          <div className="h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label={`Nivel ${lvl.level}`} aria-valuemin={0} aria-valuemax={lvl.need || 1} aria-valuenow={lvl.max ? lvl.need : lvl.have}>
            <div className="h-full rounded-full bg-[var(--gold)]" style={{ width: lvl.max ? "100%" : `${Math.round((lvl.have / lvl.need) * 100)}%`, transition: "width 400ms cubic-bezier(0.23, 1, 0.32, 1)" }} />
          </div>
          <p className="text-xs text-muted-foreground">{lvl.max ? "¡Nivel máximo! Mochito es un campeón." : `Le faltan ${lvl.need - lvl.have} puntos para el nivel ${lvl.level + 1}.`}</p>
        </div>

        <div className="flex items-end gap-6 pl-14">
          <button type="button" onClick={pet} aria-label="Acariciar a Mochito" className="relative h-32 shrink-0 cursor-pointer rounded-3xl active:scale-[0.97]">
            <MochitoHome home={profile.mochito_home}>
              <motion.span
                key={move ? `${move.id}-${move.n}` : "quieto"}
                className="block h-full"
                style={{ transformOrigin: "50% 100%" }}
                initial={false}
                animate={moving && !reduce ? { transform: moving } : undefined}
                transition={{ duration: move?.id === "bailar" ? 1.4 : 0.9, ease: EASE_OUT }}
              >
                <DressedImage char="mochito" outfit={profile.mochito_outfit} alt="" className="h-full" />
              </motion.span>
            </MochitoHome>
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

        <div role="tablist" aria-label="Rincón de Mochito" className="grid grid-cols-4 gap-1 rounded-[1.75rem] bg-secondary p-1 sm:rounded-full">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); sfx("click"); }} className={cn("flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-3xl px-1 text-[11px] font-semibold leading-tight transition-[background-color,color] duration-150 active:scale-[0.97] sm:flex-row sm:gap-1 sm:rounded-full sm:text-sm", tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                <Icon className="size-4 shrink-0" aria-hidden /> <span className="whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </div>

        {tab === "cuidar" && (
          <div role="tabpanel" className="flex flex-col gap-4">
            {walk ? (
              <WalkScene reduce={!!reduce} find={walk.phase === "done" ? walk.find : undefined} outfit={profile.mochito_outfit} onArrive={arrive} onClose={() => setWalk(null)} />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 rounded-3xl bg-secondary/60 p-3">
                  <Bar label="Barriga" value={state.belly} icon={Bone} />
                  <Bar label="Cariño" value={state.love} icon={Heart} />
                  <Bar label="Diversión" value={state.fun} icon={Gamepad2} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" className={action} onClick={pet}><Hand className="size-6 text-primary" aria-hidden /> Acariciar</button>
                  <button type="button" className={action} onClick={feed}><Cookie className="size-6 text-primary" aria-hidden /> Galleta</button>
                  <button type="button" className={action} disabled={walked} onClick={() => void goWalk()} title={walked ? "Ya paseó hoy. Mañana sale otra vez." : undefined}>
                    <Footprints className="size-6 text-primary" aria-hidden /> {walked ? "Mañana otra vez" : "Pasear"}
                  </button>
                  <button type="button" className={cn(action, games && "border-primary")} aria-expanded={games} onClick={() => setGames((v) => !v)}><Gamepad2 className="size-6 text-primary" aria-hidden /> Jugar</button>
                  <Link href="/vestuario" className={action} onClick={() => { goTo("vestir"); onOpenChange(false); }}><Shirt className="size-6 text-primary" aria-hidden /> Vestir</Link>
                  <button type="button" className={action} onClick={talk}><Sparkles className="size-6 text-primary" aria-hidden /> Otra frase</button>
                </div>
                {games && (
                  <div className="grid grid-cols-3 gap-2 rounded-3xl bg-secondary/60 p-2">
                    {GAMES.map((x) => {
                      const Icon = x.icon;
                      return (
                        <Link key={x.goto} href="/jugar/sala" onClick={() => { goTo(x.goto); onOpenChange(false); }} className="flex min-h-14 items-center justify-center gap-1.5 rounded-2xl bg-card px-2 text-sm font-semibold active:scale-[0.97]">
                          <Icon className="size-5 text-primary" aria-hidden /> {x.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}

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
          </div>
        )}

        {tab === "trucos" && (
          <ul role="tabpanel" className="flex flex-col gap-2">
            {TRICKS.map((t) => {
              const learned = tricks.includes(t.id);
              const ready = trickReady(t, lvl.level);
              const tries = practice[t.id] ?? 0;
              return (
                <li key={t.id} className={cn("flex min-h-16 items-center gap-3 rounded-3xl border-2 bg-card p-3", learned ? "border-primary/40" : "border-border")}>
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", learned ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                    {ready || learned ? <Wand2 className="size-5" aria-hidden /> : <Lock className="size-4" aria-hidden />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{learned ? "Ya lo sabe. Tócalo y lo hace." : ready ? (tries ? `Práctica ${tries} de ${TEACH_TRIES}` : `Practícalo ${TEACH_TRIES} veces y lo aprende.`) : `Se aprende en el nivel ${t.level}.`}</p>
                  </div>
                  {learned ? (
                    <button type="button" onClick={() => doTrick(t.id)} className="min-h-11 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-[0.97]">¡Hazlo!</button>
                  ) : ready ? (
                    <button type="button" onClick={() => teach(t.id)} className="min-h-11 rounded-2xl border-2 border-primary px-4 text-sm font-semibold active:scale-[0.97]">Enseñar</button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        {tab === "medallas" && (
          <div role="tabpanel" className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{medalsHave.size} de {MEDALS.length} medallas. Cada una da monedas.</p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MEDALS.map((m) => {
                const have = medalsHave.has(m.id);
                return (
                  <li key={m.id} className={cn("flex flex-col items-center gap-1 rounded-3xl border-2 p-3 text-center", have ? "border-[var(--gold)] bg-card" : "border-dashed border-border bg-secondary/40")}>
                    <span className={cn("flex size-11 items-center justify-center rounded-full", have ? "bg-[var(--gold)] text-foreground" : "bg-secondary text-muted-foreground")}>
                      {have ? <Award className="size-6" aria-hidden /> : <Lock className="size-4" aria-hidden />}
                    </span>
                    <p className="text-sm font-semibold leading-tight">{m.name}</p>
                    <p className="text-xs leading-snug text-muted-foreground">{m.desc}</p>
                    <p className="flex items-center gap-1 text-xs font-semibold"><Coins className="size-3.5 text-primary" aria-hidden /> {have ? "Ganada" : `+${m.coins}`}</p>
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-muted-foreground">Lleva {stats.days.length} {stats.days.length === 1 ? "día" : "días"} cuidándolo, {stats.walks} {stats.walks === 1 ? "paseo" : "paseos"} y {stats.games} {stats.games === 1 ? "partida" : "partidas"} juntos.</p>
          </div>
        )}

        {tab === "cosas" && <ThingsTab g={g} home={profile.mochito_home} onLine={setLine} />}
      </SheetContent>
    </Sheet>
  );
}

const SLOTS: { slot: "bed" | "bowl" | "toy"; label: string }[] = [
  { slot: "bed", label: "Cama" },
  { slot: "bowl", label: "Platito" },
  { slot: "toy", label: "Juguete" },
];

function ThingsTab({ g, home, onLine }: { g: ReturnType<typeof useGame>; home?: { bed?: string; bowl?: string; toy?: string }; onLine: (s: string) => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  async function buy(item: ShopItem) {
    const problem = await buyItem(item);
    if (problem) { setMsg(problem); return; }
    sfx("cash");
    setMsg(`¡Es suyo! ${item.name}.`);
    await setMochitoThing(item.petSlot!, item.id);
    onLine(`¡Mi ${item.name.toLowerCase()}! Gracias, me encanta.`);
  }
  return (
    <div role="tabpanel" className="flex flex-col gap-4">
      <p className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">Sus cosas salen junto a él aquí y en tu local.</span>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-3 py-1 font-semibold"><Coins className="size-4 text-primary" aria-hidden /> {g.coins}</span>
      </p>
      <p role="status" className="min-h-5 text-sm font-semibold text-primary">{msg}</p>
      {SLOTS.map(({ slot, label }) => (
        <section key={slot} aria-label={label} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{label}</h3>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PET_ITEMS.filter((i) => i.petSlot === slot).map((i) => {
              const mine = owns(i, g.ownedIds);
              const on = home?.[slot] === i.id;
              const missing = i.price - g.coins;
              return (
                <li key={i.id} className={cn("flex flex-col items-center gap-2 rounded-3xl border-2 bg-card p-2", on ? "border-primary" : "border-border")}>
                  <div className={cn("flex h-14 w-full items-center justify-center", !mine && "opacity-60 grayscale")}><ThingArt id={i.id} className="max-h-14" /></div>
                  <p className="text-center text-xs font-semibold leading-tight">{i.name}</p>
                  {mine ? (
                    <button type="button" onClick={() => void setMochitoThing(slot, on ? undefined : i.id)} className={cn("min-h-11 w-full rounded-2xl text-sm font-semibold active:scale-[0.97]", on ? "bg-secondary" : "bg-primary text-primary-foreground")}>
                      {on ? "Quitar" : "Poner"}
                    </button>
                  ) : (
                    <button type="button" disabled={missing > 0} onClick={() => void buy(i)} className="flex min-h-11 w-full items-center justify-center gap-1 rounded-2xl border-2 border-primary text-xs font-semibold active:scale-[0.97] disabled:border-border disabled:text-muted-foreground">
                      <Coins className="size-3.5" aria-hidden /> {i.price}{missing > 0 ? ` · faltan ${missing}` : ""}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** El paseo: Mochito cruza el parque y al llegar cuenta lo que encontró. */
function WalkScene({ reduce, find, outfit, onArrive, onClose }: { reduce: boolean; find?: WalkFind; outfit?: Record<string, string>; onArrive: () => void; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-40 overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 to-sky-50 dark:from-sky-950 dark:to-sky-900">
        <div className="absolute inset-x-0 bottom-0 h-10 bg-emerald-200 dark:bg-emerald-900" />
        <TreePine className="absolute bottom-8 left-[12%] size-14 text-emerald-600" aria-hidden />
        <TreePine className="absolute bottom-8 right-[8%] size-16 text-emerald-700" aria-hidden />
        <Flower2 className="absolute bottom-3 left-[40%] size-6 text-pink-500" aria-hidden />
        <Flower2 className="absolute bottom-4 left-[62%] size-5 text-amber-500" aria-hidden />
        <motion.div
          className="absolute inset-x-0 bottom-3 h-24"
          initial={reduce ? { opacity: 0 } : { transform: "translateX(-10%)" }}
          animate={reduce ? { opacity: 1 } : { transform: "translateX(62%)" }}
          transition={{ duration: reduce ? 0.4 : 2.6, ease: [0.45, 0, 0.55, 1] }}
          onAnimationComplete={onArrive}
        >
          <DressedImage char="mochito" outfit={outfit} alt="" className="h-full" />
        </motion.div>
      </div>
      {find ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-secondary/60 p-3">
          <p className="text-sm font-semibold">
            {find.kind === "coins" ? `+${find.coins} monedas` : find.kind === "wear" ? `Nueva prenda: ${find.itemName} (ya está en tu vestuario)` : "Un recuerdo bonito del paseo"} · +8 puntos para Mochito
          </p>
          <button type="button" onClick={onClose} className="min-h-11 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground active:scale-[0.97]">Volver a casa</button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground" aria-live="polite">Mochito va de paseo por el parque…</p>
      )}
    </div>
  );
}
