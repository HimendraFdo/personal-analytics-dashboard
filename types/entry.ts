export type EntryCategory = "Study" | "Finance" | "Health" | "Personal";
export type MetricType = "time" | "money" | "calories";

export type Entry = {
  id: string;
  title: string;
  value: number;
  metricType: MetricType;
  category: EntryCategory;
  date: Date;
  note: string;
};

export type EntryInput = {
  title: string;
  value: number;
  metricType?: MetricType;
  category: EntryCategory;
  date: string;
  note?: string;
};

export type EntryUpdateInput = Partial<EntryInput>;

export const ENTRY_CATEGORIES: EntryCategory[] = [
  "Study",
  "Finance",
  "Health",
  "Personal",
];
