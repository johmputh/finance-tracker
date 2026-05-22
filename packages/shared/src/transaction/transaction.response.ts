import { TransactionSource } from "./transaction-source.enum";
import { TransactionType } from "./transaction-type.enum";

export interface TransactionResponse {
  id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  source: TransactionSource;
  categoryId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
