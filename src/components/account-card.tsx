"use client";

import Link from "next/link";
import { Cloud, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { logout, useAuth, usernameOf } from "@/lib/auth";

export function AccountCard() {
  const { ready, user, configured } = useAuth();
  if (!ready) return null;

  return (
    <Card className="flex-row items-center gap-4 p-5">
      <Cloud className="size-7 shrink-0 text-primary" aria-hidden />
      <div className="flex-1">
        {user ? (
          <>
            <p className="font-semibold">Respaldo activo</p>
            <p className="text-sm text-muted-foreground">Sesión de {usernameOf(user)}</p>
          </>
        ) : (
          <>
            <p className="font-semibold">Respalda tu progreso</p>
            <p className="text-sm text-muted-foreground">
              {configured
                ? "Entra para guardar en la nube y usar otro dispositivo."
                : "La nube aún no está conectada; todo se guarda en este dispositivo."}
            </p>
          </>
        )}
      </div>
      {user ? (
        <Button
          variant="outline"
          className="h-11 rounded-2xl"
          onClick={async () => {
            const pending = await logout();
            if (pending > 0 && confirm(`Hay ${pending} cambios que todavía no se subieron (¿sin internet?). Si sales ahora, se pierden en este dispositivo. ¿Salir igual?`)) await logout(true);
          }}
        >
          <LogOut aria-hidden /> Salir
        </Button>
      ) : (
        configured && (
          <Button asChild className="h-11 rounded-2xl px-5">
            <Link href="/login">Entrar</Link>
          </Button>
        )
      )}
    </Card>
  );
}
