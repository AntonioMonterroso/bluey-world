import { DineroNav } from "@/components/dinero-nav";
import { MovementsPage } from "@/components/movements-page";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <DineroNav />
      <MovementsPage />
    </div>
  );
}
