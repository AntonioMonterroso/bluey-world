"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, Gamepad2, Home, Settings, Wallet } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { SyncBadge } from "@/components/sync-badge";
import { AppBootstrap } from "@/components/app-bootstrap";
import { TimerHost } from "@/components/timer-host";
import { GameEngine } from "@/components/game-engine";
import { GameChip } from "@/components/game-chip";
import { BakeryMenuSync } from "@/components/bakery-menu-sync";
import { LoginScreen } from "@/components/login-screen";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/recetas", label: "Cocina", icon: ChefHat },
  { href: "/dinero", label: "Dinero", icon: Wallet },
  { href: "/jugar", label: "Jugar", icon: Gamepad2 },
] as const;

// Qué rutas pertenecen a cada sección (para marcarla como activa).
const SECTIONS: Record<string, string[]> = {
  "/recetas": ["/recetas", "/cocinar", "/temporizadores", "/mi-cocina"],
  "/dinero": ["/dinero"],
  "/jugar": ["/jugar", "/bingo", "/logros", "/tienda", "/vestuario", "/pasteleria"],
};

function NavLink({
  item,
  active,
  layout,
}: {
  item: (typeof NAV)[number];
  active: boolean;
  layout: "side" | "bottom";
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center rounded-2xl text-sm font-semibold",
        "transition-[background-color,color] duration-150",
        layout === "side"
          ? "flex-col justify-center gap-1 px-1 py-2.5 text-[11px] lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-3 lg:text-sm"
          : "min-h-12 min-w-12 flex-1 flex-col justify-center gap-0.5 px-1 py-1.5 text-[11px]",
        active
          ? "bg-primary text-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span>{item.label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const auth = useAuth();

  // Sin sesión no se ve la app: primero la pantalla de entrada (si la nube está configurada).
  if (!auth.ready) return <><AppBootstrap /><div className="min-h-dvh" aria-busy="true" /></>;
  if (auth.configured && !auth.user) return <><AppBootstrap /><LoginScreen /></>;
  return <Shell pathname={pathname}>{children}</Shell>;
}

function Shell({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : (SECTIONS[href] ?? [href]).some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[5.5rem_minmax(0,1fr)] lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r bg-sidebar p-3 md:flex lg:p-4">
        <Link href="/" aria-label={`${BRAND.app}, inicio`} className="px-1 pt-2 text-center font-heading text-2xl leading-none lg:px-2 lg:text-left">
          <span className="lg:hidden">BW</span>
          <span className="hidden lg:inline">{BRAND.app}</span>
          <span className="mt-1.5 hidden text-xs font-normal text-muted-foreground lg:block">{BRAND.tagline}</span>
          <span aria-hidden className="mx-auto mt-3 block h-[3px] w-8 rounded bg-gradient-to-r from-[var(--gold)] to-transparent lg:mx-0 lg:w-12" />
        </Link>
        <nav aria-label="Principal" className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              layout="side"
            />
          ))}
        </nav>
        <GameChip className="mt-auto hidden lg:flex" />
        <Link
          href="/ajustes"
          aria-current={pathname === "/ajustes" ? "page" : undefined}
          className={cn("mt-auto flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2.5 text-[11px] font-semibold lg:mt-0 lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-3 lg:text-sm", pathname === "/ajustes" ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent")}
        >
          <Settings className="size-5 shrink-0" aria-hidden /> Ajustes
        </Link>
        <SyncBadge className="hidden lg:flex" />
      </aside>

      <AppBootstrap />
      <TimerHost />
      <GameEngine />
      <BakeryMenuSync />
      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 lg:px-10 lg:pt-10">
        <div className="mb-5 flex flex-wrap items-center gap-2 lg:hidden">
          <GameChip />
          <SyncBadge className="w-fit" />
          <Link href="/ajustes" aria-label="Ajustes" className="ml-auto flex size-11 items-center justify-center rounded-full bg-card md:hidden"><Settings className="size-5" aria-hidden /></Link>
        </div>
        {children}
      </main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 flex gap-1 border-t bg-sidebar/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur md:hidden"
      >
        {NAV.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} layout="bottom" />
        ))}
      </nav>
    </div>
  );
}
