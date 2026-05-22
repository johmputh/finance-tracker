import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

const inputClass =
  "w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition placeholder:text-zinc-500";
const labelClass = "block text-xs text-zinc-400 mb-1.5";

export function Profile() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameLoading(true);
    setNameError(null);
    try {
      const updated = await api.updateProfile({ name });
      updateUser(updated);
      toast.success("อัปเดตชื่อสำเร็จ");
    } catch (err) {
      setNameError((err as Error).message);
    } finally {
      setNameLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwError("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    setPwLoading(true);
    setPwError(null);
    try {
      await api.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
    } catch (err) {
      setPwError((err as Error).message);
    } finally {
      setPwLoading(false);
    }
  };

  const setPw = (key: keyof typeof passwords) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords((p) => ({ ...p, [key]: e.target.value }));
    setPwError(null);
  };

  return (
    <div className="text-zinc-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-kanit">โปรไฟล์</h2>
        <p className="text-zinc-500 text-sm mt-1">{user?.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        {/* Edit name */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg p-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-5">แก้ไขชื่อ</h3>
          <form onSubmit={handleUpdateName} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>ชื่อ</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(null); }}
                required
                maxLength={100}
                placeholder="ชื่อของคุณ"
                className={inputClass}
              />
            </div>

            {nameError && (
              <p className="text-rose-400 text-xs bg-rose-950/50 border border-rose-800/50 rounded-lg px-3 py-2">
                {nameError}
              </p>
            )}

            <button
              type="submit"
              disabled={nameLoading || name.trim() === "" || name === user?.name}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {nameLoading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg p-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-5">เปลี่ยนรหัสผ่าน</h3>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>รหัสผ่านปัจจุบัน</label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={setPw("currentPassword")}
                required
                autoComplete="current-password"
                placeholder="รหัสผ่านปัจจุบัน"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>รหัสผ่านใหม่</label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={setPw("newPassword")}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>ยืนยันรหัสผ่านใหม่</label>
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={setPw("confirmPassword")}
                required
                autoComplete="new-password"
                placeholder="ยืนยันรหัสผ่านใหม่"
                className={inputClass}
              />
            </div>

            {pwError && (
              <p className="text-rose-400 text-xs bg-rose-950/50 border border-rose-800/50 rounded-lg px-3 py-2">
                {pwError}
              </p>
            )}

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pwLoading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
