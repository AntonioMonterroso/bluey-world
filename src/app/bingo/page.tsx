import { BingoPage } from "@/components/bingo-page";
import { GameNav } from "@/components/game-nav";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <GameNav />
      <BingoPage />
    </div>
  );
}
