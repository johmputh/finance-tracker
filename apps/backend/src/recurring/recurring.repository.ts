import { Injectable } from "@nestjs/common";
import type { Prisma, Recurring } from "@finance-tracker/database";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RecurringRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.RecurringUncheckedCreateInput): Promise<Recurring> {
    return this.prisma.client.recurring.create({ data });
  }

  findAllByUser(userId: string): Promise<Recurring[]> {
    return this.prisma.client.recurring.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: string): Promise<Recurring | null> {
    return this.prisma.client.recurring.findUnique({ where: { id } });
  }

  findActiveByDayOfMonth(dayOfMonth: number): Promise<Recurring[]> {
    return this.prisma.client.recurring.findMany({
      where: { active: true, dayOfMonth },
    });
  }

  update(id: string, data: Prisma.RecurringUncheckedUpdateInput): Promise<Recurring> {
    return this.prisma.client.recurring.update({ where: { id }, data });
  }

  delete(id: string): Promise<Recurring> {
    return this.prisma.client.recurring.delete({ where: { id } });
  }
}
