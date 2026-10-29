import { BakeryNav } from "@/components/bakery-nav";
import { UpgradesPage } from "@/components/upgrades-page";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <BakeryNav />
      <UpgradesPage />
    </div>
  );
}
