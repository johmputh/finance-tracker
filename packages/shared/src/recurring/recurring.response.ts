export interface RecurringResponse {
  id: string;
  type: string;
  amount: number;
  categoryId: string;
  description: string | null;
  dayOfMonth: number;
  active: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
