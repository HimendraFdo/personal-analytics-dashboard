import type { Entry, EntryInput, EntryUpdateInput } from "@/types/entry";
import { getErrorMessage } from "@/lib/errors";
import type { FoodSearchResult } from "@/lib/nutrition";
import { parseApiDate } from "@/utils/date";

type ApiEntry = Omit<Entry, "date"> & { date: string };

export type MoneyImportDraft = {
  id: string;
  date: string;
  title: string;
  value: number;
  category: "Finance";
  note: string;
  confidence: number;
  duplicateCandidate: boolean;
  warnings: string[];
};

export type MoneyImportDraftUpdate = Pick<
  MoneyImportDraft,
  "id" | "date" | "title" | "value" | "note"
>;

export type MoneyImportResponse = {
  runId: string;
  status: "requires_review";
  fileName: string;
  summary: {
    totalRows: number;
    importableRows: number;
    warningRows: number;
    duplicateCandidateRows: number;
  };
  drafts: MoneyImportDraft[];
  warnings: string[];
};

export type MoneyImportCommitResponse = {
  importedEntryIds: string[];
  skippedDraftIds: string[];
};

function mapEntryFromApi(entry: ApiEntry): Entry {
  return {
    ...entry,
    date: parseApiDate(entry.date),
  };
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(body, "Request failed"));
  }
  return body as T;
}

export async function fetchEntries(params?: {
  category?: string;
  metricType?: string;
  sort?: string;
}): Promise<Entry[]> {
  const search = new URLSearchParams();
  if (params?.category) {
    search.set("category", params.category);
  }
  if (params?.metricType) {
    search.set("metric", params.metricType);
  }
  if (params?.sort) {
    search.set("sort", params.sort);
  }
  const query = search.toString();
  const url = query ? `/api/entries?${query}` : "/api/entries";
  const data = await parseJsonResponse<{ entries: ApiEntry[] }>(
    await fetch(url)
  );
  return data.entries.map(mapEntryFromApi);
}

export async function createEntry(input: EntryInput): Promise<Entry> {
  const data = await parseJsonResponse<ApiEntry>(
    await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return mapEntryFromApi(data);
}

export async function updateEntry(
  id: string,
  input: EntryUpdateInput
): Promise<Entry> {
  const data = await parseJsonResponse<ApiEntry>(
    await fetch(`/api/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return mapEntryFromApi(data);
}

export async function deleteEntry(id: string): Promise<void> {
  const response = await fetch(`/api/entries/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(getErrorMessage(body, "Failed to delete entry"));
  }
}

export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  const search = new URLSearchParams({ q: query });
  const data = await parseJsonResponse<{ foods: FoodSearchResult[] }>(
    await fetch(`/api/food/search?${search.toString()}`)
  );
  return data.foods;
}

export async function importMoneyStatement(
  file: File
): Promise<MoneyImportResponse> {
  const formData = new FormData();
  formData.set("file", file);

  return parseJsonResponse<MoneyImportResponse>(
    await fetch("/api/money/import", {
      method: "POST",
      body: formData,
    })
  );
}

export async function commitMoneyImport(
  runId: string,
  draftIds: string[],
  drafts?: MoneyImportDraftUpdate[]
): Promise<MoneyImportCommitResponse> {
  return parseJsonResponse<MoneyImportCommitResponse>(
    await fetch(`/api/money/import/${runId}/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftIds, drafts }),
    })
  );
}
