import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: "/", label: "แดชบอร์ด" },
  { to: "/transactions", label: "รายการ" },
  { to: "/budget", label: "งบประมาณ" },
  { to: "/categories", label: "หมวดหมู่" },
  { to: "/recurring", label: "รายการประจำ" },
  { to: "/profile", label: "โปรไฟล์" },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={`relative shrink-0 bg-zinc-900 transition-all duration-300 ease-in-out ${
        isOpen ? "w-56 border-r border-zinc-800" : "w-0"
      }`}
    >
      {/* Toggle button — sits on the right edge, always visible */}
      <button
        onClick={onToggle}
        aria-label={isOpen ? "ปิดเมนู" : "เปิดเมนู"}
        className="absolute top-4 -right-4 z-20 w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full text-zinc-400 hover:text-zinc-100 transition-colors shadow-md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Content — clipped as the aside shrinks */}
      <div className="overflow-hidden h-full">
        <div className="w-56 h-full p-4 flex flex-col">
          <h1 className="font-bold text-xl text-zinc-100 mb-8 tracking-tight font-kanit">
            Finance Tracker
          </h1>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm transition-colors duration-200 whitespace-nowrap ${
                    isActive
                      ? "bg-zinc-700 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-zinc-800">
            {user && (
              <p className="text-xs text-zinc-500 px-3 mb-2 truncate" title={user.email}>
                {user.name}
              </p>
            )}
            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors duration-200 whitespace-nowrap"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
