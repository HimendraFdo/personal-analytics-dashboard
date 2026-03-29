import type { ReactNode } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

type DashboardLayoutProps = {
    children: ReactNode;
};

export default function DashboardLayout({
    children,
}: DashboardLayoutProps) {
    return (
        <div className="flex h-screen">
            <Sidebar />

            <div className = "flex min-h-screen flex-col">
                <Topbar />

                <main className = "flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
