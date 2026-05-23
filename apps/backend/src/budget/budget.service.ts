import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateBudgetDto, BudgetStatusResponse } from "@finance-tracker/shared";
import { BudgetRepository } from "./budget.repository";

@Injectable()
export class BudgetService {
  constructor(private readonly repository: BudgetRepository) {}

  async upsert(userId: string, dto: CreateBudgetDto): Promise<{ id: string }> {
    const category = await this.repository.findCategoryById(dto.categoryId);
    if (!category) throw new BadRequestException("Category not found");
    if (category.userId !== null && category.userId !== userId) {
      throw new BadRequestException("Category does not belong to you");
    }
    if (category.type !== "EXPENSE") {
      throw new BadRequestException("Budget can only be set for EXPENSE categories");
    }

    const budget = await this.repository.upsert({
      userId,
      categoryId: dto.categoryId,
      month: dto.month,
      year: dto.year,
      amount: dto.amount,
    });

    return { id: budget.id };
  }

  async getStatus(userId: string, month: number, year: number): Promise<BudgetStatusResponse> {
    const budgets = await this.repository.findAllByUser(userId, month, year);
    if (budgets.length === 0) return [];

    const categoryIds = budgets.map((b) => b.categoryId);
    const spentRows = await this.repository.sumExpensesByCategory(userId, categoryIds, month, year);

    const spentMap = new Map<string, number>();
    for (const row of spentRows) {
      spentMap.set(row.categoryId, row._sum.amount ? Number(row._sum.amount) : 0);
    }

    return budgets.map((budget) => {
      const budgetAmount = budget.amount.toNumber();
      const spentAmount = spentMap.get(budget.categoryId) ?? 0;
      const percentage = budgetAmount > 0 ? Math.round((spentAmount / budgetAmount) * 10000) / 100 : 0;

      return {
        categoryName: budget.category.name,
        categoryIcon: budget.category.icon,
        budgetAmount,
        spentAmount,
        percentage,
        isOverBudget: spentAmount > budgetAmount,
      };
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const budget = await this.repository.findById(id);
    if (!budget || budget.userId !== userId) {
      throw new NotFoundException("Budget not found");
    }
    await this.repository.delete(id);
  }
}
