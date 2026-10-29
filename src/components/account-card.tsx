"use client";

import Link from "next/link";
import { Cloud, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signOut, useAuth, usernameOf } from "@/lib/auth";

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
        <Button variant="outline" onClick={() => void signOut()} className="rounded-2xl">
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
