import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { join } from "node:path";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { BudgetModule } from "./budget/budget.module";
import { CategoryModule } from "./category/category.module";
import { PrismaModule } from "./prisma/prisma.module";
import { LineModule } from "./line/line.module";
import { LinkModule } from "./link/link.module";
import { RecurringModule } from "./recurring/recurring.module";
import { TransactionModule } from "./transaction/transaction.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, "..", "..", "..", ".env"),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    CategoryModule,
    TransactionModule,
    RecurringModule,
    BudgetModule,
    LineModule,
    LinkModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
