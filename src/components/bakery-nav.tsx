"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/pasteleria", label: "Local" },
  { href: "/jugar/venta", label: "Vender" },
  { href: "/pasteleria/equipo", label: "Equipo" },
  { href: "/pasteleria/mejoras", label: "Mejoras" },
  { href: "/pasteleria/eventos", label: "Eventos" },
  { href: "/pasteleria/menu", label: "Menú" },
  { href: "/pasteleria/decorar", label: "Decorar" },
  { href: "/pasteleria/ganancias", label: "Ganancias" },
] as const;

export function BakeryNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones de Dulce Co." className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {TABS.map((t) => {
        const active = t.href === "/pasteleria" ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center rounded-full border-2 px-5 text-sm font-semibold",
              active ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-card hover:border-border",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
