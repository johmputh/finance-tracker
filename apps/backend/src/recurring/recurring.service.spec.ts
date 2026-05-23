import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { PrismaService } from "../prisma/prisma.service";
import type { RecurringRepository } from "./recurring.repository";
import { RecurringService } from "./recurring.service";

const USER_ID = "user-1";
const CAT_ID = "cat-1";
const REC_ID = "rec-1";

function fakeRecurring(overrides: Record<string, unknown> = {}) {
  return {
    id: REC_ID,
    amount: { toNumber: () => 500 },
    type: "EXPENSE",
    description: "ค่าเช่า",
    categoryId: CAT_ID,
    userId: USER_ID,
    dayOfMonth: 1,
    active: true,
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    updatedAt: new Date("2026-05-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makePrisma(categoryOverride?: Record<string, unknown> | null): PrismaService {
  const cat = categoryOverride === null ? null : { id: CAT_ID, type: "EXPENSE", userId: null, ...categoryOverride };
  return {
    client: {
      category: { findUnique: jest.fn().mockResolvedValue(cat) },
      transaction: { create: jest.fn().mockResolvedValue({}) },
    },
  } as unknown as PrismaService;
}

function makeRepo(overrides: Partial<Record<keyof RecurringRepository, jest.Mock>> = {}): RecurringRepository {
  return {
    create: jest.fn().mockResolvedValue(fakeRecurring()),
    findAllByUser: jest.fn().mockResolvedValue([fakeRecurring()]),
    findById: jest.fn().mockResolvedValue(fakeRecurring()),
    findActiveByDayOfMonth: jest.fn().mockResolvedValue([fakeRecurring()]),
    update: jest.fn().mockResolvedValue(fakeRecurring()),
    delete: jest.fn().mockResolvedValue(fakeRecurring()),
    ...overrides,
  } as unknown as RecurringRepository;
}

describe("RecurringService", () => {
  describe("create", () => {
    it("creates and maps the recurring rule", async () => {
      const repo = makeRepo();
      const prisma = makePrisma();
      const service = new RecurringService(repo, prisma);

      const result = await service.create(USER_ID, {
        type: "EXPENSE",
        amount: 500,
        categoryId: CAT_ID,
        description: "ค่าเช่า",
        dayOfMonth: 1,
      });

      expect(repo.create).toHaveBeenCalled();
      expect(result.amount).toBe(500);
      expect(result.dayOfMonth).toBe(1);
    });

    it("throws 400 when category not found", async () => {
      const repo = makeRepo();
      const prisma = makePrisma(null);
      const service = new RecurringService(repo, prisma);

      await expect(
        service.create(USER_ID, { type: "EXPENSE", amount: 500, categoryId: CAT_ID, dayOfMonth: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws 400 when category type mismatches", async () => {
      const repo = makeRepo();
      const prisma = makePrisma({ type: "INCOME" });
      const service = new RecurringService(repo, prisma);

      await expect(
        service.create(USER_ID, { type: "EXPENSE", amount: 500, categoryId: CAT_ID, dayOfMonth: 1 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("returns all recurring rules for the user", async () => {
      const service = new RecurringService(makeRepo(), makePrisma());
      const result = await service.findAll(USER_ID);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(REC_ID);
    });
  });

  describe("update", () => {
    it("updates an owned recurring rule", async () => {
      const repo = makeRepo({ update: jest.fn().mockResolvedValue(fakeRecurring({ active: false })) });
      const service = new RecurringService(repo, makePrisma());

      const result = await service.update(USER_ID, REC_ID, { active: false });
      expect(result.active).toBe(false);
    });

    it("throws NotFoundException when the rule does not belong to the user", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(fakeRecurring({ userId: "other" })) });
      const service = new RecurringService(repo, makePrisma());

      await expect(service.update(USER_ID, REC_ID, { active: false })).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("deletes an owned recurring rule", async () => {
      const service = new RecurringService(makeRepo(), makePrisma());
      const result = await service.remove(USER_ID, REC_ID);
      expect(result.id).toBe(REC_ID);
    });

    it("throws NotFoundException when the rule does not belong to the user", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const service = new RecurringService(repo, makePrisma());

      await expect(service.remove(USER_ID, REC_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe("processRecurring (cron)", () => {
    it("creates transactions for all active rules matching today", async () => {
      const repo = makeRepo();
      const prisma = makePrisma();
      const service = new RecurringService(repo, prisma);

      await service.processRecurring();

      expect(prisma.client.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ source: "RECURRING" }) }),
      );
    });
  });
});
