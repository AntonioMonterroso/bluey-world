"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Coins, DoorOpen, Hammer, Sparkles, Target, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BakeryScene, type SceneVisitor, type ScenePop } from "@/components/bakery-scene";
import { Stars } from "@/components/stars";
import { DecorarPhase, PrepararPhase } from "@/components/venta-phases";
import { finishShift, type ShiftResult } from "@/lib/bakery-sales";
import { applyEventMods } from "@/lib/bakery-events";
import { MENU_ICONS } from "@/lib/bakery";
import { getCharacter } from "@/lib/characters";
import { activeEvents } from "@/lib/game/events";
import { topReviews } from "@/lib/game/customers";
import {
  closeNow, collect, isOver, pending, phaseOf, priceByQuality, serve, startShift, summarize, tick,
  type MenuLite, type Shift, type ShiftSummary,
} from "@/lib/game/sales";
import { shiftOptions } from "@/lib/game/team";
import { dayStart } from "@/lib/game/engine";
import { GOAL_BONUS, applyTurn, turnFor, type TurnGoal, type Surprise } from "@/lib/game/turns";
import { db } from "@/lib/db/db";
import { writeAwards } from "@/lib/game/use-game";
import { sfx, sfxForLog } from "@/lib/sfx";
import { useIsClient } from "@/lib/use-is-client";
import { useMoney } from "@/lib/use-money";
import { useVentaData, type VentaData } from "@/lib/venta-data";
import { cn } from "@/lib/utils";

type Phase = "preparar" | "decorar" | "vender" | "cierre";
const STEPS: { id: Phase; label: string }[] = [
  { id: "preparar", label: "Preparar" },
  { id: "decorar", label: "Decorar" },
  { id: "vender", label: "Vender" },
  { id: "cierre", label: "Cierre" },
];

function Stepper({ phase }: { phase: Phase }) {
  const at = STEPS.findIndex((s) => s.id === phase);
  return (
    <ol className="flex flex-wrap gap-2" aria-label="Pasos del día">
      {STEPS.map((s, i) => (
        <li
          key={s.id}
          aria-current={i === at ? "step" : undefined}
          className={cn("flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold", i === at ? "bg-primary text-primary-foreground" : i < at ? "bg-secondary" : "border border-dashed text-muted-foreground")}
        >
          <span className="tabular-nums">{i + 1}</span> {s.label}
        </li>
      ))}
    </ol>
  );
}

function CustomerCard({ c, menu, fmt, onCollect }: { c: Shift["customers"][number]; menu: MenuLite[]; fmt: (n: number) => string; onCollect: () => void }) {
  const ch = getCharacter(c.char);
  const ratio = c.patienceMs / c.maxMs;
  const paying = c.status === "paying";
  const eating = c.status === "eating";
  return (
    <div className={cn("flex h-full flex-col gap-2 rounded-3xl border bg-card p-3", paying && "border-primary")}>
      <div className="flex items-end gap-3">
        <Image src={ch.src} alt={ch.name} width={ch.w} height={ch.h} className="h-20 w-auto shrink-0 object-contain" draggable={false} />
        <ul className="flex flex-1 flex-wrap justify-end gap-1.5" aria-label="Pedido">
          {c.order.map((l, i) => {
            const m = menu.find((x) => x.id === l.menuId);
            const Icon = MENU_ICONS[m?.icon ?? "cake"] ?? Hammer;
            return (
              <li key={i} className={cn("flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold", l.done ? "bg-primary text-primary-foreground" : "bg-secondary")} title={m?.name}>
                {l.done ? <Check className="size-4" aria-hidden /> : <Icon className="size-4" aria-hidden />}
                <span className="sr-only">{m?.name}{l.done ? " servido" : ""}</span>
              </li>
            );
          })}
        </ul>
      </div>
      {c.special && <p className="text-xs font-semibold text-primary">Viene por su torta encargada</p>}
      {c.combo && <p className="text-xs font-semibold text-primary">Combo: bebida + postre</p>}
      {paying ? (
        <Button onClick={onCollect} className="h-12 rounded-2xl text-base"><Coins aria-hidden /> Cobrar {fmt(c.total)}</Button>
      ) : eating ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Utensils className="size-4" aria-hidden /> Comiendo en la mesa…</p>
      ) : (
        <div className="h-2.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label="Paciencia del cliente" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)}>
          <div className={cn("h-full rounded-full", ratio > 0.6 ? "bg-primary" : ratio > 0.3 ? "bg-amber-500" : "bg-destructive")} style={{ width: `${ratio * 100}%`, transition: "width 200ms linear" }} />
        </div>
      )}
    </div>
  );
}

function VenderPhase({ d, shift, setShift, fmt, workingIds }: { d: VentaData; shift: Shift; setShift: React.Dispatch<React.SetStateAction<Shift | null>>; fmt: (n: number) => string; workingIds: string[] }) {
  const slotsRef = useRef(new Map<number, number>());
  const [pops, setPops] = useState<ScenePop[]>([]);
  const wait = pending(shift);
  const slots = Array.from({ length: shift.opts.maxCustomers }, (_, i) => shift.customers[i] ?? null);
  const progress = Math.min(1, shift.t / shift.duration);
  const phase = phaseOf(progress);

  const present = new Set(shift.customers.map((c) => c.id));
  for (const id of [...slotsRef.current.keys()]) if (!present.has(id)) slotsRef.current.delete(id);
  for (const c of shift.customers) {
    if (!slotsRef.current.has(c.id)) {
      const used = new Set(slotsRef.current.values());
      slotsRef.current.set(c.id, [0, 1, 2, 3, 4].find((n) => !used.has(n)) ?? 0);
    }
  }
  const visitors: SceneVisitor[] = shift.customers.map((c) => {
    const ratio = c.patienceMs / c.maxMs;
    return {
      id: c.id,
      char: c.char,
      slot: slotsRef.current.get(c.id) ?? 0,
      table: c.status === "eating" ? c.table : undefined,
      bubble: c.order.map((l) => ({ icon: shift.menu.find((m) => m.id === l.menuId)?.icon ?? "cake", done: l.done })),
      paying: c.status === "paying",
      mood: c.status === "paying" || c.status === "eating" || ratio > 0.6 ? "ok" : ratio > 0.3 ? "warn" : "bad",
      vip: c.vip,
    };
  });
  const addPop = (id: number, text: string) => {
    const key = Date.now() + Math.random();
    setPops((p) => [...p, { id: key, slot: slotsRef.current.get(id) ?? 0, text }]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== key)), 1300);
  };
  const ev = [...activeEvents(Date.now())].sort((a, b) => Number(a.weekly) - Number(b.weekly))[0];

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Atendiendo</h1>
        {phase === "pico" && <span className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">¡Hora pico!</span>}
        <p className="font-heading text-xl tabular-nums">{fmt(shift.sales + shift.tips)}</p>
        <Button variant="outline" className="h-11 rounded-2xl" onClick={() => setShift((s) => (s ? closeNow(s) : s))}>
          <DoorOpen aria-hidden /> Cerrar ya
        </Button>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label="Tiempo del turno" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%`, transition: "width 200ms linear" }} />
      </div>

      <BakeryScene
        name={d.bakery.name} decor={d.bakery.decor} menu={d.active} character={d.profile.character} outfit={d.profile.outfit}
        staff={d.staff.filter((x) => workingIds.includes(x.id)).map((x) => x.char)} staffOutfits={d.staffOutfits}
        event={ev ? { name: ev.def.name, icon: ev.def.icon } : undefined}
        todayProps={d.dayPlan} visitors={visitors} pops={pops} daylight={progress}
      />

      <ul className="grid gap-3 sm:grid-cols-3" aria-label="Clientes">
        {slots.map((c, i) => (
          <li key={c?.id ?? `vacio-${i}`}>
            {c ? <CustomerCard c={c} menu={shift.menu} fmt={fmt} onCollect={() => { sfx("cash"); addPop(c.id, `+${fmt(c.total)}`); setShift((s) => (s ? collect(s, c.id) : s)); }} /> : (
              <div className="flex h-full min-h-32 items-center justify-center rounded-3xl border border-dashed text-sm text-muted-foreground">Esperando clientes…</div>
            )}
          </li>
        ))}
      </ul>

      <section aria-label="Vitrina" className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Toca un postre para servirlo a quien lo pidió. Cuando el pedido esté completo, cobra.</p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {shift.menu.map((m) => {
            const Icon = MENU_ICONS[m.icon] ?? Hammer;
            const n = shift.stock[m.id] ?? 0;
            const asked = wait[m.id] ?? 0;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={n <= 0}
                  onClick={() => { sfx("serve"); setShift((s) => (s ? serve(s, m.id) : s)); }}
                  className={cn("relative flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 bg-card px-3 text-left disabled:opacity-40", asked > 0 ? "border-primary" : "border-transparent")}
                >
                  <Icon className="size-7 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{m.name}</span>
                    <span className="block text-xs text-muted-foreground">{fmt(m.price)} · quedan {n}</span>
                  </span>
                  {asked > 0 && <span className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground" aria-label={`${asked} pidiendo`}>{asked}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      <p aria-live="polite" className="min-h-5 text-sm font-semibold text-primary">{shift.log}</p>
    </div>
  );
}

function CierrePhase({ d, summary, result, fmt, onAgain, goal }: { d: VentaData; summary: ShiftSummary; result: ShiftResult | null; fmt: (n: number) => string; onAgain: () => void; goal: { goal: TurnGoal; ok: boolean } | null }) {
  const delivered = d.specials.filter((o) => summary.specialsDone.includes(o.id));
  const tip =
    summary.lost > summary.served ? "Se fueron muchos clientes: hornea más o contrata a alguien que sirva más rápido."
    : summary.profit < summary.sales * 0.4 ? "La ganancia quedó baja: revisa los precios de la pizarra."
    : "Buen día. Mañana prueba con más adornos para atraer más gente.";
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-4xl">{summary.perfect ? "¡Turno perfecto!" : "Turno terminado"}</h1>
      {goal && (
        <p className={cn("flex items-center gap-2 rounded-2xl px-4 py-3 font-semibold", goal.ok ? "bg-[color-mix(in_oklch,var(--gold)_35%,transparent)]" : "bg-secondary")}>
          <Target className="size-5 shrink-0 text-primary" aria-hidden />
          {goal.ok ? `¡Reto cumplido! «${goal.goal.text}» · +${GOAL_BONUS.coins} monedas` : `Reto sin cumplir: «${goal.goal.text}». En el próximo turno sale otro.`}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {([
          ["Clientes atendidos", String(summary.served)],
          ["Se fueron", String(summary.lost)],
          ["Ventas", fmt(summary.sales)],
          ["Propinas", fmt(summary.tips)],
          ["Costo estimado", fmt(summary.cost)],
          ["Ganancia", fmt(summary.profit)],
        ] as const).map(([label, value]) => (
          <div key={label} className="rounded-3xl bg-secondary p-4">
            <p className="font-heading text-2xl">{value}</p>
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border bg-card px-4 py-3 font-semibold">
        <Coins className="size-5 text-primary" aria-hidden />
        +{summary.coins} monedas{result && result.wages > 0 ? `, sueldos −${result.wages} (te quedan ${summary.coins - result.wages})` : " para tu tienda"} · <Stars value={summary.rating} />
      </p>
      {delivered.length > 0 && (
        <section aria-labelledby="entregas" className="flex flex-col gap-2">
          <h2 id="entregas" className="text-xl">Tortas entregadas</h2>
          <ul className="flex flex-col gap-2">
            {delivered.map((o) => (
              <li key={o.id} className="flex items-center gap-3 rounded-3xl border bg-card p-3 text-sm font-semibold">
                {getCharacter(o.char).name} <Stars value={Math.max(1, Math.round((o.quality ?? 0) * 5))} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {summary.visits.length > 0 && (
        <section aria-labelledby="resenas" className="flex flex-col gap-2">
          <h2 id="resenas" className="text-xl">Lo que dijeron</h2>
          <ul className="flex flex-col gap-2">
            {topReviews(summary.visits).map((r, i) => {
              const ch = getCharacter(r.char);
              return (
                <li key={i} className="flex items-center gap-3 rounded-3xl border bg-card p-3">
                  <Image src={ch.src} alt="" width={ch.w} height={ch.h} className="h-14 w-auto shrink-0 object-contain" />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold">{ch.name} <Stars value={r.stars} /></p>
                    <p className="text-sm text-muted-foreground">“{r.text}”</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {summary.critic && (
        <p className="rounded-2xl bg-secondary px-4 py-3 font-semibold">
          {summary.critic === "ok" ? "¡El crítico quedó encantado! +30 monedas de bonus." : "El crítico se fue molesto: tu reputación lo notó."}
        </p>
      )}
      {result && result.promoted.length > 0 && (
        <p className="rounded-2xl bg-secondary px-4 py-3 font-semibold">¡Ascenso! {result.promoted.map((id) => getCharacter(id).name).join(", ")} subió de nivel.</p>
      )}
      <p className="rounded-2xl border bg-card px-4 py-3 text-sm"><span className="font-semibold">Consejo para mañana:</span> {tip}</p>
      <div className="flex flex-wrap gap-3">
        <Button size="lg" className="h-12 rounded-2xl px-6 text-base" onClick={onAgain}>{d.left > 1 ? "Otro turno" : "Volver al local"}</Button>
        <Button asChild variant="outline" size="lg" className="h-12 rounded-2xl px-6 text-base"><Link href="/pasteleria/ganancias">Ver ganancias</Link></Button>
        <Button asChild variant="outline" size="lg" className="h-12 rounded-2xl px-6 text-base"><Link href="/jugar">Volver a Jugar</Link></Button>
      </div>
    </div>
  );
}

function Inner({ d }: { d: VentaData }) {
  const fmt = useMoney();
  const [phase, setPhase] = useState<Phase>("preparar");
  const [shift, setShift] = useState<Shift | null>(null);
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [workingIds, setWorkingIds] = useState<string[]>([]);
  const [eventKeys, setEventKeys] = useState<string[]>([]);
  const [result, setResult] = useState<ShiftResult | null>(null);
  const finishing = useRef(false);
  const [goalResult, setGoalResult] = useState<{ goal: TurnGoal; ok: boolean } | null>(null);
  const turnIdx = d.days.filter((x) => x.date === dayStart(Date.now())).length;
  const turn = turnFor(d.day, turnIdx, d.active.filter((m) => (d.stock[m.id] ?? 0) > 0).length);
  const turnRef = useRef<{ idx: number; goal: TurnGoal } | null>(null);

  const running = phase === "vender" && !!shift;
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(500, now - last);
      last = now;
      setShift((s) => (s ? tick(s, dt, Math.random) : s));
    }, 200);
    return () => clearInterval(id);
  }, [running]);

  const log = shift?.log;
  useEffect(() => {
    const kind = log ? sfxForLog(log) : null;
    if (kind) sfx(kind);
  }, [log]);

  useEffect(() => {
    if (phase !== "vender" || !shift || !isOver(shift) || finishing.current) return;
    finishing.current = true;
    const sum = summarize(shift);
    void finishShift(sum, startedAt, workingIds, eventKeys).then(async (res) => {
      const t = turnRef.current;
      if (t) {
        const ok = t.goal.check(sum);
        setGoalResult({ goal: t.goal, ok });
        if (ok) await writeAwards([{ id: `turno-reto:${d.day}:${t.idx}`, kind: "shift", label: `Reto del turno: ${t.goal.text}`, ...GOAL_BONUS, at: Date.now() }], await db.game_events.toArray());
      }
      setResult(res);
      setSummary(sum);
      setPhase("cierre");
      finishing.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, shift, startedAt, workingIds, eventKeys]);

  const sellable = d.active.filter((m) => (d.stock[m.id] ?? 0) > 0);
  const reason =
    d.active.length === 0 ? "Aún no hay postres en tu vitrina. Cocina una receta o inventa un postre."
    : sellable.length === 0 ? "No te queda nada para vender. Cocina una receta de verdad o hornea una tanda."
    : d.left === 0 ? "Ya jugaste tus turnos de hoy. Cocina una receta para ganar otro turno, o vuelve mañana."
    : null;

  function open() {
    const now = Date.now();
    const lite: MenuLite[] = d.active.map((m) => ({
      id: m.id, name: m.name, icon: m.icon,
      price: priceByQuality(m.price, d.quality[m.id] ?? 0.7),
      cost: d.unitCost.get(m.id) ?? 0,
      category: d.recipes.find((r) => r.id === m.recipe_id)?.category,
    }));
    const applied = applyEventMods(shiftOptions(d.working, d.ups, now), now, d.days);
    const opts = {
      ...applyTurn(applied.opts, turn.surprise.mods),
      arrivalMult: applied.opts.arrivalMult * d.effects.arrivalMult,
      tipBonus: applied.opts.tipBonus + d.effects.tipBonus,
      tables: d.tables,
      loyalty: d.loyalty,
      specials: d.specials
        .filter((o) => o.status === "ready" && o.base_menu_id)
        .map((o) => ({ id: o.id, char: o.char, menuId: o.base_menu_id!, price: o.price, quality: o.quality ?? 0.7 })),
    };
    turnRef.current = { idx: turnIdx, goal: turn.goal };
    setGoalResult(null);
    setEventKeys(applied.active.map((e) => e.key));
    setStartedAt(now);
    setWorkingIds(d.working.map((x) => x.id));
    setSummary(null);
    setResult(null);
    sfx("bake");
    setShift(startShift(lite, d.stock, d.rep, d.chars.length ? d.chars : ["bluey"], opts));
    setPhase("vender");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="sr-only">Un día en Dulce Co.</h1>
        {/* Mientras atiendes, el espacio vale oro en el celular: el paso ya lo dice el título. */}
        <div className={phase === "vender" ? "hidden sm:block" : undefined}><Stepper phase={phase} /></div>
      </div>
      {(phase === "preparar" || phase === "decorar") && d.left > 0 && <TurnCard surprise={turn.surprise} goal={turn.goal} n={turnIdx + 1} />}
      {phase === "preparar" && <PrepararPhase d={d} fmt={fmt} onNext={() => setPhase("decorar")} />}
      {phase === "decorar" && <DecorarPhase d={d} fmt={fmt} reason={reason} onBack={() => setPhase("preparar")} onOpen={open} />}
      {phase === "vender" && shift && <VenderPhase d={d} shift={shift} setShift={setShift} fmt={fmt} workingIds={workingIds} />}
      {phase === "cierre" && summary && <CierrePhase d={d} summary={summary} result={result} fmt={fmt} goal={goalResult} onAgain={() => { setShift(null); setSummary(null); setPhase("preparar"); }} />}
    </div>
  );
}

/** Lo que trae este turno: una sorpresa y un reto con premio. */
function TurnCard({ surprise, goal, n }: { surprise: Surprise; goal: TurnGoal; n: number }) {
  return (
    <section aria-label={`Turno ${n}`} className="grid max-w-4xl gap-3 sm:grid-cols-2">
      <div className="flex items-start gap-3 rounded-3xl border bg-card p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Sparkles className="size-5" aria-hidden /></span>
        <div><p className="text-xs font-semibold text-muted-foreground">Sorpresa del turno {n}</p><p className="font-semibold">{surprise.name}</p><p className="text-sm text-muted-foreground">{surprise.text}</p></div>
      </div>
      <div className="flex items-start gap-3 rounded-3xl border bg-card p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-foreground"><Target className="size-5" aria-hidden /></span>
        <div><p className="text-xs font-semibold text-muted-foreground">Reto del turno</p><p className="font-semibold">{goal.text}</p><p className="text-sm text-muted-foreground">Si lo cumples: +{GOAL_BONUS.coins} monedas y +{GOAL_BONUS.xp} XP.</p></div>
      </div>
    </section>
  );
}

function Loaded() {
  const d = useVentaData();
  return d ? <Inner d={d} /> : null;
}

export function VentaFlow() {
  return useIsClient() ? <Loaded /> : null;
}
