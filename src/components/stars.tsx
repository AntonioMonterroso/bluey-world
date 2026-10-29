import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Estrellas de reputación (1 a 5, con medias estrellas). */
export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-primary", className)} role="img" aria-label={`${value.toFixed(1)} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className="relative inline-block size-5" aria-hidden>
            <Star className="absolute inset-0 size-5 text-primary/30" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="size-5 fill-current" />
            </span>
          </span>
        );
      })}
    </span>
  );
}
