"use client";

import type { CSSProperties, ReactNode } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { useMetricSelection } from "@/hooks/useMetricSelection";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { activeMetric, metricConfig } = useMetricSelection();
  const { palette } = metricConfig;
  const paletteVars = {
    "--metric-shell": palette.shell,
    "--metric-shell-muted": palette.shellMuted,
    "--metric-panel": palette.panel,
    "--metric-panel-strong": palette.panelStrong,
    "--metric-primary": palette.primary,
    "--metric-primary-dark": palette.primaryDark,
    "--metric-primary-soft": palette.primarySoft,
    "--metric-secondary": palette.secondary,
    "--metric-secondary-soft": palette.secondarySoft,
    "--metric-tertiary": palette.tertiary,
    "--metric-tertiary-soft": palette.tertiarySoft,
    "--metric-text-on-primary": palette.textOnPrimary,
    "--metric-ring": palette.ring,
    "--metric-shadow": palette.shadow,
    "--metric-chart-start": palette.chartStart,
    "--metric-chart-mid": palette.chartMid,
    "--metric-chart-end": palette.chartEnd,
  } as CSSProperties;

  return (
    <div
      className="metric-shell flex h-screen overflow-hidden transition-colors duration-500"
      data-metric={activeMetric}
      style={paletteVars}
    >
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="relative flex-1 overflow-y-auto bg-[var(--metric-shell)] p-4 transition-colors duration-500 sm:p-6">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 top-8 h-72 w-72 rounded-full bg-[var(--metric-primary)] opacity-10 blur-3xl" />
            <div className="absolute bottom-10 left-1/4 h-80 w-80 rounded-full bg-[var(--metric-secondary)] opacity-10 blur-3xl" />
          </div>
          <div className="relative">
          {children}
          </div>
        </main>
      </div>
    </div>
  );
}
