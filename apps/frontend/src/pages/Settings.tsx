import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";

const EXPIRY_SECONDS = 5 * 60;

export function Settings() {
  const [code, setCode] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleRequestCode = async () => {
    setLoading(true);
    try {
      const res = await api.requestLinkCode();
      setCode(res.code);
      setSecondsLeft(EXPIRY_SECONDS);
      clearTimer();
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearTimer();
            setCode(null);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      toast.success("สร้าง code สำเร็จ");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => () => clearTimer(), []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="text-zinc-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-kanit">ตั้งค่า</h2>
        <p className="text-zinc-500 text-sm mt-1">จัดการการเชื่อมต่อบัญชี</p>
      </div>

      <div className="max-w-md">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">เชื่อม LINE</h3>
              <p className="text-xs text-zinc-500 mt-0.5">บันทึกรายรับ-รายจ่ายผ่าน LINE chat</p>
            </div>
          </div>

          {!code ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-zinc-400 leading-relaxed">
                เชื่อมบัญชีนี้กับ LINE เพื่อบันทึกรายการผ่านการพิมพ์ข้อความใน LINE bot
              </p>
              <button
                onClick={handleRequestCode}
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "กำลังสร้าง..." : "ขอ code"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="bg-zinc-800 rounded-xl p-5 text-center">
                <p className="text-xs text-zinc-500 mb-2">code เชื่อมบัญชี</p>
                <p className="text-5xl font-bold tracking-[0.3em] text-emerald-400 font-kanit">{code}</p>
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${secondsLeft > 60 ? "bg-emerald-500" : "bg-rose-500"} animate-pulse`} />
                  <p className={`text-sm font-mono ${secondsLeft > 60 ? "text-zinc-400" : "text-rose-400"}`}>
                    หมดอายุใน {mm}:{ss}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                <p className="text-xs text-zinc-400 font-semibold mb-2">วิธีใช้</p>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  เปิด LINE bot แล้วพิมพ์ว่า
                </p>
                <p className="mt-2 text-sm font-bold text-emerald-400 bg-zinc-900 rounded-lg px-3 py-2 text-center tracking-wide">
                  เชื่อม {code}
                </p>
              </div>

              <button
                onClick={handleRequestCode}
                disabled={loading}
                className="w-full py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              >
                ขอ code ใหม่
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
