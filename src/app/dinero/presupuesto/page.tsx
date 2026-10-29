import { DineroNav } from "@/components/dinero-nav";
import { BudgetPage } from "@/components/budget-page";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <DineroNav />
      <BudgetPage />
    </div>
  );
}
