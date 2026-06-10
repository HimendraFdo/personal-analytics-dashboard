"use client";

import { useMemo, useState, useEffect } from "react";
import {
  commitMoneyImport,
  importMoneyStatement,
  type MoneyImportDraft,
  type MoneyImportResponse,
} from "@/lib/api";
import { metricConfigs } from "@/lib/metrics";

type MoneyImportPanelProps = {
  disabled?: boolean;
  onImportComplete: () => void | Promise<void>;
};

const EXTRACT_STEPS = [
  "Reading your file…",
  "Identifying transactions…",
  "Parsing amounts & dates…",
  "Reviewing for duplicates…",
  "Almost there…",
];

function ExtractionLoader() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStepIndex((i) => (i + 1) % EXTRACT_STEPS.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-6 flex flex-col items-center gap-5 py-6">
      {/* Animated rings */}
      <div className="relative flex items-center justify-center">
        <span className="absolute h-16 w-16 animate-ping rounded-full bg-[var(--metric-primary)] opacity-10" />
        <span className="absolute h-12 w-12 animate-ping rounded-full bg-[var(--metric-primary)] opacity-15 [animation-delay:300ms]" />
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--metric-primary-soft)]">
          <svg
            className="h-5 w-5 animate-spin text-[var(--metric-primary)]"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
            />
          </svg>
        </span>
      </div>

      {/* Step label */}
      <p
        key={stepIndex}
        className="animate-fade-in text-sm font-semibold text-[var(--metric-primary)] transition-all duration-500"
        style={{ animation: "fadeSlideUp 0.4s ease both" }}
      >
        {EXTRACT_STEPS[stepIndex]}
      </p>

      {/* Segmented progress bar */}
      <div className="flex gap-1.5">
        {EXTRACT_STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-6 rounded-full transition-all duration-500 ${
              i <= stepIndex
                ? "bg-[var(--metric-primary)]"
                : "bg-[var(--metric-primary-soft)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function editableDraftValue(
  draft: MoneyImportDraft,
  field: keyof Pick<MoneyImportDraft, "date" | "title" | "value" | "note">,
  value: string
): MoneyImportDraft {
  if (field === "value") {
    return { ...draft, value: Number(value) };
  }
  return { ...draft, [field]: value };
}


export default function MoneyImportPanel({
  disabled = false,
  onImportComplete,
}: MoneyImportPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [review, setReview] = useState<MoneyImportResponse | null>(null);
  const [drafts, setDrafts] = useState<MoneyImportDraft[]>([]);
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(
    () => new Set()
  );
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = selectedDraftIds.size;
  const canCommit = selectedCount > 0 && review && !loading && !committing;
  const totalSelectedValue = useMemo(
    () =>
      drafts
        .filter((draft) => selectedDraftIds.has(draft.id))
        .reduce((total, draft) => total + draft.value, 0),
    [drafts, selectedDraftIds]
  );

  async function handleExtract() {
    if (!file || disabled || loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await importMoneyStatement(file);
      setReview(result);
      setDrafts(result.drafts);
      setSelectedDraftIds(new Set(result.drafts.map((draft) => draft.id)));
    } catch (extractError) {
      setError(
        extractError instanceof Error
          ? extractError.message
          : "Failed to extract statement"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    if (!review || !canCommit) {
      return;
    }

    setCommitting(true);
    setError(null);
    setMessage(null);

    try {
      const result = await commitMoneyImport(
        review.runId,
        Array.from(selectedDraftIds),
        drafts
      );
      setMessage(`Imported ${result.importedEntryIds.length} money entries.`);
      setReview(null);
      setDrafts([]);
      setSelectedDraftIds(new Set());
      setFile(null);
      await onImportComplete();
    } catch (commitError) {
      setError(
        commitError instanceof Error
          ? commitError.message
          : "Failed to import selected rows"
      );
    } finally {
      setCommitting(false);
    }
  }

  function updateDraft(
    draftId: string,
    field: keyof Pick<MoneyImportDraft, "date" | "title" | "value" | "note">,
    value: string
  ) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId ? editableDraftValue(draft, field, value) : draft
      )
    );
  }

  function toggleDraft(draftId: string) {
    setSelectedDraftIds((current) => {
      const next = new Set(current);
      if (next.has(draftId)) {
        next.delete(draftId);
      } else {
        next.add(draftId);
      }
      return next;
    });
  }

  function setAllSelected(selected: boolean) {
    setSelectedDraftIds(
      selected ? new Set(drafts.map((draft) => draft.id)) : new Set()
    );
  }

  return (
    <section
      data-testid="money-import-panel"
      className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-[var(--metric-shadow)] sm:rounded-[2rem] sm:p-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Import Statement
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Upload a PDF, PNG, JPG, or JPEG statement and review rows before saving.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            data-testid="money-import-file-input"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            disabled={disabled || loading || committing}
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setReview(null);
              setDrafts([]);
              setSelectedDraftIds(new Set());
              setMessage(null);
              setError(null);
            }}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--metric-primary-soft)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--metric-primary)] sm:w-auto"
          />
          <button
            data-testid="money-import-extract"
            type="button"
            onClick={() => void handleExtract()}
            disabled={!file || disabled || loading || committing}
            className="rounded-2xl bg-[var(--metric-panel-strong)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--metric-primary-dark)] disabled:opacity-60"
          >
            Import statement
          </button>
        </div>
      </div>

      {loading && <ExtractionLoader />}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-2xl border border-[var(--metric-ring)] bg-[var(--metric-primary-soft)] p-4 text-sm font-semibold text-[var(--metric-primary)]">
          {message}
        </div>
      )}

      {review && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["File", review.fileName],
              ["Rows", String(review.summary.totalRows)],
              ["Warnings", String(review.summary.warningRows)],
              ["Selected", metricConfigs.money.formatValue(totalSelectedValue)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-xs font-semibold uppercase text-slate-500">
                  {label}
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {review.warnings.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {review.warnings.slice(0, 4).join(" ")}
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-[900px] w-full border-collapse bg-white text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">
                    <input
                      type="checkbox"
                      checked={drafts.length > 0 && selectedCount === drafts.length}
                      onChange={(event) => setAllSelected(event.target.checked)}
                    />
                  </th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Note</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((draft) => (
                  <tr key={draft.id} className="border-t border-slate-200">
                    <td className="p-3 align-top">
                      <input
                        type="checkbox"
                        checked={selectedDraftIds.has(draft.id)}
                        onChange={() => toggleDraft(draft.id)}
                      />
                    </td>
                    <td className="p-3 align-top">
                      <input
                        type="date"
                        value={draft.date}
                        onChange={(event) =>
                          updateDraft(draft.id, "date", event.target.value)
                        }
                        className="w-36 rounded-xl border border-slate-200 px-3 py-2"
                      />
                    </td>
                    <td className="p-3 align-top">
                      <input
                        type="text"
                        value={draft.title}
                        onChange={(event) =>
                          updateDraft(draft.id, "title", event.target.value)
                        }
                        className="w-52 rounded-xl border border-slate-200 px-3 py-2"
                      />
                    </td>
                    <td className="p-3 align-top">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={Number.isFinite(draft.value) ? draft.value : ""}
                        onChange={(event) =>
                          updateDraft(draft.id, "value", event.target.value)
                        }
                        className="w-32 rounded-xl border border-slate-200 px-3 py-2"
                      />
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {Number.isFinite(draft.value)
                          ? metricConfigs.money.formatValue(draft.value)
                          : "Invalid"}
                      </p>
                    </td>
                    <td className="p-3 align-top">
                      <input
                        type="text"
                        value={draft.note}
                        onChange={(event) =>
                          updateDraft(draft.id, "note", event.target.value)
                        }
                        className="w-64 rounded-xl border border-slate-200 px-3 py-2"
                      />
                    </td>
                    <td className="p-3 align-top">
                      <div className="max-w-56 space-y-1 text-xs text-slate-600">
                        <p>Confidence {Math.round(draft.confidence * 100)}%</p>
                        {draft.duplicateCandidate && (
                          <p className="font-semibold text-amber-700">
                            Possible duplicate
                          </p>
                        )}
                        {draft.warnings.map((warning) => (
                          <p key={warning}>{warning}</p>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {selectedCount} of {drafts.length} rows selected
            </p>
            <button
              data-testid="money-import-commit"
              type="button"
              onClick={() => void handleCommit()}
              disabled={!canCommit}
              className="rounded-2xl bg-[var(--metric-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--metric-primary-dark)] disabled:opacity-60"
            >
              {committing ? "Importing..." : "Import selected"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
