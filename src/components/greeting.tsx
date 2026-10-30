"use client";

import { useProfile } from "@/lib/db/profile";
import { getCharacter } from "@/lib/characters";
import { greetingFor } from "@/lib/greetings";

/** Saludo del inicio: cambia con la hora, tu cumpleaños y lo que más te gusta; tu personaje te dice algo. */
export function Greeting() {
  const { profile } = useProfile();
  const g = greetingFor(profile, Date.now());
  const ch = getCharacter(profile.character);
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-balance text-4xl leading-tight md:text-5xl">{g.title}</h1>
      <p className="relative w-fit max-w-prose rounded-3xl rounded-bl-md bg-card px-4 py-3 text-pretty shadow-sm">
        <span className="mb-0.5 block text-xs font-semibold text-primary">{ch.name}</span>
        {g.line}
      </p>
    </div>
  );
}
