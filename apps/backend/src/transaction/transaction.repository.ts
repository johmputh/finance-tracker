import { Injectable } from "@nestjs/common";
import type { Prisma, Transaction } from "@finance-tracker/database";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.TransactionUncheckedCreateInput): Promise<Transaction> {
    return this.prisma.client.transaction.create({ data });
  }

  findManyByUser(userId: string, skip: number, take: number): Promise<Transaction[]> {
    return this.prisma.client.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  }

  countByUser(userId: string): Promise<number> {
    return this.prisma.client.transaction.count({ where: { userId } });
  }

  findById(id: string): Promise<Transaction | null> {
    return this.prisma.client.transaction.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.TransactionUncheckedUpdateInput): Promise<Transaction> {
    return this.prisma.client.transaction.update({ where: { id }, data });
  }

  delete(id: string): Promise<Transaction> {
    return this.prisma.client.transaction.delete({ where: { id } });
  }
}
