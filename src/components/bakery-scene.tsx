"use client";

import Image from "next/image";
import { Mochito } from "@/components/mochito";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DressedImage } from "@/components/dressed-image";
import { Cake, Check, Coins, Flower2, Utensils, Heart, Sprout, Star, TreePalm, type LucideIcon } from "lucide-react";
import { MENU_ICONS } from "@/lib/bakery";
import { eventIcon } from "@/lib/event-icons";
import { PROP_ICONS } from "@/lib/prop-icons";
import { propById } from "@/lib/game/appeal";
import { STICKER_ITEMS } from "@/lib/game/shop";
import type { PlacedSticker } from "@/lib/game/stickers";
import { getCharacter } from "@/lib/characters";
import { equipped } from "@/lib/game/decor";
import type { MenuItem } from "@/lib/db/db";
import { cn } from "@/lib/utils";

export const PLANT_ICON: Record<string, LucideIcon> = { "decor:p-maceta": Sprout, "decor:p-flor": Flower2, "decor:p-palma": TreePalm };
export const ART_ICON: Record<string, LucideIcon> = { "decor:a-corazon": Heart, "decor:a-pastel": Cake, "decor:a-estrella": Star };

const cq = (n: number) => `${n}cqw`;
const sq = (n: number) => ({ width: cq(n), height: cq(n) });

function Lights({ kind, color }: { kind: string; color: string }) {
  if (kind === "decor:l-focos") {
    return (
      <div className="absolute inset-x-0 top-0 h-[10%]" aria-hidden>
        <div className="absolute inset-x-[2%] top-[18%] border-t-2" style={{ borderColor: color }} />
        <div className="absolute inset-x-[3%] top-[18%] flex justify-between">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="rounded-full" style={{ ...sq(2.2), background: color, boxShadow: `0 0 ${cq(2)} ${color}`, marginTop: cq(i % 2 ? 0.6 : 0.2) }} />
          ))}
        </div>
      </div>
    );
  }
  if (kind === "decor:l-estrellas") {
    return (
      <div className="absolute inset-x-[3%] top-[3%] flex justify-between" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <Star key={i} className="fill-current" style={{ ...sq(i % 2 ? 2.6 : 3.4), color, marginTop: cq(i % 3) }} />
        ))}
      </div>
    );
  }
  if (kind === "decor:l-farolitos") {
    return (
      <div className="absolute inset-x-[5%] top-0 flex justify-between" aria-hidden>
        {[3, 6, 4, 7, 4, 6, 3].map((len, i) => (
          <div key={i} className="flex flex-col items-center">
            <span style={{ height: cq(len), width: 1, background: color }} />
            <span className="rounded-full" style={{ ...sq(3.4), background: color, boxShadow: `0 0 ${cq(2.2)} ${color}` }} />
          </div>
        ))}
      </div>
    );
  }
  return null;
}

/** Una pegatina troquelada (borde blanco, un poco girada), como las de una vitrina de verdad. */
export function StickerBadge({ id, r = 0, size = 7, selected, className, style }: { id: string; r?: number; size?: number; selected?: boolean; className?: string; style?: React.CSSProperties }) {
  const item = STICKER_ITEMS.find((s) => s.id === id);
  const Icon = item?.icon;
  if (!Icon) return null;
  return (
    <span
      className={cn("flex items-center justify-center rounded-full bg-white text-primary shadow-[0_0.4cqw_0.8cqw_rgba(0,0,0,0.18)]", selected && "ring-[0.6cqw] ring-primary", className)}
      style={{ ...sq(size), border: `${cq(size * 0.09)} solid white`, outline: `${cq(size * 0.03)} solid color-mix(in oklab, var(--primary) 35%, transparent)`, transform: `rotate(${r}deg)`, ...style }}
    >
      <Icon style={sq(size * 0.58)} aria-hidden />
    </span>
  );
}

/** Dibujo de la pastelería con lo que tienes puesto, tu personaje detrás del mostrador y tu menú en la vitrina. */
export function BakeryScene({
  name, decor, menu, character, staff = [], staffOutfits = {}, outfit, event, visitors = [], pops = [], daylight, todayProps = {}, stickers = [], className,
}: {
  name: string;
  decor: Record<string, string>;
  menu: MenuItem[];
  character: string;
  staff?: string[]; // personajes que trabajan hoy
  staffOutfits?: Record<string, Record<string, string>>; // su ropa, por personaje
  outfit?: Record<string, string>; // ropa de tu personaje
  event?: { name: string; icon: string }; // evento de temporada activo
  visitors?: SceneVisitor[]; // clientes que están en el local
  pops?: ScenePop[]; // montos que saltan al cobrar
  daylight?: number; // 0 (abre) a 1 (cierra): cambia la luz del día
  todayProps?: Record<string, string>; // adornos de hoy: lugar → adorno
  stickers?: PlacedSticker[]; // pegatinas pegadas en el local
  className?: string;
}) {
  const wall = equipped(decor, "wall");
  const floor = equipped(decor, "floor");
  const lights = equipped(decor, "lights");
  const counter = equipped(decor, "counter");
  const plant = equipped(decor, "plant");
  const art = equipped(decor, "art");
  const tables = equipped(decor, "tables");
  const ch = getCharacter(character);
  const shown = menu.filter((m) => m.active).slice(0, 6);
  const PlantIcon = PLANT_ICON[plant.id];
  const ArtIcon = ART_ICON[art.id];
  const EventIcon = event ? eventIcon(event.icon) : null;
  const tableCount = tables.id === "decor:t-dos" ? 2 : tables.id === "decor:t-una" ? 1 : 0;

  return (
    <div
      role="img"
      aria-label={`Tu pastelería ${name}, con ${shown.length} postres en la vitrina`}
      className={cn("relative aspect-[4/3] w-full select-none overflow-hidden rounded-[2rem] border sm:aspect-[16/10]", className)}
      style={{ background: wall.style, containerType: "inline-size" }}
    >
      <div className="absolute inset-x-0 bottom-0 h-[26%] border-t-4" style={{ background: floor.style, borderColor: floor.accent }} aria-hidden />
      <Lights kind={lights.id} color={lights.accent ?? "#ffd166"} />

      {/* Evento de temporada */}
      {event && EventIcon && (
        <>
          <p className="absolute left-[3cqw] top-[3cqw] z-20 flex items-center gap-[0.8cqw] rounded-full bg-primary px-[2cqw] py-[0.8cqw] font-semibold text-primary-foreground shadow" style={{ fontSize: "clamp(10px, 2cqw, 16px)" }}>
            <EventIcon style={sq(2.6)} aria-hidden /> {event.name}
          </p>
          {[[10, 52, 4], [88, 40, 5], [75, 18, 3.5], [20, 20, 3.5]].map(([x, y, n], i) => (
            <EventIcon key={i} className="absolute text-primary/35" style={{ left: `${x}%`, top: `${y}%`, ...sq(n) }} aria-hidden />
          ))}
        </>
      )}

      {/* Letrero */}
      <div className="absolute left-1/2 top-[9%] -translate-x-1/2" aria-hidden>
        <div className="absolute -top-[3cqw] left-[18%] w-px bg-primary/60" style={{ height: cq(3) }} />
        <div className="absolute -top-[3cqw] right-[18%] w-px bg-primary/60" style={{ height: cq(3) }} />
        <p className="max-w-[52cqw] truncate rounded-[1.6cqw] border-primary bg-card text-center font-heading text-primary" style={{ borderWidth: cq(0.7), padding: `${cq(0.6)} ${cq(3)}`, fontSize: "clamp(13px, 3.6cqw, 30px)" }}>
          {name}
        </p>
      </div>

      {/* Cuadros */}
      {ArtIcon && (
        <>
          <div className="absolute flex items-center justify-center rounded-[1cqw] bg-white" style={{ left: "8%", top: "30%", ...sq(11), border: `${cq(0.9)} solid ${art.accent}` }} aria-hidden>
            <ArtIcon style={{ ...sq(6), color: art.accent }} className="fill-current/20" />
          </div>
          <div className="absolute flex items-center justify-center rounded-[1cqw] bg-white" style={{ right: "26%", top: "34%", ...sq(8), border: `${cq(0.8)} solid ${art.accent}` }} aria-hidden>
            <ArtIcon style={{ ...sq(4.4), color: art.accent }} />
          </div>
        </>
      )}

      {/* Horno */}
      <div className="absolute rounded-[1.4cqw] border-[#cdbba7] bg-[#f1e6da]" style={{ left: "5%", bottom: "24%", width: "17%", height: "30%", borderWidth: cq(0.8) }} aria-hidden>
        <div className="flex justify-center gap-[12%] pt-[10%]">
          {[0, 1, 2].map((i) => <span key={i} className="rounded-full bg-[#b9a48f]" style={sq(1.5)} />)}
        </div>
        <div className="mx-[12%] mt-[10%] h-[48%] overflow-hidden rounded-[1cqw] bg-[#5b4a3f]">
          <div className="mt-[45%] h-full bg-amber-300/60" />
        </div>
      </div>

      {/* Planta */}
      {PlantIcon && (
        <div className="absolute flex flex-col items-center" style={{ right: "5%", bottom: "23%" }} aria-hidden>
          <PlantIcon style={{ ...sq(12), color: plant.accent }} />
          <span className="rounded-b-[1.2cqw] bg-[#d98a6c]" style={{ width: cq(7), height: cq(5) }} />
        </div>
      )}

      {/* Mesas */}
      {tables.id !== "decor:t-none" &&
        (tables.id === "decor:t-dos" ? [7, 83] : [83]).map((x) => (
          <div key={x} className="absolute flex flex-col items-center" style={{ left: `${x}%`, bottom: "3%" }} aria-hidden>
            <span className="rounded-full" style={{ width: cq(10), height: cq(2.6), background: tables.accent, border: `${cq(0.4)} solid #c9a578` }} />
            <span style={{ width: cq(1.2), height: cq(4), background: "#c9a578" }} />
          </div>
        ))}

      {/* Empleados que trabajan hoy */}
      {staff.slice(0, 2).map((id, i) => {
        const e = getCharacter(id);
        return (
          <div key={id} className="absolute -translate-x-1/2" style={{ left: i === 0 ? "31%" : "69%", bottom: "30%", height: "38%" }} aria-hidden>
            <DressedImage char={id} outfit={staffOutfits[id]} alt="" className="h-full" />
          </div>
        );
      })}

      {/* Personaje detrás del mostrador */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "30%", height: "48%" }}>
        <DressedImage char={character} outfit={outfit} alt="" className="h-full" />
      </div>

      {/* Mochito, en el piso junto al mostrador */}
      <Mochito interactive={false} className="absolute z-20" style={{ left: "16%", bottom: "2%", height: "22%" }} />

      {/* Mostrador con vitrina */}
      <div className="absolute z-10 left-[23%] w-[54%]" style={{ bottom: "6%", height: "35%" }}>
        <div className="flex h-[58%] items-end justify-evenly rounded-t-[2.4cqw] bg-white/55 px-[2%] pb-[1.5%]" style={{ border: `${cq(0.7)} solid ${counter.accent}`, borderBottom: 0 }}>
          {shown.length === 0 ? (
            <p className="self-center text-center text-muted-foreground" style={{ fontSize: "clamp(9px, 1.9cqw, 15px)" }}>
              Cocina una receta para llenar la vitrina
            </p>
          ) : (
            shown.map((m) => {
              const Icon = MENU_ICONS[m.icon] ?? Cake;
              return (
                <span key={m.id} className="flex flex-col items-center">
                  <Icon className="text-primary" style={sq(6.5)} aria-hidden />
                  <span className="rounded-full bg-card px-[0.8cqw] font-semibold" style={{ fontSize: "clamp(8px, 1.5cqw, 13px)" }}>
                    {m.price % 1 ? m.price.toFixed(2) : m.price}
                  </span>
                </span>
              );
            })
          )}
        </div>
        <div className="h-[42%] rounded-b-[1.6cqw]" style={{ background: counter.style, border: `${cq(0.7)} solid ${counter.accent}`, borderTopWidth: cq(1) }} />
      </div>

      {/* Adornos de hoy */}
      {Object.entries(todayProps).map(([spot, id]) => {
        const prop = propById(id);
        if (!prop || prop.spot !== spot) return null;
        const Icon = PROP_ICONS[prop.icon];
        const pos: Record<string, React.CSSProperties> = {
          colgante: { left: "17%", top: "13%" },
          mostrador: { left: "60%", bottom: "41%" },
          entrada: { left: "89%", top: "36%" },
          mesas: { left: tableCount === 1 ? "84%" : "9.5%", bottom: "10%" },
        };
        return Icon ? <Icon key={spot} className="absolute z-10 text-primary drop-shadow" style={{ ...pos[spot], ...sq(5) }} aria-label={prop.name} /> : null;
      })}

      {/* Pegatinas */}
      {stickers.map((s, i) => (
        <StickerBadge key={`${s.id}-${i}`} id={s.id} r={s.r} className="absolute z-10" style={{ left: `calc(${s.x}% - 3.5cqw)`, top: `calc(${s.y}% - 3.5cqw)` }} />
      ))}

      {/* Clientes y avisos */}
      <AnimatePresence>
        {visitors.map((v) => <VisitorView key={v.id} v={v} tables={tableCount} />)}
      </AnimatePresence>
      <AnimatePresence>
        {pops.map((p) => <PopView key={p.id} p={p} />)}
      </AnimatePresence>

      {/* Luz del día */}
      {daylight !== undefined && <div className="pointer-events-none absolute inset-0 z-30" style={{ background: tint(daylight) }} aria-hidden />}
    </div>
  );
}

// ---------- Clientes en la escena ----------

export interface SceneVisitor {
  id: number;
  char: string;
  slot: number; // lugar frente al mostrador (0 a 4)
  table?: number; // si está comiendo, en qué mesa
  bubble: { icon: string; done: boolean }[];
  paying: boolean;
  mood: "ok" | "warn" | "bad";
  vip?: boolean;
}

export interface ScenePop {
  id: number;
  slot: number;
  text: string;
}

const SLOT_X = [27, 50, 73, 38, 62];
const MOOD_BORDER = { ok: "border-primary", warn: "border-amber-500", bad: "border-destructive" } as const;

/** Tinte según la hora del turno: cálido al abrir, claro al mediodía, anaranjado al cerrar. */
function tint(p: number) {
  if (p < 0.3) return `rgba(255, 190, 110, ${0.22 * (1 - p / 0.3)})`;
  if (p > 0.65) return `rgba(255, 130, 70, ${0.3 * ((p - 0.65) / 0.35)})`;
  return "transparent";
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function VisitorView({ v, tables }: { v: SceneVisitor; tables: number }) {
  const reduce = useReducedMotion();
  const ch = getCharacter(v.char);
  const seated = v.table !== undefined;
  const x = seated ? (tables === 1 ? 89 : [14, 88][v.table! % 2]) : SLOT_X[v.slot % SLOT_X.length];
  return (
    <motion.div
      className="absolute z-20"
      style={{ left: `calc(${x}% - 5cqw)`, width: seated ? "10cqw" : "12cqw", bottom: seated ? "6%" : "2%", height: seated ? "22%" : "27%" }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateX(-34cqw)" }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, transform: "translateX(0cqw)" }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateX(26cqw)" }}
      transition={{ duration: 0.55, ease: EASE_OUT }}
    >
      <div className="relative flex size-full justify-center">
        <div
          className={cn("absolute bottom-full mb-[0.6cqw] flex items-center gap-[0.6cqw] whitespace-nowrap rounded-full border-2 bg-card px-[1.2cqw] py-[0.5cqw]", MOOD_BORDER[v.mood], v.vip && "ring-2 ring-amber-400")}
          aria-hidden
        >
          {seated ? (
            <Utensils className="text-primary" style={sq(3)} />
          ) : v.paying ? (
            <Coins className="text-primary" style={sq(3)} />
          ) : (
            v.bubble.map((b, i) => {
              const Icon = b.done ? Check : (MENU_ICONS[b.icon] ?? Cake);
              return <Icon key={i} className={b.done ? "text-primary" : "text-foreground/80"} style={sq(3)} />;
            })
          )}
        </div>
        <motion.div
          className="h-full"
          animate={reduce || v.paying ? undefined : { transform: ["translateY(0cqw)", "translateY(-0.8cqw)", "translateY(0cqw)"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: [0.45, 0, 0.55, 1], delay: (v.id % 5) * 0.2 }}
        >
          <Image src={ch.src} alt="" width={ch.w} height={ch.h} className="h-full w-auto object-contain drop-shadow-sm" draggable={false} />
        </motion.div>
      </div>
    </motion.div>
  );
}

function PopView({ p }: { p: ScenePop }) {
  const reduce = useReducedMotion();
  const x = SLOT_X[p.slot % SLOT_X.length];
  return (
    <motion.p
      className="absolute z-30 rounded-full bg-primary px-[1.4cqw] py-[0.4cqw] font-heading text-primary-foreground shadow"
      style={{ left: `calc(${x}% - 5cqw)`, bottom: "38%", fontSize: "clamp(11px, 2.4cqw, 20px)" }}
      initial={{ opacity: 1, transform: "translateY(0cqw) scale(0.95)" }}
      animate={{ opacity: 0, transform: reduce ? "translateY(0cqw) scale(1)" : "translateY(-9cqw) scale(1.05)" }}
      transition={{ duration: 1.1, ease: EASE_OUT }}
      aria-hidden
    >
      {p.text}
    </motion.p>
  );
}
