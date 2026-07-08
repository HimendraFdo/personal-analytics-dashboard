import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATEGORY_NAMES } from "../types/entry";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.entry.count();
  if (count > 0) {
    return;
  }

  const userId = process.env.SEED_USER_ID ?? "seed_demo_user";

  await prisma.category.createMany({
    data: DEFAULT_CATEGORY_NAMES.map((name) => ({ userId, name })),
    skipDuplicates: true,
  });

  await prisma.entry.createMany({
    data: [
      {
        userId,
        title: "Study Session",
        value: 150,
        metricType: "time",
        category: "Study",
        date: new Date("2026-03-31"),
        note: "Worked on frontend layout",
      },
      {
        userId,
        title: "Budget Review",
        value: 30,
        metricType: "time",
        category: "Finance",
        date: new Date("2026-03-30"),
        note: "Lunch and coffee",
      },
      {
        userId,
        title: "Workout",
        value: 45,
        metricType: "time",
        category: "Health",
        date: new Date("2026-03-29"),
        note: "Evening gym session",
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
