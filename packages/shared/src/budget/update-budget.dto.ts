import { IsNumber, Min } from "class-validator";

export class UpdateBudgetDto {
  @IsNumber()
  @Min(1)
  amount!: number;
}
