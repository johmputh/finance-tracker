import type {
  CategoryResponse,
  PaginatedResponse,
  TransactionResponse,
  TransactionSummaryResponse,
  UserResponse,
} from "@finance-tracker/shared";

const BASE = "/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

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
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    if (text) body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    // ignore non-JSON bodies
  }
  if (!res.ok) {
    const message = typeof body.message === "string" ? body.message : res.statusText;
    throw new ApiError(message, res.status);
  }
  return body as T;
}

export const api = {
  login: (data: { email: string; password: string }) =>
    request<{ accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (data: { email: string; password: string; name: string }) =>
    request<UserResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () => request<UserResponse>("/auth/me"),

  updateProfile: (data: { name: string }) =>
    request<UserResponse>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<void>("/auth/me/password", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getSummary: (month: number, year: number) =>
    request<TransactionSummaryResponse>(`/transactions/summary?month=${month}&year=${year}`),

  getTransactions: (params: Record<string, string | number>) =>
    request<PaginatedResponse<TransactionResponse>>(
      `/transactions?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`,
    ),

  getCategories: (type?: string) =>
    request<CategoryResponse[]>(`/categories${type ? `?type=${type}` : ""}`),

  createCategory: (data: { name: string; icon: string; type: string }) =>
    request<CategoryResponse>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCategory: (id: string, data: { name?: string; icon?: string }) =>
    request<CategoryResponse>(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteCategory: (id: string) =>
    request<void>(`/categories/${id}`, { method: "DELETE" }),

  createTransaction: (data: {
    amount: number;
    type: string;
    categoryId: string;
    description?: string;
    source: string;
  }) =>
    request<TransactionResponse>("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTransaction: (
    id: string,
    data: {
      amount?: number;
      type?: string;
      categoryId?: string;
      description?: string;
    },
  ) =>
    request<TransactionResponse>(`/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteTransaction: (id: string) =>
    request<TransactionResponse>(`/transactions/${id}`, { method: "DELETE" }),
};
