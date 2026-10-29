"use client";

import { useEffect, useRef, useState } from "react";
import { updateProfile, useProfile } from "@/lib/db/profile";

function NameInput({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function change(next: string) {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void updateProfile({ name: next }), 400);
  }

  return (
    <input
      id="user-name"
      type="text"
      value={value}
      maxLength={30}
      autoComplete="given-name"
      placeholder="Tu nombre"
      onChange={(e) => change(e.target.value)}
      className="h-12 w-full max-w-xs rounded-2xl border-2 border-border bg-card px-4 text-base outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-ring/30"
    />
  );
}

export function NameField() {
  const { ready, profile } = useProfile();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="user-name" className="text-sm font-semibold">
        ¿Cómo te llamas?
      </label>
      {ready ? (
        <NameInput initial={profile.name} />
      ) : (
        <div className="h-12 w-full max-w-xs rounded-2xl border-2 border-border bg-card" aria-hidden />
      )}
    </div>
  );
}
