import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

type Mode = "login" | "register";

const inputClass =
  "w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition placeholder:text-zinc-500";
const labelClass = "block text-xs text-zinc-400 mb-1.5";

export function Login() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setError(null);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register" && form.password !== form.confirm) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (mode === "register") {
        await api.register({ email: form.email, password: form.password, name: form.name });
      }
      const { accessToken } = await api.login({
        email: form.email,
        password: form.password,
      });
      localStorage.setItem("token", accessToken);
      const user = await api.getMe();
      auth.login(accessToken, user);
      navigate("/", { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-zinc-100 text-center mb-8 font-kanit tracking-tight">
          Finance Tracker
        </h1>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl p-6">
          {/* Mode tabs */}
          <div className="flex rounded-lg bg-zinc-800 p-1 mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors duration-150 ${
                  mode === m ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {m === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <div>
                <label className={labelClass}>ชื่อ</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={set("name")}
                  required
                  maxLength={100}
                  placeholder="ชื่อของคุณ"
                  autoComplete="name"
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label className={labelClass}>อีเมล</label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                required
                placeholder="example@email.com"
                autoComplete="email"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>รหัสผ่าน</label>
              <input
                type="password"
                value={form.password}
                onChange={set("password")}
                required
                minLength={8}
                placeholder={mode === "register" ? "อย่างน้อย 8 ตัวอักษร" : "รหัสผ่าน"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className={inputClass}
              />
            </div>

            {mode === "register" && (
              <div>
                <label className={labelClass}>ยืนยันรหัสผ่าน</label>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={set("confirm")}
                  required
                  placeholder="ยืนยันรหัสผ่าน"
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>
            )}

            {error && (
              <p className="text-rose-400 text-xs bg-rose-950/50 border border-rose-800/50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading
                ? "กำลังดำเนินการ..."
                : mode === "login"
                  ? "เข้าสู่ระบบ"
                  : "สร้างบัญชี"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
