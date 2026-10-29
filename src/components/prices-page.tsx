"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { ArrowDownRight, ArrowUpRight, History, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/components/ui/fields";
import { PACK_UNITS, deleteProduct, saveProduct, updatePrice, useProducts, usePriceHistory } from "@/lib/budget";
import { findProduct, norm, pricePerBase, trendOf } from "@/lib/costing";
import type { PriceEntry, Product } from "@/lib/db/db";
import { parseQty, useRecipes } from "@/lib/recipes";
import { useMoney } from "@/lib/use-money";
import { cn } from "@/lib/utils";

// Lee ?nuevo=... de la URL sin useSearchParams (así la pantalla no depende de un límite de Suspense).
const noop = () => () => {};
function usePrefill() {
  return useSyncExternalStore(
    noop,
    () => new URLSearchParams(window.location.search).get("nuevo") ?? "",
    () => "",
  );
}

function perUnit(p: Pick<Product, "price" | "pack_qty" | "pack_unit">, fmt: (n: number) => string) {
  const b = pricePerBase(p.price, p.pack_qty, p.pack_unit);
  if (!b) return "";
  return b.kind === "g" ? `${fmt(b.value * 1000)} / kg` : b.kind === "ml" ? `${fmt(b.value * 1000)} / l` : `${fmt(b.value)} / unidad`;
}

export function PricesPage() {
  const products = useProducts();
  const history = usePriceHistory();
  const recipes = useRecipes();
  const fmt = useMoney();
  const prefill = usePrefill();

  const [q, setQ] = useState("");
  const [chosen, setChosen] = useState<{ product: Product | null; name: string } | null | undefined>(undefined);
  // undefined = nadie ha tocado el formulario: si la URL trae ?nuevo=, se abre con ese nombre.
  const formFor = chosen === undefined ? (prefill ? { product: null, name: prefill } : null) : chosen;
  const setFormFor = setChosen;

  const shown = useMemo(() => (products ?? []).filter((p) => !q.trim() || norm(p.name).includes(norm(q))), [products, q]);

  const unpriced = useMemo(() => {
    if (!products || !recipes) return [];
    const seen = new Map<string, string>();
    for (const r of recipes) for (const i of r.ingredients) {
      if (i.qty !== null && !findProduct(i.name, products)) seen.set(norm(i.name), i.name);
    }
    return [...seen.values()].slice(0, 12);
  }, [products, recipes]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Precios del súper</h1>
        <Button size="lg" className="h-12 rounded-2xl px-5 text-base" onClick={() => setFormFor({ product: null, name: "" })}>
          <Plus aria-hidden /> Nuevo producto
        </Button>
      </div>

      {formFor && (
        <ProductForm key={formFor.product?.id ?? formFor.name} product={formFor.product} name={formFor.name} onDone={() => setFormFor(null)} />
      )}

      {unpriced.length > 0 && (
        <section aria-labelledby="sin" className="flex flex-col gap-2 rounded-3xl bg-secondary p-4">
          <h2 id="sin" className="text-lg">Ingredientes de tus recetas sin precio</h2>
          <ul className="flex flex-wrap gap-2">
            {unpriced.map((n) => (
              <li key={n}>
                <button type="button" onClick={() => setFormFor({ product: null, name: n })} className="min-h-11 rounded-full bg-card px-4 text-sm font-semibold hover:bg-accent/60">
                  + {n}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <label htmlFor="buscar-prod" className="sr-only">Buscar producto</label>
        <input id="buscar-prod" type="search" className={cn(inputClass, "pl-12")} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto" />
      </div>

      {products === undefined ? null : shown.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">
          {products.length ? "Ningún producto coincide." : "Aún no hay productos. Agrega el precio de harina, azúcar, huevos… y las recetas mostrarán su costo."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((p) => (
            <ProductRow key={p.id} product={p} entries={(history ?? []).filter((h) => h.product_id === p.id)} fmt={fmt} onEdit={() => { setFormFor({ product: p, name: p.name }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductRow({ product: p, entries, fmt, onEdit }: { product: Product; entries: PriceEntry[]; fmt: (n: number) => string; onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [store, setStore] = useState("");
  const [updating, setUpdating] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const trend = trendOf(entries);

  async function applyPrice(e: React.FormEvent) {
    e.preventDefault();
    const v = parseQty(price);
    if (!v) return;
    await updatePrice(p, v, store.trim() || undefined);
    setUpdating(false);
    setPrice("");
  }

  return (
    <li className="rounded-3xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold capitalize">{p.name}</p>
          <p className="text-sm text-muted-foreground">
            {p.pack_qty} {p.pack_unit}{p.store ? ` · ${p.store}` : ""} · {perUnit(p, fmt)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-heading text-2xl tabular-nums">{fmt(p.price)}</p>
          {trend && Math.abs(trend.pct) >= 0.5 && (
            <p className={cn("flex items-center justify-end gap-1 text-xs font-semibold", trend.pct > 0 ? "text-destructive" : "text-primary")}>
              {trend.pct > 0 ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
              {trend.pct > 0 ? "subió" : "bajó"} {Math.abs(Math.round(trend.pct))} %
            </p>
          )}
        </div>
      </div>

      {updating && (
        <form onSubmit={applyPrice} className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor={`np-${p.id}`} className="text-xs font-semibold">Precio nuevo</label>
            <input id={`np-${p.id}`} inputMode="decimal" className={cn(inputClass, "h-11 w-32")} value={price} onChange={(e) => setPrice(e.target.value)} autoFocus />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`ns-${p.id}`} className="text-xs font-semibold">Tienda</label>
            <input id={`ns-${p.id}`} className={cn(inputClass, "h-11 w-40")} value={store} onChange={(e) => setStore(e.target.value)} placeholder={p.store} />
          </div>
          <Button type="submit" className="h-11 rounded-2xl">Guardar</Button>
          <Button type="button" variant="ghost" className="h-11 rounded-2xl" onClick={() => setUpdating(false)}>Cancelar</Button>
        </form>
      )}

      <div className="mt-3 flex flex-wrap gap-1">
        {!updating && <Button variant="secondary" className="h-11 rounded-2xl" onClick={() => setUpdating(true)}>Actualizar precio</Button>}
        <Button variant="ghost" className="h-11 rounded-2xl" onClick={onEdit}><Pencil aria-hidden /> Editar</Button>
        <Button variant="ghost" className="h-11 rounded-2xl" aria-expanded={open} onClick={() => setOpen((v) => !v)}><History aria-hidden /> Historial ({entries.length})</Button>
        {confirm ? (
          <Button variant="destructive" className="h-11 rounded-2xl" onClick={() => void deleteProduct(p.id)}>Sí, borrar</Button>
        ) : (
          <Button variant="ghost" className="h-11 rounded-2xl" onClick={() => setConfirm(true)}><Trash2 aria-hidden /> Borrar</Button>
        )}
      </div>

      {open && (
        <ul className="mt-2 flex flex-col divide-y rounded-2xl border">
          {[...entries].sort((a, b) => b.at - a.at).map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
              <span className="text-muted-foreground">{new Date(h.at).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}{h.store ? ` · ${h.store}` : ""}</span>
              <span className="tabular-nums">{fmt(h.price)} · {h.pack_qty} {h.pack_unit}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function ProductForm({ product, name: initialName, onDone }: { product: Product | null; name: string; onDone: () => void }) {
  const [name, setName] = useState(product?.name ?? initialName);
  const [qty, setQty] = useState(product ? String(product.pack_qty) : "");
  const [unit, setUnit] = useState(product?.pack_unit ?? "g");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [store, setStore] = useState(product?.store ?? "");
  const [cup, setCup] = useState(product?.g_per_cup ? String(product.g_per_cup) : "");
  const [gpu, setGpu] = useState(product?.grams_per_unit ? String(product.grams_per_unit) : "");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = parseQty(qty);
    const pr = parseQty(price);
    const c = cup.trim() ? parseQty(cup) : null;
    const g = gpu.trim() ? parseQty(gpu) : null;
    if (!name.trim()) return setError("Ponle nombre al producto.");
    if (!q) return setError("¿Cuánto trae el paquete? Escribe un número.");
    if (!pr) return setError("Escribe el precio.");
    if (c === undefined || g === undefined) return setError("Las equivalencias deben ser números.");
    await saveProduct({ name: name.trim(), pack_qty: q, pack_unit: unit, price: pr, store: store.trim(), g_per_cup: c, grams_per_unit: g }, product?.id);
    onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl border bg-card p-5" noValidate>
      <h2 className="text-xl">{product ? "Editar producto" : "Nuevo producto"}</h2>
      <div className="flex flex-col gap-2">
        <label htmlFor="p-nombre" className={labelClass}>Nombre</label>
        <input id="p-nombre" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. harina, huevo, mantequilla" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="p-cant" className={labelClass}>Cuánto trae</label>
          <input id="p-cant" inputMode="decimal" className={inputClass} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="1000" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="p-uni" className={labelClass}>Unidad</label>
          <select id="p-uni" className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value)}>
            {PACK_UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="p-precio" className={labelClass}>Precio</label>
          <input id="p-precio" inputMode="decimal" className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="p-tienda" className={labelClass}>Tienda</label>
          <input id="p-tienda" className={inputClass} value={store} onChange={(e) => setStore(e.target.value)} />
        </div>
      </div>
      <details className="rounded-2xl border px-4 py-2">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">Equivalencias (opcional)</summary>
        <p className="py-2 text-sm text-muted-foreground">
          Sirven para pasar tazas a gramos o una barra/unidad a gramos. Si las dejas vacías, la app usa valores comunes de repostería.
        </p>
        <div className="grid gap-4 pb-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="p-taza" className={labelClass}>Gramos en una taza</label>
            <input id="p-taza" inputMode="decimal" className={inputClass} value={cup} onChange={(e) => setCup(e.target.value)} placeholder="Ej. 120 para harina" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="p-gu" className={labelClass}>Gramos de una unidad o barra</label>
            <input id="p-gu" inputMode="decimal" className={inputClass} value={gpu} onChange={(e) => setGpu(e.target.value)} placeholder="Ej. 113 para una barra" />
          </div>
        </div>
      </details>
      {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" size="lg" className="h-12 rounded-2xl px-6 text-base">Guardar</Button>
        <Button type="button" variant="ghost" size="lg" className="h-12 rounded-2xl px-6 text-base" onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  );
}
