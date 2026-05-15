import { z } from "zod";
import { ENTRY_CATEGORIES } from "@/types/entry";

const categorySchema = z.enum(
  ENTRY_CATEGORIES as [string, ...string[]]
);

export const createEntrySchema = z.object({
  title: z.string().trim().min(1).max(200),
  value: z.coerce.number().finite(),
  category: categorySchema,
  date: z.union([z.string().min(1), z.coerce.date()]),
  note: z.string().max(2000).optional().default(""),
});

export const updateEntrySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    value: z.coerce.number().finite().optional(),
    category: categorySchema.optional(),
    date: z.union([z.string().min(1), z.coerce.date()]).optional(),
    note: z.string().max(2000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type SortOption = "date_desc" | "date_asc" | "value_desc" | "value_asc";

export const sortSchema = z
  .enum(["date_desc", "date_asc", "value_desc", "value_asc"])
  .optional()
  .default("date_desc");

export function parseEntryDate(input: string | Date): Date {
  if (input instanceof Date) {
    return input;
  }
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  if (dateOnly.test(input)) {
    return new Date(`${input}T00:00:00.000Z`);
  }
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date");
  }
  return parsed;
}
