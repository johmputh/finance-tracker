import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";

const navItems = [
  { to: "/", label: "แดชบอร์ด" },
  { to: "/transactions", label: "รายการ" },
  { to: "/categories", label: "หมวดหมู่" },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-56 shrink-0 bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col">
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
              `px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
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
          className="w-full text-left px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors duration-200"
        >
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
