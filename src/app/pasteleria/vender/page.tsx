import { BakeryNav } from "@/components/bakery-nav";
import { VentaFlow } from "@/components/venta-flow";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <BakeryNav />
      <VentaFlow />
    </div>
  );
}
