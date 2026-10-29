import { DineroNav } from "@/components/dinero-nav";
import { GoalsPage } from "@/components/goals-page";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <DineroNav />
      <GoalsPage />
    </div>
  );
}
