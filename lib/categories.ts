import type { Category as PrismaCategory, Prisma } from "@prisma/client";
import type { Category } from "@/types/category";
import { DEFAULT_CATEGORY_NAMES } from "@/types/entry";

export const MAX_CATEGORIES_PER_USER = 20;

export function serializeCategory(category: PrismaCategory): Category {
  return {
    id: category.id,
    name: category.name,
  };
}

export async function listCategoriesWithDefaults(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<PrismaCategory[]> {
  const existing = await tx.category.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (existing.length > 0) {
    return existing;
  }

  await tx.category.createMany({
    data: DEFAULT_CATEGORY_NAMES.map((name) => ({ userId, name })),
    skipDuplicates: true,
  });

  return tx.category.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export function findDuplicateName(
  categories: Array<{ id: string; name: string }>,
  name: string,
  excludeId?: string
): boolean {
  const normalized = name.toLocaleLowerCase();
  return categories.some(
    (category) =>
      category.id !== excludeId &&
      category.name.toLocaleLowerCase() === normalized
  );
}
