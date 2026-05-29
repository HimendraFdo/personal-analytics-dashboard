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
  foodName: string | null;
  portionGrams: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  foodSource: string | null;
};

export type EntryInput = {
  title: string;
  value: number;
  metricType?: MetricType;
  category?: EntryCategory;
  date: string;
  note?: string;
  foodName?: string | null;
  portionGrams?: number | null;
  proteinGrams?: number | null;
  carbsGrams?: number | null;
  fatGrams?: number | null;
  foodSource?: string | null;
};

export type EntryUpdateInput = Partial<EntryInput>;

export const ENTRY_CATEGORIES: EntryCategory[] = [
  "Study",
  "Finance",
  "Health",
  "Personal",
];

export const DEFAULT_ENTRY_CATEGORIES: Record<MetricType, EntryCategory> = {
  time: "Study",
  money: "Finance",
  calories: "Health",
};
