import { EntryCategory, type Prisma } from "@prisma/client";
import { serializeEntryJson } from "@/lib/entries";
import { parseEntryDate } from "@/lib/validation";
import type { MoneyImportDraft } from "./types";

function isValidDraft(draft: MoneyImportDraft) {
  return (
    draft.category === "Finance" &&
    draft.title.trim().length > 0 &&
    draft.title.length <= 200 &&
    draft.value > 0 &&
    Number.isFinite(draft.value) &&
    /^\d{4}-\d{2}-\d{2}$/.test(draft.date) &&
    draft.note.length <= 2000
  );
}

export async function commitMoneyImportDrafts({
  tx,
  userId,
  drafts,
  draftIds,
}: {
  tx: Prisma.TransactionClient;
  userId: string;
  drafts: MoneyImportDraft[];
  draftIds: string[];
}) {
  const selectedDraftIds = new Set(draftIds);
  const selectedDrafts = drafts.filter((draft) => selectedDraftIds.has(draft.id));
  const skippedDraftIds = drafts
    .filter((draft) => !selectedDraftIds.has(draft.id) || !isValidDraft(draft))
    .map((draft) => draft.id);
  const importedEntries = [];

  for (const draft of selectedDrafts) {
    if (!isValidDraft(draft)) {
      continue;
    }

    const entry = await tx.entry.create({
      data: {
        userId,
        metricType: "money",
        title: draft.title.trim(),
        value: draft.value,
        category: EntryCategory.Finance,
        date: parseEntryDate(draft.date),
        note: draft.note,
        foodName: null,
        portionGrams: null,
        proteinGrams: null,
        carbsGrams: null,
        fatGrams: null,
        foodSource: null,
      },
    });
    importedEntries.push(serializeEntryJson(entry));
  }

  return {
    importedEntryIds: importedEntries.map((entry) => entry.id),
    skippedDraftIds,
  };
}
