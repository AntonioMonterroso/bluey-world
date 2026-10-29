"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dinero", label: "Resumen" },
  { href: "/dinero/movimientos", label: "Movimientos" },
  { href: "/dinero/recurrentes", label: "Pagos fijos" },
  { href: "/dinero/cuentas", label: "Cuentas" },
  { href: "/dinero/presupuesto", label: "Presupuesto" },
  { href: "/dinero/metas", label: "Metas" },
] as const;

export function DineroNav() {
  const pathname = usePathname();
  return (
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
  );
}
