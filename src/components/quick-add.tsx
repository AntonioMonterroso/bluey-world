"use client";

import { useState } from "react";
import { ArrowDownCircle, ArrowLeft, ArrowUpCircle, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { inputClass, labelClass } from "@/components/ui/fields";
import { saveExpense } from "@/lib/budget";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/money-core";
import { useAccounts } from "@/lib/money";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";

type Kind = "gasto" | "ingreso";
const QUICK = [10, 25, 50, 100, 200, 500];

/** Anotar en pasos cortos: ¿gastaste o te pagaron? → ¿cuánto? → ¿en qué? → ¿de qué cuenta? */
export function QuickAdd({ className }: { className?: string }) {
  const accounts = (useAccounts() ?? []).filter((a) => !a.archived);
  const fmt = useMoney();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<Kind>("gasto");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState<string>("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const value = Number(amount.replace(",", "."));
  const cats: readonly string[] = kind === "ingreso" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const steps = accounts.length > 0 ? 4 : 3;
  const accName = accounts.find((a) => a.id === account)?.name;

  function reset(next = false) {
    setStep(0); setAmount(""); setCategory(""); setAccount(""); setNote(""); setError(null);
    if (!next) setDone(null);
  }

  function goAmount() {
    if (!Number.isFinite(value) || value <= 0) return setError("Pon un monto mayor que cero.");
    setError(null);
    setStep(2);
  }

  async function save(acc: string) {
    await saveExpense({
      date: Date.now(), amount: value, kind, category, note: note.trim(), store: "", photo: null,
      account_id: acc || null, to_account_id: null, recurring_id: null,
    });
    const where = accounts.find((a) => a.id === acc)?.name;
    setDone(kind === "gasto"
      ? `Anotado: gastaste ${fmt(value)} en ${category}${where ? `, de ${where}` : ""}.`
      : `Anotado: te entraron ${fmt(value)} de ${category}${where ? `, a ${where}` : ""}.`);
    reset(true);
  }

  const question = ["¿Qué pasó con tu dinero?", kind === "gasto" ? "¿Cuánto gastaste?" : "¿Cuánto te entró?", kind === "gasto" ? "¿En qué lo gastaste?" : "¿De dónde vino?", kind === "gasto" ? "¿De dónde salió el dinero?" : "¿A dónde entró?"][step];

  return (
    <>
      <Button className={cn("h-14 rounded-2xl px-6 text-base", className)} onClick={() => { reset(); setOpen(true); }}>
        <Plus aria-hidden /> Anotar
      </Button>
      <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <SheetContent side="bottom" className="mx-auto max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] p-5 pb-8">
          <SheetHeader className="p-0">
            <p className="text-xs font-semibold text-muted-foreground">Paso {Math.min(step + 1, steps)} de {steps}</p>
            <SheetTitle className="font-heading text-2xl">{question}</SheetTitle>
            <SheetDescription className="sr-only">Anota un gasto o un ingreso en pocos pasos.</SheetDescription>
          </SheetHeader>

          {done && step === 0 && <p role="status" className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold"><Check className="size-4 text-primary" aria-hidden /> {done}</p>}

          {step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              {([["gasto", "Gasté", "Pagué algo o compré algo", ArrowDownCircle], ["ingreso", "Me pagaron", "Sueldo, una venta, un regalo", ArrowUpCircle]] as const).map(([id, label, hint, Icon]) => (
                <button key={id} type="button" onClick={() => { setKind(id); setCategory(""); setStep(1); setDone(null); }} className="flex min-h-32 flex-col items-start justify-between gap-2 rounded-3xl border-2 border-border bg-card p-4 text-left transition-[border-color] duration-150 hover:border-primary active:scale-[0.97]">
                  <Icon className="size-7 text-primary" aria-hidden />
                  <span className="font-heading text-xl">{label}</span>
                  <span className="text-xs text-muted-foreground">{hint}</span>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); goAmount(); }} className="flex flex-col gap-4">
              <label htmlFor="qa-monto" className="sr-only">Monto</label>
              <input id="qa-monto" autoFocus inputMode="decimal" className={cn(inputClass, "h-16 text-center font-heading text-3xl tabular-nums")} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              <div className="grid grid-cols-3 gap-2">
                {QUICK.map((q) => <button key={q} type="button" onClick={() => setAmount(String(q))} className="min-h-11 rounded-2xl bg-secondary font-semibold tabular-nums active:scale-[0.97]">{fmt(q)}</button>)}
              </div>
              {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
              <Button type="submit" className="h-12 rounded-2xl">Siguiente</Button>
            </form>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {cats.map((c) => (
                  <button key={c} type="button" onClick={() => { setCategory(c); if (accounts.length > 0) setStep(3); }} aria-pressed={category === c} className={cn("min-h-12 rounded-2xl border-2 px-3 text-sm font-semibold active:scale-[0.97]", category === c ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-secondary")}>{c}</button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="qa-nota" className={labelClass}>Nota (opcional)</label>
                <input id="qa-nota" className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder={kind === "gasto" ? "Ej. súper de la semana" : "Ej. pastel de cumpleaños"} />
              </div>
              {accounts.length === 0 && <Button disabled={!category} className="h-12 rounded-2xl" onClick={() => void save("")}><Check aria-hidden /> Guardar</Button>}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-2">
              {accounts.map((a) => (
                <button key={a.id} type="button" onClick={() => { setAccount(a.id); void save(a.id); }} className="flex min-h-14 items-center justify-between rounded-2xl border-2 border-border bg-card px-4 text-left font-semibold hover:border-primary active:scale-[0.97]">
                  {a.name}
                </button>
              ))}
              <button type="button" onClick={() => void save("")} className="min-h-12 rounded-2xl px-4 text-sm font-semibold text-muted-foreground underline underline-offset-4">No sé / ninguna cuenta</button>
            </div>
          )}

          {step > 0 && (
            <div className="flex items-center justify-between gap-3 text-sm">
              <Button variant="ghost" className="h-11 rounded-2xl" onClick={() => { setError(null); setStep(step - 1); }}><ArrowLeft aria-hidden /> Atrás</Button>
              <span className="text-muted-foreground">
                {kind === "gasto" ? "Gasto" : "Ingreso"}{value > 0 && step > 1 ? ` · ${fmt(value)}` : ""}{category && step > 2 ? ` · ${category}` : ""}{accName ? ` · ${accName}` : ""}
              </span>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
