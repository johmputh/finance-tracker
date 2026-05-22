import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  CreateTransactionDto,
  FindTransactionsQueryDto,
  PaginatedResponse,
  TransactionResponse,
  UpdateTransactionDto,
} from "@finance-tracker/shared";
import type { Transaction } from "@finance-tracker/database";
import { TransactionRepository } from "./transaction.repository";

@Injectable()
export class TransactionService {
  constructor(private readonly repository: TransactionRepository) {}

  async create(userId: string, dto: CreateTransactionDto): Promise<TransactionResponse> {
    const transaction = await this.repository.create({
      userId,
      amount: dto.amount,
      type: dto.type,
      categoryId: dto.categoryId,
      description: dto.description,
      source: dto.source,
    });
    return this.toResponse(transaction);
  }

  async findAll(
    userId: string,
    query: FindTransactionsQueryDto,
  ): Promise<PaginatedResponse<TransactionResponse>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.repository.findManyByUser(userId, skip, limit),
      this.repository.countByUser(userId),
    ]);

    return {
      data: transactions.map((transaction) => this.toResponse(transaction)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string): Promise<TransactionResponse> {
    const transaction = await this.getOwnedTransaction(userId, id);
    return this.toResponse(transaction);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponse> {
    await this.getOwnedTransaction(userId, id);
    const transaction = await this.repository.update(id, {
      amount: dto.amount,
      type: dto.type,
      categoryId: dto.categoryId,
      description: dto.description,
      source: dto.source,
    });
    return this.toResponse(transaction);
  }

  async remove(userId: string, id: string): Promise<TransactionResponse> {
    await this.getOwnedTransaction(userId, id);
    const transaction = await this.repository.delete(id);
    return this.toResponse(transaction);
  }

  private async getOwnedTransaction(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.repository.findById(id);
    if (!transaction || transaction.userId !== userId) {
      throw new NotFoundException("Transaction not found");
    }
    return transaction;
  }

  private toResponse(transaction: Transaction): TransactionResponse {
    return {
      id: transaction.id,
      amount: transaction.amount.toNumber(),
      type: transaction.type,
      description: transaction.description,
      source: transaction.source,
      categoryId: transaction.categoryId,
      userId: transaction.userId,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    };
  }
}
