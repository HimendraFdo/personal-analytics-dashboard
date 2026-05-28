import { Suspense } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { EntriesProvider } from "@/contexts/EntriesContext";

export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={null}>
      <EntriesProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </EntriesProvider>
    </Suspense>
  );
}
