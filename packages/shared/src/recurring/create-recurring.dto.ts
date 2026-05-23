import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateRecurringDto {
  @IsIn(["INCOME", "EXPENSE"])
  type!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth!: number;
}
