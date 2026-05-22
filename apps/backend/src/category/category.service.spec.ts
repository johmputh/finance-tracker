import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import type { CategoryRepository } from "./category.repository";
import { CategoryService } from "./category.service";

const USER_ID = "user-1";
const OTHER_ID = "user-2";
const CAT_ID = "cat-1";

function fakeCategory(overrides: Record<string, unknown> = {}) {
  return {
    id: CAT_ID,
    name: "อาหาร",
    icon: "🍔",
    type: "EXPENSE",
    userId: USER_ID,
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function makeRepo(overrides: Partial<Record<keyof CategoryRepository, jest.Mock>> = {}): CategoryRepository {
  return {
    findAllVisible: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(fakeCategory()),
    create: jest.fn().mockResolvedValue(fakeCategory()),
    update: jest.fn().mockResolvedValue(fakeCategory()),
    delete: jest.fn().mockResolvedValue(fakeCategory()),
    countTransactions: jest.fn().mockResolvedValue(0),
    ...overrides,
  } as unknown as CategoryRepository;
}

describe("CategoryService", () => {
  describe("findAll", () => {
    it("returns mapped responses", async () => {
      const repo = makeRepo({ findAllVisible: jest.fn().mockResolvedValue([fakeCategory()]) });
      const service = new CategoryService(repo);
      const result = await service.findAll(USER_ID, {});
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(CAT_ID);
      expect(result[0].createdAt).toBe("2026-01-01T00:00:00.000Z");
    });
  });

  describe("create", () => {
    it("creates and returns category", async () => {
      const repo = makeRepo();
      const service = new CategoryService(repo);
      const result = await service.create(USER_ID, { name: "อาหาร", icon: "🍔", type: "EXPENSE" });
      expect(result.userId).toBe(USER_ID);
    });
  });

  describe("update", () => {
    it("updates owned category", async () => {
      const updated = fakeCategory({ name: "ใหม่" });
      const repo = makeRepo({ update: jest.fn().mockResolvedValue(updated) });
      const service = new CategoryService(repo);
      const result = await service.update(USER_ID, CAT_ID, { name: "ใหม่" });
      expect(result.name).toBe("ใหม่");
    });

    it("throws 404 when category not found", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const service = new CategoryService(repo);
      await expect(service.update(USER_ID, CAT_ID, {})).rejects.toThrow(NotFoundException);
    });

    it("throws 403 for seed default (userId=null)", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(fakeCategory({ userId: null })) });
      const service = new CategoryService(repo);
      await expect(service.update(USER_ID, CAT_ID, {})).rejects.toThrow(ForbiddenException);
    });

    it("throws 403 for another user's category", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(fakeCategory({ userId: OTHER_ID })) });
      const service = new CategoryService(repo);
      await expect(service.update(USER_ID, CAT_ID, {})).rejects.toThrow(ForbiddenException);
    });
  });

  describe("delete", () => {
    it("deletes owned category with no transactions", async () => {
      const repo = makeRepo();
      const service = new CategoryService(repo);
      await expect(service.delete(USER_ID, CAT_ID)).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith(CAT_ID);
    });

    it("throws 403 for seed default", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(fakeCategory({ userId: null })) });
      const service = new CategoryService(repo);
      await expect(service.delete(USER_ID, CAT_ID)).rejects.toThrow(ForbiddenException);
    });

    it("throws 409 when category has transactions", async () => {
      const repo = makeRepo({ countTransactions: jest.fn().mockResolvedValue(3) });
      const service = new CategoryService(repo);
      await expect(service.delete(USER_ID, CAT_ID)).rejects.toThrow(ConflictException);
    });
  });
});
