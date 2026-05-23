import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CreateBudgetDto } from "@finance-tracker/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BudgetService } from "./budget.service";

@Controller("budget")
@UseGuards(JwtAuthGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  upsert(@CurrentUser() userId: string, @Body() dto: CreateBudgetDto) {
    return this.budgetService.upsert(userId, dto);
  }

  @Get()
  getStatus(
    @CurrentUser() userId: string,
    @Query("month") month: string,
    @Query("year") year: string,
  ) {
    return this.budgetService.getStatus(userId, Number(month), Number(year));
  }

  @Delete(":id")
  remove(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.budgetService.remove(userId, id);
  }
}
