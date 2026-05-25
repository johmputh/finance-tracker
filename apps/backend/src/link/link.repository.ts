import { Injectable } from "@nestjs/common";
import type { LinkCode, User } from "@finance-tracker/database";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LinkRepository {
  constructor(private readonly prisma: PrismaService) {}

  createCode(userId: string, code: string, expiresAt: Date): Promise<LinkCode> {
    return this.prisma.client.linkCode.create({ data: { userId, code, expiresAt } });
  }

  findByCode(code: string): Promise<LinkCode | null> {
    return this.prisma.client.linkCode.findUnique({ where: { code } });
  }

  async claimCode(id: string): Promise<boolean> {
    const result = await this.prisma.client.linkCode.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: new Date() },
    });
    return result.count > 0;
  }

  findUserByLineId(lineUserId: string): Promise<User | null> {
    return this.prisma.client.user.findUnique({ where: { lineUserId } });
  }

  async updateUserLineId(userId: string, lineUserId: string): Promise<void> {
    await this.prisma.client.user.update({ where: { id: userId }, data: { lineUserId } });
  }

  async migrateUserData(fromUserId: string, toUserId: string, lineUserId: string): Promise<void> {
    await this.prisma.client.$transaction(async (tx) => {
      await tx.transaction.updateMany({ where: { userId: fromUserId }, data: { userId: toUserId } });
      await tx.recurring.updateMany({ where: { userId: fromUserId }, data: { userId: toUserId } });
      await tx.budget.updateMany({ where: { userId: fromUserId }, data: { userId: toUserId } });
      await tx.category.deleteMany({ where: { userId: fromUserId } });
      await tx.user.delete({ where: { id: fromUserId } });
      await tx.user.update({ where: { id: toUserId }, data: { lineUserId } });
    });
  }

  async deleteExpiredCodes(): Promise<number> {
    const result = await this.prisma.client.linkCode.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
      },
    });
    return result.count;
  }
}
