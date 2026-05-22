import type {
  CategoryResponse,
  PaginatedResponse,
  TransactionResponse,
  TransactionSummaryResponse,
} from "@finance-tracker/shared";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getSummary: (month: number, year: number) =>
    request<TransactionSummaryResponse>(`/transactions/summary?month=${month}&year=${year}`),

  getTransactions: (params: Record<string, string | number>) =>
    request<PaginatedResponse<TransactionResponse>>(
      `/transactions?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`,
    ),

  getCategories: (type?: string) =>
    request<CategoryResponse[]>(`/categories${type ? `?type=${type}` : ""}`),
};
