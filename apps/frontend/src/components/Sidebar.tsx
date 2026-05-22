import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "แดชบอร์ด" },
  { to: "/transactions", label: "รายการ" },
  { to: "/categories", label: "หมวดหมู่" },
];

export function Sidebar() {
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
    </aside>
  );
}
