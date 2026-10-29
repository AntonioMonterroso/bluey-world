"use client";

import { Check } from "lucide-react";
import { THEMES, type ThemeId } from "@/lib/themes";
import { updateProfile, useProfile } from "@/lib/db/profile";
import { cn } from "@/lib/utils";

export function ThemePicker() {
  const { profile } = useProfile();
  const current = profile.theme as ThemeId;

  function choose(id: ThemeId) {
    document.documentElement.setAttribute("data-theme", id);
    void updateProfile({ theme: id });
  }

  return (
    <div role="radiogroup" aria-label="Paleta de colores" className="flex flex-wrap gap-3">
      {THEMES.map((t) => {
        const selected = t.id === current;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => choose(t.id)}
            className={cn(
              "flex min-h-12 items-center gap-2 rounded-full border-2 bg-card py-2 pl-2 pr-4 text-sm font-semibold",
              selected ? "border-primary" : "border-transparent hover:border-border",
            )}
          >
            <span className="flex -space-x-2" aria-hidden>
              {t.swatch.map((c) => (
                <span
                  key={c}
                  className="size-6 rounded-full border-2 border-card"
                  style={{ backgroundColor: c }}
                />
              ))}
            </span>
            {t.name}
            {selected && <Check className="size-4 text-primary" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}
