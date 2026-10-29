import { BakeryNav } from "@/components/bakery-nav";
import { BakeryPage } from "@/components/bakery-page";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <BakeryNav />
      <BakeryPage />
    </div>
  );
}
