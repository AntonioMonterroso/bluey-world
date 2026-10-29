"use client";

import { useProfile } from "@/lib/db/profile";

export function Greeting() {
  const { profile } = useProfile();
  const name = profile.name.trim();
  return (
    <h1 className="text-balance text-4xl leading-tight md:text-5xl">
      {name ? `¡Hola, ${name}!` : "¡Hola!"}
    </h1>
  );
}
