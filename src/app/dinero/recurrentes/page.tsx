import { DineroNav } from "@/components/dinero-nav";
import { RecurringPage } from "@/components/recurring-page";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <DineroNav />
      <RecurringPage />
    </div>
  );
}
