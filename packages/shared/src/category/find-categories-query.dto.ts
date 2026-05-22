import { IsEnum, IsOptional } from "class-validator";
import { TransactionType } from "../transaction/transaction-type.enum";

export class FindCategoriesQueryDto {
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}
