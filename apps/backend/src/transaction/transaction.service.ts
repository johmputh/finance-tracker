import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  CreateTransactionDto,
  FindTransactionsQueryDto,
  PaginatedResponse,
  TransactionResponse,
  TransactionSummaryQueryDto,
  TransactionSummaryResponse,
  UpdateTransactionDto,
} from "@finance-tracker/shared";
import type { Transaction } from "@finance-tracker/database";
import type { TransactionWithCategory } from "./transaction.repository";
import { TransactionRepository } from "./transaction.repository";

@Injectable()
export class TransactionService {
  constructor(private readonly repository: TransactionRepository) {}

  async create(userId: string, dto: CreateTransactionDto): Promise<TransactionResponse> {
    const category = await this.repository.findCategoryById(dto.categoryId);
    if (!category) throw new BadRequestException("Category not found");
    if (category.userId !== null && category.userId !== userId) {
      throw new BadRequestException("Category does not belong to you");
    }
    if (category.type !== dto.type) {
      throw new BadRequestException("Category type does not match transaction type");
    }

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

  async findAll(userId: string, query: FindTransactionsQueryDto): Promise<PaginatedResponse<TransactionResponse>> {
    const { page, limit, startDate, endDate, categoryId, type } = query;
    const skip = (page - 1) * limit;
    const filter = { startDate, endDate, categoryId, type };

    const [transactions, total] = await Promise.all([
      this.repository.findManyFiltered(userId, filter, skip, limit),
      this.repository.countFiltered(userId, filter),
    ]);

    return {
      data: transactions.map((tx) => this.toResponse(tx)),
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

  async getSummary(userId: string, query: TransactionSummaryQueryDto): Promise<TransactionSummaryResponse> {
    const now = new Date();
    const month = query.month ?? now.getMonth() + 1;
    const year = query.year ?? now.getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const transactions = await this.repository.findForSummary(userId, startDate, endDate);

    return this.computeSummary(transactions, month, year);
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto): Promise<TransactionResponse> {
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

  private computeSummary(transactions: TransactionWithCategory[], month: number, year: number): TransactionSummaryResponse {
    let totalIncome = 0;
    let totalExpense = 0;
    const expenseByCat = new Map<string, { name: string; icon: string; total: number }>();
    const incomeByCat = new Map<string, { name: string; icon: string; total: number }>();
    const dailyMap = new Map<string, { income: number; expense: number }>();

    for (const tx of transactions) {
      const amount = tx.amount.toNumber();
      const dateKey = tx.createdAt.toISOString().slice(0, 10);

      if (!dailyMap.has(dateKey)) dailyMap.set(dateKey, { income: 0, expense: 0 });

      if (tx.type === "INCOME") {
        totalIncome += amount;
        dailyMap.get(dateKey)!.income += amount;
        const e = incomeByCat.get(tx.categoryId) ?? { name: tx.category.name, icon: tx.category.icon, total: 0 };
        e.total += amount;
        incomeByCat.set(tx.categoryId, e);
      } else {
        totalExpense += amount;
        dailyMap.get(dateKey)!.expense += amount;
        const e = expenseByCat.get(tx.categoryId) ?? { name: tx.category.name, icon: tx.category.icon, total: 0 };
        e.total += amount;
        expenseByCat.set(tx.categoryId, e);
      }
    }

    const toSummary = (map: Map<string, { name: string; icon: string; total: number }>, grand: number) =>
      [...map.values()]
        .sort((a, b) => b.total - a.total)
        .map((item) => ({
          name: item.name,
          icon: item.icon,
          total: item.total,
          percentage: grand > 0 ? Math.round((item.total / grand) * 10000) / 100 : 0,
        }));

    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyTotals = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const entry = dailyMap.get(date) ?? { income: 0, expense: 0 };
      return { date, ...entry };
    });

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      byCategoryExpense: toSummary(expenseByCat, totalExpense),
      byCategoryIncome: toSummary(incomeByCat, totalIncome),
      dailyTotals,
    };
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
