import { Injectable } from "@nestjs/common";
import type { Category, Prisma } from "@finance-tracker/database";
import type { TransactionType } from "@finance-tracker/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllVisible(userId: string, type?: TransactionType): Promise<Category[]> {
    return this.prisma.client.category.findMany({
      where: {
        OR: [{ userId: null }, { userId }],
        ...(type ? { type } : {}),
      },
      orderBy: [{ userId: "asc" }, { createdAt: "asc" }],
    });
  }

  findById(id: string): Promise<Category | null> {
    return this.prisma.client.category.findUnique({ where: { id } });
  }

  create(data: Prisma.CategoryUncheckedCreateInput): Promise<Category> {
    return this.prisma.client.category.create({ data });
  }

  update(id: string, data: Prisma.CategoryUncheckedUpdateInput): Promise<Category> {
    return this.prisma.client.category.update({ where: { id }, data });
  }

  delete(id: string): Promise<Category> {
    return this.prisma.client.category.delete({ where: { id } });
  }

  countTransactions(categoryId: string): Promise<number> {
    return this.prisma.client.transaction.count({ where: { categoryId } });
  }
}
