"use client";

import { Character } from "@/components/character";
import { useProfile } from "@/lib/db/profile";

export function HeroCharacter() {
  const { ready, profile } = useProfile();
  if (!ready) return <div className="mx-auto h-32 md:h-52" aria-hidden />;
  return <Character id={profile.character} priority className="mx-auto h-32 md:h-52" />;
}
