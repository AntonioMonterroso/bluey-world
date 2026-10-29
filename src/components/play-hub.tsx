"use client";

import Link from "next/link";
import { BookOpen, Dices, Gamepad2, Heart, Shirt, Store, Trophy, Users, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LevelCard } from "@/components/level-card";
import { updateProfile, useProfile } from "@/lib/db/profile";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const BIG = [
  { href: "/jugar/venta", title: "Un día en Dulce Co.", text: "Atiende clientes, cobra y haz crecer tu pastelería.", icon: Store, status: "Ya puedes jugarlo", ready: true },
  { href: "/jugar/historia", title: "Modo Historia", text: "La Esquina de Dulce Villa: una aventura con tus personajes y tus recetas.", icon: BookOpen, status: "Acto I disponible", ready: true },
  { href: "/jugar/sala", title: "Sala de juegos", text: "Decora tortas, ordena los pasos de tus recetas y más minijuegos.", icon: Dices, status: "Ya puedes jugarlo", ready: true },
] as const;

const SMALL = [
  { href: "/bingo", title: "Bingo en la cocina", icon: Gamepad2 },
  { href: "/pasteleria/vender", title: "Clientes frecuentes", icon: Users, to: "/jugar/clientes" },
  { href: "/logros", title: "Logros y metas", icon: Trophy },
  { href: "/vestuario", title: "Vestuario", icon: Shirt },
  { href: "/tienda", title: "Tienda", icon: Heart },
] as const;

export function PlayHub() {
  const { ready, profile } = useProfile();
  const on = profile.sfx !== false;

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Jugar</h1>
        {ready && (
          <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => {
              void updateProfile({ sfx: !on });
              if (!on) setTimeout(() => sfx("coin"), 50);
            }}
            className="flex min-h-11 items-center gap-2 rounded-full border-2 border-transparent bg-card px-4 text-sm font-semibold hover:border-border"
          >
            {on ? <Volume2 className="size-5 text-primary" aria-hidden /> : <VolumeX className="size-5 text-muted-foreground" aria-hidden />}
            Sonidos del juego: {on ? "sí" : "no"}
          </button>
        )}
      </div>

      <LevelCard />

      <ul className="grid gap-4 md:grid-cols-3">
        {BIG.map((g) => {
          const Icon = g.icon;
          const body = (
            <>
              <span className={cn("flex size-14 items-center justify-center rounded-full", g.ready ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                <Icon className="size-7" aria-hidden />
              </span>
              <p className="font-heading text-2xl">{g.title}</p>
              <p className="text-sm text-muted-foreground">{g.text}</p>
              <p className={cn("mt-auto w-fit rounded-full px-3 py-1 text-xs font-semibold", g.ready ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")}>{g.status}</p>
            </>
          );
          return (
            <li key={g.title}>
              {g.ready ? (
                <Link href={g.href} className="flex h-full min-h-56 flex-col gap-3 rounded-[2rem] border bg-card p-6 hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">{body}</Link>
              ) : (
                <div aria-disabled className="flex h-full min-h-56 flex-col gap-3 rounded-[2rem] border border-dashed bg-card/60 p-6">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="mas" className="flex flex-col gap-3">
        <h2 id="mas" className="text-xl">Más para jugar</h2>
        <ul className="flex flex-wrap gap-2">
          {SMALL.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.title}>
                <Button asChild variant="outline" className="h-12 rounded-2xl px-5">
                  <Link href={"to" in s ? s.to : s.href}><Icon aria-hidden /> {s.title}</Link>
                </Button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
