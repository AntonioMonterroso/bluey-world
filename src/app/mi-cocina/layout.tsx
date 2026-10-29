import { CocinaNav } from "@/components/cocina-nav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <CocinaNav />
      {children}
    </div>
  );
}
