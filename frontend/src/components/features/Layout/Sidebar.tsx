/** Sidebar navigation component */

import { NavLink } from "react-router-dom";
import clsx from "clsx";

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/markets", label: "Markets", icon: "🏪" },
  { to: "/portfolio", label: "Portfolio", icon: "💼" },
  { to: "/orders", label: "Orders", icon: "📋" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-[var(--border-color)]">
        <h1 className="text-lg font-bold text-[var(--accent-blue)]">
          Polymarket Cabinet
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors mb-1",
                isActive
                  ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]",
              )
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
