"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUp, Bird, Camera, Cat, Droplets, Flame, Siren, Ticket } from "lucide-react";
import { finishBalloon, finishCinema, finishFire, finishZoo } from "@/lib/mochito-actions";
import {
  CINEMA_COLS, CINEMA_ROWS, FIRE_CELLS, FIRE_MAX, FLIGHT_MS, GEAR, GEAR_OK, HABITATS, HABITAT_IDS, LEVELS_UP, MOVIES, PLACES_UP, TICKET_PRICE, ZOO_ANIMALS, ZOO_TODAY,
  catOf, cinemaOf, fireSize, firesOf, flightOf, takenSeats, underBalloon, zooOf,
  type Balloon, type Gear, type Habitat, type MovieId, type PlaceUp, type Zoo, type ZooAnimal,
} from "@/lib/mochito-extra-9";
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

function DoneToday({ text, onClose, children }: { text: string; onClose: () => void; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">{text}</p>
      {children}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>Volver</button>
    </div>
  );
}

// ── Visitar el zoológico ────────────────────────────────────────────

function AnimalFace({ color, id }: { color: string; id: string }) {
  const light = ["osopolar", "flamenco", "jirafa"].includes(id);
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
      {id === "jirafa" && <path d="M14 8 v-5 M26 8 v-5" stroke="#8a5a2e" strokeWidth="2.4" strokeLinecap="round" />}
      {id === "leon" && <circle cx="20" cy="21" r="17" fill="#8a5a2e" />}
      <circle cx="9" cy="11" r="5" fill={color} stroke="rgb(0 0 0 / 0.2)" />
      <circle cx="31" cy="11" r="5" fill={color} stroke="rgb(0 0 0 / 0.2)" />
      <circle cx="20" cy="21" r="13" fill={color} stroke="rgb(0 0 0 / 0.2)" />
      {id === "cebra" && <path d="M12 14 l4 3 M28 14 l-4 3 M20 9 v4" stroke="#fffaf0" strokeWidth="2" strokeLinecap="round" />}
      <circle cx="15" cy="19" r="1.8" fill={light ? "#2b2622" : "#fffaf0"} />
      <circle cx="25" cy="19" r="1.8" fill={light ? "#2b2622" : "#fffaf0"} />
      {id === "tucan" || id === "flamenco" ? <path d="M17 24 q3 7 9 3 q-3 -2 -9 -3z" fill={id === "tucan" ? "#f6c744" : "#2b2622"} /> : <ellipse cx="20" cy="26" rx="5" ry="3.5" fill="rgb(255 255 255 / 0.35)" />}
      {id !== "tucan" && id !== "flamenco" && <circle cx="20" cy="25" r="1.4" fill="#2b2622" />}
    </svg>
  );
}

const theName = (name: string) => `${["Jirafa", "Cebra", "Foca"].includes(name) ? "la" : "el"} ${name.toLowerCase()}`;
const HABITAT_IN: Record<Habitat, string> = { selva: "la selva", sabana: "la sabana", agua: "el río", frio: "el hielo" };

/** El zoológico: lleva a cada animal a donde vive. Una vez al día; cada animal va al álbum. */
export function ZooScene({ day, zoo, onLine, onClose }: { day: string; zoo?: Zoo; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const done = zoo?.last === day;
  const [list] = useState(() => zooOf(day, Object.keys(zoo?.seen ?? {})));
  const [k, setK] = useState(0);
  const [placed, setPlaced] = useState(false);
  const [msg, setMsg] = useState("");
  const [fin, setFin] = useState(false);
  const [coins, setCoins] = useState(0);
  const sent = useRef(false);
  const album = { ...zoo?.seen, ...(fin ? Object.fromEntries(list.map((a) => [a.id, 1])) : {}) };

  if (done && !fin) return <DoneToday text="Hoy ya fuimos al zoológico. El mono me sigue saludando. Mañana hay otros animales." onClose={onClose}><ZooAlbum seen={album} /></DoneToday>;

  const a = list[Math.min(k, list.length - 1)];
  function choose(h: Habitat) {
    if (placed || fin) return;
    if (h !== a.home) { setMsg(`${theName(a.name).replace(/^./, (c) => c.toUpperCase())} no vive en ${HABITAT_IN[h]}. ¿Hace calor o frío donde vive? ¿Necesita agua?`); sfx("sad"); return; }
    setPlaced(true); setMsg(`¡Sí! ${a.fact}`); sfx("coin");
  }
  function next() {
    if (k + 1 < list.length) { setK(k + 1); setPlaced(false); setMsg(""); sfx("click"); return; }
    if (sent.current) return;
    sent.current = true;
    setFin(true);
    void finishZoo(list.map((x) => x.id as ZooAnimal)).then((r) => { setCoins(r?.coins ?? 0); sfx("success"); onLine(doneLine(r, r?.fresh ? `¡Conocimos ${r.fresh === 1 ? "un animal nuevo" : `${r.fresh} animales nuevos`}! El álbum se va llenando.` : "¡Qué paseo! Ya todos están en su casa.")); });
  }

  return (
    <div className="flex flex-col gap-3">
      {!fin ? (
        <>
          <p className="text-sm" aria-live="polite">Animal {k + 1} de {ZOO_TODAY}. {msg || `¿Dónde vive ${theName(a.name)}?`}</p>
          <div className="flex items-center gap-3 rounded-3xl bg-secondary/60 p-3">
            <motion.span key={a.id} initial={reduce ? false : { opacity: 0, transform: "scale(0.95)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ duration: 0.25, ease: EASE_OUT }} className="block size-20 shrink-0"><AnimalFace id={a.id} color={a.color} /></motion.span>
            <p className="text-lg font-semibold">{a.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Casas del zoológico">
            {HABITAT_IDS.map((h) => (
              <button key={h} type="button" disabled={placed} onClick={() => choose(h)} className={cn("min-h-14 rounded-2xl px-3 text-sm font-semibold text-white active:scale-[0.97] disabled:opacity-60", placed && h === a.home && "ring-4 ring-primary")} style={{ background: HABITATS[h].color, color: h === "frio" ? "#1d3a4a" : undefined }}>{HABITATS[h].name}</button>
            ))}
          </div>
          {placed && <button type="button" onClick={next} className={cn(btn, "self-start bg-primary text-primary-foreground")}>{k + 1 < list.length ? "Siguiente animal" : "Terminar la visita"}</button>}
        </>
      ) : (
        <>
          <p className="text-sm">¡Todos en su casa! Ganaste {coins} monedas.</p>
          <ZooAlbum seen={album} />
        </>
      )}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>{fin ? "Volver" : "Salir"}</button>
    </div>
  );
}

function ZooAlbum({ seen }: { seen: Partial<Record<string, number>> }) {
  const n = ZOO_ANIMALS.filter((a) => (seen[a.id] ?? 0) > 0).length;
  return (
    <section aria-labelledby="album-zoo" className="flex flex-col gap-2">
      <h3 id="album-zoo" className="text-sm font-semibold">Álbum del zoológico <span className="font-normal text-muted-foreground">({n} de {ZOO_ANIMALS.length})</span></h3>
      <ul className="grid grid-cols-4 gap-2">
        {ZOO_ANIMALS.map((a) => {
          const on = (seen[a.id] ?? 0) > 0;
          return (
            <li key={a.id} className={cn("flex flex-col items-center gap-1 rounded-2xl p-1.5 text-center text-[11px] font-semibold", on ? "bg-card" : "bg-secondary/60 text-muted-foreground")}>
              <span className={cn("block size-9", !on && "opacity-25 grayscale")}><AnimalFace id={a.id} color={a.color} /></span>{on ? a.name : "?"}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── Ir al cine ──────────────────────────────────────────────────────

const POPCORN = { chica: "Palomitas chicas", mediana: "Palomitas medianas", grande: "Palomitas grandes" } as const;
const DRINKS = { agua: "Agua pura", jugo: "Jugo de manzana", horchata: "Horchata" } as const;

/** El cine: escoge película, compra el boleto y la comida, busca tu asiento, mira y contesta. Una función al día. */
export function CinemaScene({ day, done, onLine, onClose }: { day: string; done: boolean; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [info] = useState(() => cinemaOf(day));
  const mine = info.row * CINEMA_COLS + info.col;
  const [taken] = useState(() => takenSeats(day, mine));
  const [step, setStep] = useState<"cartelera" | "dulceria" | "asiento" | "pelicula" | "preguntas" | "fin">("cartelera");
  const [movie, setMovie] = useState<MovieId | null>(null);
  const [pop, setPop] = useState<keyof typeof POPCORN | null>(null);
  const [drink, setDrink] = useState<keyof typeof DRINKS | null>(null);
  const [msg, setMsg] = useState("");
  const [scene, setScene] = useState(0);
  const [q, setQ] = useState(0);
  const [right, setRight] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [coins, setCoins] = useState(0);
  const sent = useRef(false);

  if (done && step === "cartelera") return <DoneToday text="Hoy ya fuimos al cine. Todavía tengo palomitas en los bigotes. Mañana hay otra función." onClose={onClose} />;

  const m = MOVIES.find((x) => x.id === movie);
  const seatName = `fila ${CINEMA_ROWS[info.row]}, asiento ${info.col + 1}`;
  function sit(i: number) {
    if (i !== mine) { setMsg(`Ese no es. Tu boleto dice ${seatName}.`); sfx("sad"); return; }
    sfx("coin"); setStep("pelicula"); setScene(0); onLine("¡Shhh! Ya empieza. Apagaron las luces.");
  }
  function answer(i: number) {
    if (!m || answered !== null) return;
    const ok = i === m.quiz[q].ok;
    setAnswered(i); if (ok) setRight((r) => r + 1); sfx(ok ? "coin" : "sad");
  }
  function nextQ() {
    if (!m) return;
    if (q + 1 < m.quiz.length) { setQ(q + 1); setAnswered(null); return; }
    if (sent.current) return;
    sent.current = true;
    setStep("fin");
    const total = right;
    void finishCinema(m.id, total).then((r) => { setCoins(r?.coins ?? 0); sfx("success"); onLine(doneLine(r, total === m.quiz.length ? "¡Me acordé de todo! Fue la mejor película." : "¡Qué buena película! Aunque me distraje con las palomitas.")); });
  }

  return (
    <div className="flex flex-col gap-3">
      {step === "cartelera" && (
        <>
          <p className="text-sm">Cartelera de hoy. El boleto cuesta {TICKET_PRICE} monedas de juguete (las pone Mochito). ¿Cuál vemos?</p>
          <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Películas">
            {info.billboard.map((id) => { const x = MOVIES.find((mm) => mm.id === id)!; return (
              <button key={id} type="button" onClick={() => { setMovie(id); setStep("dulceria"); sfx("coin"); onLine(`¡«${x.name}»! Buena elección. Ahora, la dulcería.`); }} className="flex min-h-20 flex-col justify-end rounded-2xl p-3 text-left text-sm font-bold text-white active:scale-[0.97]" style={{ background: x.color }}>
                <Ticket className="mb-1 size-5" aria-hidden />{x.name}
              </button>
            ); })}
          </div>
        </>
      )}
      {step === "dulceria" && (
        <>
          <p className="text-sm">Tu boleto: <b>{seatName}</b>. Escoge palomitas y bebida.</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Palomitas">
            {(Object.keys(POPCORN) as (keyof typeof POPCORN)[]).map((k) => <button key={k} type="button" role="radio" aria-checked={pop === k} onClick={() => { setPop(k); sfx("click"); }} className={cn(chip, pop === k ? "border-primary bg-primary/10" : "border-border")}>{POPCORN[k]}</button>)}
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Bebida">
            {(Object.keys(DRINKS) as (keyof typeof DRINKS)[]).map((k) => <button key={k} type="button" role="radio" aria-checked={drink === k} onClick={() => { setDrink(k); sfx("click"); }} className={cn(chip, drink === k ? "border-primary bg-primary/10" : "border-border")}>{DRINKS[k]}</button>)}
          </div>
          <button type="button" disabled={!pop || !drink} onClick={() => { setStep("asiento"); onLine(pop === "grande" ? "¡Palomitas grandes! Prometo no comérmelas todas antes de que empiece." : "Ahora busquemos nuestro asiento."); }} className={cn(btn, "self-start bg-primary text-primary-foreground disabled:opacity-50")}>Entrar a la sala</button>
        </>
      )}
      {step === "asiento" && (
        <>
          <p className="text-sm" aria-live="polite">{msg || `Busca tu asiento: ${seatName}. Los grises ya están ocupados.`}</p>
          <div className="mx-auto flex w-full max-w-sm flex-col gap-1.5 rounded-3xl bg-[#2b2238] p-3">
            <span className="mx-auto mb-2 block h-2 w-3/4 rounded-full bg-[#e8e2f4]" aria-hidden />
            {CINEMA_ROWS.map((row, r) => (
              <div key={row} className="grid grid-cols-[1.25rem_repeat(6,minmax(0,1fr))] items-center gap-1.5">
                <span className="text-xs font-bold text-[#e8e2f4]">{row}</span>
                {Array.from({ length: CINEMA_COLS }, (_, c) => { const i = r * CINEMA_COLS + c; const busy = taken.includes(i); return (
                  <button key={c} type="button" disabled={busy} onClick={() => sit(i)} aria-label={`Fila ${row}, asiento ${c + 1}${busy ? ", ocupado" : ""}`} className={cn("flex h-11 items-center justify-center rounded-t-xl rounded-b-md text-xs font-bold active:scale-[0.97]", busy ? "bg-[#5d566a] text-[#8f88a0]" : "bg-[#c0392b] text-white")}>{c + 1}</button>
                ); })}
              </div>
            ))}
          </div>
        </>
      )}
      {step === "pelicula" && m && (
        <>
          <div className="relative flex aspect-video w-full max-w-md items-end overflow-hidden rounded-3xl p-4 text-white" style={{ background: m.color }}>
            <span className="absolute left-4 top-3 text-xs font-semibold opacity-80">{m.name} · Escena {scene + 1} de {m.scenes.length}</span>
            <motion.p key={scene} initial={reduce || scene === 0 ? false : { opacity: 0, transform: "translateY(6px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: 0.3, ease: EASE_OUT }} className="text-base font-semibold [text-shadow:0_1px_2px_rgb(0_0_0/0.35)]">{m.scenes[scene]}</motion.p>
          </div>
          <button type="button" onClick={() => { if (scene + 1 < m.scenes.length) { setScene(scene + 1); sfx("click"); } else { setStep("preguntas"); onLine("Se acabó. ¿Te acuerdas de lo que pasó?"); } }} className={cn(btn, "self-start bg-primary text-primary-foreground")}>{scene + 1 < m.scenes.length ? "Siguiente escena" : "Fin de la película"}</button>
        </>
      )}
      {step === "preguntas" && m && (
        <>
          <p className="text-sm font-semibold">Pregunta {q + 1} de {m.quiz.length}: {m.quiz[q].q}</p>
          <div className="flex flex-col gap-2" role="group" aria-label="Respuestas">
            {m.quiz[q].a.map((a, i) => (
              <button key={i} type="button" disabled={answered !== null} onClick={() => answer(i)} className={cn("min-h-11 rounded-2xl border-2 px-4 text-left text-sm font-semibold active:scale-[0.97]", answered === null ? "border-border bg-card" : i === m.quiz[q].ok ? "border-emerald-600 bg-emerald-600/10" : answered === i ? "border-destructive bg-destructive/10" : "border-border opacity-60")}>{a}</button>
            ))}
          </div>
          {answered !== null && <button type="button" onClick={nextQ} className={cn(btn, "self-start bg-primary text-primary-foreground")}>{q + 1 < m.quiz.length ? "Siguiente pregunta" : "Salir del cine"}</button>}
        </>
      )}
      {step === "fin" && m && <p className="rounded-3xl bg-secondary/60 px-4 py-3 text-sm">Viste «{m.name}» y contestaste bien {right} de {m.quiz.length}. Ganaste {coins} monedas.</p>}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>{step === "fin" ? "Volver" : "Salir"}</button>
    </div>
  );
}

// ── Estación de bomberos ────────────────────────────────────────────

/** Los bomberos: ponte el equipo, apaga los fuegos de las ventanas y baja al gatito con la escalera. Una vez al día. */
export function FireScene({ day, done, onLine, onClose }: { day: string; done: boolean; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [fires] = useState(() => firesOf(day));
  const [cat] = useState(() => catOf(day));
  const [step, setStep] = useState<"equipo" | "camion" | "fuego" | "gatito" | "fin">("equipo");
  const [gear, setGear] = useState<Gear[]>([]);
  const [msg, setMsg] = useState("");
  const [t, setT] = useState(0);
  const [sprays, setSprays] = useState<Record<number, number>>({});
  const [out, setOut] = useState<number[]>([]);
  const [ladder, setLadder] = useState(0);
  const [coins, setCoins] = useState(0);
  const outRef = useRef<number[]>([]);
  const spraysRef = useRef<Record<number, number>>({});
  const big = useRef(false);
  const sent = useRef(false);

  useEffect(() => {
    if (step !== "fuego") return;
    const t0 = Date.now();
    const last = Math.max(...fires.map((f) => f.at));
    const id = setInterval(() => {
      const v = Date.now() - t0;
      setT(v);
      if (fires.some((f) => !outRef.current.includes(f.id) && fireSize(f, v, spraysRef.current[f.id] ?? 0) >= FIRE_MAX)) big.current = true;
      if (v > last && outRef.current.length >= fires.length) { clearInterval(id); setStep("gatito"); onLine("¡Todo apagado! Oigan… ¿qué es ese «miau» en el árbol?"); }
    }, 100);
    return () => clearInterval(id);
  }, [step, fires, onLine]);

  if (done && step === "equipo") return <DoneToday text="Hoy ya fuimos con los bomberos. El camión está lavado y listo para mañana." onClose={onClose} />;

  function suitUp() {
    const ok = GEAR_OK.every((g) => gear.includes(g)) && gear.length === GEAR_OK.length;
    if (!ok) { setMsg(gear.some((g) => !GEAR_OK.includes(g)) ? "Eso no sirve para el fuego. Quítalo." : "Falta algo para protegerte."); sfx("sad"); return; }
    setStep("camion"); setMsg(""); sfx("success"); onLine("¡Listos! Casco, chaqueta y botas. ¡Al camión!");
  }
  function spray(id: number) {
    const f = fires.find((x) => x.id === id)!;
    if (outRef.current.includes(id)) return;
    const s = (spraysRef.current[id] ?? 0) + 1;
    spraysRef.current = { ...spraysRef.current, [id]: s };
    setSprays(spraysRef.current); sfx("click");
    if (fireSize(f, t, s) <= 0) { outRef.current = [...outRef.current, id]; setOut(outRef.current); sfx("coin"); }
  }
  function rescue() {
    if (ladder !== cat || sent.current) return;
    sent.current = true;
    setStep("fin");
    const perfect = !big.current;
    void finishFire(perfect, true).then((r) => { setCoins(r?.coins ?? 0); sfx("success"); onLine(doneLine(r, "¡El gatito está a salvo! Me dio un lengüetazo… bueno, un rasguñito de cariño.")); });
  }
  const active = fires.filter((f) => t >= f.at && !out.includes(f.id));

  return (
    <div className="flex flex-col gap-3">
      {step === "equipo" && (
        <>
          <p className="text-sm" aria-live="polite">{msg || "Ponte el equipo de bombero. Escoge solo lo que protege del fuego."}</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Equipo">
            {(Object.keys(GEAR) as Gear[]).map((g) => { const on = gear.includes(g); return <button key={g} type="button" aria-pressed={on} onClick={() => { setGear((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g])); sfx("click"); }} className={cn(chip, on ? "border-primary bg-primary/10" : "border-border")}>{GEAR[g]}</button>; })}
          </div>
          <button type="button" onClick={suitUp} className={cn(btn, "self-start bg-primary text-primary-foreground")}>Estoy listo</button>
        </>
      )}
      {step === "camion" && (
        <>
          <p className="text-sm">¡Hay fuego en un edificio! Prende la sirena y vámonos.</p>
          <button type="button" onClick={() => { setStep("fuego"); sfx("success"); onLine("¡Iuuu iuuu! Toca cada ventana con fuego hasta apagarla."); }} className={cn(btn, "self-start bg-[#c0392b] text-white")}><Siren className="mr-1.5 inline size-4" aria-hidden />Prender la sirena</button>
        </>
      )}
      {step === "fuego" && (
        <>
          <p className="text-sm" aria-live="polite">Toca las ventanas con fuego para echarles agua · Apagados: {out.length} de {fires.length}</p>
          <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-2 rounded-t-3xl bg-[#b9854c] p-3 dark:bg-[#6b4a2a]">
            {Array.from({ length: FIRE_CELLS }, (_, cell) => {
              const f = active.find((x) => x.cell === cell);
              const size = f ? fireSize(f, t, sprays[f.id] ?? 0) : 0;
              return (
                <button key={cell} type="button" disabled={!f} onClick={() => f && spray(f.id)} aria-label={f ? `Ventana con fuego, tamaño ${size} de ${FIRE_MAX}` : "Ventana"} className="flex aspect-square items-center justify-center rounded-xl bg-[#cfe6f5] active:scale-[0.97] disabled:active:scale-100">
                  {f && <motion.span initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1, transform: `scale(${0.5 + (size / FIRE_MAX) * 0.5})` }} transition={{ duration: 0.2, ease: EASE_OUT }}><Flame className="size-10 text-[#e8590c]" fill="#f6c744" aria-hidden /></motion.span>}
                  {!f && out.some((id) => fires.find((x) => x.id === id)?.cell === cell) && <Droplets className="size-5 text-[#3f8fc4]" aria-hidden />}
                </button>
              );
            })}
          </div>
        </>
      )}
      {(step === "gatito" || step === "fin") && (
        <>
          <p className="text-sm" aria-live="polite">{step === "gatito" ? `El gatito está en la rama ${cat}. Sube la escalera hasta su rama (${ladder} de ${cat}).` : `¡Rescate completo! Ganaste ${coins} monedas.`}</p>
          <div className="relative mx-auto h-56 w-full max-w-xs overflow-hidden rounded-3xl bg-[#cfe9f7] dark:bg-[#2b3a4a]">
            <span className="absolute bottom-0 left-[58%] block h-full w-5 bg-[#8a5a2e]" aria-hidden />
            {Array.from({ length: 6 }, (_, i) => <span key={i} className="absolute left-[62%] block h-2 w-16 rounded-full bg-[#8a5a2e]" style={{ bottom: `${(i + 1) * 14}%` }} aria-hidden />)}
            <span className="absolute left-[66%] block" style={{ bottom: `calc(${cat * 14}% + 6px)` }} aria-hidden><Cat className={cn("size-7", step === "fin" ? "opacity-0" : "text-[#e3893a]")} /></span>
            <motion.span className="absolute bottom-0 left-[30%] block w-8 origin-bottom" style={{ height: "100%" }} initial={false} animate={{ transform: `scaleY(${ladder / 7})` }} transition={{ duration: 0.25, ease: EASE_OUT }} aria-hidden>
              <span className="block h-full w-full" style={{ background: "repeating-linear-gradient(to top, transparent 0 12px, #c0392b 12px 16px), linear-gradient(to right, #c0392b 0 4px, transparent 4px calc(100% - 4px), #c0392b calc(100% - 4px))" }} />
            </motion.span>
          </div>
          {step === "gatito" && (
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-label="Bajar un tramo" disabled={ladder <= 0} onClick={() => { setLadder(ladder - 1); sfx("click"); }} className={cn(chip, "border-border disabled:opacity-50")}><ArrowDown className="size-4" aria-hidden /></button>
              <button type="button" aria-label="Subir un tramo" disabled={ladder >= 6} onClick={() => { setLadder(ladder + 1); sfx("click"); }} className={cn(chip, "border-border disabled:opacity-50")}><ArrowUp className="size-4" aria-hidden /></button>
              <button type="button" disabled={ladder !== cat} onClick={rescue} className={cn(btn, "bg-primary text-primary-foreground disabled:opacity-50")}><Cat className="mr-1.5 inline size-4" aria-hidden />Bajar al gatito</button>
            </div>
          )}
        </>
      )}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>{step === "fin" ? "Volver" : "Salir"}</button>
    </div>
  );
}

// ── Paseo en globo ──────────────────────────────────────────────────

const BURNS = 6;
const levelTop = (lv: number) => 74 - lv * 19;

/** El globo: ínflalo, sube y baja para ver bien los lugares y tómales foto a los tres de la lista. Un paseo al día. */
export function BalloonScene({ day, balloon, onLine, onClose }: { day: string; balloon?: Balloon; onLine: (s: string) => void; onClose: () => void }) {
  const reduce = useReducedMotion();
  const done = balloon?.last === day;
  const [flight] = useState(() => flightOf(day));
  const [step, setStep] = useState<"inflar" | "vuelo" | "fin">("inflar");
  const [burns, setBurns] = useState(0);
  const [t, setT] = useState(0);
  const [level, setLevel] = useState(1);
  const [photos, setPhotos] = useState<PlaceUp[]>([]);
  const [coins, setCoins] = useState(0);
  const photosRef = useRef<PlaceUp[]>([]);
  const levelRef = useRef(1);
  const bumped = useRef<number[]>([]);
  const sent = useRef(false);

  useEffect(() => {
    if (step !== "vuelo") return;
    const t0 = Date.now();
    const id = setInterval(() => {
      const v = Date.now() - t0;
      setT(v);
      const x = v / FLIGHT_MS;
      flight.birds.forEach((b, k) => {
        if (!bumped.current.includes(k) && Math.abs(b.x - x) < 0.025 && b.level === levelRef.current) { bumped.current = [...bumped.current, k]; levelRef.current = Math.max(0, levelRef.current - 1); setLevel(levelRef.current); sfx("sad"); onLine("¡Pájaros! Nos movieron para abajo. Sube o baja para esquivarlos."); }
      });
      if (v >= FLIGHT_MS) {
        clearInterval(id);
        setStep("fin");
        if (sent.current) return;
        sent.current = true;
        const ph = photosRef.current;
        void finishBalloon(ph).then((r) => { setCoins(r?.coins ?? 0); sfx("success"); onLine(doneLine(r, ph.length === flight.goals.length ? "¡Aterrizamos con las tres fotos! El pueblo se ve precioso desde arriba." : `Aterrizamos con ${ph.length} ${ph.length === 1 ? "foto" : "fotos"}. ¡Qué vista!`)); });
      }
    }, 60);
    return () => clearInterval(id);
  }, [step, flight, onLine]);

  if (done && step === "inflar") return <DoneToday text="Hoy ya paseamos en globo. Se acabó el aire caliente. Mañana volamos otra vez." onClose={onClose}><PlaceAlbum photos={balloon?.photos} /></DoneToday>;

  const x = Math.min(1, t / FLIGHT_MS);
  const under = underBalloon(flight.map, x);
  const want = under && flight.goals.includes(under.id) && !photos.includes(under.id) ? under : null;
  const right = want && PLACES_UP[want.id].level === level;
  function move(d: number) { const nl = Math.max(0, Math.min(LEVELS_UP - 1, level + d)); levelRef.current = nl; setLevel(nl); sfx("click"); }
  function snap() {
    if (!want || !right) return;
    photosRef.current = [...photosRef.current, want.id];
    setPhotos(photosRef.current); sfx("coin");
    onLine(`¡Clic! Ya tenemos la foto de ${PLACES_UP[want.id].name.toLowerCase()}.`);
  }
  const hint = step !== "vuelo" ? "" : want ? (right ? `¡Ahí está ${PLACES_UP[want.id].name.toLowerCase()}! Toma la foto.` : PLACES_UP[want.id].level > level ? `Ahí está ${PLACES_UP[want.id].name.toLowerCase()}, pero vamos muy bajito: sube un poco.` : `Abajo está ${PLACES_UP[want.id].name.toLowerCase()}: baja para verlo bien.`) : "Sigue volando. Busca los lugares con estrellita.";

  return (
    <div className="flex flex-col gap-3">
      {step === "inflar" ? (
        <>
          <p className="text-sm">Fotos de hoy: {flight.goals.map((id) => PLACES_UP[id].name.toLowerCase()).join(", ")}. Primero, calienta el aire para inflar el globo ({burns} de {BURNS}).</p>
          <div className="mx-auto flex h-40 w-full max-w-xs items-end justify-center rounded-3xl bg-[#cfe9f7] dark:bg-[#2b3a4a]">
            <motion.span className="mb-2 block size-28 origin-bottom rounded-full" style={{ background: "repeating-conic-gradient(#d6453d 0 30deg, #f6c744 30deg 60deg)" }} animate={{ transform: `scale(${0.35 + (burns / BURNS) * 0.65})` }} transition={{ duration: reduce ? 0 : 0.3, ease: EASE_OUT }} aria-hidden />
          </div>
          <button type="button" onClick={() => { const b = burns + 1; setBurns(b); sfx("click"); if (b >= BURNS) { setStep("vuelo"); sfx("success"); onLine("¡Despegamos! Sube y baja para ver bien cada lugar."); } }} className={cn(btn, "self-start bg-primary text-primary-foreground")}><Flame className="mr-1.5 inline size-4" aria-hidden />Calentar el aire</button>
        </>
      ) : (
        <>
          <p className="text-sm" aria-live="polite">{step === "vuelo" ? `Fotos: ${photos.length} de ${flight.goals.length} · ${hint}` : `¡Aterrizamos! Tomaste ${photos.length} de ${flight.goals.length} fotos. Ganaste ${coins} monedas.`}</p>
          <div className="relative mx-auto aspect-[2/1] w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-[#9fd3f2] to-[#e6f4fb] dark:from-[#2b3a5a] dark:to-[#3b4a62]">
            <span className="absolute inset-x-0 bottom-0 block h-[8%] bg-[#7fbf6a]" aria-hidden />
            {flight.map.map((p) => { const P = PLACES_UP[p.id]; const goal = flight.goals.includes(p.id); return (
              <span key={p.id} className="absolute bottom-[8%] flex w-[9%] -translate-x-1/2 flex-col items-center justify-end" style={{ left: `${p.x * 100}%`, height: `${P.level * 19 - 2}%` }} aria-hidden>
                {goal && <span className={cn("mb-0.5 text-[10px] leading-none", photos.includes(p.id) ? "text-emerald-700" : "text-[#d9a21b]")}>{photos.includes(p.id) ? "✓" : "★"}</span>}
                <span className="block w-full flex-1 rounded-t-md border border-black/15" style={{ background: P.color }} />
              </span>
            ); })}
            {flight.birds.map((b, k) => <span key={k} className="absolute block -translate-x-1/2 -translate-y-1/2" style={{ left: `${b.x * 100}%`, top: `${levelTop(b.level)}%` }} aria-hidden><Bird className="size-5 text-[#2b2622] dark:text-[#e8ecff]" /></span>)}
            <motion.span className="pointer-events-none absolute inset-0 block" initial={false} animate={{ transform: `translate(${x * 100}%, ${levelTop(level)}%)` }} transition={{ duration: reduce ? 0 : 0.3, ease: EASE_OUT }} aria-hidden>
              <span className="absolute left-0 top-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                <span className="block size-8 rounded-full" style={{ background: "repeating-conic-gradient(#d6453d 0 30deg, #f6c744 30deg 60deg)" }} />
                <span className="block h-2 w-0.5 bg-[#5b3a1f]" />
                <span className="block h-2.5 w-3.5 rounded-sm bg-[#8a5a2e]" />
              </span>
            </motion.span>
          </div>
          {step === "vuelo" && (
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-label="Subir (soltar arena)" disabled={level >= LEVELS_UP - 1} onClick={() => move(1)} className={cn(chip, "flex items-center gap-1 border-border disabled:opacity-50")}><ArrowUp className="size-4" aria-hidden />Subir</button>
              <button type="button" aria-label="Bajar (soltar aire)" disabled={level <= 0} onClick={() => move(-1)} className={cn(chip, "flex items-center gap-1 border-border disabled:opacity-50")}><ArrowDown className="size-4" aria-hidden />Bajar</button>
              <button type="button" disabled={!right} onClick={snap} className={cn(btn, "bg-primary text-primary-foreground disabled:opacity-50")}><Camera className="mr-1.5 inline size-4" aria-hidden />Tomar foto</button>
            </div>
          )}
          {step === "fin" && <PlaceAlbum photos={{ ...balloon?.photos, ...Object.fromEntries(photos.map((id) => [id, 1])) }} />}
        </>
      )}
      <button type="button" onClick={onClose} className={cn(btn, "self-start bg-secondary")}>{step === "fin" ? "Volver" : "Salir"}</button>
    </div>
  );
}

function PlaceAlbum({ photos }: { photos?: Partial<Record<PlaceUp, number>> }) {
  const ids = Object.keys(PLACES_UP) as PlaceUp[];
  const n = ids.filter((id) => (photos?.[id] ?? 0) > 0).length;
  return (
    <section aria-labelledby="album-globo" className="flex flex-col gap-2">
      <h3 id="album-globo" className="text-sm font-semibold">Fotos desde el globo <span className="font-normal text-muted-foreground">({n} de {ids.length})</span></h3>
      <ul className="grid grid-cols-4 gap-2">
        {ids.map((id) => { const on = (photos?.[id] ?? 0) > 0; return (
          <li key={id} className={cn("flex flex-col items-center gap-1 rounded-2xl p-1.5 text-center text-[11px] font-semibold", on ? "bg-card" : "bg-secondary/60 text-muted-foreground")}>
            <span className="block h-6 w-8 rounded-md border border-black/15" style={{ background: on ? PLACES_UP[id].color : "transparent" }} aria-hidden />{on ? PLACES_UP[id].name : "?"}
          </li>
        ); })}
      </ul>
    </section>
  );
}
