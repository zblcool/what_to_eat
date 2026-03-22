import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../state/AppContext";

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

const navItems = [
  { to: "/", label: "首页" },
  { to: "/menu", label: "点单" },
  { to: "/cart", label: "购物车" },
  { to: "/prep", label: "备餐" },
  { to: "/manage", label: "菜单库" }
];

export function AppShell({ title, subtitle, children, actions }: AppShellProps) {
  const location = useLocation();
  const { mode, setMode, repositoryStatus, cartCount } = useApp();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="topbar-kicker">家庭早餐站</p>
          <h1>{title}</h1>
          {subtitle ? <p className="topbar-subtitle">{subtitle}</p> : null}
        </div>
        <div className="topbar-actions">
          <div className="mode-switch">
            <button
              type="button"
              className={mode === "order" ? "mode-chip active" : "mode-chip"}
              onClick={() => setMode("order")}
            >
              点单模式
            </button>
            <button
              type="button"
              className={mode === "manage" ? "mode-chip active" : "mode-chip"}
              onClick={() => setMode("manage")}
            >
              做饭模式
            </button>
          </div>
          {actions}
        </div>
      </header>

      <div className="status-banner">
        <span>{repositoryStatus.source === "firebase" ? "Firebase 在线模式" : "本地演示模式"}</span>
        {repositoryStatus.setupMessage ? <strong>{repositoryStatus.setupMessage}</strong> : null}
        <Link to="/cart">购物车 {cartCount}</Link>
      </div>

      <main className="page-body">{children}</main>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <Link
            key={item.to}
            className={
              location.pathname === item.to ||
              (item.to !== "/" && location.pathname.startsWith(item.to))
                ? "bottom-nav-item active"
                : "bottom-nav-item"
            }
            to={item.to}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
