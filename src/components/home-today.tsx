"use client";

import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, ChefHat, Coins, Gamepad2, Store, Timer, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { monthEnd, monthStart, useExpenses } from "@/lib/budget";
import { useGame } from "@/lib/game/use-game";
import { daysUntil, isOpen, useOrders, usePantry, pantryState } from "@/lib/kitchen";
import { dueLabel, dueSoon, totalsOf } from "@/lib/money-core";
import { useRecurring } from "@/lib/money";
import { useRecipes } from "@/lib/recipes";
import { useProfile } from "@/lib/db/profile";
import { useIsClient } from "@/lib/use-is-client";
import { goalStates, weekGoals, weekWindow } from "@/lib/game/progress";
import { useProgressData } from "@/lib/progress-data";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";

function Card({ title, icon: Icon, href, children, cta, first }: { title: string; icon: typeof Wallet; href: string; children: React.ReactNode; cta: string; first?: boolean }) {
  return (
    <section aria-label={title} data-first={first ? "" : undefined} className="flex flex-col gap-3 rounded-[2rem] border bg-card p-5">
      <h2 className="flex items-center gap-2 text-xl"><Icon className="size-6 text-primary" aria-hidden /> {title}</h2>
      <div className="flex flex-1 flex-col gap-2 text-sm">{children}</div>
      <Link href={href} className="inline-flex min-h-11 w-fit items-center font-semibold text-primary underline underline-offset-4">{cta}</Link>
    </section>
  );
}

function Inner() {
  const moves = useExpenses();
  const recurring = useRecurring();
  const orders = useOrders();
  const pantry = usePantry();
  const recipes = useRecipes();
  const game = useGame();
  const progress = useProgressData();
  const { profile } = useProfile();
  const fmt = useMoney();
  const now = Date.now();
  if (!moves || !recurring || !orders || !pantry || !recipes || !progress) return null;
  const ww = weekWindow(now);
  const weekDone = goalStates(weekGoals(now), progress, ww.from, ww.to).filter((g) => g.done).length;

  const t = totalsOf(moves, monthStart(new Date()), monthEnd(new Date()));
  const due = dueSoon(recurring, now, 7);
  const nextDue = due[0];
  const ordersSoon = orders.filter((o) => isOpen(o) && daysUntil(o.due, now) <= 1);
  const expiring = pantry.filter((p) => ["por-vencer", "vencido"].includes(pantryState(p, now)));
  const overdue = due.filter((r) => daysUntil(r.next_due, now) < 0);

  const alerts: { text: string; href: string }[] = [];
  if (overdue.length) alerts.push({ text: `${overdue.length === 1 ? "Tienes 1 pago atrasado" : `Tienes ${overdue.length} pagos atrasados`}: ${overdue.map((r) => r.name).join(", ")}`, href: "/dinero/recurrentes" });
  if (ordersSoon.length) alerts.push({ text: `${ordersSoon.length === 1 ? "1 pedido" : `${ordersSoon.length} pedidos`} para hoy o mañana: ${ordersSoon.map((o) => o.client).join(", ")}`, href: "/mi-cocina" });
  if (expiring.length) alerts.push({ text: `Usa pronto: ${expiring.slice(0, 3).map((p) => p.name).join(", ")}`, href: "/mi-cocina/despensa" });

  return (
    <div className="flex flex-col gap-6">
      {alerts.length > 0 && (
        <ul aria-label="Pendientes" className="flex flex-col gap-2">
          {alerts.map((a) => (
            <li key={a.text}><Link href={a.href} className="flex min-h-12 items-center rounded-2xl bg-primary px-4 py-2 font-semibold text-primary-foreground">{a.text}</Link></li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 md:grid-cols-3 [&>[data-first]]:order-first">
        <Card first={profile.interest === "dinero"} title="Dinero" icon={Wallet} href="/dinero" cta="Abrir Dinero">
          <p>Este mes: <span className="font-semibold text-primary">+{fmt(t.income)}</span> · <span className="font-semibold">−{fmt(t.spent)}</span></p>
          <p className={cn("font-heading text-2xl tabular-nums", t.net < 0 && "text-destructive")}>{t.net < 0 ? "−" : ""}{fmt(Math.abs(t.net))}</p>
          {nextDue ? (
            <p className="text-muted-foreground">Próximo: <span className="font-semibold text-foreground">{nextDue.name}</span> ({nextDue.kind === "ingreso" ? "+" : "−"}{fmt(nextDue.amount)}) · {dueLabel(nextDue.next_due, now).toLowerCase()}</p>
          ) : (
            <p className="text-muted-foreground">{recurring.length === 0 ? "Aún no tienes pagos fijos." : "Nada vence esta semana."}</p>
          )}
        </Card>

        <Card first={profile.interest === "cocina"} title="Cocina" icon={ChefHat} href="/recetas" cta="Abrir Cocina">
          <p><span className="font-semibold">{recipes.length}</span> {recipes.length === 1 ? "receta" : "recetas"} guardadas</p>
          <p className="text-muted-foreground">{ordersSoon.length ? `${ordersSoon.length} pedido(s) para entregar pronto` : "Sin pedidos para hoy ni mañana."}</p>
          <p className="text-muted-foreground">{expiring.length ? `${expiring.length} cosa(s) por vencer en la despensa` : "Despensa al día."}</p>
        </Card>

        <Card first={profile.interest === "juego"} title="Jugar" icon={Gamepad2} href="/jugar" cta="Abrir Jugar">
          <p className="font-heading text-2xl">Nivel {game.ready ? game.level : "–"} · {game.ready ? game.title : ""}</p>
          <p className="flex items-center gap-1 font-semibold text-primary"><Coins className="size-4" aria-hidden /> {game.ready ? game.coins : "–"} monedas</p>
          <p className="text-muted-foreground">Metas de la semana: <span className="font-semibold text-foreground">{weekDone} de 3</span></p>
          <Link href="/logros" className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary underline underline-offset-4">Ver metas y rachas</Link>
        </Card>
      </div>

      <section aria-labelledby="rapido" className="flex flex-col gap-3">
        <h2 id="rapido" className="text-xl">Acceso rápido</h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="h-12 rounded-2xl px-5"><Link href="/dinero/movimientos?tipo=gasto"><ArrowDownCircle aria-hidden /> Anotar gasto</Link></Button>
          <Button asChild variant="outline" className="h-12 rounded-2xl px-5"><Link href="/dinero/movimientos?tipo=ingreso"><ArrowUpCircle aria-hidden /> Anotar ingreso</Link></Button>
          <Button asChild variant="outline" className="h-12 rounded-2xl px-5"><Link href="/cocinar"><ChefHat aria-hidden /> Cocinar</Link></Button>
          <Button asChild variant="outline" className="h-12 rounded-2xl px-5"><Link href="/temporizadores"><Timer aria-hidden /> Temporizador</Link></Button>
          <Button asChild variant="outline" className="h-12 rounded-2xl px-5"><Link href="/jugar/venta"><Store aria-hidden /> Abrir el local</Link></Button>
        </div>
      </section>
    </div>
  );
}

export function HomeToday() {
  return useIsClient() ? <Inner /> : <div className="h-64" aria-hidden />;
}
