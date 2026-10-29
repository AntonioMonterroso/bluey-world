import { BakeryNav } from "@/components/bakery-nav";
import { ProfitPage } from "@/components/profit-page";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <BakeryNav />
      <ProfitPage />
    </div>
  );
}
