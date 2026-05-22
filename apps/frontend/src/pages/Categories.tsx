import { useEffect, useMemo, useState } from "react";
import type { CategoryResponse } from "@finance-tracker/shared";
import { Modal } from "../components/ui/Modal";
import { api, ApiError } from "../lib/api";

interface CategoryFormData {
  name: string;
  icon: string;
  type: string;
}

const emptyForm: CategoryFormData = { name: "", icon: "", type: "EXPENSE" };

const inputClass =
  "w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition placeholder:text-zinc-500";
const labelClass = "block text-xs text-zinc-400 mb-1";

function CategoryForm({
  initial,
  isEdit,
  onSubmit,
  onCancel,
  submitting,
  formError,
}: {
  initial: CategoryFormData;
  isEdit: boolean;
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
  submitting: boolean;
  formError: string | null;
}) {
  const [form, setForm] = useState<CategoryFormData>(initial);

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

      {!isEdit && (
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
                onClick={() => setForm((f) => ({ ...f, type: v }))}
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
      )}

      <div>
        <label className={labelClass}>ชื่อหมวดหมู่</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          maxLength={100}
          placeholder="เช่น อาหาร, ขนส่ง, เงินเดือน..."
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>ไอคอน (emoji)</label>
        <input
          type="text"
          value={form.icon}
          onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
          required
          maxLength={10}
          placeholder="🍔"
          className={`${inputClass} text-xl`}
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

function CategorySection({
  title,
  colorClass,
  categories,
  onEdit,
  onDelete,
}: {
  title: string;
  colorClass: string;
  categories: CategoryResponse[];
  onEdit: (cat: CategoryResponse) => void;
  onDelete: (cat: CategoryResponse) => void;
}) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg p-5">
      <h3 className={`text-base font-semibold mb-4 ${colorClass}`}>{title}</h3>
      {categories.length === 0 ? (
        <p className="text-zinc-600 text-sm py-4 text-center">ไม่มีหมวดหมู่</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-800">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center gap-3 py-3 min-w-0">
              <span className="text-2xl w-9 text-center shrink-0">{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-100 truncate">{cat.name}</p>
                {cat.userId === null && (
                  <span className="text-xs text-zinc-500">ค่าเริ่มต้น</span>
                )}
              </div>
              {cat.userId !== null && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onEdit(cat)}
                    className="text-xs text-zinc-400 hover:text-zinc-100 px-2 py-1 rounded hover:bg-zinc-700 transition"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => onDelete(cat)}
                    className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10 transition"
                  >
                    ลบ
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Categories() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryResponse | null>(null);
  const [deletingCat, setDeletingCat] = useState<CategoryResponse | null>(null);

  const fetchCategories = () => {
    setLoading(true);
    api
      .getCategories()
      .then(setCategories)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const income = useMemo(() => categories.filter((c) => c.type === "INCOME"), [categories]);
  const expense = useMemo(() => categories.filter((c) => c.type === "EXPENSE"), [categories]);

  const handleCreate = async (form: CategoryFormData) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await api.createCategory({ name: form.name, icon: form.icon, type: form.type });
      setShowCreate(false);
      fetchCategories();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (form: CategoryFormData) => {
    if (!editingCat) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await api.updateCategory(editingCat.id, { name: form.name, icon: form.icon });
      setEditingCat(null);
      fetchCategories();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCat) return;
    setSubmitting(true);
    setDeleteError(null);
    try {
      await api.deleteCategory(deletingCat.id);
      setDeletingCat(null);
      fetchCategories();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setDeleteError("มี transaction ใช้หมวดนี้อยู่ ย้าย transaction ไปหมวดอื่นก่อน");
      } else {
        setDeleteError((err as Error).message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const editInitial = useMemo<CategoryFormData>(
    () =>
      editingCat
        ? { name: editingCat.name, icon: editingCat.icon, type: editingCat.type }
        : emptyForm,
    [editingCat],
  );

  return (
    <div className="text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-zinc-100 font-kanit">หมวดหมู่</h2>
        <button
          onClick={() => {
            setFormError(null);
            setShowCreate(true);
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition hover:scale-[1.02] active:scale-95"
        >
          + เพิ่มหมวดใหม่
        </button>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategorySection
            title="รายรับ"
            colorClass="text-emerald-400"
            categories={income}
            onEdit={(cat) => {
              setFormError(null);
              setEditingCat(cat);
            }}
            onDelete={(cat) => {
              setDeleteError(null);
              setDeletingCat(cat);
            }}
          />
          <CategorySection
            title="รายจ่าย"
            colorClass="text-rose-400"
            categories={expense}
            onEdit={(cat) => {
              setFormError(null);
              setEditingCat(cat);
            }}
            onDelete={(cat) => {
              setDeleteError(null);
              setDeletingCat(cat);
            }}
          />
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal title="เพิ่มหมวดใหม่" onClose={() => setShowCreate(false)}>
          <CategoryForm
            initial={emptyForm}
            isEdit={false}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            submitting={submitting}
            formError={formError}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editingCat && (
        <Modal title="แก้ไขหมวดหมู่" onClose={() => setEditingCat(null)}>
          <CategoryForm
            initial={editInitial}
            isEdit={true}
            onSubmit={handleUpdate}
            onCancel={() => setEditingCat(null)}
            submitting={submitting}
            formError={formError}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deletingCat && (
        <Modal
          title="ยืนยันการลบ"
          onClose={() => {
            setDeletingCat(null);
            setDeleteError(null);
          }}
        >
          <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
            คุณต้องการลบหมวด{" "}
            <span className="text-zinc-100 font-medium">
              {deletingCat.icon} {deletingCat.name}
            </span>{" "}
            ใช่หรือไม่?
          </p>
          {deleteError && (
            <p className="text-rose-400 text-xs bg-rose-950/50 border border-rose-800/50 rounded-lg px-3 py-2 mb-4">
              {deleteError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setDeletingCat(null);
                setDeleteError(null);
              }}
              className="flex-1 py-2 rounded-lg text-sm text-zinc-400 border border-zinc-700 hover:bg-zinc-800 transition active:scale-95"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "กำลังลบ..." : "ลบหมวด"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
