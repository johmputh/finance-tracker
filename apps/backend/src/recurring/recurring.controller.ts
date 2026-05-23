import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { CreateRecurringDto, RecurringResponse, UpdateRecurringDto } from "@finance-tracker/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { RecurringService } from "./recurring.service";

@UseGuards(JwtAuthGuard)
@Controller("recurring")
export class RecurringController {
  constructor(private readonly service: RecurringService) {}

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateRecurringDto): Promise<RecurringResponse> {
    return this.service.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser() userId: string): Promise<RecurringResponse[]> {
    return this.service.findAll(userId);
  }

  @Get(":id")
  findOne(@CurrentUser() userId: string, @Param("id") id: string): Promise<RecurringResponse> {
    return this.service.findOne(userId, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateRecurringDto,
  ): Promise<RecurringResponse> {
    return this.service.update(userId, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() userId: string, @Param("id") id: string): Promise<RecurringResponse> {
    return this.service.remove(userId, id);
  }
}
