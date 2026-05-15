import DashboardLayout from "@/layouts/DashboardLayout";
import { EntriesProvider } from "@/contexts/EntriesContext";

export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <EntriesProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </EntriesProvider>
  );
}
