import { IsInt, IsNumber, IsString, Max, Min } from "class-validator";

export class CreateBudgetDto {
  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  categoryId!: string;

  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @IsInt()
  @Min(2000)
  year!: number;
}
