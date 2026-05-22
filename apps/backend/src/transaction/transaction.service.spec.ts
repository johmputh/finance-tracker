import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { TransactionRepository } from "./transaction.repository";
import { TransactionService } from "./transaction.service";

const USER_ID = "user-1";
const CAT_ID = "cat-1";

function fakeCategory(overrides: Record<string, unknown> = {}) {
  return { id: CAT_ID, type: "EXPENSE", userId: null, ...overrides };
}

function fakeTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: "tx-1",
    amount: { toNumber: () => 100 },
    type: "EXPENSE",
    description: "lunch",
    source: "WEB",
    categoryId: CAT_ID,
    userId: USER_ID,
    createdAt: new Date("2026-05-21T00:00:00.000Z"),
    updatedAt: new Date("2026-05-21T00:00:00.000Z"),
    ...overrides,
  };
}

function fakeTransactionWithCategory(overrides: Record<string, unknown> = {}) {
  return {
    ...fakeTransaction(overrides),
    category: { id: CAT_ID, name: "อาหาร", icon: "🍔", type: "EXPENSE", userId: null, createdAt: new Date() },
  };
}

function makeRepo(overrides: Partial<Record<keyof TransactionRepository, jest.Mock>> = {}): TransactionRepository {
  return {
    create: jest.fn().mockResolvedValue(fakeTransaction()),
    findManyFiltered: jest.fn().mockResolvedValue([fakeTransaction()]),
    countFiltered: jest.fn().mockResolvedValue(1),
    findById: jest.fn().mockResolvedValue(fakeTransaction()),
    findCategoryById: jest.fn().mockResolvedValue(fakeCategory()),
    findForSummary: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue(fakeTransaction()),
    delete: jest.fn().mockResolvedValue(fakeTransaction()),
    ...overrides,
  } as unknown as TransactionRepository;
}

describe("TransactionService", () => {
  describe("create", () => {
    it("creates a transaction for the user and maps the response", async () => {
      const repo = makeRepo();
      const service = new TransactionService(repo);

      const result = await service.create(USER_ID, {
        amount: 100,
        type: "EXPENSE",
        categoryId: CAT_ID,
        description: "lunch",
        source: "WEB",
      });

      expect(repo.create).toHaveBeenCalledWith({
        userId: USER_ID,
        amount: 100,
        type: "EXPENSE",
        categoryId: CAT_ID,
        description: "lunch",
        source: "WEB",
      });
      expect(result.amount).toBe(100);
      expect(result.createdAt).toBe("2026-05-21T00:00:00.000Z");
    });

    it("throws 400 when category is not found", async () => {
      const repo = makeRepo({ findCategoryById: jest.fn().mockResolvedValue(null) });
      const service = new TransactionService(repo);
      await expect(service.create(USER_ID, { amount: 100, type: "EXPENSE", categoryId: "x" })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws 400 when category belongs to another user", async () => {
      const repo = makeRepo({ findCategoryById: jest.fn().mockResolvedValue(fakeCategory({ userId: "other" })) });
      const service = new TransactionService(repo);
      await expect(service.create(USER_ID, { amount: 100, type: "EXPENSE", categoryId: CAT_ID })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws 400 when category type does not match transaction type", async () => {
      const repo = makeRepo({ findCategoryById: jest.fn().mockResolvedValue(fakeCategory({ type: "INCOME" })) });
      const service = new TransactionService(repo);
      await expect(service.create(USER_ID, { amount: 100, type: "EXPENSE", categoryId: CAT_ID })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("findAll", () => {
    it("returns paginated transactions", async () => {
      const repo = makeRepo({
        findManyFiltered: jest.fn().mockResolvedValue([fakeTransaction()]),
        countFiltered: jest.fn().mockResolvedValue(5),
      });
      const service = new TransactionService(repo);

      const result = await service.findAll(USER_ID, { page: 2, limit: 2 });

      expect(repo.findManyFiltered).toHaveBeenCalledWith(USER_ID, expect.any(Object), 2, 2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("findOne", () => {
    it("returns the transaction when owned by the user", async () => {
      const repo = makeRepo();
      const service = new TransactionService(repo);
      const result = await service.findOne(USER_ID, "tx-1");
      expect(result.id).toBe("tx-1");
    });

    it("throws NotFoundException when transaction does not exist", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const service = new TransactionService(repo);
      await expect(service.findOne(USER_ID, "missing")).rejects.toThrow(NotFoundException);
    });

    it("throws NotFoundException when transaction belongs to another user", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(fakeTransaction({ userId: "other" })) });
      const service = new TransactionService(repo);
      await expect(service.findOne(USER_ID, "tx-1")).rejects.toThrow(NotFoundException);
    });
  });

  describe("getSummary", () => {
    it("aggregates income, expense, balance and daily totals", async () => {
      const tx1 = fakeTransactionWithCategory({ amount: { toNumber: () => 500 }, type: "INCOME", createdAt: new Date("2026-05-05T00:00:00.000Z") });
      const tx2 = fakeTransactionWithCategory({ amount: { toNumber: () => 200 }, type: "EXPENSE", createdAt: new Date("2026-05-05T00:00:00.000Z") });
      const repo = makeRepo({ findForSummary: jest.fn().mockResolvedValue([tx1, tx2]) });
      const service = new TransactionService(repo);

      const result = await service.getSummary(USER_ID, { month: 5, year: 2026 });

      expect(result.totalIncome).toBe(500);
      expect(result.totalExpense).toBe(200);
      expect(result.balance).toBe(300);
      expect(result.byCategoryIncome).toHaveLength(1);
      expect(result.byCategoryExpense).toHaveLength(1);
      expect(result.byCategoryExpense[0].percentage).toBe(100);
      expect(result.dailyTotals).toHaveLength(31);
      const may5 = result.dailyTotals.find((d) => d.date === "2026-05-05")!;
      expect(may5.income).toBe(500);
      expect(may5.expense).toBe(200);
    });

    it("returns zeroed summary when no transactions exist", async () => {
      const repo = makeRepo({ findForSummary: jest.fn().mockResolvedValue([]) });
      const service = new TransactionService(repo);

      const result = await service.getSummary(USER_ID, { month: 1, year: 2026 });

      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(0);
      expect(result.balance).toBe(0);
      expect(result.byCategoryExpense).toHaveLength(0);
      expect(result.dailyTotals).toHaveLength(31);
    });
  });

  describe("update", () => {
    it("updates an owned transaction", async () => {
      const repo = makeRepo({ update: jest.fn().mockResolvedValue(fakeTransaction({ amount: { toNumber: () => 250 } })) });
      const service = new TransactionService(repo);

      const result = await service.update(USER_ID, "tx-1", { amount: 250 });

      expect(result.amount).toBe(250);
    });

    it("throws NotFoundException when updating a transaction the user does not own", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(fakeTransaction({ userId: "other" })) });
      const service = new TransactionService(repo);
      await expect(service.update(USER_ID, "tx-1", { amount: 1 })).rejects.toThrow(NotFoundException);
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("deletes an owned transaction", async () => {
      const repo = makeRepo();
      const service = new TransactionService(repo);
      const result = await service.remove(USER_ID, "tx-1");
      expect(repo.delete).toHaveBeenCalledWith("tx-1");
      expect(result.id).toBe("tx-1");
    });

    it("throws NotFoundException when deleting a transaction the user does not own", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(fakeTransaction({ userId: "other" })) });
      const service = new TransactionService(repo);
      await expect(service.remove(USER_ID, "tx-1")).rejects.toThrow(NotFoundException);
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });
});
