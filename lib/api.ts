import type { Entry, EntryInput, EntryUpdateInput } from "@/types/entry";
import { getErrorMessage } from "@/lib/errors";
import { parseApiDate } from "@/utils/date";

type ApiEntry = Omit<Entry, "date"> & { date: string };

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
  sort?: string;
}): Promise<Entry[]> {
  const search = new URLSearchParams();
  if (params?.category) {
    search.set("category", params.category);
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
