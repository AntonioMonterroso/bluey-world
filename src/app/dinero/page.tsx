import { DineroNav } from "@/components/dinero-nav";
import { MoneySummary } from "@/components/money-summary";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <DineroNav />
      <MoneySummary />
    </div>
  );
}
