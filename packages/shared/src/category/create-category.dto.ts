import { IsEnum, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { TransactionType } from "../transaction/transaction-type.enum";

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  icon!: string;

  @IsEnum(TransactionType)
  type!: TransactionType;
}
