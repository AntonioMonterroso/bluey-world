"use client";

import Image from "next/image";
import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/fields";
import { BRAND } from "@/lib/brand";
import { getCharacter } from "@/lib/characters";
import { normalizeUsername, signIn } from "@/lib/auth";

/** Pantalla de entrada: sin cuenta no se ve la app. Las cuentas las crea quien administra la app. */
export function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ch = getCharacter("bluey");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.includes("@") && normalizeUsername(username).length < 3) return setError("Escribe tu usuario o tu correo.");
    if (password.length < 6) return setError("La contraseña tiene al menos 6 caracteres.");
    setBusy(true);
    const problem = await signIn(username, password);
    setBusy(false);
    if (problem) setError(problem);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-4xl items-center gap-8 md:grid-cols-[1fr_22rem]">
        <section className="hidden flex-col gap-4 md:flex">
          <h1 className="text-5xl leading-tight">{BRAND.app}</h1>
          <p className="max-w-md text-lg text-muted-foreground">Tus recetas, tu dinero y tu pastelería de juego, guardados en tu propia cuenta.</p>
          <Image src={ch.src} alt="" width={ch.w} height={ch.h} priority className="h-64 w-auto object-contain" />
        </section>

        <form onSubmit={submit} className="flex flex-col gap-5 rounded-[2rem] border bg-card p-6 sm:p-8" noValidate>
          <div className="flex items-center gap-3 md:hidden">
            <Image src={ch.src} alt="" width={ch.w} height={ch.h} priority className="h-20 w-auto object-contain" />
            <p className="font-heading text-3xl leading-tight">{BRAND.app}</p>
          </div>
          <div>
            <h2 className="text-3xl">Entrar</h2>
            <p className="mt-1 text-sm text-muted-foreground">Entra con tu usuario (o el correo de tu cuenta) para ver tus cosas. Cada cuenta guarda sus propios datos.</p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="usuario" className={labelClass}>Usuario o correo</label>
            <input id="usuario" className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={80} inputMode="email" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="clave" className={labelClass}>Contraseña</label>
            <input id="clave" type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {error && <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{error}</p>}
          <Button type="submit" size="lg" disabled={busy} className="h-12 rounded-2xl text-base"><LogIn aria-hidden /> {busy ? "Entrando…" : "Entrar"}</Button>
          <p className="text-xs text-muted-foreground">¿No tienes cuenta? Pídesela a quien te compartió la app.</p>
        </form>
      </div>
    </main>
  );
}
