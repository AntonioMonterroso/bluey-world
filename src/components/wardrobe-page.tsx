"use client";

import { useState } from "react";
import { Coins, Dices, Pencil, Save, Shirt, Star, Sun, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DressedImage } from "@/components/dressed-image";
import { WearTuner } from "@/components/wear-tuner";
import { WardrobeStage } from "@/components/wardrobe-stage";
import { inputClass, labelClass } from "@/components/ui/fields";
import { useStaff } from "@/lib/bakery-team";
import { getCharacter } from "@/lib/characters";
import { upsertRow } from "@/lib/db/repo";
import { updateProfile, useProfile } from "@/lib/db/profile";
import type { BakeryStaff } from "@/lib/db/db";
import { anchorsFor } from "@/lib/game/anchors";
import { dayKey } from "@/lib/game/engine";
import { encodeWear, idOf, parseWear } from "@/lib/game/outfit";
import { owns } from "@/lib/game/shop";
import { buyItem, useGame } from "@/lib/game/use-game";
import { WEAR_ITEMS, WEAR_SLOTS, wearById, type WearItem, type WearSlot } from "@/lib/game/wardrobe";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

type Outfit = Record<string, string>;
const MAX_LOOKS = 12;

function Inner() {
  const { ready, profile } = useProfile();
  const game = useGame();
  const staff = useStaff();
  const [target, setTarget] = useState<"me" | string>("me"); // a quién vistes: tú o alguien del equipo
  const [slot, setSlot] = useState<WearSlot>("head");
  const [tryOn, setTryOn] = useState<Record<string, string | null>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [lookName, setLookName] = useState("");
  if (!ready || !game.ready || !staff) return null;

  const member: BakeryStaff | undefined = target === "me" ? undefined : staff.find((s) => s.id === target);
  const charId = member ? member.char : profile.character;
  const outfit: Outfit = (member ? member.outfit : profile.outfit) ?? {};
  const looks = profile.looks ?? [];
  const ch = getCharacter(charId);
  const dressable = anchorsFor(charId) !== null;

  const preview: Outfit = { ...outfit };
  for (const [s, id] of Object.entries(tryOn)) {
    if (id) preview[s] = id;
    else delete preview[s];
  }
  const trying = Object.keys(tryOn).length > 0;

  async function setOutfit(next: Outfit) {
    if (member) await upsertRow<BakeryStaff>("bakery_staff", { ...member, outfit: next });
    else await updateProfile({ outfit: next });
  }

  async function wear(item: WearItem) {
    if (!owns(item, game.ownedIds)) {
      const problem = await buyItem(item);
      if (problem) return setMessage(problem);
      setMessage(`¡Es tuyo! ${item.name}`);
    }
    const fit = profile.fits?.[`${charId}|${item.id}`];
    await setOutfit({ ...outfit, [item.slot]: fit ? encodeWear(item.id, fit) : item.id });
    setTryOn((t) => { const n = { ...t }; delete n[item.slot]; return n; });
  }

  /** Cambia cómo lleva una prenda y lo recuerda para este personaje, así no hay que ajustarla otra vez. */
  async function tune(slotId: string, value: string) {
    await setOutfit({ ...outfit, [slotId]: value });
    const { id, tweak } = parseWear(value);
    const key = `${charId}|${id}`;
    const fits = { ...(profile.fits ?? {}) };
    if (tweak.x || tweak.y || tweak.s !== 1 || tweak.r) fits[key] = { x: tweak.x, y: tweak.y, s: tweak.s, r: tweak.r };
    else delete fits[key];
    await updateProfile({ fits });
  }



  async function take(item: WearItem) {
    const next = { ...outfit };
    delete next[item.slot];
    await setOutfit(next);
  }

  async function surprise() {
    const mine = WEAR_ITEMS.filter((i) => owns(i, game.ownedIds));
    if (mine.length === 0) return setMessage("Compra algo primero para poder combinarlo.");
    const next: Outfit = {};
    for (const s of WEAR_SLOTS) {
      const options = mine.filter((i) => i.slot === s.id);
      if (options.length && Math.random() < 0.7) next[s.id] = options[Math.floor(Math.random() * options.length)].id;
    }
    setTryOn({});
    await setOutfit(next);
  }

  async function saveLook(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(outfit).length === 0) return setMessage("Ponle algo antes de guardar el look.");
    if (looks.length >= MAX_LOOKS) return setMessage(`Solo caben ${MAX_LOOKS} looks. Borra uno.`);
    await updateProfile({ looks: [...looks, { name: lookName.trim() || `Look ${looks.length + 1}`, outfit }] });
    setLookName("");
    setMessage("Look guardado.");
  }

  const saveLooks = (next: typeof looks) => updateProfile({ looks: next });
  const sortedIdx = looks.map((l, i) => ({ l, i })).sort((a, b) => Number(!!b.l.fav) - Number(!!a.l.fav) || a.i - b.i);

  /** Elige un look para hoy entre tus favoritos (o entre todos): el mismo todo el día. */
  async function lookOfTheDay() {
    const pool = looks.some((l) => l.fav) ? looks.filter((l) => l.fav) : looks;
    if (pool.length === 0) return setMessage("Guarda algún look primero.");
    const n = Number(dayKey(Date.now()).replace(/\D/g, "")) % pool.length;
    setTryOn({});
    await setOutfit(pool[n].outfit);
    setMessage(`Look del día: ${pool[n].name}.`);
  }

  const items = WEAR_ITEMS.filter((i) => i.slot === slot);
  const worn = outfit[slot];
  const wornItem = worn ? wearById(idOf(worn)) : undefined;

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Vestuario</h1>
        <p className="flex items-center gap-2 rounded-full bg-secondary px-5 py-2 font-heading text-xl">
          <Coins className="size-5 text-primary" aria-hidden /> {game.coins} monedas
        </p>
      </div>

      <section aria-label="A quién vistes" className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Vistes a</p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label="A quién vistes">
          <button type="button" role="radio" aria-checked={target === "me"} onClick={() => { setTarget("me"); setTryOn({}); }} className={cn("min-h-11 shrink-0 rounded-full border-2 px-5 text-sm font-semibold", target === "me" ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-card")}>
            Yo · {getCharacter(profile.character).name}
          </button>
          {staff.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={target === s.id} onClick={() => { setTarget(s.id); setTryOn({}); }} className={cn("min-h-11 shrink-0 rounded-full border-2 px-5 text-sm font-semibold", target === s.id ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-card")}>
              {getCharacter(s.char).name}
            </button>
          ))}
        </div>
        {staff.length === 0 && <p className="text-xs text-muted-foreground">Cuando contrates a alguien en Dulce Co., también podrás vestirlo aquí.</p>}
      </section>

      <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
        <section aria-label="Probador" className="flex flex-col gap-3 md:sticky md:top-4 md:self-start">
          <WardrobeStage
            charId={charId}
            outfit={preview}
            slot={slot}
            onSelect={(sl) => setSlot(sl as WearSlot)}
            onChange={(sl, v) => void tune(sl, v)}
            onDropItem={(id) => { const it = wearById(id); if (!it) return; setSlot(it.slot); if (owns(it, game.ownedIds)) void wear(it); else setTryOn((t) => ({ ...t, [it.slot]: it.id })); }}
            label={`Probador de ${ch.name}. Toca una prenda para elegirla y arrástrala; usa las asas para agrandarla o girarla. Con teclado: flechas, + y −, [ y ].`}
          />
          <p className="text-center text-xs text-muted-foreground">
            {Object.keys(outfit).length ? `Toca una prenda y arrástrala. Usa las asas para agrandarla o girarla (en el celular, también con dos dedos). Se recuerda para ${ch.name}.` : "Ponle algo, o arrastra una prenda del catálogo hasta el personaje."}
          </p>
          <p className="text-center text-sm font-semibold">{ch.name}{trying ? " · probando" : ""}</p>
          {!dressable && <p className="rounded-2xl border border-dashed bg-card p-3 text-sm text-muted-foreground">{ch.name} no se puede vestir porque son varios personajes juntos.</p>}
          <div className="flex flex-wrap gap-2">
            {trying && <Button variant="outline" className="h-11 rounded-2xl" onClick={() => setTryOn({})}>Dejar de probar</Button>}
            <Button variant="outline" className="h-11 rounded-2xl" onClick={() => void surprise()}><Dices aria-hidden /> Sorpréndeme</Button>
            <Button variant="ghost" className="h-11 rounded-2xl" disabled={Object.keys(outfit).length === 0} onClick={() => { setTryOn({}); void setOutfit({}); }}>Quitar todo</Button>
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-5">
          <p role="status" className="min-h-6 text-sm font-semibold text-primary">{message}</p>

          <div role="tablist" aria-label="Qué ponerle" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {WEAR_SLOTS.map((s) => (
              <button key={s.id} type="button" role="tab" aria-selected={slot === s.id} onClick={() => setSlot(s.id)} className={cn("flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-2 px-5 text-sm font-semibold", slot === s.id ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-card hover:border-border")}>
                {s.label}
                {outfit[s.id] && <span className="size-2 rounded-full bg-current" aria-label="con algo puesto" />}
              </button>
            ))}
          </div>

          {worn && wornItem && (
            <WearTuner name={wornItem.name} value={worn} onChange={(v) => void tune(slot, v)} />
          )}

          <ul className="grid grid-cols-2 gap-3 xl:grid-cols-3" role="tabpanel">
            {items.map((item) => {
              const mine = owns(item, game.ownedIds);
              const on = !!worn && idOf(worn) === item.id;
              const tried = tryOn[item.slot] === item.id;
              const missing = item.price - game.coins;
              return (
                <li key={item.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/wear", item.id); e.dataTransfer.effectAllowed = "copy"; }} className={cn("flex cursor-grab flex-col gap-2 rounded-3xl border bg-card p-3", on && "border-primary")}>
                  <div className="flex h-28 items-center justify-center overflow-hidden rounded-2xl bg-secondary/60">
                    <DressedImage char={charId} outfit={{ [item.slot]: item.id }} className="h-24" />
                  </div>
                  <p className="text-center font-semibold">{item.name}</p>
                  <div className="flex flex-col gap-2">
                    {!on && (
                      <Button variant={tried ? "secondary" : "outline"} aria-pressed={tried} className="h-11 w-full rounded-2xl px-2" onClick={() => setTryOn((t) => (tried ? Object.fromEntries(Object.entries(t).filter(([k]) => k !== item.slot)) : { ...t, [item.slot]: item.id }))}>
                        <Shirt aria-hidden /> Probar
                      </Button>
                    )}
                    {mine ? (
                      <Button variant={on ? "secondary" : "default"} className="h-11 w-full rounded-2xl px-2" onClick={() => void (on ? take(item) : wear(item))}>
                        {on ? "Quitar" : "Poner"}
                      </Button>
                    ) : item.event ? (
                      <p className="rounded-2xl bg-secondary px-2 py-3 text-center text-xs font-semibold">Evento: {item.event}</p>
                    ) : (
                      <Button disabled={missing > 0} className="h-11 w-full rounded-2xl px-2" onClick={() => void wear(item)}>
                        <Coins aria-hidden /> {item.price}
                      </Button>
                    )}
                  </div>
                  {!mine && !item.event && missing > 0 && <p className="text-center text-xs text-muted-foreground">Te faltan {missing}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <section aria-labelledby="looks" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="looks" className="text-2xl">Mis looks</h2>
          <Button variant="outline" className="h-11 rounded-2xl" onClick={() => void lookOfTheDay()}><Sun aria-hidden /> Look del día</Button>
        </div>
        <form onSubmit={saveLook} className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-48 flex-1 flex-col gap-2">
            <label htmlFor="nombre-look" className={labelClass}>Guardar lo que lleva puesto {member ? ch.name : "tu personaje"}</label>
            <input id="nombre-look" className={inputClass} value={lookName} maxLength={24} onChange={(e) => setLookName(e.target.value)} placeholder={`Look ${looks.length + 1}`} />
          </div>
          <Button type="submit" className="h-12 rounded-2xl px-5"><Save aria-hidden /> Guardar look</Button>
        </form>
        {looks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Guarda combinaciones (con sus colores y ajustes) para ponerlas con un toque. Marca tus favoritos con la estrella: el «Look del día» elige entre ellos.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sortedIdx.map(({ l, i }) => (
              <li key={`${l.name}-${i}`} className="flex flex-col items-center gap-2 rounded-3xl border bg-card p-3">
                <div className="flex h-24 items-center justify-center">
                  <DressedImage char={charId} outfit={l.outfit} className="h-24" />
                </div>
                <p className="flex w-full items-center justify-center gap-1 truncate text-center text-sm font-semibold">{l.fav && <Star className="size-4 shrink-0 fill-current text-primary" aria-hidden />} <span className="truncate">{l.name}</span></p>
                <div className="flex w-full flex-wrap justify-center gap-1">
                  <Button className="h-11 min-w-0 flex-1 rounded-2xl px-2" onClick={() => { setTryOn({}); void setOutfit(l.outfit); }}>Usar</Button>
                  <button type="button" aria-pressed={!!l.fav} aria-label={l.fav ? `Quitar ${l.name} de favoritos` : `Marcar ${l.name} como favorito`} onClick={() => void saveLooks(looks.map((x, k) => (k === i ? { ...x, fav: !x.fav } : x)))} className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent/60"><Star className={cn("size-4", l.fav && "fill-current text-primary")} aria-hidden /></button>
                  <button type="button" aria-label={`Cambiar el nombre de ${l.name}`} onClick={() => { const n = prompt("Nuevo nombre del look", l.name)?.trim(); if (n) void saveLooks(looks.map((x, k) => (k === i ? { ...x, name: n.slice(0, 24) } : x))); }} className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent/60"><Pencil className="size-4" aria-hidden /></button>
                  <button type="button" aria-label={`Borrar ${l.name}`} onClick={() => void saveLooks(looks.filter((_, k) => k !== i))} className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent/60"><Trash2 className="size-4" aria-hidden /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function WardrobePage() {
  return useIsClient() ? <Inner /> : null;
}
