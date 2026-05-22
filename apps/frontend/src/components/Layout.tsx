import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function Layout() {
  const [isOpen, setIsOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true,
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen flex bg-zinc-950">
      <Sidebar isOpen={isOpen} onToggle={() => setIsOpen((o) => !o)} />
      <main className="flex-1 p-6 overflow-y-auto min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
