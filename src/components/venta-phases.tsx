"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Cake, Coins, DoorOpen, Flame, Hammer, Lock, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BakeryScene } from "@/components/bakery-scene";
import { CakeGame } from "@/components/cake-game";
import { OvenGame } from "@/components/oven-game";
import { Stars } from "@/components/stars";
import { MENU_ICONS, updateMenuItem } from "@/lib/bakery";
import { bakeBatch } from "@/lib/bakery-sales";
import { describeMods } from "@/lib/bakery-events";
import { decorateSpecial, setProp } from "@/lib/bakery-venta";
import { getCharacter } from "@/lib/characters";
import type { MenuItem, SpecialOrder } from "@/lib/db/db";
import { eventIcon } from "@/lib/event-icons";
import { appealLabel, PROPS, SPOTS } from "@/lib/game/appeal";
import { describeRequest } from "@/lib/game/cake";
import { activeEvents } from "@/lib/game/events";
import { BASE_SHIFTS, MAX_BONUS_SHIFTS, SHIFT_MS } from "@/lib/game/sales";
import { batchSpec, effectiveLevel, roleLabel, wageOf } from "@/lib/game/team";
import { PROP_ICONS } from "@/lib/prop-icons";
import type { VentaData } from "@/lib/venta-data";
import { cn } from "@/lib/utils";

type Fmt = (n: number) => string;
const MAX_SHOWN = 6;

// ---------------------------------------------------------------------------------------------
// 1. PREPARAR
// ---------------------------------------------------------------------------------------------

function BoardRow({ m, d, fmt, onBake, say }: { m: MenuItem; d: VentaData; fmt: Fmt; onBake: () => void; say: (t: string) => void }) {
  const Icon = MENU_ICONS[m.icon] ?? Cake;
  const n = d.stock[m.id] ?? 0;
  const q = d.quality[m.id] ?? 0.7;
  const spec = m.kind === "custom" ? batchSpec(m.price, d.working, d.ups, Date.now()) : null;

  function toggle() {
    if (!m.active && d.active.length >= MAX_SHOWN) return say(`Caben ${MAX_SHOWN} postres en la vitrina. Quita uno primero.`);
    void updateMenuItem(m, { active: !m.active });
  }

  return (
    <li className={cn("flex flex-col gap-3 rounded-3xl border p-4", m.active ? "bg-card" : "bg-muted/50")}>
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><Icon className="size-6" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{m.name}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {n} {n === 1 ? "porción" : "porciones"} · calidad <Stars value={q * 5} className="[&_span]:size-3.5 [&_svg]:size-3.5" />
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={m.active}
          aria-label={`${m.name} en la vitrina`}
          onClick={toggle}
          className={cn("flex h-11 w-16 shrink-0 items-center rounded-full border-2 p-1", m.active ? "justify-end border-primary bg-primary" : "justify-start border-border bg-card")}
        >
          <span className={cn("size-7 rounded-full", m.active ? "bg-primary-foreground" : "bg-muted-foreground/40")} />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-full bg-secondary p-1" role="group" aria-label={`Precio de ${m.name}`}>
          <button type="button" aria-label="Bajar precio" disabled={m.price <= 1} onClick={() => void updateMenuItem(m, { price: Math.max(1, m.price - 1) })} className="flex size-10 items-center justify-center rounded-full hover:bg-card disabled:opacity-40"><Minus className="size-4" aria-hidden /></button>
          <span className="min-w-20 text-center text-sm font-semibold tabular-nums" aria-live="polite">{fmt(m.price)}</span>
          <button type="button" aria-label="Subir precio" onClick={() => void updateMenuItem(m, { price: m.price + 1 })} className="flex size-10 items-center justify-center rounded-full hover:bg-card"><Plus className="size-4" aria-hidden /></button>
        </div>
        {n === 0 && m.kind === "recipe" && m.recipe_id && (
          <Button asChild variant="outline" className="h-11 rounded-2xl"><Link href={`/cocinar?id=${m.recipe_id}`}><Flame aria-hidden /> Cocínala</Link></Button>
        )}
        {spec && (
          <Button variant="outline" className="h-11 rounded-2xl" onClick={onBake}>
            <Hammer aria-hidden /> Hornear {spec.qty} · {spec.cost} <Coins aria-hidden />
          </Button>
        )}
      </div>
    </li>
  );
}

export function PrepararPhase({ d, fmt, onNext }: { d: VentaData; fmt: Fmt; onNext: () => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const [baking, setBaking] = useState<MenuItem | null>(null);
  const now = Date.now();
  const events = activeEvents(now);

  async function finishBake(item: MenuItem, quality: number) {
    const spec = batchSpec(item.price, d.working, d.ups, Date.now());
    const problem = await bakeBatch(item, { ...spec, quality });
    setMessage(problem ?? `Horneaste ${spec.qty} de ${item.name} (calidad ${Math.round(quality * 100)} %).`);
    setBaking(null);
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-3xl bg-secondary p-5">
        <div><p className="text-xs font-semibold text-muted-foreground">Reputación</p><Stars value={d.rep} /></div>
        <div><p className="text-xs font-semibold text-muted-foreground">Turnos de hoy</p><p className="font-heading text-2xl">{d.left}</p></div>
        <div><p className="text-xs font-semibold text-muted-foreground">Tus monedas</p><p className="flex items-center gap-1 font-heading text-2xl"><Coins className="size-5 text-primary" aria-hidden /> {d.coins}</p></div>
      </div>
      <p className="text-sm text-muted-foreground">
        Tienes {BASE_SHIFTS} turnos al día, y uno más por cada receta que cocines hoy (hasta {MAX_BONUS_SHIFTS} extra). Cada turno dura {Math.round(SHIFT_MS / 60000 * 10) / 10} minutos.
        Lo que vendes sale de lo que cocinas de verdad: cada porción es un postre para la vitrina, y cuanto mejor calificaste la receta, mejor se paga.
      </p>

      <section aria-labelledby="pizarra" className="flex flex-col gap-3">
        <h2 id="pizarra" className="text-2xl">Pizarra del día</h2>
        <p className="text-sm text-muted-foreground">Elige hasta {MAX_SHOWN} postres para la vitrina ({d.active.length} de {MAX_SHOWN}) y ponles precio.</p>
        {d.menu.length === 0 ? (
          <p className="rounded-3xl border border-dashed bg-card p-5 text-muted-foreground">
            Todavía no hay postres. <Link href="/cocinar" className="font-semibold text-primary underline underline-offset-4">Cocina una receta</Link> o <Link href="/pasteleria/menu" className="font-semibold text-primary underline underline-offset-4">inventa un postre</Link>.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {d.menu.map((m) => <BoardRow key={m.id} m={m} d={d} fmt={fmt} say={setMessage} onBake={() => setBaking(m)} />)}
          </ul>
        )}
        <p role="status" className="min-h-5 text-sm font-semibold text-primary">{message}</p>
      </section>

      <section aria-labelledby="equipo-hoy" className="flex flex-col gap-3">
        <h2 id="equipo-hoy" className="text-2xl">Equipo de hoy</h2>
        {d.working.length === 0 ? (
          <p className="rounded-3xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
            Nadie trabaja hoy: atiendes tú sola. <Link href="/pasteleria/equipo" className="font-semibold text-primary underline underline-offset-4">Armar el equipo</Link>
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {d.working.map((w) => {
              const ch = getCharacter(w.char);
              return (
                <li key={w.id} className="flex items-center gap-2 rounded-full bg-card py-1 pl-1 pr-4 text-sm font-semibold">
                  <Image src={ch.src} alt="" width={ch.w} height={ch.h} className="h-10 w-8 object-contain" />
                  {ch.name} · {roleLabel(w.role)} {effectiveLevel(w, now)} · −{wageOf(w.level)}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="fiestas" className="flex flex-col gap-3">
        <h2 id="fiestas" className="text-2xl">Eventos de hoy</h2>
        <ul className="flex flex-col gap-2">
          {events.map((e) => {
            const Icon = eventIcon(e.def.icon);
            return (
              <li key={e.key} className="flex items-start gap-3 rounded-3xl border bg-card p-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Icon className="size-5" aria-hidden /></span>
                <div className="min-w-0">
                  <p className="font-semibold">{e.def.name}</p>
                  <p className="text-xs text-muted-foreground">{describeMods(e.def.mods).join(" · ")}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <Link href="/pasteleria/eventos" className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary underline underline-offset-4">Ver metas y premios</Link>
      </section>

      {d.specials.length > 0 && (
        <p className="rounded-3xl border bg-card p-4 text-sm">
          <span className="font-semibold">Hoy te encargaron {d.specials.length} {d.specials.length === 1 ? "torta" : "tortas"}.</span> Las decoras en el siguiente paso.
        </p>
      )}

      <Button size="lg" className="h-14 w-fit rounded-2xl px-8 text-lg" onClick={onNext}>Siguiente: Decorar</Button>

      {baking && <OvenGame name={baking.name} onCancel={() => setBaking(null)} onDone={(q) => void finishBake(baking, q)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// 2. DECORAR
// ---------------------------------------------------------------------------------------------

function SpecialCard({ o, d, onDecorate }: { o: SpecialOrder; d: VentaData; onDecorate: (baseId: string) => void }) {
  const ch = getCharacter(o.char);
  const reserved = (id: string) => d.specials.filter((x) => x.status === "ready" && x.base_menu_id === id && x.id !== o.id).length;
  const options = d.active.filter((m) => (d.stock[m.id] ?? 0) - reserved(m.id) > 0);
  const [base, setBase] = useState<string>(options[0]?.id ?? "");
  const chosen = options.find((m) => m.id === base) ? base : (options[0]?.id ?? "");

  return (
    <li className="flex flex-col gap-3 rounded-3xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <Image src={ch.src} alt="" width={ch.w} height={ch.h} className="h-16 w-auto shrink-0 object-contain" />
        <div className="min-w-0">
          <p className="font-semibold">{ch.name} encargó una torta</p>
          <p className="text-sm text-muted-foreground">{describeRequest(o.request)}</p>
          <p className="text-xs font-semibold text-primary">Paga desde Q {o.price}, más si queda perfecta</p>
        </div>
      </div>
      {o.status === "pending" ? (
        options.length === 0 ? (
          <p className="text-sm text-muted-foreground">Necesitas un postre con porciones en la vitrina para usarlo de base.</p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor={`base-${o.id}`} className="text-xs font-semibold">Hecha sobre</label>
              <select id={`base-${o.id}`} value={chosen} onChange={(e) => setBase(e.target.value)} className="h-11 rounded-2xl border-2 border-border bg-card px-3 text-sm font-semibold">
                {options.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <Button className="h-11 rounded-2xl" onClick={() => onDecorate(chosen)}>Decorar torta</Button>
          </div>
        )
      ) : (
        <p className="flex items-center gap-2 text-sm font-semibold">
          {o.status === "delivered" ? "Entregada" : "Lista para entregar hoy"} · <Stars value={Math.max(1, Math.round((o.quality ?? 0) * 5))} />
        </p>
      )}
    </li>
  );
}

export function DecorarPhase({
  d, fmt, reason, onBack, onOpen,
}: {
  d: VentaData; fmt: Fmt; reason: string | null; onBack: () => void; onOpen: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [cake, setCake] = useState<{ order: SpecialOrder; base: string } | null>(null);
  const ev = [...activeEvents(Date.now())].sort((a, b) => Number(a.weekly) - Number(b.weekly))[0];
  const moreClients = Math.round((1 - d.effects.arrivalMult) * 100);
  const moreTips = Math.round(d.effects.tipBonus * 100);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <BakeryScene
        name={d.bakery.name} decor={d.bakery.decor} stickers={d.bakery.stickers} menu={d.active} character={d.profile.character} outfit={d.profile.outfit}
        staff={d.working.map((w) => w.char)} staffOutfits={d.staffOutfits} event={ev ? { name: ev.def.name, icon: ev.def.icon } : undefined} todayProps={d.dayPlan}
      />

      <section aria-labelledby="atractivo" className="flex flex-col gap-2 rounded-3xl bg-secondary p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="atractivo" className="text-2xl">Atractivo: {appealLabel(d.appeal.total)}</h2>
          <p className="font-heading text-2xl tabular-nums">{d.appeal.total} de 100</p>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-card" role="progressbar" aria-label="Atractivo del local" aria-valuemin={0} aria-valuemax={100} aria-valuenow={d.appeal.total}>
          <div className="h-full rounded-full bg-primary" style={{ width: `${d.appeal.total}%`, transition: "width 400ms cubic-bezier(0.23, 1, 0.32, 1)" }} />
        </div>
        <p className="text-sm text-muted-foreground">
          Decoración permanente {d.appeal.permanent} · adornos de hoy {d.appeal.props} · vitrina {d.appeal.vitrina}{d.appeal.stickers ? ` · pegatinas ${d.appeal.stickers}` : ""}. Llegan clientes {moreClients} % más seguido y las propinas suben {moreTips} %.
        </p>
        <Link href="/pasteleria/decorar" className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary underline underline-offset-4">Cambiar paredes, piso y muebles</Link>
      </section>

      <section aria-labelledby="adornos" className="flex flex-col gap-3">
        <h2 id="adornos" className="text-2xl">Adornos de hoy</h2>
        <p className="text-sm text-muted-foreground">Un adorno por lugar. Duran el día y cuestan pocas monedas.</p>
        <ul className="flex flex-col gap-3">
          {SPOTS.map((spot) => (
            <li key={spot.id} className="rounded-3xl border bg-card p-4">
              <p className="mb-2 font-semibold">{spot.label}</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Adorno de ${spot.label}`}>
                <button type="button" role="radio" aria-checked={!d.dayPlan[spot.id]} onClick={() => void setProp(d.day, spot.id, null)} className={cn("min-h-11 rounded-full border-2 px-4 text-sm font-semibold", !d.dayPlan[spot.id] ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary")}>Nada</button>
                {PROPS.filter((p) => p.spot === spot.id).map((p) => {
                  const Icon = PROP_ICONS[p.icon];
                  const on = d.dayPlan[spot.id] === p.id;
                  const short = !on && p.cost > d.coins;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={short}
                      onClick={async () => setMessage((await setProp(d.day, spot.id, p.id)) ?? `Pusiste: ${p.name}.`)}
                      className={cn("flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-sm font-semibold disabled:opacity-50", on ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary")}
                    >
                      {Icon && <Icon className="size-4" aria-hidden />} {p.name} · +{p.appeal}
                      {!on && <span className="flex items-center gap-0.5 text-xs opacity-80"><Coins className="size-3" aria-hidden />{p.cost}</span>}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
        <p role="status" className="min-h-5 text-sm font-semibold text-primary">{message}</p>
      </section>

      {d.specials.length > 0 && (
        <section aria-labelledby="pedidos" className="flex flex-col gap-3">
          <h2 id="pedidos" className="text-2xl">Pedidos especiales</h2>
          <ul className="flex flex-col gap-3">
            {d.specials.map((o) => <SpecialCard key={o.id} o={o} d={d} onDecorate={(base) => setCake({ order: o, base })} />)}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="lg" className="h-14 rounded-2xl px-6 text-base" onClick={onBack}>Atrás</Button>
          <Button size="lg" disabled={!!reason} onClick={onOpen} className="h-14 rounded-2xl px-8 text-lg">
            {reason ? <Lock aria-hidden /> : <DoorOpen aria-hidden />} Abrir el local
          </Button>
        </div>
        {reason && <p className="text-sm text-muted-foreground">{reason}</p>}
      </div>

      {cake && (
        <CakeGame
          request={cake.order.request}
          who={getCharacter(cake.order.char).name}
          onCancel={() => setCake(null)}
          onDone={async (score) => {
            await decorateSpecial(cake.order, cake.base, score.quality);
            setCake(null);
          }}
        />
      )}
    </div>
  );
}
