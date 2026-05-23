import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import type { CreateRecurringDto, RecurringResponse, UpdateRecurringDto } from "@finance-tracker/shared";
import { TransactionType, type Recurring } from "@finance-tracker/database";
import { PrismaService } from "../prisma/prisma.service";
import { RecurringRepository } from "./recurring.repository";

@Injectable()
export class RecurringService {
  private readonly logger = new Logger(RecurringService.name);

  constructor(
    private readonly repository: RecurringRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, dto: CreateRecurringDto): Promise<RecurringResponse> {
    await this.validateCategory(userId, dto.categoryId, dto.type);
    const recurring = await this.repository.create({
      userId,
      amount: dto.amount,
      type: dto.type as TransactionType,
      categoryId: dto.categoryId,
      description: dto.description,
      dayOfMonth: dto.dayOfMonth,
    });
    return this.toResponse(recurring);
  }

  async findAll(userId: string): Promise<RecurringResponse[]> {
    const recurrings = await this.repository.findAllByUser(userId);
    return recurrings.map((r) => this.toResponse(r));
  }

  async findOne(userId: string, id: string): Promise<RecurringResponse> {
    const recurring = await this.getOwned(userId, id);
    return this.toResponse(recurring);
  }

  async update(userId: string, id: string, dto: UpdateRecurringDto): Promise<RecurringResponse> {
    const existing = await this.getOwned(userId, id);
    if (dto.categoryId) {
      await this.validateCategory(userId, dto.categoryId, dto.type ?? existing.type);
    }
    const recurring = await this.repository.update(id, {
      amount: dto.amount,
      type: dto.type as TransactionType | undefined,
      categoryId: dto.categoryId,
      description: dto.description,
      dayOfMonth: dto.dayOfMonth,
      active: dto.active,
    });
    return this.toResponse(recurring);
  }

  async remove(userId: string, id: string): Promise<RecurringResponse> {
    await this.getOwned(userId, id);
    const recurring = await this.repository.delete(id);
    return this.toResponse(recurring);
  }

  @Cron("1 0 * * *")
  async processRecurring(): Promise<void> {
    const today = new Date();
    const dayOfMonth = today.getDate();
    this.logger.log(`Processing recurring transactions for day ${dayOfMonth}`);

    const recurrings = await this.repository.findActiveByDayOfMonth(dayOfMonth);

    const results = await Promise.allSettled(
      recurrings.map((r) =>
        this.prisma.client.transaction.create({
          data: {
            userId: r.userId,
            amount: r.amount,
            type: r.type,
            categoryId: r.categoryId,
            description: r.description,
            source: "RECURRING",
          },
        }),
      ),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    this.logger.log(`Created ${results.length - failed} recurring transactions; ${failed} failed`);
  }

  private async getOwned(userId: string, id: string): Promise<Recurring> {
    const recurring = await this.repository.findById(id);
    if (!recurring || recurring.userId !== userId) {
      throw new NotFoundException("Recurring not found");
    }
    return recurring;
  }

  private async validateCategory(userId: string, categoryId: string, type: string): Promise<void> {
    const category = await this.prisma.client.category.findUnique({
      where: { id: categoryId },
      select: { id: true, type: true, userId: true },
    });
    if (!category) throw new BadRequestException("Category not found");
    if (category.userId !== null && category.userId !== userId) {
      throw new BadRequestException("Category does not belong to you");
    }
    if (category.type !== type) {
      throw new BadRequestException("Category type does not match transaction type");
    }
  }

  private toResponse(r: Recurring): RecurringResponse {
    return {
      id: r.id,
      type: r.type,
      amount: r.amount.toNumber(),
      categoryId: r.categoryId,
      description: r.description,
      dayOfMonth: r.dayOfMonth,
      active: r.active,
      userId: r.userId,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}
