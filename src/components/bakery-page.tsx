"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BakeryScene } from "@/components/bakery-scene";
import { inputClass, labelClass } from "@/components/ui/fields";
import { saveBakery, useBakery, useMenu } from "@/lib/bakery";
import { useProfile } from "@/lib/db/profile";
import { SLOTS, equipped } from "@/lib/game/decor";
import { BRAND } from "@/lib/brand";
import { activeEvents } from "@/lib/game/events";

function NameForm({ initial }: { initial: string }) {
  const [name, setName] = useState(initial);
  const [saved, setSaved] = useState(false);
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const clean = name.trim() || BRAND.tycoon;
        setName(clean);
        void saveBakery({ name: clean }).then(() => setSaved(true));
      }}
    >
      <div className="flex min-w-56 flex-1 flex-col gap-2">
        <label htmlFor="nombre-local" className={labelClass}>Nombre del letrero</label>
        <input id="nombre-local" className={inputClass} value={name} maxLength={28} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
      </div>
      <Button type="submit" className="h-12 rounded-2xl px-5 text-base">{saved ? "Guardado" : "Guardar"}</Button>
    </form>
  );
}

export function BakeryPage() {
  const { ready, bakery } = useBakery();
  const menu = useMenu();
  const { profile } = useProfile();
  if (!ready || menu === undefined) return null;

  const active = menu.filter((m) => m.active);
  const ev = [...activeEvents(Date.now())].sort((a, b) => Number(a.weekly) - Number(b.weekly))[0];
  const decorated = SLOTS.filter((s) => equipped(bakery.decor, s.id).price > 0).length;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <h1 className="text-4xl">{bakery.name}</h1>
      <BakeryScene name={bakery.name} decor={bakery.decor} stickers={bakery.stickers} menu={menu} character={profile.character} outfit={profile.outfit} event={ev ? { name: ev.def.name, icon: ev.def.icon } : undefined} />

      <NameForm key={bakery.updated_at} initial={bakery.name} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl bg-secondary p-4">
          <p className="font-heading text-3xl">{active.length}</p>
          <p className="text-xs font-semibold text-muted-foreground">postres en la vitrina</p>
        </div>
        <div className="rounded-3xl bg-secondary p-4">
          <p className="font-heading text-3xl">{decorated} de {SLOTS.length}</p>
          <p className="text-xs font-semibold text-muted-foreground">detalles de decoración</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-3xl bg-secondary p-4">
          <Button asChild className="h-11 rounded-2xl"><Link href="/jugar/venta">Vender</Link></Button>
          <Button asChild variant="outline" className="h-11 rounded-2xl"><Link href="/pasteleria/menu">Menú</Link></Button>
          
        </div>
      </div>

      <section aria-labelledby="crecer" className="flex flex-col gap-3">
        <h2 id="crecer" className="text-2xl">Haz crecer tu pastelería</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {[
            { href: "/pasteleria/equipo", title: "Equipo", text: "Contrata, asigna puestos y cuida el ánimo." },
            { href: "/pasteleria/mejoras", title: "Mejoras", text: "Más clientes, más paciencia, mejores tandas." },
            { href: "/pasteleria/eventos", title: "Eventos", text: "Fiestas y metas con premios que no se compran." },
          ].map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="block h-full rounded-3xl border bg-card p-4 hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <p className="font-heading text-lg">{c.title}</p>
                <p className="text-sm text-muted-foreground">{c.text}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
