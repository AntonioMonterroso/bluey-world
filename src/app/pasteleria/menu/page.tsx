import { BakeryNav } from "@/components/bakery-nav";
import { BakeryMenuPage } from "@/components/bakery-menu-page";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <BakeryNav />
      <BakeryMenuPage />
    </div>
  );
}
