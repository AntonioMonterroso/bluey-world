import { GameNav } from "@/components/game-nav";
import { LogrosPage } from "@/components/logros-page";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <GameNav />
      <LogrosPage />
    </div>
  );
}
