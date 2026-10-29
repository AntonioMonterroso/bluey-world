"use client";

import Image from "next/image";
import { useState } from "react";
import { Cake, Coins, GraduationCap, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fireEmployee, giftEmployee, hireEmployee, setOnDuty, setRole, trainEmployee, useStaff, useUpgradeLevels } from "@/lib/bakery-team";
import { CHARACTERS, getCharacter } from "@/lib/characters";
import type { BakeryStaff } from "@/lib/db/db";
import { useProfile } from "@/lib/db/profile";
import { dayKey } from "@/lib/game/engine";
import {
  GIFT_COST, MAX_LEVEL, MAX_STAFF, PROMOTE_EVERY, ROLES, candidatesFor, dutyLimit, effectiveLevel, moodNow, roleLabel,
  trainCost, wageOf, type Candidate,
} from "@/lib/game/team";
import { useGame } from "@/lib/game/use-game";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

const moodText = (m: number) => (m >= 60 ? "Contenta" : m >= 30 ? "Algo cansada" : m >= 20 ? "Muy cansada" : "Agotada");

function Employee({ s, now, onMessage }: { s: BakeryStaff; now: number; onMessage: (m: string | null) => void }) {
  const ch = getCharacter(s.char);
  const mood = moodNow(s, now);
  const [confirm, setConfirm] = useState(false);
  const eff = effectiveLevel(s, now);
  const run = async (p: Promise<string | null>) => onMessage(await p);

  return (
    <li className={cn("flex flex-col gap-3 rounded-3xl border bg-card p-4", s.on_duty && "border-primary")}>
      <div className="flex items-center gap-3">
        <Image src={ch.src} alt="" width={ch.w} height={ch.h} className="h-20 w-auto shrink-0 object-contain" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-lg">{ch.name}</p>
          <p className="text-xs text-muted-foreground">
            Nivel {s.level} · le gusta {roleLabel(s.specialty)} · sueldo {wageOf(s.level)} por turno
          </p>
          <p className="text-xs text-muted-foreground">
            {s.worked % PROMOTE_EVERY} de {PROMOTE_EVERY} turnos para el ascenso{s.level >= MAX_LEVEL ? " (ya es el máximo)" : ""}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={s.on_duty}
          aria-label={`${ch.name} trabaja en el próximo turno`}
          onClick={() => void run(setOnDuty(s, !s.on_duty))}
          className={cn("flex h-11 w-16 shrink-0 items-center rounded-full border-2 p-1", s.on_duty ? "justify-end border-primary bg-primary" : "justify-start border-border bg-card")}
        >
          <span className={cn("size-7 rounded-full", s.on_duty ? "bg-primary-foreground" : "bg-muted-foreground/40")} />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs font-semibold">
          <span>{moodText(mood)}</span>
          <span className="text-muted-foreground">{eff > 0 ? `rinde como nivel ${eff}` : "no puede trabajar"}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label="Ánimo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(mood)}>
          <div className={cn("h-full rounded-full", mood >= 60 ? "bg-primary" : mood >= 30 ? "bg-amber-500" : "bg-destructive")} style={{ width: `${mood}%` }} />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`puesto-${s.id}`} className="text-xs font-semibold">Puesto</label>
          <select id={`puesto-${s.id}`} value={s.role} onChange={(e) => void setRole(s, e.target.value)} className="h-11 rounded-2xl border-2 border-border bg-card px-3 text-sm font-semibold">
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>
        <Button variant="outline" className="h-11 rounded-2xl" disabled={s.level >= MAX_LEVEL} onClick={() => void run(trainEmployee(s))}>
          <GraduationCap aria-hidden /> Entrenar · {s.level >= MAX_LEVEL ? "máx." : trainCost(s.level)} <Coins aria-hidden />
        </Button>
        <Button variant="outline" className="h-11 rounded-2xl" onClick={() => void run(giftEmployee(s))}>
          <Cake aria-hidden /> Pastelito · {GIFT_COST} <Coins aria-hidden />
        </Button>
        {confirm ? (
          <Button variant="destructive" className="h-11 rounded-2xl" onClick={() => void fireEmployee(s.id)}>Sí, despedir</Button>
        ) : (
          <Button variant="ghost" className="h-11 rounded-2xl" onClick={() => setConfirm(true)}><UserMinus aria-hidden /> Despedir</Button>
        )}
      </div>
    </li>
  );
}

function CandidateCard({ c, disabled, coins, onMessage }: { c: Candidate; disabled: boolean; coins: number; onMessage: (m: string | null) => void }) {
  const ch = getCharacter(c.char);
  return (
    <li className="flex flex-col items-center gap-2 rounded-3xl border bg-card p-4 text-center">
      <Image src={ch.src} alt="" width={ch.w} height={ch.h} className="h-24 w-auto object-contain" />
      <p className="font-heading text-lg">{ch.name}</p>
      <p className="text-xs text-muted-foreground">Le gusta {roleLabel(c.specialty)}</p>
      <Button disabled={disabled || coins < c.cost} className="h-11 w-full rounded-2xl" onClick={async () => onMessage((await hireEmployee(c)) ?? `¡${ch.name} ya trabaja contigo!`)}>
        <UserPlus aria-hidden /> Contratar · {c.cost} <Coins aria-hidden />
      </Button>
    </li>
  );
}

function TeamInner() {
  const staff = useStaff();
  const ups = useUpgradeLevels();
  const game = useGame();
  const { profile } = useProfile();
  const [message, setMessage] = useState<string | null>(null);
  if (!staff || !ups || !game.ready) return null;

  const now = Date.now();
  const hiredChars = staff.map((s) => s.char);
  const candidates = candidatesFor(dayKey(now), [...hiredChars, profile.character], CHARACTERS.map((c) => c.id));
  const working = staff.filter((s) => s.on_duty).length;

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Equipo</h1>
        <p className="flex items-center gap-2 rounded-full bg-secondary px-5 py-2 font-heading text-xl">
          <Coins className="size-5 text-primary" aria-hidden /> {game.coins} monedas
        </p>
      </div>
      <p className="text-muted-foreground">
        Puedes tener hasta {MAX_STAFF} empleados y {dutyLimit(ups)} trabajando a la vez. Quien trabaja un turno se cansa; si no descansa, rinde menos.
        Cada empleado cobra un sueldo por turno, que sale de lo que ganas vendiendo.
      </p>
      <p role="status" className="min-h-6 text-sm font-semibold text-primary">{message}</p>

      <section aria-labelledby="puestos" className="rounded-3xl bg-secondary p-5">
        <h2 id="puestos" className="mb-2 text-lg">Qué hace cada puesto</h2>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {ROLES.map((r) => <li key={r.id}><span className="font-semibold">{r.label}:</span> {r.desc}</li>)}
        </ul>
      </section>

      <section aria-labelledby="mi-equipo" className="flex flex-col gap-3">
        <h2 id="mi-equipo" className="text-2xl">Tu equipo ({staff.length} de {MAX_STAFF}) · {working} de {dutyLimit(ups)} trabajando</h2>
        {staff.length === 0 ? (
          <p className="rounded-3xl border border-dashed bg-card p-5 text-muted-foreground">Todavía no tienes empleados. Contrata a alguien abajo.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {staff.map((s) => <Employee key={s.id} s={s} now={now} onMessage={setMessage} />)}
          </ul>
        )}
      </section>

      <section aria-labelledby="candidatos" className="flex flex-col gap-3">
        <h2 id="candidatos" className="text-2xl">Se buscan empleados</h2>
        <p className="text-sm text-muted-foreground">Cada día se presentan personas distintas.</p>
        {candidates.length === 0 ? (
          <p className="text-muted-foreground">Hoy no hay más candidatos.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {candidates.map((c) => <CandidateCard key={c.id} c={c} disabled={staff.length >= MAX_STAFF} coins={game.coins} onMessage={setMessage} />)}
          </ul>
        )}
      </section>
    </div>
  );
}

export function TeamPage() {
  return useIsClient() ? <TeamInner /> : null;
}
