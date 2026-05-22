export interface CategorySummary {
  name: string;
  icon: string;
  total: number;
  percentage: number;
}

export interface DailyTotal {
  date: string;
  income: number;
  expense: number;
}

export interface TransactionSummaryResponse {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategoryExpense: CategorySummary[];
  byCategoryIncome: CategorySummary[];
  dailyTotals: DailyTotal[];
}
