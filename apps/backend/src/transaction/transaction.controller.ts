import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  CreateTransactionDto,
  FindTransactionsQueryDto,
  UpdateTransactionDto,
} from "@finance-tracker/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TransactionService } from "./transaction.service";

@Controller("transactions")
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateTransactionDto) {
    return this.transactionService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser() userId: string, @Query() query: FindTransactionsQueryDto) {
    return this.transactionService.findAll(userId, query);
  }

  @Get(":id")
  findOne(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.transactionService.findOne(userId, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(userId, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() userId: string, @Param("id") id: string) {
    return this.transactionService.remove(userId, id);
  }
}
