import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-container">
        <div className="mkt-footer-grid">
          <div>
            <div className="mkt-footer-title">ЧОУ «Профессионал»</div>
            <p className="mkt-footer-text">
              Учебный центр дополнительного профессионального образования. Курган.
              Лицензия № 1190 от 17.02.2017.
            </p>
          </div>
          <div>
            <div className="mkt-footer-heading">Разделы</div>
            <div className="mkt-footer-links">
              <Link href="/programs">Программы обучения</Link>
              <Link href="/pricing">Цены</Link>
              <Link href="/about">О компании</Link>
              <Link href="/contacts">Контакты</Link>
            </div>
          </div>
          <div>
            <div className="mkt-footer-heading">Контакты</div>
            <div className="mkt-footer-links">
              <div style={{ color: "rgba(255,255,255,0.65)" }}>
                г. Курган, ул. Уральская, д. 1, стр. 3
              </div>
              <a href="tel:+79195615406">+7 919 561-54-06</a>
              <a href="mailto:profi-045@yandex.ru">profi-045@yandex.ru</a>
            </div>
          </div>
        </div>
        <div className="mkt-footer-copy">© 2026 ЧОУ «Профессионал». Все права защищены.</div>
      </div>
    </footer>
  );
}
