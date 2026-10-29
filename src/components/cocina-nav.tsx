"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/recetas", label: "Recetas" },
  { href: "/cocinar", label: "Cocinar" },
  { href: "/temporizadores", label: "Temporizadores" },
  { href: "/mi-cocina", label: "Pedidos" },
  { href: "/mi-cocina/diario", label: "Diario" },
  { href: "/mi-cocina/despensa", label: "Despensa" },
  { href: "/mi-cocina/precios", label: "Precios" },
  { href: "/mi-cocina/compras", label: "Compras" },
] as const;

export function CocinaNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones de Cocina" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {TABS.map((t) => {
        const active = t.href === "/mi-cocina" ? pathname === t.href : pathname.startsWith(t.href);
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
