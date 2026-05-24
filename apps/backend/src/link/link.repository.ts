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

  async markUsed(id: string): Promise<void> {
    await this.prisma.client.linkCode.update({ where: { id }, data: { usedAt: new Date() } });
  }

  findUserByLineId(lineUserId: string): Promise<User | null> {
    return this.prisma.client.user.findUnique({ where: { lineUserId } });
  }

  async moveTransactions(fromUserId: string, toUserId: string): Promise<void> {
    await this.prisma.client.transaction.updateMany({
      where: { userId: fromUserId },
      data: { userId: toUserId },
    });
  }

  async updateUserLineId(userId: string, lineUserId: string): Promise<void> {
    await this.prisma.client.user.update({ where: { id: userId }, data: { lineUserId } });
  }

  async deleteUser(id: string): Promise<void> {
    await this.prisma.client.user.delete({ where: { id } });
  }
}
