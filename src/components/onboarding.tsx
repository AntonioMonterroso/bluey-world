"use client";

import Image from "next/image";
import { useState } from "react";
import { ChefHat, ChevronLeft, ChevronRight, Gamepad2, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/fields";
import { Character } from "@/components/character";
import { saveBakery } from "@/lib/bakery";
import { BRAND } from "@/lib/brand";
import { CHARACTERS, getCharacter } from "@/lib/characters";
import { updateProfile, useProfile } from "@/lib/db/profile";
import { anchorsFor } from "@/lib/game/anchors";
import { upsertRow } from "@/lib/db/repo";
import type { OwnedItem } from "@/lib/db/db";
import { THEMES, type ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const INTERESTS = [
  { id: "cocina", label: "Cocinar y hornear", icon: ChefHat },
  { id: "dinero", label: "Llevar bien mi dinero", icon: Wallet },
  { id: "juego", label: "Jugar y divertirme", icon: Gamepad2 },
] as const;

// En el registro se puede elegir cualquier personaje (que se pueda vestir): el elegido queda de regalo.
const STARTERS = CHARACTERS.filter((c) => anchorsFor(c.id));

type Step = "hola" | "nombre" | "apodo" | "personaje" | "paleta" | "local" | "cumple" | "gusto" | "listo";
const ORDER: Step[] = ["hola", "nombre", "apodo", "personaje", "paleta", "local", "cumple", "gusto", "listo"];
// Quién habla en cada paso (el personaje elegido saluda al final).
const SPEAKER: Record<Step, string> = { hola: "bingo", nombre: "bluey", apodo: "chilli", personaje: "bingo", paleta: "coco", local: "bandit", cumple: "muffin", gusto: "chilli", listo: "" };

/** Registro inicial: los personajes te preguntan lo básico, uno por uno. */
export function Onboarding() {
  const { profile } = useProfile();
  const [step, setStep] = useState<Step>("hola");
  const [name, setName] = useState(profile.name ?? "");
  const [nick, setNick] = useState(profile.nickname ?? "");
  const [char, setChar] = useState(STARTERS.some((c) => c.id === profile.character) ? profile.character : (STARTERS[0]?.id ?? "bluey"));
  const [theme, setTheme] = useState<ThemeId>((profile.theme as ThemeId) ?? THEMES[0].id);
  const [local, setLocal] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [interest, setInterest] = useState<"cocina" | "dinero" | "juego" | null>(null);
  const [saving, setSaving] = useState(false);

  const i = ORDER.indexOf(step);
  const call = nick.trim() || name.trim();
  const go = (d: 1 | -1) => setStep(ORDER[Math.max(0, Math.min(ORDER.length - 1, i + d))]);
  const speaker = step === "listo" ? char : SPEAKER[step];
  const sp = getCharacter(speaker);

  function pickTheme(t: ThemeId) {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  }

  async function finish() {
    setSaving(true);
    const birthday = day && month ? `${month.padStart(2, "0")}-${day.padStart(2, "0")}` : undefined;
    await updateProfile({ name: name.trim(), nickname: nick.trim() || undefined, character: char, theme, birthday, interest: interest ?? undefined, onboarded_at: Date.now() });
    try { localStorage.setItem("bw-theme", theme); } catch {}
    await upsertRow<OwnedItem>("owned_items", { id: `char:${char}`, bought_at: Date.now() });
    await saveBakery({ name: local.trim() || `${BRAND.tycoon}` });
  }

  const lines: Record<Step, string> = {
    hola: `¡Hola! Bienvenida a ${BRAND.app}. Antes de empezar, queremos conocerte un poquito. Son preguntas cortitas, lo prometo.`,
    nombre: "¿Cómo te llamas?",
    apodo: `¡Qué bonito nombre${name.trim() ? `, ${name.trim()}` : ""}! ¿Cómo te gusta que te digamos? Puede ser un apodo.`,
    personaje: "¿Con quién quieres jugar? Elige a quien quieras: te lo regalamos. Te acompaña en toda la app.",
    paleta: "Ahora lo importante: ¿de qué color pintamos todo?",
    local: "Toda pastelera necesita un letrero. ¿Cómo se llama tu pastelería?",
    cumple: "¿Cuándo es tu cumpleaños? Así te celebramos ese día. Si prefieres no decirlo, sigue.",
    gusto: "Y por último: ¿qué es lo que más te gusta hacer aquí? Así ordenamos tu inicio.",
    listo: `¡Listo, ${call || "amiga"}! ${local.trim() ? `${local.trim()} ya tiene su letrero.` : "Tu pastelería ya tiene su letrero."} Cuando quieras, empezamos.`,
  };

  const canNext = step === "nombre" ? name.trim().length >= 2 : true;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-3xl flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-heading text-2xl">{BRAND.app}</p>
          <p className="text-sm font-semibold text-muted-foreground" aria-live="polite">Paso {i + 1} de {ORDER.length}</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label="Avance del registro" aria-valuemin={1} aria-valuemax={ORDER.length} aria-valuenow={i + 1}>
          <div className="h-full rounded-full bg-primary" style={{ width: `${((i + 1) / ORDER.length) * 100}%`, transition: "width 300ms cubic-bezier(0.23, 1, 0.32, 1)" }} />
        </div>

        <section className="grid items-end gap-4 sm:grid-cols-[10rem_1fr]">
          <div className="flex justify-center">
            {step === "listo" ? <Character id={char} interactive={false} buddy className="h-44" /> : <Image src={sp.src} alt="" width={sp.w} height={sp.h} priority className="h-44 w-auto object-contain" />}
          </div>
          <div className="relative rounded-[2rem] border bg-card p-5 text-lg leading-relaxed">
            <p className="mb-1 text-sm font-semibold text-primary">{sp.name}</p>
            <p aria-live="polite">{lines[step]}</p>
          </div>
        </section>

        <div className="rounded-[2rem] bg-secondary p-5">
          {step === "hola" && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Sparkles className="size-4 text-primary" aria-hidden /> Todo se puede cambiar después en Ajustes.</p>}
          {step === "nombre" && (
            <div className="flex flex-col gap-2"><label htmlFor="ob-nombre" className={labelClass}>Tu nombre</label><input id="ob-nombre" autoFocus className={inputClass} value={name} maxLength={30} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && canNext) go(1); }} /></div>
          )}
          {step === "apodo" && (
            <div className="flex flex-col gap-2"><label htmlFor="ob-apodo" className={labelClass}>Cómo te decimos (opcional)</label><input id="ob-apodo" autoFocus className={inputClass} value={nick} maxLength={24} placeholder={name.trim()} onChange={(e) => setNick(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") go(1); }} /></div>
          )}
          {step === "personaje" && (
            <div role="radiogroup" aria-label="Tu personaje" className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {STARTERS.map((c) => (
                <button key={c.id} type="button" role="radio" aria-checked={char === c.id} onClick={() => setChar(c.id)} className={cn("flex flex-col items-center gap-1 rounded-3xl border-2 bg-card p-2 text-xs font-semibold", char === c.id ? "border-primary" : "border-transparent")}>
                  <Image src={c.src} alt="" width={c.w} height={c.h} className="h-20 w-auto object-contain" />{c.name}
                </button>
              ))}
            </div>
          )}
          {step === "paleta" && (
            <div role="radiogroup" aria-label="Paleta de colores" className="flex flex-wrap gap-3">
              {THEMES.map((t) => (
                <button key={t.id} type="button" role="radio" aria-checked={theme === t.id} onClick={() => pickTheme(t.id)} className={cn("flex min-h-12 items-center gap-2 rounded-full border-2 bg-card py-2 pl-2 pr-4 text-sm font-semibold", theme === t.id ? "border-primary" : "border-transparent")}>
                  <span className="flex">{t.swatch.map((c) => <span key={c} className="-ml-1 size-7 rounded-full border-2 border-card first:ml-0" style={{ background: c }} />)}</span>{t.name}
                </button>
              ))}
            </div>
          )}
          {step === "local" && (
            <div className="flex flex-col gap-2"><label htmlFor="ob-local" className={labelClass}>Nombre de tu pastelería</label><input id="ob-local" autoFocus className={inputClass} value={local} maxLength={30} placeholder="Ej. Dulce Esquina" onChange={(e) => setLocal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") go(1); }} /></div>
          )}
          {step === "cumple" && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-2"><label htmlFor="ob-dia" className={labelClass}>Día</label><select id="ob-dia" className={`${inputClass} w-24`} value={day} onChange={(e) => setDay(e.target.value)}><option value="">—</option>{Array.from({ length: 31 }, (_, k) => <option key={k} value={String(k + 1)}>{k + 1}</option>)}</select></div>
              <div className="flex flex-col gap-2"><label htmlFor="ob-mes" className={labelClass}>Mes</label><select id="ob-mes" className={`${inputClass} w-44`} value={month} onChange={(e) => setMonth(e.target.value)}><option value="">—</option>{MONTHS.map((m, k) => <option key={m} value={String(k + 1)}>{m}</option>)}</select></div>
            </div>
          )}
          {step === "gusto" && (
            <div role="radiogroup" aria-label="Lo que más te gusta" className="grid gap-2 sm:grid-cols-3">
              {INTERESTS.map((o) => {
                const Icon = o.icon;
                return (
                  <button key={o.id} type="button" role="radio" aria-checked={interest === o.id} onClick={() => setInterest(o.id)} className={cn("flex min-h-14 items-center gap-2 rounded-2xl border-2 bg-card px-4 text-left font-semibold", interest === o.id ? "border-primary" : "border-transparent")}>
                    <Icon className="size-5 text-primary" aria-hidden /> {o.label}
                  </button>
                );
              })}
            </div>
          )}
          {step === "listo" && <p className="text-sm text-muted-foreground">Tu personaje y tus colores ya quedaron. En la Historia te esperan los vecinos de Dulce Villa.</p>}
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" className="h-12 rounded-2xl" disabled={i === 0 || saving} onClick={() => go(-1)}><ChevronLeft aria-hidden /> Atrás</Button>
          {step === "listo" ? (
            <Button className="h-12 rounded-2xl px-8 text-base" disabled={saving} onClick={() => void finish()}>{saving ? "Guardando…" : "Empezar"}</Button>
          ) : (
            <Button className="h-12 rounded-2xl px-8 text-base" disabled={!canNext} onClick={() => go(1)}>{step === "hola" ? "¡Vamos!" : "Siguiente"} <ChevronRight aria-hidden /></Button>
          )}
        </div>
      </div>
    </main>
  );
}
