import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { BudgetController } from "./budget.controller";
import { BudgetRepository } from "./budget.repository";
import { BudgetService } from "./budget.service";

@Module({
  imports: [AuthModule],
  controllers: [BudgetController],
  providers: [BudgetService, BudgetRepository],
})
export class BudgetModule {}
