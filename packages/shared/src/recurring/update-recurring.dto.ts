import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateRecurringDto {
  @IsOptional()
  @IsIn(["INCOME", "EXPENSE"])
  type?: string;

  @IsOptional()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
