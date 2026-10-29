import { BakeryNav } from "@/components/bakery-nav";
import { EventsPage } from "@/components/events-page";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <BakeryNav />
      <EventsPage />
    </div>
  );
}
