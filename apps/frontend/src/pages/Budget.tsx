import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { BudgetStatusItem, BudgetStatusResponse, CategoryResponse } from "@finance-tracker/shared";
import { Modal } from "../components/ui/Modal";
import { api } from "../lib/api";

const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function formatMoney(amount: number) {
  return `฿${amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const inputClass =
  "w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition placeholder:text-zinc-500";
const labelClass = "block text-xs text-zinc-400 mb-1";

interface SetBudgetModalProps {
  item: BudgetStatusItem;
  categoryId: string;
  month: number;
  year: number;
  onClose: () => void;
  onSaved: () => void;
}

function SetBudgetModal({ item, categoryId, month, year, onClose, onSaved }: SetBudgetModalProps) {
  const [amount, setAmount] = useState(item.budgetAmount > 0 ? String(item.budgetAmount) : "");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      setFormError("กรุณากรอกจำนวนเงินที่ถูกต้อง");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await api.setBudget({ amount: parsed, categoryId, month, year });
      toast.success("บันทึกงบประมาณสำเร็จ");
      onSaved();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-3 py-1">
        <span className="text-2xl">{item.categoryIcon}</span>
        <span className="text-zinc-100 font-medium">{item.categoryName}</span>
      </div>

      {formError && (
        <p className="text-rose-400 text-xs bg-rose-950/50 border border-rose-800/50 rounded-lg px-3 py-2">
          {formError}
        </p>
      )}

      <div>
        <label className={labelClass}>จำนวนเงิน (บาท)</label>
        <input
          ref={amountRef}
          type="number"
          min="1"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder="0.00"
          className={inputClass}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
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

interface BudgetCardProps {
  item: BudgetStatusItem;
  onSetBudget: (item: BudgetStatusItem) => void;
}

function BudgetCard({ item, onSetBudget }: BudgetCardProps) {
  const pct = Math.min(item.percentage, 100);
  const barColor = item.isOverBudget ? "bg-rose-500" : "bg-emerald-500";

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl shrink-0">{item.categoryIcon}</span>
          <span className="font-medium text-zinc-100 truncate font-kanit">{item.categoryName}</span>
        </div>
        <button
          onClick={() => onSetBudget(item)}
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 hover:scale-[1.02] transition active:scale-95"
        >
          ตั้งงบ
        </button>
      </div>

      <div className="bg-zinc-800 rounded-full h-2">
        <div
          className={`rounded-full h-2 transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">
          {formatMoney(item.spentAmount)}{" "}
          <span className="text-zinc-600">/</span>{" "}
          {formatMoney(item.budgetAmount)}
        </span>
        <span className={item.isOverBudget ? "text-rose-400 font-semibold" : "text-zinc-400"}>
          {item.percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

interface EmptyStateCategoryProps {
  categories: CategoryResponse[];
  onSetBudget: (cat: CategoryResponse) => void;
}

function EmptyStateCategories({ categories, onSetBudget }: EmptyStateCategoryProps) {
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  if (expenseCategories.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500">
        ยังไม่มีหมวดหมู่รายจ่าย กรุณาเพิ่มหมวดหมู่ก่อน
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-400 mb-1">ยังไม่ได้ตั้งงบประมาณสำหรับเดือนนี้ เลือกหมวดหมู่เพื่อเริ่มต้น</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {expenseCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSetBudget(cat)}
            className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg p-4 flex items-center gap-3 hover:border-zinc-600 hover:scale-[1.02] transition active:scale-95 text-left"
          >
            <span className="text-xl">{cat.icon}</span>
            <span className="text-zinc-100 text-sm font-medium">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Budget() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [budgets, setBudgets] = useState<BudgetStatusResponse>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalItem, setModalItem] = useState<BudgetStatusItem | null>(null);
  const [modalCategoryId, setModalCategoryId] = useState<string | null>(null);

  const years = useMemo(() => {
    const y = now.getFullYear();
    return [y - 2, y - 1, y, y + 1];
  }, []);

  const selectClass =
    "bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition";

  const fetchBudgets = () => {
    setLoading(true);
    api
      .getBudgetStatus(month, year)
      .then((res) => {
        setBudgets(res);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [month, year]);

  const handleOpenModal = (item: BudgetStatusItem) => {
    const cat = categories.find(
      (c) => c.name === item.categoryName && c.icon === item.categoryIcon,
    );
    setModalItem(item);
    setModalCategoryId(cat?.id ?? null);
  };

  const handleOpenModalFromCategory = (cat: CategoryResponse) => {
    setModalItem({
      categoryName: cat.name,
      categoryIcon: cat.icon,
      budgetAmount: 0,
      spentAmount: 0,
      percentage: 0,
      isOverBudget: false,
    });
    setModalCategoryId(cat.id);
  };

  const handleCloseModal = () => {
    setModalItem(null);
    setModalCategoryId(null);
  };

  const handleSaved = () => {
    handleCloseModal();
    fetchBudgets();
  };

  return (
    <div className="text-zinc-100">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-zinc-100 font-kanit">งบประมาณ</h2>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className={selectClass}
          >
            {MONTHS_TH.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={selectClass}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950 border border-rose-800 text-rose-300 rounded-xl p-4 mb-6 text-sm">
          เกิดข้อผิดพลาด: {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : budgets.length === 0 ? (
        <EmptyStateCategories
          categories={categories}
          onSetBudget={handleOpenModalFromCategory}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((item) => (
            <BudgetCard
              key={`${item.categoryName}-${item.categoryIcon}`}
              item={item}
              onSetBudget={handleOpenModal}
            />
          ))}
        </div>
      )}

      {modalItem && modalCategoryId && (
        <Modal
          title={modalItem.budgetAmount > 0 ? "แก้ไขงบประมาณ" : "ตั้งงบประมาณ"}
          onClose={handleCloseModal}
        >
          <SetBudgetModal
            item={modalItem}
            categoryId={modalCategoryId}
            month={month}
            year={year}
            onClose={handleCloseModal}
            onSaved={handleSaved}
          />
        </Modal>
      )}
    </div>
  );
}
