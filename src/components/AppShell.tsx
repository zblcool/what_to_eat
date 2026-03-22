import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { LocalizedLink, useI18n } from "../i18n";
import { useApp } from "../state/AppContext";

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function AppShell({ title, subtitle, children, actions }: AppShellProps) {
  const location = useLocation();
  const { repositoryStatus, runtimeNotice, cartCount } = useApp();
  const { language, text, toggleLanguage } = useI18n();
  const navItems = [
    { to: "/", label: text("首页", "Home") },
    { to: "/menu", label: text("点单", "Order") },
    { to: "/cart", label: text("购物车", "Cart") },
    { to: "/prep", label: text("备餐", "Prep") },
    { to: "/manage", label: text("菜单库", "Menu") }
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="topbar-kicker">{text("家庭早餐站", "Family Breakfast")}</p>
          <h1>{title}</h1>
          {subtitle ? <p className="topbar-subtitle">{subtitle}</p> : null}
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className="secondary-button compact-button"
            onClick={toggleLanguage}
          >
            {language === "en" ? "中文" : "EN"}
          </button>
          {actions}
        </div>
      </header>

      <main className="page-body">{children}</main>

      <div className="status-banner footer-status-banner">
        <span>
          {repositoryStatus.source === "firebase"
            ? text("Firebase 在线模式", "Firebase Live Mode")
            : text("本地演示模式", "Local Demo Mode")}
        </span>
        {runtimeNotice ? <strong>{runtimeNotice.message}</strong> : null}
        {!runtimeNotice && repositoryStatus.source === "local" ? (
          <strong>
            {text(
              "未检测到 Firebase 配置，当前使用本地演示数据。",
              "Firebase not found. Using local demo data."
            )}
          </strong>
        ) : null}
        <LocalizedLink to="/cart">
          {text("购物车", "Cart")} {cartCount}
        </LocalizedLink>
      </div>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <LocalizedLink
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
          </LocalizedLink>
        ))}
      </nav>
    </div>
  );
}
