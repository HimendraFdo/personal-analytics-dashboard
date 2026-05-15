import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const entries = await prisma.entry.findMany();
  console.log("OK", entries.length, "entries");
} catch (error) {
  console.error("ERR", error?.code, error?.message);
  if (error?.meta) console.error("meta", error.meta);
} finally {
  await prisma.$disconnect();
}
