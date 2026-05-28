"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  metricConfigs,
  parseMetricType,
  type MetricConfig,
} from "@/lib/metrics";
import type { MetricType } from "@/types/entry";

type MetricSelection = {
  activeMetric: MetricType;
  setActiveMetric: (metricType: MetricType) => void;
  metricConfig: MetricConfig;
};

export function useMetricSelection(): MetricSelection {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeMetric = parseMetricType(searchParams.get("metric"));

  const setActiveMetric = useCallback(
    (metricType: MetricType) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("metric", metricType);
      router.push(`${pathname}?${nextParams.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return {
    activeMetric,
    setActiveMetric,
    metricConfig: metricConfigs[activeMetric],
  };
}
