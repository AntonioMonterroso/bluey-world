import { BakeryNav } from "@/components/bakery-nav";
import { TeamPage } from "@/components/team-page";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <BakeryNav />
      <TeamPage />
    </div>
  );
}
