import { Injectable } from "@nestjs/common";
import type { Budget, Category, Prisma } from "@finance-tracker/database";
import { PrismaService } from "../prisma/prisma.service";

export type BudgetWithCategory = Budget & { category: Category };

@Injectable()
export class BudgetRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(data: { userId: string; categoryId: string; month: number; year: number; amount: number }): Promise<Budget> {
    const { userId, categoryId, month, year, amount } = data;
    return this.prisma.client.budget.upsert({
      where: { userId_categoryId_month_year: { userId, categoryId, month, year } },
      create: { userId, categoryId, month, year, amount },
      update: { amount },
    });
  }

  findAllByUser(userId: string, month: number, year: number): Promise<BudgetWithCategory[]> {
    return this.prisma.client.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
    }) as Promise<BudgetWithCategory[]>;
  }

  findById(id: string): Promise<Budget | null> {
    return this.prisma.client.budget.findUnique({ where: { id } });
  }

  delete(id: string): Promise<Budget> {
    return this.prisma.client.budget.delete({ where: { id } });
  }

  async sumExpensesByCategory(
    userId: string,
    categoryIds: string[],
    month: number,
    year: number,
  ): Promise<Array<{ categoryId: string; _sum: { amount: Prisma.Decimal | null } }>> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    const rows = await this.prisma.client.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        categoryId: { in: categoryIds },
        type: "EXPENSE",
        createdAt: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
    });
    return rows as Array<{ categoryId: string; _sum: { amount: Prisma.Decimal | null } }>;
  }

  findCategoryById(id: string): Promise<{ id: string; type: string; userId: string | null } | null> {
    return this.prisma.client.category.findUnique({
      where: { id },
      select: { id: true, type: true, userId: true },
    });
  }
}
