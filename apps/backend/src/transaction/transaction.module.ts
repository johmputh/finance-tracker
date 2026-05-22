import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TransactionController } from "./transaction.controller";
import { TransactionRepository } from "./transaction.repository";
import { TransactionService } from "./transaction.service";

@Module({
  imports: [AuthModule],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionRepository],
})
export class TransactionModule {}
