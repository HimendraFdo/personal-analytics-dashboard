import type { ReactNode } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";

type DashboardLayoutProps = {
    children: ReactNode;
    activeItem: string;
    onSelectItem: (item: string) => void;
};

export default function DashboardLayout({
    children,
    activeItem,
    onSelectItem,
}: DashboardLayoutProps) {
    return (
        <div className="flex h-screen">
            <Sidebar activeItem={activeItem} onSelectItem={onSelectItem} />

            <div className = "flex min-h-screen flex-col">
                <Topbar />

                <main className = "flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
