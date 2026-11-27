"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BookOpen, CloudRain, Leaf, Palette, Puzzle, Route, Stethoscope, Sun, Trophy, Wind, Award, Check, Star, Target, BookHeart, Cake, Gift, Moon, Bath, Bell, Bone, Camera, Coins, Cookie, Dog, Droplets, Flower2, Footprints, Gamepad2, Hand, Heart, Home, Lock, Shirt, Sparkles, TreePine, Users, Wand2 } from "lucide-react";
import { DressedImage } from "@/components/dressed-image";
import { MochitoFigure } from "@/components/mochito-figure";
import { goTo, type MochitoGoto } from "@/lib/mochito-goto";
import { MochitoHome, ThingArt } from "@/components/mochito-things";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { updateProfile, useProfile } from "@/lib/db/profile";
import { PET_ITEMS, owns, type ShopItem } from "@/lib/game/shop";
import { buyItem, useGame } from "@/lib/game/use-game";
import { MOOD_LABEL, actionLine, mochitoSays, mochitoState, type MochitoNews } from "@/lib/mochito";
import { LEVEL_UP, MEDAL_WON, THING_NEW, TRICK_DONE, WALK_GO } from "@/lib/mochito-lines";
import { useMochitoDid } from "@/components/mochito";
import { medalInputOf, claimBirthday, claimMissions, missionsEventId, markGreeted, mochitoDo, mochitoWalk, openDailyGift, setMochitoThing } from "@/lib/mochito-actions";
import { BIRTHDAY_GIFT, MOCHITO_BDAY_LINES, festiveOf, giftFor, giftOpened, isMorning, isNight, logDayTitle, mochitoBirthday, morningLine, nextStreak, sleepyLine } from "@/lib/mochito-life";
import { dayKey } from "@/lib/game/engine";
import { MISSIONS_REWARD, missionProgress, missionsFor, type Mission, EMPTY_STATS, FRIEND_AT, MEDALS, SCRUB_STEPS, TEACH_TRIES, TRICKS, earnedMedals, friendsOf, mochitoLevel, trickReady, walkedToday, type Friend, type WalkFind } from "@/lib/mochito-play";
import { FriendsTab } from "@/components/mochito-friends";
import { StickersTab } from "@/components/mochito-stickers";
import { HouseArt, HouseDesigner } from "@/components/mochito-house";
import { PhotoTab } from "@/components/mochito-photos";
import { ShowScene, StoryScene, VetScene, WeatherLayer } from "@/components/mochito-care-2";
import { AILMENTS, WEATHER, checkupDue, mochitoAilment, rainOutfit, showWeek, weatherOf, type Weather } from "@/lib/mochito-more";
import { TRICK_MOVES } from "@/lib/mochito-moves";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const pickOf = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

type Tab = "cuidar" | "trucos" | "medallas" | "cosas" | "amigos" | "fotos" | "diario" | "pegatinas";
const TABS: { id: Tab; label: string; icon: typeof Heart }[] = [
  { id: "cuidar", label: "Cuidar", icon: Heart },
  { id: "trucos", label: "Trucos", icon: Wand2 },
  { id: "medallas", label: "Medallas", icon: Award },
  { id: "cosas", label: "Sus cosas", icon: Home },
  { id: "amigos", label: "Amigos", icon: Users },
  { id: "fotos", label: "Fotos", icon: Camera },
  { id: "diario", label: "Diario", icon: BookHeart },
  { id: "pegatinas", label: "Pegatinas", icon: Star },
];

const GAMES: { goto: MochitoGoto; name: string; icon: typeof Bone }[] = [
  { goto: "juego:mochito", name: "Galletas", icon: Cookie },
  { goto: "juego:pelota", name: "Pelota", icon: Dog },
  { goto: "juego:escondidas", name: "Escondidas", icon: Sparkles },
  { goto: "juego:simon", name: "Simón dice", icon: Wand2 },
  { goto: "juego:carrera", name: "Carrera", icon: Footprints },
  { goto: "juego:cocinam", name: "Cocinar", icon: Cookie },
  { goto: "juego:memoriam", name: "Memoria", icon: Sparkles },
  { goto: "juego:hueso", name: "Hueso", icon: Bone },
  { goto: "juego:ritmo", name: "Ritmo", icon: Footprints },
  { goto: "juego:burbujas", name: "Burbujas", icon: Droplets },
  { goto: "juego:loteria", name: "Lotería", icon: Star },
  { goto: "juego:rompecabezas", name: "Rompecabezas", icon: Puzzle },
  { goto: "juego:lluvia", name: "Lluvia", icon: Cookie },
  { goto: "juego:laberinto", name: "Laberinto", icon: Route },
  { goto: "juego:pintar", name: "Pintar", icon: Palette },
];

const WEATHER_ICON: Record<Weather, typeof Sun> = { sol: Sun, lluvia: CloudRain, viento: Wind, hojas: Leaf };

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
  const [bath, setBath] = useState(false);
  const [scene, setScene] = useState<"vet" | "story" | "show" | null>(null);
  const [walk, setWalk] = useState<{ phase: "going" | "done"; find?: Awaited<ReturnType<typeof mochitoWalk>> } | null>(null);
  const walkRef = useRef<{ arrived: boolean; find?: Awaited<ReturnType<typeof mochitoWalk>> }>({ arrived: false });
  const did = useMochitoDid(open ? now : 0);
  const ctx = { now, birthday: profile.birthday, did };
  const bday = mochitoBirthday(stats.days, now);
  const festive = festiveOf(now, !!bday?.isToday);
  const sleeping = isNight(now);
  const greet = isMorning(now) && profile.mochito_greet !== dayKey(now);
  const ailment = mochitoAilment(now, care.vet);
  const vetDue = !!ailment || checkupDue(care.vet, now);
  const weather = weatherOf(now);
  const WeatherIcon = WEATHER_ICON[weather];
  const showDone = profile.mochito_show?.week === showWeek(now);
  const said = line ?? (bday?.isToday ? MOCHITO_BDAY_LINES[now % MOCHITO_BDAY_LINES.length] : sleeping ? sleepyLine(0) : ailment ? AILMENTS[ailment].says : news[0]?.text ?? mochitoSays(state.mood, new Date(now).getHours(), (now % 997) / 997, ctx));
  const [gifting, setGifting] = useState<{ coins: number; streak: number; bonus: number } | null>(null);
  useEffect(() => {
    if (!open) return;
    if (bday?.isToday) void claimBirthday().then((age) => { if (age) { sfx("success"); setLine(`¡Hoy cumplo ${age} ${age === 1 ? "año" : "años"}! Gracias por cuidarme. Te dejé un regalo: ${BIRTHDAY_GIFT.coins} monedas.`); } });
    else if (greet) void markGreeted().then(() => setLine(morningLine(now)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  async function gift() {
    const r = await openDailyGift();
    if (!r) return;
    sfx("cash");
    setGifting(r);
    setLine(r.bonus ? `¡Racha de ${r.streak} días! Te traje un regalo especial: ${r.coins} monedas.` : `¡Toma! Te guardé ${r.coins} monedas. ${r.streak === 1 ? "Mañana vuelve por otro." : `Llevamos ${r.streak} días seguidos.`}`);
  }

  async function after(kind: Parameters<typeof mochitoDo>[0], extra?: { trick?: string }) {
    const r = await mochitoDo(kind, extra);
    if (r.after > r.before) { sfx("success"); setLine(`${pickOf(LEVEL_UP)} Ya soy nivel ${r.after}.${TRICKS.some((t) => t.level === r.after) ? " ¡Y puedo aprender un truco nuevo!" : ""}`); }
    else if (r.medals.length) { sfx("success"); setLine(`${pickOf(MEDAL_WON)} Es «${r.medals[0]}».`); }
    if (r.sticker) setLine((l) => `${l ?? ""} ¡Y me gané la pegatina «${r.sticker!.name}»!`.trim());
    if (r.wear.length) { sfx("success"); setLine((l) => `${l ?? ""} ¡Y gané ropa nueva: ${r.wear.join(", ")}! Está en el vestuario.`.trim()); }
  }
  function pet() {
    setHearts((n) => n + 1);
    sfx("success");
    setLine(isNight(Date.now()) ? sleepyLine(hearts + 1) : pickOf(actionLine.petted));
    void after("pet");
  }
  function feed() {
    if (mochitoState(care, Date.now()).full) { setLine(pickOf(actionLine.full)); return; }
    sfx("coin");
    setLine(pickOf(actionLine.fed));
    void after("treat");
  }
  function talk() { setLine(mochitoSays(state.mood, new Date().getHours(), Math.random(), { ...ctx, now: Date.now() })); sfx("click"); }
  async function goWalk() {
    walkRef.current = { arrived: false };
    setWalk({ phase: "going" });
    setLine(pickOf(WALK_GO));
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
  function tell(find: WalkFind & { medals?: string[]; levelUp?: number; friend?: Friend | null; met?: number }) {
    sfx(find.kind === "coins" ? "coin" : "success");
    const friend = find.friend ? (find.met === FRIEND_AT ? ` ¡Y me encontré a ${find.friend.name} otra vez! Ahora somos amigos.` : (find.met ?? 0) > FRIEND_AT ? ` Jugué con mi amigo ${find.friend.name}.` : ` Conocí a ${find.friend.name}. Me dijo: «${find.friend.says}»`) : "";
    setLine(`${find.text}${friend}${find.levelUp ? ` ¡Y subí al nivel ${find.levelUp}!` : find.medals?.length ? ` ¡Y gané la medalla «${find.medals[0]}»!` : ""}`);
  }
  async function finishBath() {
    sfx("success");
    setLine(pickOf(["¡Rechinando de limpio! Huelo a jabón de coco.", "¡Qué rico baño! Ahora estoy suavecito.", "Ya no tengo lodo. ¡Mira cómo brillo!", "Gracias por bañarme. Me siento nuevo."]));
    const r = await mochitoDo("bath");
    if (r.after > r.before) setLine(`${pickOf(LEVEL_UP)} Ya soy nivel ${r.after}.`);
    else if (r.medals.length) setLine(`${pickOf(MEDAL_WON)} Es «${r.medals[0]}».`);
  }
  function doTrick(id: string) {
    const t = TRICKS.find((x) => x.id === id)!;
    setMove({ id, n: (move?.n ?? 0) + 1 });
    sfx("click");
    setLine(pickOf([t.says, t.says, t.says, ...TRICK_DONE]));
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
  const medalsHave = new Set(earnedMedals(medalInputOf(profile)).map((m) => m.id));
  const moving = move ? TRICK_MOVES[move.id] : null;

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setLine(null); setGames(false); setWalk(null); setBath(false); setScene(null); setGifting(null); setTab("cuidar"); } }}>
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

        <div className={cn("relative flex items-end gap-6 rounded-3xl p-3 pl-14 transition-[background-color] duration-500", sleeping && "bg-[#26244a] text-white")}>
          {sleeping && <Moon className="absolute right-4 top-3 size-6 fill-amber-200 text-amber-200" aria-hidden />}
          {bday?.isToday && <Cake className="absolute bottom-3 left-3 size-9 text-primary" aria-label="Pastel de cumpleaños" />}
          <button type="button" onClick={pet} aria-label="Acariciar a Mochito" className="relative h-32 shrink-0 cursor-pointer rounded-3xl active:scale-[0.97]">
            <MochitoHome home={profile.mochito_home}>
              <motion.span
                key={move ? `${move.id}-${move.n}` : "quieto"}
                className="relative block h-full"
                style={{ transformOrigin: "50% 100%" }}
                initial={false}
                animate={moving && !reduce ? { transform: moving } : undefined}
                transition={{ duration: move?.id === "bailar" ? 1.4 : 0.9, ease: EASE_OUT }}
              >
                <MochitoFigure outfit={profile.mochito_outfit} festive={festive} sleeping={sleeping}>{care.muddy && <Mud />}</MochitoFigure>
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
          <p aria-live="polite" className="mb-6 min-w-0 flex-1 rounded-3xl rounded-bl-md bg-secondary px-4 py-3 text-base leading-snug text-pretty text-foreground">{said}</p>
        </div>

        <div role="tablist" aria-label="Rincón de Mochito" className="grid grid-cols-4 gap-1 rounded-[1.75rem] bg-secondary p-1 sm:grid-cols-8">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); sfx("click"); }} className={cn("flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-3xl px-1 text-[11px] font-semibold leading-tight transition-[background-color,color] duration-150 active:scale-[0.97] sm:text-xs", tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                <Icon className="size-4 shrink-0" aria-hidden /> <span className="whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </div>

        {tab === "cuidar" && (
          <div role="tabpanel" className="flex flex-col gap-4">
            {scene === "vet" ? (
              <VetScene ailment={ailment} outfit={profile.mochito_outfit} onLine={setLine} onClose={() => setScene(null)} />
            ) : scene === "story" ? (
              <StoryScene now={now} read={profile.mochito_stories} toy={profile.mochito_home?.toy} outfit={profile.mochito_outfit} onLine={setLine} onClose={() => setScene(null)} />
            ) : scene === "show" ? (
              <ShowScene now={now} outfit={profile.mochito_outfit} tricks={tricks} clean={state.clean} love={state.love} metFriends={friendsOf(profile.mochito_friends).map((f) => f.id)} result={profile.mochito_show} onLine={setLine} onClose={() => setScene(null)} />
            ) : bath ? (
              <BathScene reduce={!!reduce} muddy={!!care.muddy} outfit={profile.mochito_outfit} onStep={(t) => setLine(t)} onDone={() => void finishBath()} onClose={() => setBath(false)} />
            ) : walk ? (
              <WalkScene reduce={!!reduce} weather={weather} find={walk.phase === "done" ? walk.find : undefined} outfit={weather === "lluvia" ? rainOutfit(profile.mochito_outfit) : profile.mochito_outfit} house={profile.mochito_house} onArrive={arrive} onClose={() => setWalk(null)} />
            ) : (
              <>
                {ailment && !sleeping && (
                  <button type="button" onClick={() => { setScene("vet"); sfx("click"); setLine("¿Vamos con la doctora Pimienta? Me porto bien, prometido."); }} className="flex min-h-14 items-center gap-3 rounded-3xl border-2 border-destructive/40 bg-destructive/10 p-3 text-left active:scale-[0.97]">
                    <Stethoscope className="size-6 shrink-0 text-destructive" aria-hidden />
                    <span className="min-w-0 flex-1 text-sm"><span className="block font-semibold">Mochito no se siente bien: {AILMENTS[ailment].name.toLowerCase()}</span><span className="text-muted-foreground">Llévalo al veterinario y se cura enseguida.</span></span>
                  </button>
                )}
                <MissionsCard missions={missionsFor(now)} stats={profile.mochito_stats} now={now} did={new Set([...(did ?? []), ...(did?.includes("earned") ? ["spent"] : []), ...(giftOpened(profile.mochito_gift, now) ? ["gift"] : [])])} claimed={g.events.some((e) => e.id === missionsEventId(now))} onClaim={() => void claimMissions().then((ok) => { if (ok) { sfx("cash"); setLine(`¡Cumplimos las misiones! Te ganaste ${MISSIONS_REWARD.coins} monedas y yo subí un poquito.`); } })} />
                <GiftCard opened={giftOpened(profile.mochito_gift, now) && !gifting} gifting={gifting} streakNext={nextStreak(profile.mochito_gift, now)} streakNow={profile.mochito_gift?.streak ?? 0} onOpen={() => void gift()} reduce={!!reduce} />
                <p className="flex items-center gap-2 rounded-3xl bg-secondary/60 px-4 py-2 text-xs font-semibold"><WeatherIcon className="size-4 shrink-0 text-primary" aria-hidden /> {WEATHER[weather].today}</p>
                <div className="grid grid-cols-2 gap-3 rounded-3xl bg-secondary/60 p-3 sm:grid-cols-4">
                  <Bar label="Barriga" value={state.belly} icon={Bone} />
                  <Bar label="Cariño" value={state.love} icon={Heart} />
                  <Bar label="Diversión" value={state.fun} icon={Gamepad2} />
                  <Bar label="Limpieza" value={state.clean} icon={Droplets} />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  <button type="button" className={action} onClick={pet}><Hand className="size-6 text-primary" aria-hidden /> Acariciar</button>
                  <button type="button" className={action} onClick={feed}><Cookie className="size-6 text-primary" aria-hidden /> Galleta</button>
                  <button type="button" className={action} onClick={() => { setBath(true); setLine(care.muddy ? "¡Sí! Quítame este lodo, por favor." : "¿Baño con burbujas? ¡Me encanta!"); sfx("click"); }}><Bath className="size-6 text-primary" aria-hidden /> Bañar</button>
                  <button type="button" className={action} disabled={walked} onClick={() => void goWalk()} title={walked ? "Ya paseó hoy. Mañana sale otra vez." : undefined}>
                    <Footprints className="size-6 text-primary" aria-hidden /> {walked ? "Mañana otra vez" : "Pasear"}
                  </button>
                  <button type="button" className={cn(action, games && "border-primary")} aria-expanded={games} onClick={() => setGames((v) => !v)}><Gamepad2 className="size-6 text-primary" aria-hidden /> Jugar</button>
                  <Link href="/vestuario" className={action} onClick={() => { goTo("vestir"); onOpenChange(false); }}><Shirt className="size-6 text-primary" aria-hidden /> Vestir</Link>
                  <button type="button" className={cn(action, ailment && "border-destructive/50")} onClick={() => { setScene("vet"); sfx("click"); setLine(ailment ? "Sí, vamos. Me siento malito." : "¿Mi chequeo? Está bien, pero me das premio después."); }}>
                    <Stethoscope className="size-6 text-primary" aria-hidden /> {ailment ? "Al veterinario" : vetDue ? "Su chequeo" : "Veterinario"}
                  </button>
                  <button type="button" className={cn(action, sleeping && "border-primary")} onClick={() => { setScene("story"); sfx("click"); }}><BookOpen className="size-6 text-primary" aria-hidden /> Cuento</button>
                  <button type="button" className={action} onClick={() => { setScene("show"); sfx("click"); setLine(showDone ? "Ya concursamos esta semana. ¿Viste mi listón?" : "¿Un concurso? ¡Quiero el listón azul!"); }}>
                    <Trophy className="size-6 text-primary" aria-hidden /> {showDone ? "Su listón" : "Concurso"}
                  </button>
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
        {tab === "cosas" && <HouseDesigner house={profile.mochito_house} onLine={setLine} />}
        {tab === "amigos" && <FriendsTab met={profile.mochito_friends} />}
        {tab === "fotos" && <PhotoTab level={lvl.level} onLine={setLine} />}
        {tab === "pegatinas" && <StickersTab have={profile.mochito_stickers} outfit={profile.mochito_outfit} />}
        {tab === "diario" && <DiaryTab log={profile.mochito_log} now={now} since={bday?.since} />}
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
    const medals = await setMochitoThing(item.petSlot!, item.id);
    onLine(medals.length ? `${pickOf(MEDAL_WON)} Es «${medals[0]}».` : `¡Mi ${item.name.toLowerCase()}! ${pickOf(THING_NEW)}`);
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
                    <button type="button" onClick={() => { void setMochitoThing(slot, on ? undefined : i.id).then((m) => { if (!on) onLine(m.length ? `${pickOf(MEDAL_WON)} Es «${m[0]}».` : pickOf(THING_NEW)); }); }} className={cn("min-h-11 w-full rounded-2xl text-sm font-semibold active:scale-[0.97]", on ? "bg-secondary" : "bg-primary text-primary-foreground")}>
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
function WalkScene({ reduce, weather, find, outfit, house, onArrive, onClose }: { reduce: boolean; weather: Weather; find?: WalkFind; outfit?: Record<string, string>; house?: { style?: string; roof?: string; wall?: string; flowers?: string; sign?: string }; onArrive: () => void; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-40 overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 to-sky-50 dark:from-sky-950 dark:to-sky-900">
        <div className="absolute inset-x-0 bottom-0 h-10 bg-emerald-200 dark:bg-emerald-900" />
        <div className="absolute bottom-7 left-[3%] h-24 w-28"><HouseArt house={house} /></div>
        <TreePine className={cn("absolute bottom-8 right-[8%] size-16", weather === "hojas" ? "text-orange-600" : "text-emerald-700")} aria-hidden />
        <WeatherLayer weather={weather} />
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
        <p className="text-sm text-muted-foreground" aria-live="polite">{weather === "lluvia" ? "Mochito sale con sus botitas y su paraguas…" : "Mochito va de paseo por el parque…"}</p>
      )}
    </div>
  );
}

/** Manchitas de lodo encima de Mochito (después del paseo, hasta que lo bañas). */
function Mud({ fade = 0 }: { fade?: number }) {
  return (
    <svg viewBox="0 0 100 140" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden style={{ opacity: 1 - fade }}>
      <g fill="#7a5230" opacity="0.75">
        <ellipse cx="38" cy="96" rx="9" ry="6" />
        <ellipse cx="62" cy="108" rx="7" ry="5" />
        <ellipse cx="30" cy="126" rx="8" ry="4" />
        <ellipse cx="66" cy="128" rx="7" ry="4" />
        <circle cx="52" cy="88" r="3.5" />
        <circle cx="45" cy="114" r="3" />
      </g>
    </svg>
  );
}

/** El baño: primero se enjabona tallándolo con el dedo y luego se cepilla. */
function BathScene({ reduce, muddy, outfit, onStep, onDone, onClose }: { reduce: boolean; muddy: boolean; outfit?: Record<string, string>; onStep: (t: string) => void; onDone: () => void; onClose: () => void }) {
  const [step, setStep] = useState<"jabon" | "cepillo" | "listo">("jabon");
  const [rubs, setRubs] = useState(0);
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number }[]>([]);
  const last = useRef<{ x: number; y: number } | null>(null);
  const nextId = useRef(1);

  function rub(x: number, y: number, force = false) {
    if (step === "listo") return;
    const prev = last.current;
    const far = !prev || Math.hypot(x - prev.x, y - prev.y) > 0.12;
    if (!far && !force) return;
    last.current = { x, y };
    if (step === "jabon") setBubbles((b) => [...b.slice(-14), { id: nextId.current++, x, y }]);
    const n = rubs + 1;
    sfx("click");
    if (n < SCRUB_STEPS) { setRubs(n); return; }
    if (step === "jabon") {
      setStep("cepillo"); setRubs(0); last.current = null;
      onStep("¡Qué espumita! Ahora cepíllame el pelo, despacito.");
    } else {
      setStep("listo"); setBubbles([]);
      onDone();
    }
  }
  const progress = step === "listo" ? 1 : rubs / SCRUB_STEPS;
  const mudFade = step === "jabon" ? progress : 1;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold" aria-live="polite">
        {step === "jabon" ? `Paso 1 de 2: talla a Mochito con el dedo para enjabonarlo (${rubs} de ${SCRUB_STEPS}).` : step === "cepillo" ? `Paso 2 de 2: pásale el cepillo por el pelo (${rubs} de ${SCRUB_STEPS}).` : "¡Listo! Mochito quedó limpiecito."}
      </p>
      <div
        className="relative flex h-48 touch-none select-none items-end justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-sky-50 to-cyan-100 dark:from-sky-950 dark:to-cyan-950"
        onPointerMove={(e) => { if (e.buttons || e.pointerType === "touch") { const r = e.currentTarget.getBoundingClientRect(); rub((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); } }}
        onPointerDown={(e) => { const r = e.currentTarget.getBoundingClientRect(); rub((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); }}
      >
        <div className="absolute inset-x-6 bottom-2 h-14 rounded-b-[3rem] rounded-t-xl bg-white/80 shadow-inner dark:bg-white/20" aria-hidden />
        <div className="relative z-10 mb-4 h-36">
          <DressedImage char="mochito" outfit={outfit} alt="" className="h-full" />
          {muddy && <Mud fade={mudFade} />}
        </div>
        {bubbles.map((b) => (
          <motion.span
            key={b.id}
            aria-hidden
            className="pointer-events-none absolute z-20 size-6 rounded-full border-2 border-white bg-white/50"
            style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%` }}
            initial={{ opacity: 0, transform: "translate(-50%, -50%) scale(0.95)" }}
            animate={{ opacity: 1, transform: reduce ? "translate(-50%, -50%) scale(1)" : "translate(-50%, -80%) scale(1.15)" }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
          />
        ))}
        {step === "listo" && !reduce && (
          <motion.span aria-hidden className="pointer-events-none absolute right-6 top-6 z-20 text-primary" initial={{ opacity: 0, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1.1)" }} transition={{ duration: 0.4, ease: EASE_OUT }}>
            <Sparkles className="size-8" />
          </motion.span>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label="Avance del baño" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%`, transition: "width 200ms cubic-bezier(0.23, 1, 0.32, 1)" }} />
      </div>
      <div className="flex flex-wrap gap-2">
        {step !== "listo" && (
          <button type="button" onClick={() => rub(0.3 + ((rubs * 37) % 40) / 100, 0.35 + ((rubs * 23) % 40) / 100, true)} className="min-h-11 rounded-2xl border-2 border-primary px-5 text-sm font-semibold active:scale-[0.97]">
            {step === "jabon" ? "Tallar" : "Cepillar"}
          </button>
        )}
        <button type="button" onClick={onClose} className={cn("min-h-11 rounded-2xl px-5 text-sm font-semibold active:scale-[0.97]", step === "listo" ? "bg-primary text-primary-foreground" : "bg-secondary")}>
          {step === "listo" ? "Volver" : "Dejarlo para después"}
        </button>
      </div>
    </div>
  );
}

/** El regalo del día: se abre una vez al día y crece con la racha. */
function GiftCard({ opened, gifting, streakNext, streakNow, onOpen, reduce }: { opened: boolean; gifting: { coins: number; streak: number; bonus: number } | null; streakNext: number; streakNow: number; onOpen: () => void; reduce: boolean }) {
  if (gifting) {
    return (
      <motion.div className="flex items-center gap-3 rounded-3xl bg-[color-mix(in_oklch,var(--gold)_35%,transparent)] p-3" initial={{ opacity: 0, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ duration: reduce ? 0.2 : 0.35, ease: EASE_OUT }}>
        <Gift className="size-8 shrink-0 text-primary" aria-hidden />
        <p className="text-sm font-semibold">+{gifting.coins} monedas · racha de {gifting.streak} {gifting.streak === 1 ? "día" : "días"}{gifting.bonus ? " · ¡bono especial!" : ""}</p>
      </motion.div>
    );
  }
  if (opened) {
    const to7 = 7 - (streakNow % 7);
    return (
      <p className="flex items-center gap-2 rounded-3xl bg-secondary/60 px-4 py-2 text-xs font-semibold text-muted-foreground">
        <Gift className="size-4 shrink-0 text-primary" aria-hidden /> Racha de {streakNow} {streakNow === 1 ? "día" : "días"}. Mañana hay otro regalo{to7 < 7 ? `; en ${to7} ${to7 === 1 ? "día" : "días"} llega el bono` : ""}.
      </p>
    );
  }
  const preview = giftFor(streakNext);
  return (
    <button type="button" onClick={onOpen} className="flex min-h-16 items-center gap-3 rounded-3xl border-2 border-[var(--gold)] bg-card p-3 text-left active:scale-[0.97]">
      <motion.span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]" animate={reduce ? undefined : { transform: ["rotate(0deg)", "rotate(-8deg)", "rotate(8deg)", "rotate(0deg)"] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.6, ease: EASE_OUT }}>
        <Gift className="size-6 text-foreground" aria-hidden />
      </motion.span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">Regalo del día</span>
        <span className="block text-xs text-muted-foreground">Día {streakNext} seguido{preview.bonus ? " · ¡hoy trae bono!" : ""}. Tócalo para abrirlo.</span>
      </span>
    </button>
  );
}

/** El diario de Mochito: lo que hicieron juntos cada día, contado por él. */
function DiaryTab({ log, now, since }: { log?: { d: string; e: string[] }[]; now: number; since?: string }) {
  const days = [...(log ?? [])].reverse();
  return (
    <div role="tabpanel" className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Mochito anota solito lo que hacen juntos.{since ? ` Llegó a tu vida el ${new Date(since + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" })}.` : ""}
      </p>
      {days.length === 0 ? (
        <p className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">Todavía no hay recuerdos. Acarícialo, juega o sácalo a pasear y aquí lo cuenta.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {days.map((day) => (
            <li key={day.d} className="rounded-3xl border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold first-letter:uppercase">{logDayTitle(day.d, now)}</h3>
              <ul className="flex flex-col gap-1.5">
                {day.e.map((e) => (
                  <li key={e} className="flex gap-2 text-sm leading-snug"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />{e}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Las tres misiones del día y su premio. */
function MissionsCard({ missions, stats, now, did, claimed, onClaim }: { missions: Mission[]; stats?: Parameters<typeof missionProgress>[1]; now: number; did: Set<string>; claimed: boolean; onClaim: () => void }) {
  const rows = missions.map((m) => ({ m, ...missionProgress(m, stats, now, did) }));
  const all = rows.every((r) => r.done);
  return (
    <section aria-labelledby="misiones" className="flex flex-col gap-2 rounded-3xl border-2 border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 id="misiones" className="flex items-center gap-1.5 text-sm font-semibold"><Target className="size-4 text-primary" aria-hidden /> Misiones de hoy</h3>
        <span className="text-xs font-semibold text-muted-foreground">{rows.filter((r) => r.done).length} de 3</span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {rows.map(({ m, have, done }) => (
          <li key={m.id} className={cn("flex items-center gap-2 text-sm", done && "text-muted-foreground line-through")}>
            <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border-2", done ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{done && <Check className="size-3" aria-hidden />}</span>
            <span className="min-w-0 flex-1">{m.text}</span>
            {m.need > 1 && !done && <span className="text-xs tabular-nums text-muted-foreground">{have}/{m.need}</span>}
          </li>
        ))}
      </ul>
      {claimed ? (
        <p className="text-xs font-semibold text-primary">¡Misiones cumplidas! Mañana hay nuevas.</p>
      ) : all ? (
        <button type="button" onClick={onClaim} className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-[0.97]">
          <Coins className="size-4" aria-hidden /> Cobrar premio: {MISSIONS_REWARD.coins} monedas
        </button>
      ) : (
        <p className="text-xs text-muted-foreground">Cúmplelas todas y ganas {MISSIONS_REWARD.coins} monedas, y Mochito sube un poquito.</p>
      )}
    </section>
  );
}
