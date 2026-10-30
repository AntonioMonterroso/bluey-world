"use client";

import { inputClass, labelClass } from "@/components/ui/fields";
import { updateProfile, useProfile } from "@/lib/db/profile";
import { cn } from "@/lib/utils";

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Apodo, cumpleaños y lo que más te gusta (lo mismo que pide el registro inicial). */
export function ProfileExtras() {
  const { ready, profile } = useProfile();
  if (!ready) return null;
  const [m, d] = (profile.birthday ?? "-").split("-");
  const setBirthday = (mm: string, dd: string) => void updateProfile({ birthday: mm && dd ? `${mm.padStart(2, "0")}-${dd.padStart(2, "0")}` : undefined });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="aj-apodo" className={labelClass}>Cómo te decimos</label>
        <input id="aj-apodo" className={inputClass} defaultValue={profile.nickname ?? ""} maxLength={24} onBlur={(e) => void updateProfile({ nickname: e.target.value.trim() || undefined })} />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2"><label htmlFor="aj-dia" className={labelClass}>Cumpleaños: día</label>
          <select id="aj-dia" className={`${inputClass} w-24`} value={d ? String(Number(d)) : ""} onChange={(e) => setBirthday(m ? String(Number(m)) : "", e.target.value)}><option value="">—</option>{Array.from({ length: 31 }, (_, k) => <option key={k} value={String(k + 1)}>{k + 1}</option>)}</select>
        </div>
        <div className="flex flex-col gap-2"><label htmlFor="aj-mes" className={labelClass}>Mes</label>
          <select id="aj-mes" className={`${inputClass} w-44`} value={m && m !== "" ? String(Number(m)) : ""} onChange={(e) => setBirthday(e.target.value, d ? String(Number(d)) : "")}><option value="">—</option>{MONTHS.map((x, k) => <option key={x} value={String(k + 1)}>{x}</option>)}</select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className={labelClass}>Lo que más te gusta</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Lo que más te gusta">
          {([["cocina", "Cocinar"], ["dinero", "Mi dinero"], ["juego", "Jugar"]] as const).map(([id, label]) => (
            <button key={id} type="button" role="radio" aria-checked={profile.interest === id} onClick={() => void updateProfile({ interest: id })} className={cn("min-h-11 rounded-full border-2 px-4 text-sm font-semibold", profile.interest === id ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-card")}>{label}</button>
          ))}
        </div>
      </div>
      <button type="button" onClick={() => void updateProfile({ onboarded_at: undefined })} className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary underline underline-offset-4">Volver a hacer el registro inicial</button>
    </div>
  );
}
