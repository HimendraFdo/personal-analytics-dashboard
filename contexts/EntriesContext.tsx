"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useEntries } from "@/hooks/useEntries";

type EntriesContextValue = ReturnType<typeof useEntries>;

const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({ children }: { children: ReactNode }) {
  const value = useEntries();
  return (
    <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>
  );
}

export function useEntriesContext() {
  const context = useContext(EntriesContext);
  if (!context) {
    throw new Error("useEntriesContext must be used within EntriesProvider");
  }
  return context;
}
