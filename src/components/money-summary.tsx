"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarClock, Landmark, ListChecks, PiggyBank, Plus, Repeat, Target, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DueRow } from "@/components/due-row";
import { MonthSwitch } from "@/components/month-switch";
import { MonthsChart } from "@/components/months-chart";
import { QuickAdd } from "@/components/quick-add";
import { monthEnd, monthStart, useBudgets, useExpenses } from "@/lib/budget";
import { useGoals, progressOf } from "@/lib/goals";
import { balanceOf, dueLabel, dueSoon, freeAhead, lastMonths, monthOutlook, positionOf, totalsOf } from "@/lib/money-core";
import { useAccounts, useRecurring } from "@/lib/money";
import { useIsClient } from "@/lib/use-is-client";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";

const GUIDE = [
  { href: "/dinero/movimientos", label: "Lo que anoté", icon: ListChecks, text: "Cada gasto e ingreso que anotas, mes por mes. Ahí se editan o se borran." },
  { href: "/dinero/recurrentes", label: "Pagos fijos", icon: Repeat, text: "Lo que se repite: renta, luz, internet, tu sueldo. Te avisa antes de que venza." },
  { href: "/dinero/cuentas", label: "Cuentas", icon: Landmark, text: "Dónde está tu dinero: efectivo, banco, ahorro y tarjetas (lo que debes)." },
  { href: "/dinero/presupuesto", label: "Presupuesto", icon: Target, text: "Un tope por categoría al mes, para no gastar de más en comida, salidas…" },
  { href: "/dinero/metas", label: "Metas", icon: PiggyBank, text: "Ahorrar para algo concreto (una batidora, un viaje) y ver cuánto falta." },
];

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-3xl bg-secondary p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={cn("font-heading text-2xl tabular-nums sm:text-3xl", tone === "good" && "text-primary", tone === "bad" && "text-destructive")}>{value}</p>
    </div>
  );
}

function Inner() {
  const moves = useExpenses();
  const accounts = useAccounts();
  const recurring = useRecurring();
  const budgets = useBudgets();
  const goals = useGoals();
  const fmt = useMoney();
  const [month, setMonth] = useState(() => new Date());
  const [now] = useState(() => Date.now());

  const data = useMemo(() => {
    if (!moves || !accounts || !recurring) return null;
    const from = monthStart(month);
    const to = monthEnd(month);
    const totals = totalsOf(moves, from, to);
    const isCurrent = now >= from && now < to;
    return {
      totals,
      isCurrent,
      outlook: isCurrent ? monthOutlook(totals, recurring.filter((r) => r.active), to) : null,
      position: positionOf(accounts, moves),
      due: dueSoon(recurring, now, 14),
      ahead: freeAhead(positionOf(accounts, moves), recurring.filter((r) => r.active), now),
      months: lastMonths(moves, now, 6),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moves, accounts, recurring, month]);

  if (!data || !moves || !accounts || !recurring) return null;
  const { totals, outlook, position, due, isCurrent, ahead, months } = data;
  const free = ahead.free;
  const dueExpenses = due.filter((r) => r.kind === "gasto");
  const dueTotal = dueExpenses.reduce((a, r) => a + r.amount, 0);
  const next = dueExpenses[0];
  const verdict = accounts.length === 0
    ? "Crea tus cuentas con el saldo de hoy y aquí verás cuánto tienes de verdad."
    : free < 0
      ? `Ojo: con lo que tienes no alcanza para lo que falta pagar este mes. Te faltan ${fmt(Math.abs(free))}.`
      : free < ahead.pay * 0.25
        ? "Alcanza, pero justo. Cuida los gastos que no son necesarios hasta fin de mes."
        : "Vas bien: alcanza para tus pagos fijos del próximo mes y te sobra.";
  const cats = Object.entries(totals.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const accName = (id: string | null) => accounts.find((a) => a.id === id)?.name;
  const empty = moves.length === 0 && accounts.length === 0 && recurring.length === 0;

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Dinero</h1>
        <MonthSwitch month={month} onChange={setMonth} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <QuickAdd />
        <Button asChild variant="outline" className="h-14 rounded-2xl px-5"><Link href="/dinero/movimientos"><ListChecks aria-hidden /> Lo que anoté</Link></Button>
        <Button asChild variant="outline" className="h-14 rounded-2xl px-5"><Link href="/dinero/recurrentes"><Repeat aria-hidden /> Pagos fijos</Link></Button>
      </div>

      {!empty && (
        <section aria-labelledby="palabras" className="flex flex-col gap-3 rounded-[2rem] bg-card p-5 shadow-sm">
          <h2 id="palabras" className="text-2xl">Tu dinero, en palabras</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1 rounded-3xl bg-secondary p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold"><Wallet className="size-4 text-primary" aria-hidden /> Tienes hoy</p>
              <p className="font-heading text-3xl tabular-nums">{fmt(position.cash)}</p>
              <p className="text-xs text-muted-foreground">{position.debt > 0 ? `Sumando efectivo, banco y ahorro. Debes ${fmt(position.debt)} en tarjetas.` : "Sumando efectivo, banco y ahorro."}</p>
            </div>
            <div className="flex flex-col gap-1 rounded-3xl bg-secondary p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold"><PiggyBank className="size-4 text-primary" aria-hidden /> Te queda libre</p>
              <p className={cn("font-heading text-3xl tabular-nums", free < 0 && "text-destructive")}>{free < 0 ? "−" : ""}{fmt(Math.abs(free))}</p>
              <p className="text-xs text-muted-foreground">{`Lo que tienes, menos tus pagos fijos de los próximos 30 días${ahead.pay ? ` (${fmt(ahead.pay)})` : ""}, más lo que vas a cobrar.`}</p>
            </div>
            <div className="flex flex-col gap-1 rounded-3xl bg-secondary p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold"><CalendarClock className="size-4 text-primary" aria-hidden /> Por pagar en 2 semanas</p>
              <p className="font-heading text-3xl tabular-nums">{fmt(dueTotal)}</p>
              <p className="text-xs text-muted-foreground">{next ? `Lo próximo: ${next.name}, ${dueLabel(next.next_due, now).toLowerCase()}.` : "Nada por pagar en estos días."}</p>
            </div>
          </div>
          <p className="text-pretty font-semibold">{verdict}</p>
        </section>
      )}

      {empty && (
        <section className="rounded-3xl border border-dashed bg-card p-6">
          <h2 className="text-2xl">Empieza por aquí</h2>
          <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-muted-foreground">
            <li><Link href="/dinero/cuentas" className="font-semibold text-primary underline underline-offset-4">Crea tus cuentas</Link>: efectivo, banco, tarjetas. Con el saldo que tienes hoy.</li>
            <li><Link href="/dinero/recurrentes" className="font-semibold text-primary underline underline-offset-4">Anota tus pagos fijos</Link> (renta, luz, internet) y tu sueldo, para que te avise cuando venzan.</li>
            <li><Link href="/dinero/movimientos" className="font-semibold text-primary underline underline-offset-4">Anota cada gasto e ingreso</Link> cuando pase. Con una foto del recibo, si quieres.</li>
          </ol>
        </section>
      )}

      <section aria-labelledby="mes" className="flex flex-col gap-3">
        <h2 id="mes" className="text-2xl">Este mes</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Te entró" value={fmt(totals.income)} tone="good" />
          <Stat label="Gastaste" value={fmt(totals.spent)} />
          <Stat label={totals.net < 0 ? "Gastaste de más" : "Te quedó"} value={`${totals.net < 0 ? "−" : ""}${fmt(Math.abs(totals.net))}`} tone={totals.net < 0 ? "bad" : "good"} />
        </div>
        {outlook && (outlook.pendingExpenses > 0 || outlook.pendingIncome > 0) && (
          <p className="rounded-2xl bg-card px-4 py-3 text-sm">
            Aún falta pagar <span className="font-semibold">{fmt(outlook.pendingExpenses)}</span> en pagos fijos
            {outlook.pendingIncome > 0 ? <> y cobrar <span className="font-semibold">{fmt(outlook.pendingIncome)}</span></> : null}.
            Si todo se cumple, el mes cierra en <span className={cn("font-semibold", outlook.left < 0 && "text-destructive")}>{outlook.left < 0 ? "−" : ""}{fmt(Math.abs(outlook.left))}</span>.
          </p>
        )}
      </section>

      {months.some((m) => m.income || m.spent) && <MonthsChart months={months} fmt={fmt} />}

      {isCurrent && (
        <section aria-labelledby="proximos" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="proximos" className="text-2xl">Próximos pagos y cobros</h2>
            <Link href="/dinero/recurrentes" className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm font-semibold text-primary underline underline-offset-4">Ver todos</Link>
          </div>
          {due.length === 0 ? (
            <p className="rounded-3xl border border-dashed bg-card p-5 text-muted-foreground">No hay nada que venza en los próximos 14 días.</p>
          ) : (
            <ul className="flex flex-col gap-3">{due.map((r) => <li key={r.id}><DueRow r={r} now={now} accountName={accName(r.account_id)} /></li>)}</ul>
          )}
        </section>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <section aria-labelledby="cuentas" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="cuentas" className="text-2xl">Mis cuentas</h2>
            <Link href="/dinero/cuentas" className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm font-semibold text-primary underline underline-offset-4">Ver</Link>
          </div>
          {accounts.length === 0 ? (
            <p className="rounded-3xl border border-dashed bg-card p-5 text-muted-foreground">Aún no tienes cuentas. <Link href="/dinero/cuentas" className="font-semibold text-primary underline underline-offset-4">Crear una</Link></p>
          ) : (
            <>
              <div className="rounded-3xl bg-secondary p-4">
                <p className="text-xs font-semibold text-muted-foreground">Tienes</p>
                <p className="font-heading text-2xl tabular-nums">{fmt(position.cash)}</p>
                {position.debt > 0 && <p className="text-sm text-destructive">Debes {fmt(position.debt)} en tarjetas · neto {fmt(position.net)}</p>}
              </div>
              <ul className="flex flex-col gap-2">
                {accounts.filter((a) => !a.archived).map((a) => {
                  const b = balanceOf(a, moves);
                  return (
                    <li key={a.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3">
                      <span className="font-semibold">{a.name}</span>
                      <span className={cn("tabular-nums", b < 0 && "text-destructive")}>{b < 0 ? "−" : ""}{fmt(Math.abs(b))}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <section aria-labelledby="cats" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="cats" className="text-2xl">En qué se va</h2>
            <Link href="/dinero/presupuesto" className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm font-semibold text-primary underline underline-offset-4">Presupuesto</Link>
          </div>
          {cats.length === 0 ? (
            <p className="rounded-3xl border border-dashed bg-card p-5 text-muted-foreground">Cuando anotes gastos, verás aquí en qué categorías se van.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {cats.map(([c, v]) => {
                const limit = budgets?.find((b) => b.category === c)?.limit ?? null;
                const pct = limit ? Math.min(100, (v / limit) * 100) : (v / Math.max(1, totals.spent)) * 100;
                return (
                  <li key={c} className="flex flex-col gap-1">
                    <p className="flex justify-between gap-3 text-sm"><span className="font-semibold">{c} <span className="font-normal text-muted-foreground">· {Math.round((v / Math.max(1, totals.spent)) * 100)} %</span></span><span className="tabular-nums">{fmt(v)}{limit ? <span className="text-muted-foreground"> de {fmt(limit)}</span> : null}</span></p>
                    <div className="h-2.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label={c} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
                      <div className={cn("h-full rounded-full", limit && v > limit ? "bg-destructive" : "bg-primary")} style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {goals && goals.length > 0 && (
        <section aria-labelledby="metas" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="metas" className="text-2xl">Mis metas</h2>
            <Link href="/dinero/metas" className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm font-semibold text-primary underline underline-offset-4">Ver</Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {goals.slice(0, 4).map((g) => (
              <li key={g.id} className="flex flex-col gap-1 rounded-2xl border bg-card p-4">
                <p className="flex justify-between gap-3 text-sm font-semibold"><span>{g.name}</span><span className="tabular-nums">{Math.round(progressOf(g) * 100)} %</span></p>
                <div className="h-2.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${progressOf(g) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="secciones" className="flex flex-col gap-3">
        <h2 id="secciones" className="text-2xl">¿Qué hay en cada parte?</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {GUIDE.map((g) => (
            <li key={g.href}>
              <Link href={g.href} className="flex min-h-20 items-start gap-3 rounded-3xl border bg-card p-4 transition-[border-color] duration-150 hover:border-primary">
                <g.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <span className="flex flex-col gap-0.5"><span className="font-semibold">{g.label}</span><span className="text-sm text-muted-foreground">{g.text}</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <Button asChild variant="ghost" className="h-11 w-fit"><Link href="/dinero/movimientos"><Plus aria-hidden /> Ver todos los movimientos</Link></Button>
    </div>
  );
}

export function MoneySummary() {
  return useIsClient() ? <Inner /> : null;
}
