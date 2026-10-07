"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="mkt-header">
      <div className="mkt-header-inner">
        <Link href="/" className="mkt-logo" onClick={() => setMenuOpen(false)}>
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
            <a href="tel:+79195615406" className="mkt-header-phone">
              +7 919 561-54-06
            </a>
          ) : null}
          <Link href="/login" className="mkt-btn-outline">
            Вход
          </Link>
          <Link href="/contacts#form" className="mkt-btn-primary">
            Оставить заявку
          </Link>
        </div>

        <div className="mkt-header-mobile-actions">
          <Link href="/contacts#form" className="mkt-btn-primary">
            Оставить заявку
          </Link>
          <button
            type="button"
            className="mkt-burger"
            aria-label="Открыть меню"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {mounted && menuOpen
        ? createPortal(
            <div className="mkt-mobile-menu">
              <div className="mkt-mobile-menu-top">
                <Link
                  href="/"
                  className="mkt-logo"
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="mkt-logo-mark">П</div>
                  <div>
                    <div className="mkt-logo-title">ЧОУ «Профессионал»</div>
                    <div className="mkt-logo-subtitle">
                      Учебный центр · Курган
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  className="mkt-mobile-menu-close"
                  aria-label="Закрыть меню"
                  onClick={() => setMenuOpen(false)}
                >
                  ✕
                </button>
              </div>

              <nav className="mkt-mobile-menu-nav">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={item.key === active ? "is-active" : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mkt-mobile-menu-actions">
                <Link
                  href="/login"
                  className="mkt-btn-outline"
                  onClick={() => setMenuOpen(false)}
                >
                  Вход
                </Link>
                <Link
                  href="/contacts#form"
                  className="mkt-btn-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  Оставить заявку
                </Link>
                {showPhone ? (
                  <a href="tel:+79195615406" className="mkt-mobile-menu-phone">
                    +7 919 561-54-06
                  </a>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
