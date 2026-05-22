import { NotFoundException } from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import type { TransactionRepository } from "./transaction.repository";

function createRepositoryMock() {
  return {
    create: jest.fn(),
    findManyByUser: jest.fn(),
    countByUser: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

function fakeTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: "tx-1",
    amount: { toNumber: () => 100 },
    type: "EXPENSE",
    description: "lunch",
    source: "WEB",
    categoryId: "cat-1",
    userId: "user-1",
    createdAt: new Date("2026-05-21T00:00:00.000Z"),
    updatedAt: new Date("2026-05-21T00:00:00.000Z"),
    ...overrides,
  };
}

describe("TransactionService", () => {
  let repository: ReturnType<typeof createRepositoryMock>;
  let service: TransactionService;

  beforeEach(() => {
    repository = createRepositoryMock();
    service = new TransactionService(repository as unknown as TransactionRepository);
  });

  describe("create", () => {
    it("creates a transaction for the user and maps the response", async () => {
      repository.create.mockResolvedValue(fakeTransaction());

      const result = await service.create("user-1", {
        amount: 100,
        type: "EXPENSE",
        categoryId: "cat-1",
        description: "lunch",
        source: "WEB",
      });

      expect(repository.create).toHaveBeenCalledWith({
        userId: "user-1",
        amount: 100,
        type: "EXPENSE",
        categoryId: "cat-1",
        description: "lunch",
        source: "WEB",
      });
      expect(result).toEqual({
        id: "tx-1",
        amount: 100,
        type: "EXPENSE",
        description: "lunch",
        source: "WEB",
        categoryId: "cat-1",
        userId: "user-1",
        createdAt: "2026-05-21T00:00:00.000Z",
        updatedAt: "2026-05-21T00:00:00.000Z",
      });
    });
  });

  describe("findAll", () => {
    it("returns paginated transactions with computed totals", async () => {
      repository.findManyByUser.mockResolvedValue([fakeTransaction()]);
      repository.countByUser.mockResolvedValue(5);

      const result = await service.findAll("user-1", { page: 2, limit: 2 });

      expect(repository.findManyByUser).toHaveBeenCalledWith("user-1", 2, 2);
      expect(repository.countByUser).toHaveBeenCalledWith("user-1");
      expect(result.total).toBe(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("findOne", () => {
    it("returns the transaction when owned by the user", async () => {
      repository.findById.mockResolvedValue(fakeTransaction());

      const result = await service.findOne("user-1", "tx-1");

      expect(result.id).toBe("tx-1");
    });

    it("throws NotFoundException when the transaction does not exist", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne("user-1", "missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("throws NotFoundException when the transaction belongs to another user", async () => {
      repository.findById.mockResolvedValue(fakeTransaction({ userId: "other" }));

      await expect(service.findOne("user-1", "tx-1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("updates an owned transaction", async () => {
      repository.findById.mockResolvedValue(fakeTransaction());
      repository.update.mockResolvedValue(fakeTransaction({ amount: { toNumber: () => 250 } }));

      const result = await service.update("user-1", "tx-1", { amount: 250 });

      expect(repository.update).toHaveBeenCalledWith("tx-1", {
        amount: 250,
        type: undefined,
        categoryId: undefined,
        description: undefined,
        source: undefined,
      });
      expect(result.amount).toBe(250);
    });

    it("throws NotFoundException when updating a transaction the user does not own", async () => {
      repository.findById.mockResolvedValue(fakeTransaction({ userId: "other" }));

      await expect(
        service.update("user-1", "tx-1", { amount: 1 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("deletes an owned transaction", async () => {
      repository.findById.mockResolvedValue(fakeTransaction());
      repository.delete.mockResolvedValue(fakeTransaction());

      const result = await service.remove("user-1", "tx-1");

      expect(repository.delete).toHaveBeenCalledWith("tx-1");
      expect(result.id).toBe("tx-1");
    });

    it("throws NotFoundException when deleting a transaction the user does not own", async () => {
      repository.findById.mockResolvedValue(fakeTransaction({ userId: "other" }));

      await expect(service.remove("user-1", "tx-1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
