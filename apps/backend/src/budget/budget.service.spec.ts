import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { BudgetRepository } from "./budget.repository";
import { BudgetService } from "./budget.service";

const USER_ID = "user-1";
const CAT_ID = "cat-1";
const BUDGET_ID = "budget-1";

function fakeCategory(overrides: Record<string, unknown> = {}) {
  return { id: CAT_ID, type: "EXPENSE", userId: null, ...overrides };
}

function fakeBudget(overrides: Record<string, unknown> = {}) {
  return {
    id: BUDGET_ID,
    amount: { toNumber: () => 1000 },
    month: 5,
    year: 2026,
    userId: USER_ID,
    categoryId: CAT_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function fakeBudgetWithCategory(overrides: Record<string, unknown> = {}) {
  return {
    ...fakeBudget(overrides),
    category: { id: CAT_ID, name: "อาหาร", icon: "🍔", type: "EXPENSE", userId: null, createdAt: new Date() },
  };
}

function makeRepo(overrides: Partial<Record<keyof BudgetRepository, jest.Mock>> = {}): BudgetRepository {
  return {
    upsert: jest.fn().mockResolvedValue(fakeBudget()),
    findAllByUser: jest.fn().mockResolvedValue([fakeBudgetWithCategory()]),
    findById: jest.fn().mockResolvedValue(fakeBudget()),
    delete: jest.fn().mockResolvedValue(fakeBudget()),
    sumExpensesByCategory: jest.fn().mockResolvedValue([]),
    findCategoryById: jest.fn().mockResolvedValue(fakeCategory()),
    ...overrides,
  } as unknown as BudgetRepository;
}

describe("BudgetService", () => {
  describe("upsert", () => {
    it("creates a budget when category is valid EXPENSE type", async () => {
      const repo = makeRepo();
      const service = new BudgetService(repo);

      const result = await service.upsert(USER_ID, {
        amount: 1000,
        categoryId: CAT_ID,
        month: 5,
        year: 2026,
      });

      expect(repo.upsert).toHaveBeenCalledWith({
        userId: USER_ID,
        categoryId: CAT_ID,
        month: 5,
        year: 2026,
        amount: 1000,
      });
      expect(result.id).toBe(BUDGET_ID);
    });

    it("throws BadRequestException when category type is not EXPENSE", async () => {
      const repo = makeRepo({ findCategoryById: jest.fn().mockResolvedValue(fakeCategory({ type: "INCOME" })) });
      const service = new BudgetService(repo);

      await expect(
        service.upsert(USER_ID, { amount: 1000, categoryId: CAT_ID, month: 5, year: 2026 }),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequestException when category does not exist", async () => {
      const repo = makeRepo({ findCategoryById: jest.fn().mockResolvedValue(null) });
      const service = new BudgetService(repo);

      await expect(
        service.upsert(USER_ID, { amount: 1000, categoryId: CAT_ID, month: 5, year: 2026 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getStatus", () => {
    it("returns correct percentage and isOverBudget=true when spent exceeds budget", async () => {
      const spentRows = [{ categoryId: CAT_ID, _sum: { amount: 1500 } }];
      const repo = makeRepo({ sumExpensesByCategory: jest.fn().mockResolvedValue(spentRows) });
      const service = new BudgetService(repo);

      const result = await service.getStatus(USER_ID, 5, 2026);

      expect(result).toHaveLength(1);
      expect(result[0].budgetAmount).toBe(1000);
      expect(result[0].spentAmount).toBe(1500);
      expect(result[0].percentage).toBe(150);
      expect(result[0].isOverBudget).toBe(true);
    });

    it("returns correct percentage and isOverBudget=false when within budget", async () => {
      const spentRows = [{ categoryId: CAT_ID, _sum: { amount: 500 } }];
      const repo = makeRepo({ sumExpensesByCategory: jest.fn().mockResolvedValue(spentRows) });
      const service = new BudgetService(repo);

      const result = await service.getStatus(USER_ID, 5, 2026);

      expect(result[0].percentage).toBe(50);
      expect(result[0].isOverBudget).toBe(false);
    });

    it("returns empty array when no budgets exist", async () => {
      const repo = makeRepo({ findAllByUser: jest.fn().mockResolvedValue([]) });
      const service = new BudgetService(repo);

      const result = await service.getStatus(USER_ID, 5, 2026);

      expect(result).toHaveLength(0);
    });
  });

  describe("remove", () => {
    it("deletes a budget owned by the user", async () => {
      const repo = makeRepo();
      const service = new BudgetService(repo);

      await service.remove(USER_ID, BUDGET_ID);

      expect(repo.delete).toHaveBeenCalledWith(BUDGET_ID);
    });

    it("throws NotFoundException when budget does not belong to the user", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(fakeBudget({ userId: "other-user" })) });
      const service = new BudgetService(repo);

      await expect(service.remove(USER_ID, BUDGET_ID)).rejects.toThrow(NotFoundException);
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it("throws NotFoundException when budget does not exist", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const service = new BudgetService(repo);

      await expect(service.remove(USER_ID, BUDGET_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
