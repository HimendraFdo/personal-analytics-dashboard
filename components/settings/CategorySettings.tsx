"use client";

import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";

const MAX_NAME_LENGTH = 40;

export default function CategorySettings() {
  const {
    categories,
    loading,
    error,
    reload,
    addCategory,
    renameCategory,
    deleteCategory,
  } = useCategories();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function runAction(action: () => Promise<void>) {
    setPending(true);
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setPending(false);
    }
  }

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newName.trim();
    if (!name || pending) {
      return;
    }
    await runAction(async () => {
      await addCategory(name);
      setNewName("");
    });
  }

  function handleStartRename(id: string, currentName: string) {
    setEditingId(id);
    setEditingName(currentName);
    setActionError(null);
  }

  async function handleRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = editingName.trim();
    if (!editingId || !name || pending) {
      return;
    }
    await runAction(async () => {
      await renameCategory(editingId, name);
      setEditingId(null);
      setEditingName("");
    });
  }

  async function handleDelete(id: string, name: string) {
    if (pending) {
      return;
    }
    const confirmed = window.confirm(
      `Delete the "${name}" category? Existing entries keep their "${name}" label.`
    );
    if (!confirmed) {
      return;
    }
    await runAction(() => deleteCategory(id));
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-500">Loading your categories...</p>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-3 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <ul className="space-y-2">
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            {editingId === category.id ? (
              <form
                onSubmit={(event) => void handleRename(event)}
                className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row"
              >
                <input
                  type="text"
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  maxLength={MAX_NAME_LENGTH}
                  autoFocus
                  disabled={pending}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--metric-primary)] focus:ring-4 focus:ring-[var(--metric-ring)]"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={pending || !editingName.trim()}
                    className="rounded-xl bg-[var(--metric-panel-strong)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--metric-primary-dark)] disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    disabled={pending}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <span className="min-w-0 truncate text-sm font-semibold text-slate-900">
                  {category.name}
                </span>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartRename(category.id, category.name)}
                    disabled={pending}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--metric-primary)] hover:bg-[var(--metric-primary-soft)] disabled:opacity-60"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(category.id, category.name)}
                    disabled={pending || categories.length <= 1}
                    title={
                      categories.length <= 1
                        ? "You need at least one category"
                        : undefined
                    }
                    className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      <form
        onSubmit={(event) => void handleAdd(event)}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          type="text"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          maxLength={MAX_NAME_LENGTH}
          disabled={pending}
          placeholder="e.g. Side projects"
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--metric-primary)] focus:ring-4 focus:ring-[var(--metric-ring)]"
        />
        <button
          type="submit"
          disabled={pending || !newName.trim()}
          className="rounded-2xl bg-[var(--metric-panel-strong)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--metric-shadow)] transition hover:-translate-y-0.5 hover:bg-[var(--metric-primary-dark)] disabled:opacity-60"
        >
          Add Category
        </button>
      </form>

      <p className="text-xs leading-5 text-slate-500">
        Renaming a category also updates the entries that use it. Deleting a
        category keeps existing entries labelled with the old name.
      </p>
    </div>
  );
}
