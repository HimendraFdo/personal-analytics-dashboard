import { z } from "zod";
import { METRIC_TYPES } from "@/lib/metrics";

export const categoryNameSchema = z.string().trim().min(1).max(40);

const categorySchema = categoryNameSchema;
const metricTypeSchema = z.enum(METRIC_TYPES as [string, ...string[]]);
const optionalNutritionNumber = z.coerce.number().nonnegative().finite().nullable().optional();
const optionalFoodText = z.string().trim().max(200).nullable().optional();

export const createEntrySchema = z.object({
  title: z.string().trim().min(1).max(200),
  value: z.coerce.number().positive().finite(),
  metricType: metricTypeSchema.optional().default("time"),
  category: categorySchema.optional(),
  date: z.union([z.string().min(1), z.coerce.date()]),
  note: z.string().max(2000).optional().default(""),
  foodName: optionalFoodText,
  portionGrams: optionalNutritionNumber,
  proteinGrams: optionalNutritionNumber,
  carbsGrams: optionalNutritionNumber,
  fatGrams: optionalNutritionNumber,
  foodSource: optionalFoodText,
}).strict();

export const updateEntrySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    value: z.coerce.number().positive().finite().optional(),
    metricType: metricTypeSchema.optional(),
    category: categorySchema.optional(),
    date: z.union([z.string().min(1), z.coerce.date()]).optional(),
    note: z.string().max(2000).optional(),
    foodName: optionalFoodText,
    portionGrams: optionalNutritionNumber,
    proteinGrams: optionalNutritionNumber,
    carbsGrams: optionalNutritionNumber,
    fatGrams: optionalNutritionNumber,
    foodSource: optionalFoodText,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type SortOption = "date_desc" | "date_asc" | "value_desc" | "value_asc";

export const sortSchema = z
  .enum(["date_desc", "date_asc", "value_desc", "value_asc"])
  .optional()
  .default("date_desc");

export const entryIdSchema = z.string().uuid();

export const categoryIdSchema = z.string().uuid();

export const categoryMutationSchema = z
  .object({
    name: categoryNameSchema,
  })
  .strict();

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
