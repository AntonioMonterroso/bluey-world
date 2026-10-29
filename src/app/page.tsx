import { Greeting } from "@/components/greeting";
import { HeroCharacter } from "@/components/hero-character";
import { HomeToday } from "@/components/home-today";
import { LevelCard } from "@/components/level-card";

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-[1fr_7rem] items-center gap-4 rounded-[2rem] bg-secondary p-5 md:grid-cols-[1fr_12rem] md:p-8">
        <div className="flex flex-col gap-2">
          <Greeting />
          <p className="max-w-prose text-pretty text-muted-foreground">Esto es lo de hoy: tu dinero, tu cocina y tu juego, en un solo vistazo.</p>
        </div>
        <HeroCharacter />
      </section>

      <HomeToday />
      <LevelCard />
    </div>
  );
}
