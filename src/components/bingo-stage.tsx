"use client";

import { DancingCharacter } from "@/components/character";
import { YouTubeEmbed } from "@/components/youtube-embed";

export function BingoStage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="relative flex min-h-80 items-end justify-center overflow-hidden rounded-[2rem] bg-secondary px-6 pt-10">
        <div className="absolute inset-x-0 bottom-0 h-16 bg-accent/60" aria-hidden />
        <DancingCharacter id="bingo" className="relative z-10 h-64 md:h-80" />
      </div>
      <section aria-labelledby="musica" className="flex max-w-2xl flex-col gap-3">
        <h2 id="musica" className="text-xl">Ponle música</h2>
        <YouTubeEmbed url="https://youtu.be/JXOTmWl5t3A" title="Bluey Extended Theme Song" />
      </section>
    </div>
  );
}
