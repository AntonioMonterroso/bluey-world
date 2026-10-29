import { GameNav } from "@/components/game-nav";
import { ShopPage } from "@/components/shop-page";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <GameNav />
      <ShopPage />
    </div>
  );
}
