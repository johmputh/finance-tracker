import type { TransactionType } from "../transaction/transaction-type.enum";

export interface CategoryResponse {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
  userId: string | null;
  createdAt: string;
}
