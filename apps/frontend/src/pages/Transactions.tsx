import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { CategoryResponse, TransactionResponse } from "@finance-tracker/shared";
import { Modal } from "../components/ui/Modal";
import { api } from "../lib/api";

const LIMIT = 20;

const TYPE_OPTIONS = [
  { value: "", label: "ทั้งหมด" },
  { value: "INCOME", label: "รายรับ" },
  { value: "EXPENSE", label: "รายจ่าย" },
];

function formatMoney(amount: number) {
  return `฿${amount.toLocaleString("th-TH")}`;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

interface Filters {
  type: string;
  categoryId: string;
  startDate: string;
  endDate: string;
}

interface FormData {
  amount: string;
  type: string;
  categoryId: string;
  description: string;
}

const emptyForm: FormData = { amount: "", type: "EXPENSE", categoryId: "", description: "" };

const inputClass =
  "w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition placeholder:text-zinc-500";
const labelClass = "block text-xs text-zinc-400 mb-1";

function TransactionForm({
  initial,
  categories,
  onSubmit,
  onCancel,
  submitting,
  formError,
}: {
  initial: FormData;
  categories: CategoryResponse[];
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  submitting: boolean;
  formError: string | null;
}) {
  const [form, setForm] = useState<FormData>(initial);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === form.type),
    [categories, form.type],
  );

  const handleTypeChange = (type: string) => {
    setForm((f) => ({ ...f, type, categoryId: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {formError && (
        <p className="text-rose-400 text-xs bg-rose-950/50 border border-rose-800/50 rounded-lg px-3 py-2">
          {formError}
        </p>
      )}

      <div>
        <label className={labelClass}>ประเภท</label>
        <div className="flex gap-2">
          {[
            { v: "EXPENSE", label: "รายจ่าย" },
            { v: "INCOME", label: "รายรับ" },
          ].map(({ v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => handleTypeChange(v)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition active:scale-95 ${
                form.type === v
                  ? v === "EXPENSE"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/50"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>หมวดหมู่</label>
        <select
          value={form.categoryId}
          onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          required
          className={inputClass}
        >
          <option value="">เลือกหมวดหมู่</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>จำนวนเงิน (บาท)</label>
        <input
          ref={amountRef}
          type="number"
          min="0.01"
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          required
          placeholder="0.00"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>รายละเอียด (ไม่บังคับ)</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="ระบุรายละเอียด..."
          maxLength={255}
          className={inputClass}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg text-sm text-zinc-400 border border-zinc-700 hover:bg-zinc-800 transition active:scale-95"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </form>
  );
}

export function Transactions() {
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    type: "",
    categoryId: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionResponse | null>(null);
  const [deletingTx, setDeletingTx] = useState<TransactionResponse | null>(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: LIMIT };
    if (filters.type) params.type = filters.type;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    api
      .getTransactions(params)
      .then((res) => {
        setTransactions(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, filters]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const setFilter = (key: keyof Filters, value: string) => {
    setPage(1);
    setFilters((f) => ({
      ...f,
      [key]: value,
      ...(key === "type" ? { categoryId: "" } : {}),
    }));
  };

  const handleCreate = async (form: FormData) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await api.createTransaction({
        amount: Number(form.amount),
        type: form.type,
        categoryId: form.categoryId,
        description: form.description || undefined,
        source: "WEB",
      });
      setShowCreate(false);
      fetchTransactions();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (form: FormData) => {
    if (!editingTx) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await api.updateTransaction(editingTx.id, {
        amount: Number(form.amount),
        type: form.type,
        categoryId: form.categoryId,
        description: form.description || undefined,
      });
      setEditingTx(null);
      fetchTransactions();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTx) return;
    setSubmitting(true);
    try {
      await api.deleteTransaction(deletingTx.id);
      setDeletingTx(null);
      fetchTransactions();
      toast.success("ลบรายการสำเร็จ");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const editInitial = useMemo<FormData>(
    () =>
      editingTx
        ? {
            amount: String(editingTx.amount),
            type: editingTx.type,
            categoryId: editingTx.categoryId,
            description: editingTx.description ?? "",
          }
        : emptyForm,
    [editingTx],
  );

  const visibleCategories = useMemo(
    () => (filters.type ? categories.filter((c) => c.type === filters.type) : categories),
    [categories, filters.type],
  );

  const selectClass =
    "bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition";

  return (
    <div className="text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-zinc-100 font-kanit">รายการธุรกรรม</h2>
        <button
          onClick={() => {
            setFormError(null);
            setShowCreate(true);
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition hover:scale-[1.02] active:scale-95"
        >
          + เพิ่มรายการ
        </button>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <select
          value={filters.type}
          onChange={(e) => setFilter("type", e.target.value)}
          className={selectClass}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={filters.categoryId}
          onChange={(e) => setFilter("categoryId", e.target.value)}
          className={selectClass}
        >
          <option value="">หมวดหมู่ทั้งหมด</option>
          {visibleCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilter("startDate", e.target.value)}
          className={selectClass}
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilter("endDate", e.target.value)}
          className={selectClass}
        />
        {(filters.type || filters.categoryId || filters.startDate || filters.endDate) && (
          <button
            onClick={() => {
              setPage(1);
              setFilters({ type: "", categoryId: "", startDate: "", endDate: "" });
            }}
            className="text-sm text-zinc-400 hover:text-zinc-100 underline underline-offset-2 transition"
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-950 border border-rose-800 text-rose-300 rounded-xl p-4 mb-4 text-sm">
          เกิดข้อผิดพลาด: {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3">วันที่</th>
                  <th className="text-left px-4 py-3">รายการ</th>
                  <th className="text-left px-4 py-3">หมวด</th>
                  <th className="text-right px-4 py-3">จำนวนเงิน</th>
                  <th className="text-center px-4 py-3">ประเภท</th>
                  <th className="text-center px-4 py-3">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-zinc-500">
                      ไม่มีรายการ
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const cat = categoryMap.get(tx.categoryId);
                    const isIncome = tx.type === "INCOME";
                    return (
                      <tr key={tx.id} className="hover:bg-zinc-800/50 transition-colors duration-150">
                        <td className="px-4 py-3 text-zinc-400 whitespace-nowrap text-xs">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-zinc-100 max-w-xs truncate">
                          {tx.description ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                          {cat ? `${cat.icon} ${cat.name}` : "—"}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                            isIncome ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatMoney(tx.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              isIncome
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-rose-500/15 text-rose-400"
                            }`}
                          >
                            {isIncome ? "รายรับ" : "รายจ่าย"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setFormError(null);
                                setEditingTx(tx);
                              }}
                              className="text-xs text-zinc-400 hover:text-zinc-100 px-2 py-1 rounded hover:bg-zinc-700 transition"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => setDeletingTx(tx)}
                              className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10 transition"
                            >
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden flex flex-col gap-3">
            {transactions.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">ไม่มีรายการ</div>
            ) : (
              transactions.map((tx) => {
                const cat = categoryMap.get(tx.categoryId);
                const isIncome = tx.type === "INCOME";
                return (
                  <div
                    key={tx.id}
                    className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex items-center gap-3"
                  >
                    <span className="text-xl w-8 text-center shrink-0">{cat?.icon ?? "—"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-100 truncate">
                        {tx.description ?? cat?.name ?? "—"}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {cat?.name ?? "—"} · {formatDate(tx.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`text-sm font-semibold ${
                          isIncome ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatMoney(tx.amount)}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setFormError(null);
                            setEditingTx(tx);
                          }}
                          className="text-xs text-zinc-400 hover:text-zinc-100 px-1.5 py-0.5 rounded hover:bg-zinc-700 transition"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => setDeletingTx(tx)}
                          className="text-xs text-rose-400 hover:text-rose-300 px-1.5 py-0.5 rounded hover:bg-rose-500/10 transition"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm text-zinc-400 flex-wrap gap-2">
            <span>รายการทั้งหมด {total} รายการ</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95"
                >
                  ← ก่อนหน้า
                </button>
                <span className="px-2 text-zinc-300">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95"
                >
                  ถัดไป →
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal title="เพิ่มรายการใหม่" onClose={() => setShowCreate(false)}>
          <TransactionForm
            initial={emptyForm}
            categories={categories}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            submitting={submitting}
            formError={formError}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editingTx && (
        <Modal title="แก้ไขรายการ" onClose={() => setEditingTx(null)}>
          <TransactionForm
            initial={editInitial}
            categories={categories}
            onSubmit={handleUpdate}
            onCancel={() => setEditingTx(null)}
            submitting={submitting}
            formError={formError}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deletingTx && (
        <Modal title="ยืนยันการลบ" onClose={() => setDeletingTx(null)}>
          <p className="text-zinc-300 text-sm mb-6 leading-relaxed">
            คุณต้องการลบรายการ{" "}
            <span className="text-zinc-100 font-medium">
              &ldquo;{deletingTx.description ?? categoryMap.get(deletingTx.categoryId)?.name ?? "รายการนี้"}&rdquo;
            </span>{" "}
            มูลค่า{" "}
            <span className={deletingTx.type === "INCOME" ? "text-emerald-400" : "text-rose-400"}>
              {formatMoney(deletingTx.amount)}
            </span>{" "}
            ใช่หรือไม่?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setDeletingTx(null)}
              className="flex-1 py-2 rounded-lg text-sm text-zinc-400 border border-zinc-700 hover:bg-zinc-800 transition active:scale-95"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "กำลังลบ..." : "ลบรายการ"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
