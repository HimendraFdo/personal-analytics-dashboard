import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.RLS_TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;
const prisma = databaseUrl
  ? new PrismaClient({ datasourceUrl: databaseUrl })
  : null;
const userA = `rls-test-a-${randomUUID()}`;
const userB = `rls-test-b-${randomUUID()}`;
const ownEntryId = randomUUID();
const otherEntryId = randomUUID();

async function withUserContext<T>(
  userId: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
) {
  if (!prisma) {
    throw new Error("RLS_TEST_DATABASE_URL is required");
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
    return callback(tx);
  });
}

describeWithDatabase("Entry PostgreSQL RLS", () => {
  beforeAll(async () => {
    await withUserContext(userA, (tx) =>
      tx.entry.create({
        data: {
          id: ownEntryId,
          userId: userA,
          title: "User A entry",
          value: 1,
          metricType: "time",
          category: "Study",
          date: new Date("2026-05-31T00:00:00.000Z"),
        },
      })
    );
    await withUserContext(userB, (tx) =>
      tx.entry.create({
        data: {
          id: otherEntryId,
          userId: userB,
          title: "User B entry",
          value: 2,
          metricType: "time",
          category: "Study",
          date: new Date("2026-05-31T00:00:00.000Z"),
        },
      })
    );
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }

    await withUserContext(userA, (tx) =>
      tx.entry.deleteMany({ where: { userId: userA } })
    );
    await withUserContext(userB, (tx) =>
      tx.entry.deleteMany({ where: { userId: userB } })
    );
    await prisma.$disconnect();
  });

  it("allows user A to select only their own rows", async () => {
    const entries = await withUserContext(userA, (tx) =>
      tx.entry.findMany({
        where: { id: { in: [ownEntryId, otherEntryId] } },
        orderBy: { id: "asc" },
      })
    );

    expect(entries.map(({ id }) => id)).toEqual([ownEntryId]);
  });

  it("prevents user A from updating user B rows", async () => {
    const result = await withUserContext(userA, (tx) =>
      tx.entry.updateMany({
        where: { id: otherEntryId },
        data: { title: "Blocked update" },
      })
    );

    expect(result.count).toBe(0);
  });

  it("prevents user A from deleting user B rows", async () => {
    const result = await withUserContext(userA, (tx) =>
      tx.entry.deleteMany({ where: { id: otherEntryId } })
    );

    expect(result.count).toBe(0);
  });

  it("rejects inserts owned by a different user", async () => {
    await expect(
      withUserContext(userA, (tx) =>
        tx.entry.create({
          data: {
            userId: userB,
            title: "Blocked insert",
            value: 3,
            metricType: "time",
            category: "Study",
            date: new Date("2026-05-31T00:00:00.000Z"),
          },
        })
      )
    ).rejects.toThrow();
  });

  it("prevents access when the RLS context is missing", async () => {
    if (!prisma) {
      throw new Error("RLS_TEST_DATABASE_URL is required");
    }

    const entries = await prisma.entry.findMany({
      where: { id: { in: [ownEntryId, otherEntryId] } },
    });

    expect(entries).toEqual([]);
  });

  it("does not leak context when switching users", async () => {
    const entriesForA = await withUserContext(userA, (tx) =>
      tx.entry.findMany({ where: { id: { in: [ownEntryId, otherEntryId] } } })
    );
    const entriesForB = await withUserContext(userB, (tx) =>
      tx.entry.findMany({ where: { id: { in: [ownEntryId, otherEntryId] } } })
    );

    expect(entriesForA.map(({ id }) => id)).toEqual([ownEntryId]);
    expect(entriesForB.map(({ id }) => id)).toEqual([otherEntryId]);
  });
});
