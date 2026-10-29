import { GameNav } from "@/components/game-nav";
import { WardrobePage } from "@/components/wardrobe-page";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <GameNav />
      <WardrobePage />
    </div>
  );
}
