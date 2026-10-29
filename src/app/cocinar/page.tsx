import { Suspense } from "react";
import { CookRoute } from "@/components/cook-mode";

export default function Page() {
  return (
    <Suspense>
      <CookRoute />
    </Suspense>
  );
}
