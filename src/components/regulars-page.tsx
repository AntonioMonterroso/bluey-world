"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useRegulars } from "@/lib/bakery-sales";
import { CHARACTERS } from "@/lib/characters";
import { useProfile } from "@/lib/db/profile";
import { ARCHETYPES, CHAR_ARCH, loyaltyLabel } from "@/lib/game/customers";
import { cn } from "@/lib/utils";

export function RegularsPage() {
  const regulars = useRegulars();
  const { profile } = useProfile();
  if (regulars === undefined) return null;

  const byChar = new Map(regulars.map((r) => [r.id, r]));
  const met = regulars.filter((r) => r.visits > 0).length;
  const total = CHARACTERS.filter((c) => c.id !== profile.character).length;

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <div>
        <h1 className="text-4xl">Clientes frecuentes</h1>
        <p className="mt-1 text-muted-foreground">
          Has conocido a {met} de {total}. Quien sale contento vuelve más seguido; quien se va sin su pedido se enfría.{" "}
          <Link href="/pasteleria/vender" className="font-semibold text-primary underline underline-offset-4">Abrir el local</Link>
        </p>
      </div>

      {ARCHETYPES.map((a) => {
        const chars = CHARACTERS.filter((c) => CHAR_ARCH[c.id] === a.id && c.id !== profile.character);
        if (chars.length === 0) return null;
        return (
          <section key={a.id} aria-labelledby={`t-${a.id}`} className="flex flex-col gap-3">
            <div>
              <h2 id={`t-${a.id}`} className="text-2xl">{a.name}</h2>
              <p className="text-sm text-muted-foreground">{a.blurb} Les gusta: {a.favs.join(", ")}.</p>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {chars.map((c) => {
                const r = byChar.get(c.id);
                const seen = !!r && r.visits > 0;
                return (
                  <li key={c.id} className={cn("flex flex-col items-center gap-2 rounded-3xl border bg-card p-3 text-center", !seen && "opacity-70")}>
                    <Image src={c.src} alt="" width={c.w} height={c.h} className={cn("h-24 w-auto object-contain", !seen && "grayscale")} />
                    <p className="font-semibold">{c.name}</p>
                    {seen ? (
                      <>
                        <p className="text-xs font-semibold text-primary">{loyaltyLabel(r.loyalty)} · {r.visits} {r.visits === 1 ? "visita" : "visitas"}</p>
                        <div className="flex gap-0.5" role="img" aria-label={`Fidelidad ${Math.round(r.loyalty)} de 100`}>
                          {[0, 1, 2, 3, 4].map((i) => (
                            <Heart key={i} className={cn("size-4", r.loyalty >= (i + 1) * 20 - 10 ? "fill-primary text-primary" : "text-muted-foreground/40")} aria-hidden />
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Todavía no ha venido</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
