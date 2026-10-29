import Image from "next/image";
import { AccountCard } from "@/components/account-card";
import { CharacterPicker } from "@/components/character-picker";
import { CurrencyField } from "@/components/currency-field";
import { NameField } from "@/components/name-field";
import { ThemePicker } from "@/components/theme-picker";
import { ART } from "@/lib/characters";
import { BRAND } from "@/lib/brand";

export default function Page() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <h1 className="text-4xl">Ajustes</h1>

      <section aria-labelledby="perfil" className="flex flex-col gap-3">
        <h2 id="perfil" className="text-2xl">Tu nombre</h2>
        <NameField />
      </section>

      <section aria-labelledby="cuenta" className="flex flex-col gap-3">
        <h2 id="cuenta" className="text-2xl">Cuenta y respaldo</h2>
        <AccountCard />
      </section>

      <section aria-labelledby="moneda" className="flex flex-col gap-3">
        <h2 id="moneda" className="text-2xl">Moneda</h2>
        <p className="text-sm text-muted-foreground">El símbolo que aparece en todo tu dinero.</p>
        <CurrencyField />
      </section>

      <section aria-labelledby="personaje" className="flex flex-col gap-3">
        <h2 id="personaje" className="text-2xl">Tu personaje</h2>
        <CharacterPicker />
      </section>

      <section aria-labelledby="paleta" className="flex flex-col gap-3">
        <h2 id="paleta" className="text-2xl">Tu paleta</h2>
        <ThemePicker />
      </section>

      <section aria-labelledby="elenco" className="flex flex-col gap-3">
        <h2 id="elenco" className="text-2xl">Todo el elenco</h2>
        <p className="text-sm text-muted-foreground">Con ellos vas a ir armando tu equipo en {BRAND.tycoon}.</p>
        <Image src={ART.elenco.src} alt="Todos los personajes con sus nombres" width={ART.elenco.w} height={ART.elenco.h} className="mx-auto h-auto w-full max-w-sm rounded-3xl border" />
      </section>
    </div>
  );
}
