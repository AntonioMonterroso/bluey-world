"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dinero", label: "Resumen", hint: "Cuánto tienes, cuánto te queda libre y qué viene por pagar." },
  { href: "/dinero/movimientos", label: "Lo que anoté", hint: "Cada gasto e ingreso que anotas. Toca uno para editarlo." },
  { href: "/dinero/recurrentes", label: "Pagos fijos", hint: "Lo que se repite (renta, luz, sueldo). Márcalo como pagado cuando lo pagues." },
  { href: "/dinero/cuentas", label: "Cuentas", hint: "Dónde está tu dinero. En las tarjetas, el saldo es lo que debes." },
  { href: "/dinero/presupuesto", label: "Presupuesto", hint: "Ponle un tope a cada categoría y mira cuánto llevas este mes." },
  { href: "/dinero/metas", label: "Metas", hint: "Ahorra para algo concreto y ve cuánto te falta." },
] as const;

export function DineroNav() {
  const pathname = usePathname();
  const current = TABS.find((t) => (t.href === "/dinero" ? pathname === t.href : pathname.startsWith(t.href)));
  return (
    <div className="flex flex-col gap-2">
    <nav aria-label="Secciones de Dinero" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {TABS.map((t) => {
        const active = t.href === "/dinero" ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn("flex min-h-11 shrink-0 items-center rounded-full border-2 px-5 text-sm font-semibold", active ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-card hover:border-border")}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
    {current && <p className="text-sm text-muted-foreground">{current.hint}</p>}
    </div>
  );
}
