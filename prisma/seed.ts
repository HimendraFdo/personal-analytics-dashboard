import { PrismaClient, EntryCategory } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.entry.count();
  if (count > 0) {
    return;
  }

  await prisma.entry.createMany({
    data: [
      {
        title: "Study Hours",
        value: 2.5,
        category: EntryCategory.Study,
        date: new Date("2026-03-31"),
        note: "Worked on frontend layout",
      },
      {
        title: "Expense",
        value: 18,
        category: EntryCategory.Finance,
        date: new Date("2026-03-30"),
        note: "Lunch and coffee",
      },
      {
        title: "Workout",
        value: 45,
        category: EntryCategory.Health,
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
