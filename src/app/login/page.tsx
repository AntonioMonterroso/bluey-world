"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { normalizeUsername, signIn, signUp, useAuth } from "@/lib/auth";

const inputClass =
  "h-12 w-full rounded-2xl border-2 border-border bg-card px-4 text-base outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-ring/30";

export default function LoginPage() {
  const router = useRouter();
  const { configured, ready, user } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (normalizeUsername(username).length < 3) {
      setError("El usuario necesita al menos 3 letras o números.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setBusy(true);
    const problem = mode === "in" ? await signIn(username, password) : await signUp(username, password);
    setBusy(false);
    if (problem) setError(problem);
    else router.push("/");
  }

  if (ready && user) {
    return (
      <div className="flex max-w-md flex-col gap-4">
        <h1 className="text-4xl">Ya entraste</h1>
        <Button onClick={() => router.push("/")}>Ir al inicio</Button>
      </div>
    );
  }

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl">{mode === "in" ? "Entrar" : "Crear cuenta"}</h1>
        <p className="text-muted-foreground">
          Con tu cuenta tus recetas y tu progreso se respaldan en la nube y puedes usarlos en el
          celular y en la computadora. La app también funciona sin cuenta.
        </p>
      </div>

      {ready && !configured && (
        <Card className="p-5 text-sm">
          <p className="font-semibold">Falta conectar la nube.</p>
          <p className="mt-1 text-muted-foreground">
            Mientras tanto todo se guarda solo en este dispositivo.
          </p>
        </Card>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor="usuario" className="text-sm font-semibold">
            Usuario
          </label>
          <input
            id="usuario"
            className={inputClass}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={30}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="clave" className="text-sm font-semibold">
            Contraseña
          </label>
          <input
            id="clave"
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
          />
        </div>
        {error && (
          <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={busy || !configured} className="h-12 rounded-2xl text-base">
          {busy ? "Un momento…" : mode === "in" ? "Entrar" : "Crear cuenta"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "in" ? "up" : "in");
          setError(null);
        }}
        className="w-fit text-sm font-semibold text-primary underline underline-offset-4"
      >
        {mode === "in" ? "No tengo cuenta, crear una" : "Ya tengo cuenta, entrar"}
      </button>
    </div>
  );
}
