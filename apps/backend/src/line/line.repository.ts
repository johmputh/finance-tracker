import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import * as bcrypt from "bcrypt";
import type { Category, Prisma, Transaction, User } from "@finance-tracker/database";
import { PrismaService } from "../prisma/prisma.service";

export type TransactionWithCategory = Transaction & { category: Category };

@Injectable()
export class LineRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByLineId(lineUserId: string): Promise<User | null> {
    return this.prisma.client.user.findUnique({ where: { lineUserId } });
  }

  async findOrCreateLineUser(lineUserId: string): Promise<User> {
    const existing = await this.findUserByLineId(lineUserId);
    if (existing) return existing;

    const password = await bcrypt.hash(randomUUID(), 10);
    return this.prisma.client.user.create({
      data: {
        lineUserId,
        email: `line_${lineUserId}@line.local`,
        name: "LINE User",
        password,
      },
    });
  }

  createTransaction(data: Prisma.TransactionUncheckedCreateInput): Promise<TransactionWithCategory> {
    return this.prisma.client.transaction.create({
      data,
      include: { category: true },
    }) as Promise<TransactionWithCategory>;
  }

  findLatestLineTransaction(userId: string): Promise<TransactionWithCategory | null> {
    return this.prisma.client.transaction.findFirst({
      where: { userId, source: "LINE" },
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }) as Promise<TransactionWithCategory | null>;
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.prisma.client.transaction.delete({ where: { id } });
  }

  findTransactionsInRange(userId: string, start: Date, end: Date): Promise<TransactionWithCategory[]> {
    return this.prisma.client.transaction.findMany({
      where: { userId, createdAt: { gte: start, lt: end } },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }) as Promise<TransactionWithCategory[]>;
  }
}
