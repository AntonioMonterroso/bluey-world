import { BakeryNav } from "@/components/bakery-nav";
import { BakeryDecorPage } from "@/components/bakery-decor-page";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <BakeryNav />
      <BakeryDecorPage />
    </div>
  );
}
