"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Armchair, Check, CloudDrizzle, Coins, Cookie, Croissant, Droplets, Flower2, GraduationCap, Lightbulb, Lock, Mailbox, Squirrel, Store, ThumbsDown, ThumbsUp, TreePine, Trees,
} from "lucide-react";
import { MochitoFigure } from "@/components/mochito-figure";
import { ThingArt } from "@/components/mochito-things";
import { PuppyArt } from "@/components/puppy-art";
import { finishBake, finishStreet, passClass, setRoomItem, spendJar } from "@/lib/mochito-actions";
import {
  BAKE_MS, CLASS_PASS, CLASS_ROUNDS, CLASSES_PER_COURSE, COMMANDS, COURSES, CUTTERS, CUT_COUNT, INGREDIENTS, MIX_TAPS, NEIGHBORS, PET_RECIPES, ROOM, ROOM_SLOTS,
  SPOTS, SQUIRREL_HOLD_MS, SQUIRREL_WAIT_MS, STREET_COINS, STREET_STOPS, TREASURES, TREAT_IDS, bakeCount, bakeZone, classPlan, courseClasses, nextCourse, pantryFor,
  roomBuyId, roomItem, streetEvent, streetRoute, treatsFor,
  type CourseId, type Cutter, type Ingredient, type Room, type RoomSlot, type Spot, type StreetEvent, type Treasure, type Treat, type School,
} from "@/lib/mochito-extra-2";
import type { Groom } from "@/lib/mochito-extra";
import { rng } from "@/lib/game/engine";
import type { Friend } from "@/lib/mochito-play";
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

// ── Su cuarto ───────────────────────────────────────────────────────

const WALLS: Record<string, string> = { crema: "#f6ead2", menta: "#cdebd9", rayas: "#fbe3ea", estrellas: "#2f3d6b", huellas: "#f3dccb" };
const FLOORS: Record<string, string> = { madera: "#c48a52", barro: "#c8684a", ajedrez: "#f4efe6", azul: "#7fb0dc" };

/** El cuarto de Mochito por dentro (200×130), con sus cosas: cama, platito y juguete. */
export function RoomArt({ room, home, className }: { room?: Room; home?: { bed?: string; bowl?: string; toy?: string }; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const it = (s: RoomSlot) => roomItem(s, room?.[s]).id;
  const wall = it("pared");
  const floor = it("piso");
  const line = "rgb(0 0 0 / 0.22)";
  const curtain = it("ventana") === "rojas" ? "#c8473d" : it("ventana") === "flores" ? "#f6d36b" : "#3b4f8c";
  return (
    <svg viewBox="0 0 200 130" className={cn("h-full w-full", className)} aria-hidden>
      <defs>
        <pattern id={`rayas${uid}`} width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#fbe3ea" /><rect width="6" height="12" fill="#f5c6d6" /></pattern>
        <pattern id={`estrellas${uid}`} width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#2f3d6b" /><path d="M6 4 L7 7 L10 7 L7.6 8.8 L8.5 12 L6 10 L3.5 12 L4.4 8.8 L2 7 L5 7 Z" fill="#f6d36b" /><circle cx="17" cy="16" r="1" fill="#fff" /></pattern>
        <pattern id={`huellas${uid}`} width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#f3dccb" /><g fill="#e2b99c"><ellipse cx="8" cy="10" rx="3" ry="2.4" /><circle cx="4.5" cy="6.5" r="1.1" /><circle cx="7" cy="5" r="1.1" /><circle cx="9.5" cy="5" r="1.1" /><circle cx="12" cy="6.5" r="1.1" /></g></pattern>
        <pattern id={`ajedrez${uid}`} width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#f4efe6" /><rect width="8" height="8" fill="#3c3a46" /><rect x="8" y="8" width="8" height="8" fill="#3c3a46" /></pattern>
      </defs>
      <rect x="0" y="0" width="200" height="90" fill={["rayas", "estrellas", "huellas"].includes(wall) ? `url(#${wall}${uid})` : WALLS[wall]} />
      <rect x="0" y="88" width="200" height="42" fill={floor === "ajedrez" ? `url(#ajedrez${uid})` : FLOORS[floor]} />
      {floor === "madera" && [100, 112, 124].map((y) => <path key={y} d={`M0 ${y} H200`} stroke="rgb(0 0 0 / 0.12)" strokeWidth="0.8" />)}
      {(floor === "barro" || floor === "azul") && [30, 60, 90, 120, 150, 180].map((x) => <path key={x} d={`M${x} 88 V130 M0 108 H200`} stroke="rgb(255 255 255 / 0.35)" strokeWidth="0.8" />)}
      <rect x="0" y="86" width="200" height="4" fill="#e8dcc6" stroke={line} strokeWidth="0.5" />

      <rect x="18" y="14" width="50" height="42" rx="3" fill="#bfe3f7" stroke="#ffffff" strokeWidth="3" />
      <path d="M43 14 V56 M18 35 H68" stroke="#ffffff" strokeWidth="2" />
      <circle cx="58" cy="24" r="4" fill="#f6c744" />
      {it("ventana") !== "nada" && (
        <>
          <path d="M12 10 Q22 34 16 60 H26 Q30 34 24 10 Z" fill={curtain} stroke={line} strokeWidth="0.6" />
          <path d="M74 10 Q64 34 70 60 H60 Q56 34 62 10 Z" fill={curtain} stroke={line} strokeWidth="0.6" />
          {it("ventana") === "flores" && [[18, 24], [20, 44], [67, 22], [66, 46]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.8" fill="#e2457a" />)}
          {it("ventana") === "noche" && [[18, 22], [21, 42], [67, 26], [65, 46]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.2" fill="#f6d36b" />)}
          <rect x="8" y="8" width="70" height="3" rx="1.5" fill="#8a5a2e" />
        </>
      )}

      {it("cuadro") !== "nada" && (
        <g>
          <rect x="112" y="16" width="38" height="30" fill="#ffffff" stroke="#a8703f" strokeWidth="3" />
          {it("cuadro") === "hueso" && <path d="M120 31 a3 3 0 1 1 3 -4 h16 a3 3 0 1 1 3 4 a3 3 0 1 1 -3 4 h-16 a3 3 0 1 1 -3 -4 Z" fill="#f6c744" stroke={line} strokeWidth="0.6" />}
          {it("cuadro") === "lago" && <><rect x="113.5" y="17.5" width="35" height="27" fill="#cfe8fb" /><path d="M113.5 34 H148.5 V44.5 H113.5 Z" fill="#4f93c9" /><path d="M118 34 L126 24 L134 34 Z" fill="#7a8ea8" /></>}
          {it("cuadro") === "retrato" && <><rect x="113.5" y="17.5" width="35" height="27" fill="#f4e3c3" /><circle cx="131" cy="31" r="8" fill="#e9c48f" /><ellipse cx="123" cy="28" rx="3" ry="6" fill="#9a6532" /><ellipse cx="139" cy="28" rx="3" ry="6" fill="#9a6532" /><circle cx="128" cy="30" r="1" fill="#222" /><circle cx="134" cy="30" r="1" fill="#222" /><ellipse cx="131" cy="34" rx="2" ry="1.4" fill="#222" /></>}
          {it("cuadro") === "volcan" && <><rect x="113.5" y="17.5" width="35" height="27" fill="#fbd9b5" /><path d="M116 44.5 L128 24 L134 24 L146 44.5 Z" fill="#6b6f80" /><path d="M128 24 Q131 18 134 24" fill="#f6a623" /></>}
        </g>
      )}
      {it("lampara") === "pie" && <g><path d="M184 86 V44" stroke="#5a3b2e" strokeWidth="2" /><path d="M174 46 L194 46 L189 32 L179 32 Z" fill="#f6d36b" stroke={line} strokeWidth="0.6" /><ellipse cx="184" cy="87" rx="7" ry="2" fill="#5a3b2e" /></g>}
      {it("lampara") === "luces" && <g><path d="M80 6 Q140 20 200 6" stroke="#5a5a5a" strokeWidth="0.8" fill="none" />{[88, 100, 112, 124, 136, 148, 160, 172, 184, 196].map((x, k) => <circle key={x} cx={x} cy={6 + Math.sin(((x - 80) / 120) * Math.PI) * 7 + 2} r="2" fill={["#f6c744", "#e2457a", "#5bb06a", "#3f74c4"][k % 4]} />)}</g>}
      {it("lampara") === "luna" && <g><rect x="166" y="54" width="30" height="3" fill="#a8703f" /><circle cx="181" cy="44" r="9" fill="#fff3c4" stroke={line} strokeWidth="0.6" /><circle cx="185" cy="41" r="8" fill={["rayas", "estrellas", "huellas"].includes(wall) ? "#d9cba6" : WALLS[wall]} /></g>}
      {it("planta") !== "nada" && (
        <g>
          <path d="M6 88 L8 74 H26 L28 88 Z" fill="#c8684a" stroke={line} strokeWidth="0.6" />
          {it("planta") === "cactus" && <path d="M17 74 V54 Q17 50 20 50 Q23 50 23 54 V74 M23 62 H27 V56" stroke="#4a9a5b" strokeWidth="5" fill="none" strokeLinecap="round" />}
          {it("planta") === "helecho" && [-40, -20, 0, 20, 40].map((a) => <ellipse key={a} cx="17" cy="62" rx="3" ry="12" fill="#3f8a4a" transform={`rotate(${a} 17 74)`} />)}
          {it("planta") === "girasol" && <><path d="M17 74 V50" stroke="#3f8a4a" strokeWidth="2" />{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <ellipse key={a} cx="17" cy="42" rx="2.4" ry="5" fill="#f6c13a" transform={`rotate(${a} 17 47)`} />)}<circle cx="17" cy="47" r="3.6" fill="#7a4a1d" /></>}
        </g>
      )}
      {it("alfombra") === "redonda" && <ellipse cx="98" cy="114" rx="42" ry="10" fill="#e27aa3" stroke="#fff" strokeWidth="1.5" strokeDasharray="3 2" />}
      {it("alfombra") === "huella" && <g fill="#9b7fd1"><ellipse cx="98" cy="117" rx="20" ry="8" /><ellipse cx="74" cy="106" rx="6" ry="3.5" /><ellipse cx="88" cy="101" rx="6" ry="3.5" /><ellipse cx="108" cy="101" rx="6" ry="3.5" /><ellipse cx="122" cy="106" rx="6" ry="3.5" /></g>}
      {it("alfombra") === "arcoiris" && ["#d6453d", "#f39a2b", "#f6c744", "#5bb06a", "#3f74c4"].map((c, k) => <ellipse key={c} cx="98" cy="115" rx={44 - k * 7} ry={11 - k * 1.8} fill={c} />)}
      {home?.bed && <foreignObject x="130" y="92" width="62" height="36"><ThingArt id={home.bed} /></foreignObject>}
      {home?.bowl && <foreignObject x="34" y="104" width="26" height="16"><ThingArt id={home.bowl} /></foreignObject>}
      {home?.toy && <foreignObject x="62" y="110" width="20" height="14"><ThingArt id={home.toy} /></foreignObject>}
    </svg>
  );
}

/** Decorar su cuarto: cada rincón tiene opciones; lo nuevo se compra una vez con monedas. */
export function RoomScene({ room, home, coins, owned, look, onLine, onClose }: {
  room?: Room; home?: { bed?: string; bowl?: string; toy?: string }; coins: number; owned: Set<string>; look: Look; onLine: (s: string) => void; onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const [slot, setSlot] = useState<RoomSlot>("pared");
  const [err, setErr] = useState("");
  const [hop, setHop] = useState(0);
  async function put(id: string) {
    const item = roomItem(slot, id);
    const had = item.price === 0 || owned.has(roomBuyId(slot, id));
    const e = await setRoomItem(slot, id);
    if (e) { setErr(e); sfx("sad"); return; }
    setErr("");
    setHop((n) => n + 1);
    sfx(had ? "click" : "cash");
    onLine(had ? `Así queda: ${item.name.toLowerCase()}. ¡Me gusta!` : `¡Compramos ${item.name.toLowerCase()} para mi cuarto! Ya se ve más bonito.`);
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-3xl border-4 border-[#e8dcc6]">
        <RoomArt room={room} home={home} className="block" />
        <motion.span
          key={hop}
          className="absolute bottom-[6%] left-[44%] block h-[42%]"
          initial={false}
          animate={reduce ? undefined : hop ? { transform: ["translateY(0px)", "translateY(-14px)", "translateY(0px)"] } : { transform: ["translateX(0px)", "translateX(-24px)", "translateX(10px)", "translateX(0px)"] }}
          transition={hop ? { duration: 0.4, ease: EASE_OUT } : { duration: 8, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
          aria-hidden
        >
          <MochitoFigure outfit={look.outfit} groom={look.groom} />
        </motion.span>
      </div>
      <p className="flex items-center gap-1.5 text-sm font-semibold"><Coins className="size-4 text-primary" aria-hidden /> Tienes {coins} monedas</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Rincón del cuarto">
        {ROOM_SLOTS.map((s) => <button key={s} type="button" role="radio" aria-checked={slot === s} onClick={() => { setSlot(s); setErr(""); }} className={cn(chip, slot === s ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary")}>{ROOM[s].name}</button>)}
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ROOM[slot].items.map((i) => {
          const on = roomItem(slot, room?.[slot]).id === i.id;
          const have = i.price === 0 || owned.has(roomBuyId(slot, i.id));
          return (
            <li key={i.id}>
              <button type="button" onClick={() => void put(i.id)} disabled={on} aria-pressed={on} className={cn("flex min-h-14 w-full items-center justify-between gap-2 rounded-2xl border-2 bg-card px-3 text-left text-sm font-semibold active:scale-[0.97]", on ? "border-primary" : "border-border")}>
                <span className="leading-tight">{i.name}</span>
                <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground">
                  {on ? <><Check className="size-4 text-primary" aria-hidden /> Puesto</> : have ? "Lo tienes" : <><Coins className="size-3.5" aria-hidden /> {i.price}</>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {err && <p className="text-sm font-semibold text-destructive" role="alert">{err}</p>}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
    </div>
  );
}

// ── Paseo por la colonia ────────────────────────────────────────────

const SPOT_ICONS: Record<Spot, typeof Store> = {
  arbol: TreePine, poste: Lightbulb, tienda: Store, fuente: Droplets, jardin: Flower2, banca: Armchair, buzon: Mailbox, panaderia: Croissant, charco: CloudDrizzle, parquecito: Trees,
};

export function TreasureArt({ id, className }: { id: Treasure; className?: string }) {
  const c = TREASURES.find((t) => t.id === id)?.color ?? "#ccc";
  const line = "rgb(0 0 0 / 0.3)";
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      {id === "pluma" ? <path d="M10 34 Q14 10 32 6 Q30 24 10 34 Z M10 34 L24 16" fill={c} stroke={line} strokeWidth="1" />
        : id === "hoja" ? <path d="M8 32 Q8 8 32 8 Q32 32 8 32 Z M8 32 L26 14" fill={c} stroke={line} strokeWidth="1" />
        : id === "palito" ? <path d="M6 30 L34 12 M18 22 L22 30" stroke={c} strokeWidth="4" strokeLinecap="round" />
        : id === "bellota" ? <><ellipse cx="20" cy="24" rx="9" ry="11" fill={c} stroke={line} /><path d="M10 18 Q20 6 30 18 Z" fill="#6b4422" /></>
        : id === "caracol" ? <><path d="M20 8 a12 12 0 1 1 -0.1 0 Z" fill={c} stroke={line} /><path d="M20 14 a6 6 0 1 1 -0.1 0" fill="none" stroke={line} strokeWidth="1.5" /></>
        : id === "boton" ? <><circle cx="20" cy="20" r="12" fill={c} stroke={line} /><circle cx="16" cy="17" r="2" fill="#fff" /><circle cx="24" cy="17" r="2" fill="#fff" /><circle cx="16" cy="24" r="2" fill="#fff" /><circle cx="24" cy="24" r="2" fill="#fff" /></>
        : <><circle cx="20" cy="20" r="12" fill={c} stroke={line} /><circle cx="15" cy="15" r="3.5" fill="rgb(255 255 255 / 0.6)" /></>}
    </svg>
  );
}

export function TreasureShelf({ have }: { have?: Record<string, number> }) {
  const n = TREASURES.filter((t) => (have?.[t.id] ?? 0) > 0).length;
  return (
    <section aria-labelledby="tesoros" className="flex flex-col gap-2 rounded-3xl border bg-card p-3">
      <h3 id="tesoros" className="text-sm font-semibold">Tesoros de la colonia <span className="font-normal text-muted-foreground">({n} de {TREASURES.length})</span></h3>
      <ul className="grid grid-cols-5 gap-2">
        {TREASURES.map((t) => {
          const k = have?.[t.id] ?? 0;
          return (
            <li key={t.id} className="flex flex-col items-center gap-0.5 text-center">
              <span className={cn("flex size-11 items-center justify-center rounded-2xl bg-secondary", !k && "opacity-30 grayscale")}><TreasureArt id={t.id} className="size-8" /></span>
              <span className="text-[11px] leading-tight">{k ? t.name : "¿?"}{k > 1 ? ` ×${k}` : ""}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** El paseo con correa por la colonia: en cada esquina eliges a dónde ir. Una vez al día. */
export function StreetScene({ day, done, look, onLine, onClose }: { day: string; done: boolean; look: Look; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const route = streetRoute(day);
  const [stop, setStop] = useState(-1);
  const [ev, setEv] = useState<(StreetEvent & { spot: Spot }) | null>(null);
  const [found, setFound] = useState<Treasure[]>([]);
  const [met, setMet] = useState<string[]>([]);
  const [cookies, setCookies] = useState(0);
  const [squirrel, setSquirrel] = useState<"espera" | "bien" | "jalo">("espera");
  const [hold, setHold] = useState(0);
  const [finished, setFinished] = useState(false);
  const holdT = useRef<ReturnType<typeof setInterval> | null>(null);
  const failT = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (holdT.current) clearInterval(holdT.current); if (failT.current) clearTimeout(failT.current); }, []);

  function go(spot: Spot) {
    const e = streetEvent(day, stop, spot, found.length);
    setEv({ ...e, spot });
    sfx("click");
    if (e.kind === "tesoro" && e.treasure) { setFound((f) => [...f, e.treasure!]); sfx("coin"); onLine(`¡Mira lo que encontré! ${TREASURES.find((t) => t.id === e.treasure)!.name}. Me lo llevo.`); }
    if (e.kind === "vecino" && e.neighbor) { setMet((m) => [...m, e.neighbor!]); if (NEIGHBORS[e.neighbor].cookie) setCookies((c) => c + 1); onLine("¡Hola, vecino! Muevo la cola para saludar."); }
    if (e.kind === "oler") onLine(e.smell);
    if (e.kind === "ardilla") {
      setSquirrel("espera");
      setHold(0);
      onLine("¡Una ardilla! ¡Una ardilla! ¡Quiero ir!");
      failT.current = setTimeout(() => { setSquirrel((s) => (s === "espera" ? "jalo" : s)); }, SQUIRREL_WAIT_MS);
    }
  }
  function startHold() {
    if (squirrel !== "espera") return;
    const t0 = Date.now();
    holdT.current = setInterval(() => {
      const v = Math.min(1, (Date.now() - t0) / SQUIRREL_HOLD_MS);
      setHold(v);
      if (v >= 1) { if (holdT.current) clearInterval(holdT.current); if (failT.current) clearTimeout(failT.current); setSquirrel("bien"); sfx("success"); onLine("Me quedé quieto aunque me moría de ganas. ¿Soy buen perro?"); }
    }, 50);
  }
  function stopHold() { if (holdT.current) clearInterval(holdT.current); setHold((h) => (h >= 1 ? 1 : 0)); }
  async function next() {
    setEv(null);
    if (stop + 1 < STREET_STOPS) { setStop((s) => s + 1); return; }
    setFinished(true);
    const r = await finishStreet(found, met, cookies);
    sfx("success");
    onLine(doneLine(r, `¡Qué buen paseo! Regresé con ${found.length} ${found.length === 1 ? "tesoro" : "tesoros"} y ${STREET_COINS} monedas.`));
  }

  if (done && !finished) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Hoy ya paseamos por la colonia. Mañana hay otro recorrido, con otras esquinas.</p>
        <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
      </div>
    );
  }
  const Icon = ev ? SPOT_ICONS[ev.spot] : null;
  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-48 overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 to-amber-50 dark:from-sky-950 dark:to-stone-900">
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          {[[4, "#e9b9a0"], [52, "#cfe3c4"], [100, "#f2d79a"], [148, "#c9d8f0"]].map(([x, c]) => <g key={x as number}><rect x={x as number} y="22" width="44" height="46" fill={c as string} /><path d={`M${(x as number) - 3} 24 L${(x as number) + 22} 8 L${(x as number) + 47} 24 Z`} fill="#b65a45" /><rect x={(x as number) + 16} y="46" width="12" height="22" fill="#6b4a2b" /><rect x={(x as number) + 5} y="30" width="9" height="9" fill="#fff" /><rect x={(x as number) + 30} y="30" width="9" height="9" fill="#fff" /></g>)}
          <rect x="0" y="68" width="200" height="10" fill="#d8d2c4" />
          <rect x="0" y="78" width="200" height="22" fill="#8c8c94" />
          {[10, 50, 90, 130, 170].map((x) => <rect key={x} x={x} y="88" width="18" height="2" fill="#f4f4f4" />)}
        </svg>
        <motion.span
          className="absolute bottom-3 left-[10%] block h-28"
          initial={false}
          animate={reduce ? undefined : { transform: `translateX(${Math.max(0, stop) * 40}px)` }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          aria-hidden
        >
          <MochitoFigure outfit={look.outfit} groom={look.groom} />
          <svg viewBox="0 0 40 60" className="absolute -right-8 top-6 h-16 w-10 overflow-visible"><path d="M2 14 Q20 20 30 60" stroke="#d6453d" strokeWidth="2" fill="none" /></svg>
        </motion.span>
        {ev && Icon && <span className="absolute right-4 top-4 flex size-16 items-center justify-center rounded-3xl bg-card shadow" aria-hidden><Icon className="size-9 text-primary" /></span>}
        {ev?.kind === "ardilla" && squirrel === "espera" && (
          <motion.span className="absolute bottom-14 right-8 block" initial={reduce ? false : { opacity: 0, transform: "translateX(20px)" }} animate={{ opacity: 1, transform: "translateX(0px)" }} transition={{ duration: 0.3, ease: EASE_OUT }} aria-hidden>
            <Squirrel className="size-10 text-[#9a6532]" />
          </motion.span>
        )}
      </div>

      {stop < 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm">Le ponemos la correa y salimos a dar la vuelta a la colonia. Son {STREET_STOPS} esquinas: en cada una eliges a dónde ir. Puede haber tesoros, vecinos… o ardillas.</p>
          <button type="button" onClick={() => { setStop(0); sfx("click"); onLine("¡Correa puesta! Vámonos."); }} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Ponerle la correa</button>
        </div>
      ) : finished ? (
        <div className="flex flex-col gap-2 rounded-3xl bg-secondary/60 p-3">
          <p className="text-sm font-semibold">¡Regresamos a casa!</p>
          <p className="text-sm">{found.length ? `Tesoros: ${found.map((t) => TREASURES.find((x) => x.id === t)!.name.toLowerCase()).join(", ")}.` : "Hoy no hubo tesoros."} {met.length ? `Saludamos a ${met.length} ${met.length === 1 ? "vecino" : "vecinos"}.` : ""} Ganaste {STREET_COINS} monedas.</p>
        </div>
      ) : ev ? (
        <div className="flex flex-col gap-2 rounded-3xl bg-secondary/60 p-3" aria-live="polite">
          <p className="text-sm font-semibold">{SPOTS[ev.spot].name}</p>
          {ev.kind === "oler" && <p className="text-sm">Mochito olfatea un buen rato. «{ev.smell}»</p>}
          {ev.kind === "tesoro" && ev.treasure && <p className="flex items-center gap-2 text-sm"><TreasureArt id={ev.treasure} className="size-10 shrink-0" /> ¡Encontró un tesoro: {TREASURES.find((t) => t.id === ev.treasure)!.name.toLowerCase()}!</p>}
          {ev.kind === "vecino" && ev.neighbor && <p className="text-sm"><span className="font-semibold">{NEIGHBORS[ev.neighbor].name}:</span> «{NEIGHBORS[ev.neighbor].line}»</p>}
          {ev.kind === "ardilla" && (
            squirrel === "espera" ? (
              <>
                <p className="text-sm">¡Una ardilla! Mantén presionado «Quieto» para que Mochito no se jale.</p>
                <button type="button" onPointerDown={(e) => { e.preventDefault(); startHold(); }} onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold} onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) startHold(); }} onKeyUp={stopHold} className="relative min-h-14 touch-none select-none overflow-hidden rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground active:scale-[0.97]">
                  <span className="absolute inset-y-0 left-0 bg-white/30" style={{ width: `${hold * 100}%` }} aria-hidden />
                  <span className="relative">Quieto…</span>
                </button>
              </>
            ) : squirrel === "bien" ? <p className="text-sm">Se quedó quieto aunque se moría de ganas. ¡Muy bien!</p>
              : <p className="text-sm">¡Te jaló tras la ardilla! La ardilla se subió al árbol y Mochito regresó contento.</p>
          )}
          {(ev.kind !== "ardilla" || squirrel !== "espera") && (
            <button type="button" onClick={() => void next()} className={cn(btn, "self-start bg-primary text-primary-foreground")}>{stop + 1 < STREET_STOPS ? "Seguir caminando" : "Regresar a casa"}</button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Esquina {stop + 1} de {STREET_STOPS}: ¿a dónde vamos?</p>
          <div className="grid grid-cols-2 gap-2">
            {route[stop].map((s) => {
              const I = SPOT_ICONS[s];
              return <button key={s} type="button" onClick={() => go(s)} className="flex min-h-16 items-center gap-2 rounded-2xl border-2 border-border bg-card px-3 text-left text-sm font-semibold active:scale-[0.97]"><I className="size-7 shrink-0 text-primary" aria-hidden /> {SPOTS[s].name}</button>;
            })}
          </div>
        </div>
      )}
      {!ev && !finished && <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>{stop < 0 ? "Volver" : "Dejar el paseo para después"}</button>}
      {finished && <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>}
    </div>
  );
}

// ── Escuela de perritos ─────────────────────────────────────────────

export function DiplomaShelf({ school }: { school?: School }) {
  return (
    <section aria-labelledby="diplomas" className="flex flex-col gap-2 rounded-3xl border bg-card p-3">
      <h3 id="diplomas" className="text-sm font-semibold">Sus diplomas</h3>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {COURSES.map((c) => {
          const n = courseClasses(school, c.id);
          const got = n >= CLASSES_PER_COURSE;
          return (
            <li key={c.id} className={cn("flex flex-col items-center gap-1 rounded-2xl border-2 p-2 text-center", got ? "border-[var(--gold)] bg-[#fffaf0] dark:bg-card" : "border-dashed border-border")}>
              <GraduationCap className={cn("size-7", got ? "text-primary" : "text-muted-foreground/50")} aria-hidden />
              <span className="text-xs font-semibold leading-tight">{c.name}</span>
              <span className="text-[11px] text-muted-foreground">{got ? "¡Graduado!" : `${n} de ${CLASSES_PER_COURSE} clases`}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type Verdict = { ok: boolean; text: string };

/** La escuela: la maestra da una orden, Mochito hace algo y tú decides si se lo merece. Una clase al día. */
export function SchoolScene({ school, level, today, look, onLine, onClose }: { school?: School; level: number; today: string; look: Look; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const course = nextCourse(school, level);
  const tookToday = school?.last === today;
  const [plan, setPlan] = useState<ReturnType<typeof classPlan> | null>(null);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [end, setEnd] = useState<"pasa" | "repite" | null>(null);
  const [tries, setTries] = useState(0);

  function start() {
    if (!course) return;
    setPlan(classPlan(rng(`clase:${today}:${course.id}:${tries}`), course.id as CourseId, courseClasses(school, course.id)));
    setI(0); setRight(0); setVerdict(null); setEnd(null); setTries((t) => t + 1);
    sfx("click");
    onLine("¡A clase! Prometo poner atención… y no oler a mis compañeros.");
  }
  function judge(good: boolean) {
    if (!plan || verdict) return;
    const r = plan[i];
    const did = r.did === r.cmd;
    const ok = good === did;
    const say = COMMANDS[r.cmd].say.replace(/[¡!]/g, "");
    setVerdict({ ok, text: ok ? (did ? "¡Eso! Lo hizo bien y le diste su premio." : `Bien visto: le pidieron «${say}» y no lo hizo. Se lo vuelves a pedir con calma.`) : did ? "Sí lo hizo bien: se merecía su premio." : `Ojo: le pidieron «${say}» y él hizo otra cosa. Así no se premia.` });
    if (ok) setRight((n) => n + 1);
    sfx(ok ? "coin" : "sad");
  }
  async function nextRound() {
    setVerdict(null);
    if (i + 1 < CLASS_ROUNDS) { setI((n) => n + 1); return; }
    if (right >= CLASS_PASS && course) {
      setEnd("pasa");
      const r = await passClass(course.id as CourseId);
      sfx("success");
      onLine(doneLine(r, r?.diploma ? `¡Me gradué en «${course.name}»! Mira mi diploma.` : "¡Pasé la clase! La maestra dijo que voy muy bien."));
    } else setEnd("repite");
  }

  const r = plan?.[i];
  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex h-48 items-end justify-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-b from-amber-50 to-lime-100 p-3 dark:from-stone-900 dark:to-lime-950">
        <span className="absolute left-3 top-3 rounded-2xl bg-[#2f4a3a] px-3 py-1.5 font-heading text-lg text-white shadow" aria-live="polite">{r && !end ? COMMANDS[r.cmd].say : "Escuela de perritos"}</span>
        <motion.span
          key={`${tries}-${i}`}
          className="block h-32"
          initial={false}
          animate={r && !end && !reduce ? { transform: COMMANDS[r.did].move } : undefined}
          transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.5 }}
          aria-hidden
        >
          <MochitoFigure outfit={look.outfit} groom={look.groom} />
        </motion.span>
        {end === "pasa" && <GraduationCap className="absolute right-6 top-6 size-12 text-primary" aria-hidden />}
      </div>

      {!plan ? (
        <>
          {course ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm"><span className="font-semibold">{course.name}:</span> clase {courseClasses(school, course.id) + 1} de {CLASSES_PER_COURSE}. La maestra da una orden y Mochito intenta hacerla. Si la hace bien, dale su premio. Si se equivoca, no se premia: se le vuelve a pedir.</p>
              {tookToday ? (
                <p className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm">Hoy ya tuvo su clase. La siguiente es mañana: así aprende mejor.</p>
              ) : (
                <button type="button" onClick={start} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Empezar la clase</button>
              )}
            </div>
          ) : (
            <p className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm">{COURSES.some((c) => c.level > level && courseClasses(school, c.id) < CLASSES_PER_COURSE) ? `Terminó los cursos que hay por ahora. El siguiente se abre en el nivel ${COURSES.find((c) => c.level > level)!.level}.` : "¡Ya se graduó de todos los cursos! Es el perrito más estudioso de la colonia."}</p>
          )}
          <DiplomaShelf school={school} />
        </>
      ) : end ? (
        <div className="flex flex-col gap-2 rounded-3xl bg-secondary/60 p-3">
          <p className="text-sm font-semibold">{end === "pasa" ? `¡Clase aprobada! Acertaste ${right} de ${CLASS_ROUNDS}.` : `Acertaste ${right} de ${CLASS_ROUNDS}. Se necesitan ${CLASS_PASS} para pasar.`}</p>
          {end === "repite" && <button type="button" onClick={start} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Repetir la clase</button>}
        </div>
      ) : r ? (
        <div className="flex flex-col gap-2" aria-live="polite">
          <p className="text-sm font-semibold">Orden {i + 1} de {CLASS_ROUNDS} · La maestra dijo «{COMMANDS[r.cmd].say}» y Mochito… <span className="text-primary">{COMMANDS[r.did].did.toLowerCase()}</span>.</p>
          {verdict ? (
            <>
              <p className={cn("rounded-2xl px-4 py-2 text-sm font-semibold", verdict.ok ? "bg-[#e3f3e6] text-[#1f5c2e] dark:bg-emerald-950 dark:text-emerald-200" : "bg-destructive/10 text-destructive")}>{verdict.text}</p>
              <button type="button" onClick={() => void nextRound()} className={cn(btn, "self-start bg-primary text-primary-foreground")}>{i + 1 < CLASS_ROUNDS ? "Siguiente orden" : "Ver cómo le fue"}</button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => judge(true)} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-3 text-sm font-semibold text-primary-foreground active:scale-[0.97]"><ThumbsUp className="size-5" aria-hidden /> ¡Bien hecho! (premio)</button>
              <button type="button" onClick={() => judge(false)} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-secondary px-3 text-sm font-semibold active:scale-[0.97]"><ThumbsDown className="size-5" aria-hidden /> Así no, otra vez</button>
            </div>
          )}
        </div>
      ) : null}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
    </div>
  );
}

// ── Cocina de premios ───────────────────────────────────────────────

function CutterArt({ id, color, className }: { id: Cutter; color: string; className?: string }) {
  const line = "rgb(0 0 0 / 0.25)";
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      {id === "hueso" && <path d="M9 17 a5 5 0 1 1 5 -6 h12 a5 5 0 1 1 5 6 a5 5 0 1 1 -5 6 h-12 a5 5 0 1 1 -5 -6 Z" transform="translate(0 6)" fill={color} stroke={line} />}
      {id === "huella" && <g fill={color} stroke={line}><ellipse cx="20" cy="26" rx="9" ry="7" /><circle cx="10" cy="15" r="3.5" /><circle cx="16.5" cy="10" r="3.5" /><circle cx="23.5" cy="10" r="3.5" /><circle cx="30" cy="15" r="3.5" /></g>}
      {id === "corazon" && <path d="M20 34 L7 21 a7 7 0 0 1 13 -9 a7 7 0 0 1 13 9 Z" fill={color} stroke={line} />}
      {id === "estrella" && <path d="M20 4 L24.5 15 L36 15.5 L27 23 L30 34.5 L20 28 L10 34.5 L13 23 L4 15.5 L15.5 15 Z" fill={color} stroke={line} />}
    </svg>
  );
}

type BakeStep = "receta" | "ingredientes" | "mezclar" | "cortar" | "hornear" | "listo";

/** Hornear premios para perro: ingredientes seguros, mezclar, cortar con molde y sacar del horno a tiempo. */
export function BakeScene({ jar, level, friends, look, onLine, onClose }: { jar?: Record<string, number>; level: number; friends: Friend[]; look: Look; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<BakeStep>("receta");
  const [treat, setTreat] = useState<Treat>("mani");
  const [pantry, setPantry] = useState<Ingredient[]>([]);
  const [added, setAdded] = useState<Ingredient[]>([]);
  const [warn, setWarn] = useState("");
  const [mix, setMix] = useState(0);
  const [cutter, setCutter] = useState<Cutter>("hueso");
  const [cuts, setCuts] = useState<{ x: number; y: number }[]>([]);
  const [oven, setOven] = useState(0);
  const [made, setMade] = useState(0);
  const ovenT = useRef<ReturnType<typeof setInterval> | null>(null);
  const can = treatsFor(level);
  const inJar = TREAT_IDS.filter((t) => (jar?.[t] ?? 0) > 0);
  const recipe = PET_RECIPES[treat];

  useEffect(() => () => { if (ovenT.current) clearInterval(ovenT.current); }, []);

  function choose(t: Treat) {
    setTreat(t);
    setPantry(pantryFor(t, Math.random));
    setAdded([]); setWarn(""); setMix(0); setCuts([]); setOven(0);
    setStep("ingredientes");
    sfx("click");
    onLine("¿Vas a cocinar para mí? ¡Me siento aquí a esperar!");
  }
  function add(i: Ingredient) {
    if (added.includes(i)) return;
    const info = INGREDIENTS[i];
    if (info.bad) { setWarn(`¡Eso no! ${info.bad}`); sfx("sad"); onLine("¡Uy! Eso no es para perritos."); return; }
    if (!recipe.items.includes(i)) { setWarn(`${info.name} no va en esta receta. Mira la lista.`); sfx("click"); return; }
    setWarn("");
    const next = [...added, i];
    setAdded(next);
    sfx("coin");
    if (next.length === recipe.items.length) setTimeout(() => setStep("mezclar"), 400);
  }
  function stir() {
    const n = mix + 1;
    setMix(n);
    sfx("click");
    if (n >= MIX_TAPS) setTimeout(() => setStep("cortar"), 300);
  }
  function cut(x: number, y: number) {
    if (cuts.length >= CUT_COUNT) return;
    const next = [...cuts, { x: Math.min(0.88, Math.max(0.12, x)), y: Math.min(0.82, Math.max(0.18, y)) }];
    setCuts(next);
    sfx("click");
    if (next.length >= CUT_COUNT) setTimeout(() => startOven(), 400);
  }
  function startOven() {
    setStep("hornear");
    setOven(0);
    const t0 = Date.now();
    ovenT.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / BAKE_MS);
      setOven(p);
      if (p >= 1) { if (ovenT.current) clearInterval(ovenT.current); void takeOut(1); }
    }, 60);
  }
  async function takeOut(p = oven) {
    const z = bakeZone(p);
    if (z === "crudas") { setWarn("Todavía están crudas. Esperemos un poquito más."); sfx("click"); return; }
    if (ovenT.current) clearInterval(ovenT.current);
    setWarn("");
    const n = bakeCount(z);
    setMade(n);
    setStep("listo");
    const r = await finishBake(treat, n);
    sfx("success");
    onLine(doneLine(r, z === "doradas" ? `¡Doraditas! Salieron ${n} y ya están en el frasco.` : `Quedaron un poco tostadas, pero salieron ${n}. ¡A mí me gustan igual!`));
  }
  async function give(t: Treat, f?: Friend) {
    const r = await spendJar(t, f?.id);
    sfx("success");
    onLine(doneLine(r, f ? `Le llevamos un premio a ${f.name}. ¡Ya somos más amigos!` : "¡Ñam! Hecho en casa sabe mejor."));
  }

  const zone = bakeZone(oven);
  return (
    <div className="flex flex-col gap-3">
      {step === "receta" && (
        <>
          <p className="text-sm">Vamos a hornear premios para perro. Elige la receta:</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {TREAT_IDS.map((t) => {
              const ok = can.includes(t);
              return (
                <button key={t} type="button" disabled={!ok} onClick={() => choose(t)} className="flex min-h-14 items-center gap-2 rounded-2xl border-2 border-border bg-card px-3 text-left text-sm font-semibold active:scale-[0.97] disabled:opacity-50">
                  <span className="block size-9 shrink-0">{ok ? <CutterArt id="hueso" color={PET_RECIPES[t].color} className="size-9" /> : <Lock className="m-2 size-5 text-muted-foreground" aria-hidden />}</span>
                  <span className="leading-tight">{PET_RECIPES[t].name}<span className="block text-xs font-normal text-muted-foreground">{ok ? PET_RECIPES[t].items.map((i) => INGREDIENTS[i].name.toLowerCase()).join(", ") : `Desde el nivel ${PET_RECIPES[t].level}`}</span></span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {step === "ingredientes" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">{recipe.name}: pon en el tazón lo que lleva ({added.length} de {recipe.items.length}).</p>
          <ul className="flex flex-wrap gap-2 text-xs">{recipe.items.map((i) => <li key={i} className={cn("flex items-center gap-1 rounded-full px-3 py-1", added.includes(i) ? "bg-primary text-primary-foreground" : "bg-secondary")}>{added.includes(i) && <Check className="size-3.5" aria-hidden />}{INGREDIENTS[i].name}</li>)}</ul>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {pantry.map((i) => <button key={i} type="button" disabled={added.includes(i)} onClick={() => add(i)} className="min-h-14 rounded-2xl border-2 border-border bg-card px-2 text-sm font-semibold active:scale-[0.97] disabled:opacity-40">{INGREDIENTS[i].name}</button>)}
          </div>
        </div>
      )}

      {step === "mezclar" && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm font-semibold">Mezcla bien la masa ({mix} de {MIX_TAPS}).</p>
          <button type="button" onClick={stir} aria-label="Mezclar" className="relative size-40 overflow-hidden rounded-full border-8 border-[#e8dcc6] active:scale-[0.97]" style={{ background: recipe.color }}>
            <motion.span className="absolute inset-0 block" initial={false} animate={reduce ? undefined : { transform: `rotate(${mix * 45}deg)` }} transition={{ duration: 0.25, ease: EASE_OUT }} aria-hidden>
              <span className="absolute left-1/2 top-2 h-16 w-2 -translate-x-1/2 rounded-full bg-[#a8703f]" />
              <span className="absolute left-[30%] top-[55%] size-5 rounded-full bg-white/25" />
            </motion.span>
          </button>
        </div>
      )}

      {step === "cortar" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Elige el molde y toca la masa para cortar {CUT_COUNT} premios ({cuts.length} de {CUT_COUNT}).</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Molde">
            {CUTTERS.map((c) => <button key={c.id} type="button" role="radio" aria-checked={cutter === c.id} disabled={cuts.length > 0} onClick={() => setCutter(c.id)} className={cn(chip, "flex items-center gap-1.5", cutter === c.id ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary")}><CutterArt id={c.id} color="currentColor" className="size-5" /> {c.name}</button>)}
          </div>
          <button type="button" onPointerDown={(e) => { const r = e.currentTarget.getBoundingClientRect(); cut((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cut(0.18 + (cuts.length % 3) * 0.32, cuts.length < 3 ? 0.32 : 0.7); } }} aria-label="Masa extendida: toca para cortar" className="relative h-44 w-full touch-none overflow-hidden rounded-3xl" style={{ background: recipe.color }}>
            {cuts.map((c, k) => <span key={k} className="absolute block size-12 -translate-x-1/2 -translate-y-1/2" style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }} aria-hidden><CutterArt id={cutter} color="#f6e2bf" className="size-12" /></span>)}
          </button>
        </div>
      )}

      {step === "hornear" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Al horno. Sácalas cuando estén doraditas.</p>
          <div className="relative h-6 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label="Horneado" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(oven * 100)}>
            <span className="absolute inset-y-0 left-[50%] w-[30%] bg-[var(--gold)]/50" aria-hidden />
            <span className="absolute inset-y-0 left-0 bg-[#c98b4a]" style={{ width: `${oven * 100}%` }} aria-hidden />
          </div>
          <p className="text-xs text-muted-foreground">Ahora: {zone === "crudas" ? "todavía crudas" : zone === "doradas" ? "¡doraditas!" : "se están tostando"}</p>
          {warn && <p className="text-sm font-semibold text-destructive" role="alert">{warn}</p>}
          <button type="button" onClick={() => void takeOut()} className="min-h-14 self-start rounded-2xl bg-primary px-8 text-base font-semibold text-primary-foreground active:scale-[0.97]">Sacar del horno</button>
        </div>
      )}

      {step === "listo" && (
        <div className="flex flex-col gap-2 rounded-3xl bg-secondary/60 p-3">
          <p className="text-sm font-semibold">¡Salieron {made} {recipe.name.toLowerCase()}!</p>
          <div className="flex flex-wrap gap-1" aria-hidden>{Array.from({ length: made }, (_, k) => <CutterArt key={k} id={cutter} color={recipe.color} className="size-9" />)}</div>
          <button type="button" onClick={() => setStep("receta")} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Hornear otra tanda</button>
        </div>
      )}

      {warn && step === "ingredientes" && <p className="text-sm font-semibold text-destructive" role="alert">{warn}</p>}

      <section aria-labelledby="frasco" className="flex flex-col gap-2">
        <h3 id="frasco" className="flex items-center gap-1.5 text-sm font-semibold"><Cookie className="size-4 text-primary" aria-hidden /> El frasco de premios</h3>
        {inJar.length === 0 ? (
          <p className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">Está vacío. Lo que hornees se guarda aquí para dárselo a Mochito o a sus amigos.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {inJar.map((t) => (
              <li key={t} className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-border bg-card p-2">
                <CutterArt id="hueso" color={PET_RECIPES[t].color} className="size-9 shrink-0" />
                <span className="min-w-0 flex-1 text-sm font-semibold">{PET_RECIPES[t].name} <span className="tabular-nums text-muted-foreground">× {jar![t]}</span></span>
                <button type="button" onClick={() => void give(t)} className={cn(btn, "bg-primary px-3 text-primary-foreground")}>Para Mochito</button>
                {friends.slice(0, 3).map((f) => <button key={f.id} type="button" onClick={() => void give(t, f)} className={cn(btn, "flex items-center gap-1 bg-secondary px-3")}><span className="block size-6"><PuppyArt friend={f} /></span> {f.name}</button>)}
              </li>
            ))}
          </ul>
        )}
      </section>
      {step !== "receta" && step !== "listo" && <span className="sr-only">Mochito te mira cocinar.</span>}
      <div className="flex items-end gap-2">
        <span className="block h-20" aria-hidden><MochitoFigure outfit={look.outfit} groom={look.groom} /></span>
        <button type="button" onClick={onClose} className={cn(btn, "bg-secondary")}>Volver</button>
      </div>
    </div>
  );
}
