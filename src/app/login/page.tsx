"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** La entrada ahora es la primera pantalla de la app; esta dirección solo lleva al inicio. */
export default function LoginPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/"); }, [router]);
  return null;
}
