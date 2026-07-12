import Link from "next/link";
import type { NavKey } from "@/lib/marketing/data";

const NAV_ITEMS: { key: NavKey; href: string; label: string }[] = [
  { key: "home", href: "/", label: "Главная" },
  { key: "programs", href: "/programs", label: "Программы" },
  { key: "pricing", href: "/pricing", label: "Цены" },
  { key: "about", href: "/about", label: "О компании" },
  { key: "contacts", href: "/contacts", label: "Контакты" },
];

export function MarketingHeader({
  active,
  showPhone = false,
}: {
  active: NavKey;
  showPhone?: boolean;
}) {
  return (
    <header className="mkt-header">
      <div className="mkt-header-inner">
        <Link href="/" className="mkt-logo">
          <div className="mkt-logo-mark">П</div>
          <div>
            <div className="mkt-logo-title">ЧОУ «Профессионал»</div>
            <div className="mkt-logo-subtitle">Учебный центр · Курган</div>
          </div>
        </Link>

        <nav className="mkt-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={item.key === active ? "is-active" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mkt-header-actions">
          {showPhone ? (
            <a href="tel:+79195615406" style={{ fontWeight: 600, color: "#101826", fontSize: 13, whiteSpace: "nowrap" }}>
              +7 919 561-54-06
            </a>
          ) : null}
          <Link href="/login" className="mkt-btn-outline">
            Вход
          </Link>
          {!showPhone ? (
            <Link href="/contacts#form" className="mkt-btn-primary">
              Оставить заявку
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
