import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { CategoryResponse, RecurringResponse } from "@finance-tracker/shared";
import { Modal } from "../components/ui/Modal";
import { api } from "../lib/api";

const inputClass =
  "w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition placeholder:text-zinc-500";
const labelClass = "block text-xs text-zinc-400 mb-1";

interface RecurringForm {
  type: string;
  amount: string;
  categoryId: string;
  description: string;
  dayOfMonth: string;
}

const emptyForm: RecurringForm = {
  type: "EXPENSE",
  amount: "",
  categoryId: "",
  description: "",
  dayOfMonth: "1",
};

function RecurringFormFields({
  form,
  setForm,
  categories,
  isEdit,
  onSubmit,
  onCancel,
  submitting,
  error,
}: {
  form: RecurringForm;
  setForm: (f: RecurringForm) => void;
  categories: CategoryResponse[];
  isEdit: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const amountRef = useRef<HTMLInputElement>(null);
  useEffect(() => { amountRef.current?.focus(); }, []);

  const filteredCats = categories.filter((c) => c.type === form.type);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="text-rose-400 text-xs bg-rose-950/50 border border-rose-800/50 rounded-lg px-3 py-2">{error}</p>
      )}

      {!isEdit && (
        <div>
          <label className={labelClass}>ประเภท</label>
          <div className="flex gap-2">
            {[{ v: "EXPENSE", label: "รายจ่าย" }, { v: "INCOME", label: "รายรับ" }].map(({ v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => setForm({ ...form, type: v, categoryId: "" })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition active:scale-95 ${
                  form.type === v
                    ? v === "EXPENSE"
                      ? "bg-rose-600 text-white"
                      : "bg-emerald-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className={labelClass}>จำนวนเงิน (฿)</label>
        <input
          ref={amountRef}
          type="number"
          min={1}
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
          placeholder="0.00"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>หมวดหมู่</label>
        <select
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          required
          className={inputClass}
        >
          <option value="">เลือกหมวดหมู่</option>
          {filteredCats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>วันที่ของเดือน (1–31)</label>
        <input
          type="number"
          min={1}
          max={31}
          value={form.dayOfMonth}
          onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value })}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>รายละเอียด (ไม่บังคับ)</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="เช่น ค่าเช่า, ค่าโทรศัพท์"
          maxLength={200}
          className={inputClass}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition active:scale-95"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "กำลังบันทึก..." : isEdit ? "บันทึก" : "เพิ่ม"}
        </button>
      </div>
    </form>
  );
}

function formatMoney(amount: number) {
  return `฿${amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function Recurring() {
  const [recurrings, setRecurrings] = useState<RecurringResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<RecurringForm>(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [editTarget, setEditTarget] = useState<RecurringResponse | null>(null);
  const [editForm, setEditForm] = useState<RecurringForm>(emptyForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<RecurringResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([api.getRecurrings(), api.getCategories()])
      .then(([r, c]) => {
        setRecurrings(r);
        setCategories(c);
      })
      .finally(() => setLoading(false));
  }, []);

  const openEdit = (r: RecurringResponse) => {
    setEditTarget(r);
    setEditForm({
      type: r.type,
      amount: String(r.amount),
      categoryId: r.categoryId,
      description: r.description ?? "",
      dayOfMonth: String(r.dayOfMonth),
    });
    setEditError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const created = await api.createRecurring({
        type: createForm.type,
        amount: Number(createForm.amount),
        categoryId: createForm.categoryId,
        description: createForm.description || undefined,
        dayOfMonth: Number(createForm.dayOfMonth),
      });
      setRecurrings((prev) => [created, ...prev]);
      setShowCreate(false);
      setCreateForm(emptyForm);
      toast.success("เพิ่มรายการประจำสำเร็จ");
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditing(true);
    setEditError(null);
    try {
      const updated = await api.updateRecurring(editTarget.id, {
        amount: Number(editForm.amount),
        categoryId: editForm.categoryId,
        description: editForm.description || undefined,
        dayOfMonth: Number(editForm.dayOfMonth),
      });
      setRecurrings((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditTarget(null);
      toast.success("แก้ไขสำเร็จ");
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setEditing(false);
    }
  };

  const handleToggleActive = async (r: RecurringResponse) => {
    try {
      const updated = await api.updateRecurring(r.id, { active: !r.active });
      setRecurrings((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteRecurring(deleteTarget.id);
      setRecurrings((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("ลบรายการประจำสำเร็จ");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const categoryName = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    return cat ? `${cat.icon} ${cat.name}` : id;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="text-zinc-100">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-kanit">รายการประจำ</h2>
          <p className="text-zinc-500 text-sm mt-1">ระบบจะสร้าง transaction อัตโนมัติทุกวันตามวันที่กำหนด</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateForm(emptyForm); setCreateError(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition hover:scale-[1.02] active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          เพิ่มรายการ
        </button>
      </div>

      {recurrings.length === 0 ? (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center">
          <p className="text-zinc-500">ยังไม่มีรายการประจำ</p>
          <p className="text-zinc-600 text-sm mt-1">กดปุ่ม "เพิ่มรายการ" เพื่อตั้งค่าการหักเงินอัตโนมัติ</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3">ประเภท</th>
                  <th className="text-left px-5 py-3">หมวดหมู่</th>
                  <th className="text-left px-5 py-3">รายละเอียด</th>
                  <th className="text-right px-5 py-3">จำนวน</th>
                  <th className="text-center px-5 py-3">วันที่/เดือน</th>
                  <th className="text-center px-5 py-3">สถานะ</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {recurrings.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.type === "INCOME" ? "bg-emerald-900/50 text-emerald-400" : "bg-rose-900/50 text-rose-400"}`}>
                        {r.type === "INCOME" ? "รายรับ" : "รายจ่าย"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300">{categoryName(r.categoryId)}</td>
                    <td className="px-5 py-3.5 text-zinc-400">{r.description ?? "—"}</td>
                    <td className={`px-5 py-3.5 text-right font-medium tabular-nums ${r.type === "INCOME" ? "text-emerald-400" : "text-rose-400"}`}>
                      {formatMoney(r.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-center text-zinc-400">วันที่ {r.dayOfMonth}</td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleActive(r)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${r.active ? "bg-emerald-600" : "bg-zinc-700"}`}
                        aria-label={r.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${r.active ? "translate-x-4" : "translate-x-1"}`} />
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEdit(r)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition active:scale-95"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-rose-900/30 hover:bg-rose-900/60 text-rose-400 transition active:scale-95"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-3">
            {recurrings.map((r) => (
              <div key={r.id} className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.type === "INCOME" ? "bg-emerald-900/50 text-emerald-400" : "bg-rose-900/50 text-rose-400"}`}>
                      {r.type === "INCOME" ? "รายรับ" : "รายจ่าย"}
                    </span>
                    <p className="text-zinc-300 text-sm mt-1">{categoryName(r.categoryId)}</p>
                    {r.description && <p className="text-zinc-500 text-xs">{r.description}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold tabular-nums ${r.type === "INCOME" ? "text-emerald-400" : "text-rose-400"}`}>
                      {formatMoney(r.amount)}
                    </p>
                    <p className="text-zinc-500 text-xs">วันที่ {r.dayOfMonth} ของเดือน</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <button
                    onClick={() => handleToggleActive(r)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${r.active ? "bg-emerald-600" : "bg-zinc-700"}`}
                    aria-label={r.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${r.active ? "translate-x-4" : "translate-x-1"}`} />
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(r)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition active:scale-95"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => setDeleteTarget(r)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-rose-900/30 hover:bg-rose-900/60 text-rose-400 transition active:scale-95"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="เพิ่มรายการประจำ">
          <RecurringFormFields
            form={createForm}
            setForm={setCreateForm}
            categories={categories}
            isEdit={false}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            submitting={creating}
            error={createError}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editTarget && (
        <Modal onClose={() => setEditTarget(null)} title="แก้ไขรายการประจำ">
          <RecurringFormFields
            form={editForm}
            setForm={setEditForm}
            categories={categories}
            isEdit={true}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            submitting={editing}
            error={editError}
          />
        </Modal>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)} title="ยืนยันการลบ">
          <p className="text-zinc-300 text-sm mb-6">
            คุณต้องการลบรายการ{" "}
            <span className="font-semibold text-zinc-100">{categoryName(deleteTarget.categoryId)}</span>{" "}
            {formatMoney(deleteTarget.amount)} ใช่ไหม?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition active:scale-95"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white transition active:scale-95 disabled:opacity-40"
            >
              {deleting ? "กำลังลบ..." : "ลบ"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
