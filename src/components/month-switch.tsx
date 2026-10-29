"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, monthLabel } from "@/lib/budget";

export function MonthSwitch({ month, onChange }: { month: Date; onChange: (d: Date) => void }) {
  return (
    <div className="flex items-center gap-1 self-start rounded-full bg-card p-1" role="group" aria-label="Mes">
      <button type="button" aria-label="Mes anterior" onClick={() => onChange(addMonths(month, -1))} className="flex size-11 items-center justify-center rounded-full hover:bg-accent/60">
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <span className="min-w-36 text-center font-semibold first-letter:uppercase" aria-live="polite">{monthLabel(month)}</span>
      <button type="button" aria-label="Mes siguiente" onClick={() => onChange(addMonths(month, 1))} className="flex size-11 items-center justify-center rounded-full hover:bg-accent/60">
        <ChevronRight className="size-5" aria-hidden />
      </button>
    </div>
  );
}
