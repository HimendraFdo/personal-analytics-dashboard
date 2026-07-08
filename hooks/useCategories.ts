"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createCategory as createCategoryApi,
  deleteCategory as deleteCategoryApi,
  fetchCategories,
  renameCategory as renameCategoryApi,
} from "@/lib/api";
import type { Category } from "@/types/category";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const addCategory = useCallback(async (name: string) => {
    const created = await createCategoryApi(name);
    setCategories((current) => [...current, created]);
    return created;
  }, []);

  const renameCategory = useCallback(async (id: string, name: string) => {
    const updated = await renameCategoryApi(id, name);
    setCategories((current) =>
      current.map((category) => (category.id === id ? updated : category))
    );
    return updated;
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await deleteCategoryApi(id);
    setCategories((current) =>
      current.filter((category) => category.id !== id)
    );
  }, []);

  return {
    categories,
    loading,
    error,
    reload: loadCategories,
    addCategory,
    renameCategory,
    deleteCategory,
  };
}
