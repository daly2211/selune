import { ClientOnly } from "@/components/client-only";
import { AppShell } from "@/components/app-shell";

export default function Home() {
  return (
    <ClientOnly>
      <AppShell />
    </ClientOnly>
  );
}
