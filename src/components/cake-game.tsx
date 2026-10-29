"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CakeArt } from "@/components/cake-art";
import { Stars } from "@/components/stars";
import { sfx } from "@/lib/sfx";
import { FROSTINGS, MAX_TOPPINGS, TOPPINGS, describeRequest, frostingName, scoreCake, toppingName, type CakeRequest, type CakeScore } from "@/lib/game/cake";
import { cn } from "@/lib/utils";

/** Minijuego "Decora la torta": elige la crema y los adornos que pidió el cliente. */
export function CakeGame({
  request, who, onDone, onCancel,
}: {
  request: CakeRequest;
  who: string;
  onDone: (score: CakeScore) => void;
  onCancel: () => void;
}) {
  const [frosting, setFrosting] = useState<string | null>(null);
  const [toppings, setToppings] = useState<string[]>([]);
  const [score, setScore] = useState<CakeScore | null>(null);

  function toggle(id: string) {
    sfx("click");
    setToppings((t) => (t.includes(id) ? t.filter((x) => x !== id) : t.length >= MAX_TOPPINGS ? t : [...t, id]));
  }

  function deliver() {
    const s = scoreCake(request, { frosting, toppings });
    setScore(s);
    sfx(s.quality >= 0.75 ? "success" : "serve");
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Decora la torta" className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-foreground/40 p-3 sm:items-center">
      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-[2rem] bg-background p-5 shadow-xl">
        <div>
          <h2 className="text-2xl">Decora la torta</h2>
          <p className="text-sm text-muted-foreground">Pedido de {who}</p>
        </div>

        <div className="rounded-2xl bg-secondary p-3">
          <p className="text-sm font-semibold">{describeRequest(request)}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <CakeArt frosting={frosting} toppings={toppings} className="mx-auto max-w-xs" />

          <div className="flex flex-col gap-4">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Crema</legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Crema">
                {FROSTINGS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="radio"
                    aria-checked={frosting === f.id}
                    aria-label={f.name}
                    disabled={!!score}
                    onClick={() => { sfx("click"); setFrosting(f.id); }}
                    className={cn("flex size-12 items-center justify-center rounded-full border-4", frosting === f.id ? "border-primary" : "border-card")}
                    style={{ background: f.color }}
                  >
                    {frosting === f.id && <Check className="size-5 text-foreground/70" aria-hidden />}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Adornos ({toppings.length} de {MAX_TOPPINGS})</legend>
              <div className="flex flex-wrap gap-2">
                {TOPPINGS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={toppings.includes(t.id)}
                    disabled={!!score}
                    onClick={() => toggle(t.id)}
                    className={cn("min-h-11 rounded-full border-2 px-4 text-sm font-semibold", toppings.includes(t.id) ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-card hover:border-border")}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        {score ? (
          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4" role="status">
            <p className="flex items-center gap-2 font-heading text-xl">Quedó así: <Stars value={score.stars} /></p>
            <p className="text-sm text-muted-foreground">
              {score.quality >= 0.95 ? "¡Exactamente como la pidió!" : [
                !score.frostingOk && `La crema debía ser ${frostingName(request.frosting)}.`,
                score.missing.length > 0 && `Faltó: ${score.missing.map(toppingName).join(", ")}.`,
                score.extras.length > 0 && `Sobró: ${score.extras.map(toppingName).join(", ")}.`,
              ].filter(Boolean).join(" ")}
            </p>
            <Button className="h-12 w-fit rounded-2xl px-6" onClick={() => onDone(score)}>Entregar</Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button className="h-12 rounded-2xl px-6 text-base" disabled={!frosting} onClick={deliver}>Terminé la torta</Button>
            <Button variant="ghost" className="h-12 rounded-2xl px-6 text-base" onClick={onCancel}>Ahora no</Button>
          </div>
        )}
      </div>
    </div>
  );
}
