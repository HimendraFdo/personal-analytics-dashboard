import { Suspense, type ReactNode } from "react";
import { EntriesProvider } from "@/contexts/EntriesContext";
import DashboardLayout from "@/layouts/DashboardLayout";

type ShellLayoutProps = {
  children: ReactNode;
};

export default function ShellLayout({ children }: ShellLayoutProps) {
  return (
    <Suspense fallback={null}>
      <EntriesProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </EntriesProvider>
    </Suspense>
  );
}
