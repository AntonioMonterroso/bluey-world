import { DineroNav } from "@/components/dinero-nav";
import { AccountsPage } from "@/components/accounts-page";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <DineroNav />
      <AccountsPage />
    </div>
  );
}
