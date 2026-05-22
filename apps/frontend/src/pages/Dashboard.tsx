import { useEffect, useMemo, useState } from "react";
import type { CategoryResponse, TransactionResponse, TransactionSummaryResponse } from "@finance-tracker/shared";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SummaryCard } from "../components/ui/SummaryCard";
import { api } from "../lib/api";

const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const EXPENSE_COLORS = ["#f87171", "#fb923c", "#fbbf24", "#f97316", "#ef4444"];
const INCOME_COLORS = ["#34d399", "#60a5fa", "#a78bfa", "#10b981", "#3b82f6"];

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

interface PiePayload {
  name: string;
  value: number;
  payload: { percentage: number; icon?: string };
}

function PieTooltipContent({ active, payload }: { active?: boolean; payload?: PiePayload[] }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: data } = payload[0];
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 shadow-lg">
      <p className="font-medium">{name}</p>
      <p className="text-zinc-300">{formatMoney(value)}</p>
      <p className="text-zinc-400">{data.percentage}%</p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
      ยังไม่มีข้อมูลเดือนนี้
    </div>
  );
}

const inputClass =
  "bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition";

export function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [summary, setSummary] = useState<TransactionSummaryResponse | null>(null);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const years = useMemo(() => {
    const y = now.getFullYear();
    return [y - 2, y - 1, y, y + 1];
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getSummary(month, year),
      api.getTransactions({ limit: 10 }),
      api.getCategories(),
    ])
      .then(([s, txs, cats]) => {
        setSummary(s);
        setTransactions(txs.data);
        setCategories(cats);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [month, year]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const hasBarData = summary?.dailyTotals.some((d) => d.income > 0 || d.expense > 0);

  return (
    <div className="text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-zinc-100 font-kanit">แดชบอร์ด</h2>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className={inputClass}
          >
            {MONTHS_TH.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={inputClass}
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
      ) : (
        <div className="flex flex-col gap-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard title="รายรับรวม" amount={summary?.totalIncome ?? 0} amountClass="text-emerald-400" />
            <SummaryCard title="รายจ่ายรวม" amount={summary?.totalExpense ?? 0} amountClass="text-rose-400" />
            <SummaryCard title="คงเหลือ" amount={summary?.balance ?? 0} amountClass="text-cyan-400" />
          </div>

          {/* Charts: 1 col mobile / 2 col tablet (bar full-width) / 3 col desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Expense pie */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg p-4">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4">รายจ่ายแยกหมวด</h3>
              {summary && summary.byCategoryExpense.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={summary.byCategoryExpense}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                    >
                      {summary.byCategoryExpense.map((_, i) => (
                        <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltipContent />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>

            {/* Income pie */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg p-4">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4">รายรับแยกหมวด</h3>
              {summary && summary.byCategoryIncome.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={summary.byCategoryIncome}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                    >
                      {summary.byCategoryIncome.map((_, i) => (
                        <Cell key={i} fill={INCOME_COLORS[i % INCOME_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltipContent />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>

            {/* Daily bar chart — full width on tablet, 1 col on desktop */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg p-4 md:col-span-2 lg:col-span-1">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4">รายรับ-รายจ่ายรายวัน</h3>
              {summary && hasBarData ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={summary.dailyTotals}
                    margin={{ top: 0, right: 4, bottom: 0, left: -20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d: string) => String(Number(d.slice(8, 10)))}
                      interval={4}
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                      }
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(v) => formatMoney(v as number)}
                      labelFormatter={(label) =>
                        `วันที่ ${Number(String(label).slice(8, 10))}`
                      }
                      contentStyle={{
                        background: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="income" name="รายรับ" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={8} />
                    <Bar dataKey="expense" name="รายจ่าย" fill="#f43f5e" radius={[2, 2, 0, 0]} maxBarSize={8} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>

          {/* Recent transactions */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">รายการล่าสุด</h3>
            {transactions.length === 0 ? (
              <EmptyChart />
            ) : (
              <ul className="flex flex-col divide-y divide-zinc-800">
                {transactions.map((tx) => {
                  const cat = categoryMap.get(tx.categoryId);
                  const isIncome = tx.type === "INCOME";
                  return (
                    <li key={tx.id} className="flex items-center gap-3 py-3 min-w-0">
                      <span className="text-xl w-8 text-center shrink-0">{cat?.icon ?? "—"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-100 truncate">
                          {tx.description ?? cat?.name ?? "—"}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {cat?.name ?? "—"} · {formatDate(tx.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold shrink-0 ${
                          isIncome ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isIncome ? "+" : "-"}{formatMoney(tx.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
