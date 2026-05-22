import { Injectable } from "@nestjs/common";
import type { Category, Prisma, Transaction } from "@finance-tracker/database";
import { PrismaService } from "../prisma/prisma.service";

export type TransactionWithCategory = Transaction & { category: Category };

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  type?: string;
}

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.TransactionUncheckedCreateInput): Promise<Transaction> {
    return this.prisma.client.transaction.create({ data });
  }

  findManyFiltered(userId: string, filter: TransactionFilter, skip: number, take: number): Promise<Transaction[]> {
    return this.prisma.client.transaction.findMany({
      where: this.buildWhere(userId, filter),
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  }

  countFiltered(userId: string, filter: TransactionFilter): Promise<number> {
    return this.prisma.client.transaction.count({ where: this.buildWhere(userId, filter) });
  }

  findById(id: string): Promise<Transaction | null> {
    return this.prisma.client.transaction.findUnique({ where: { id } });
  }

  findCategoryById(id: string): Promise<{ id: string; type: string; userId: string | null } | null> {
    return this.prisma.client.category.findUnique({
      where: { id },
      select: { id: true, type: true, userId: true },
    });
  }

  findForSummary(userId: string, startDate: Date, endDate: Date): Promise<TransactionWithCategory[]> {
    return this.prisma.client.transaction.findMany({
      where: { userId, createdAt: { gte: startDate, lt: endDate } },
      include: { category: true },
    }) as Promise<TransactionWithCategory[]>;
  }

  update(id: string, data: Prisma.TransactionUncheckedUpdateInput): Promise<Transaction> {
    return this.prisma.client.transaction.update({ where: { id }, data });
  }

  delete(id: string): Promise<Transaction> {
    return this.prisma.client.transaction.delete({ where: { id } });
  }

  private buildWhere(userId: string, filter: TransactionFilter): Prisma.TransactionWhereInput {
    return {
      userId,
      ...(filter.type && { type: filter.type as Prisma.EnumTransactionTypeFilter }),
      ...(filter.categoryId && { categoryId: filter.categoryId }),
      ...((filter.startDate ?? filter.endDate) && {
        createdAt: {
          ...(filter.startDate && { gte: new Date(filter.startDate) }),
          ...(filter.endDate && { lte: new Date(filter.endDate) }),
        },
      }),
    };
  }
}
