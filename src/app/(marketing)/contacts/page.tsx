import { ApplicationForm } from "@/components/marketing/application-form";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";

export default function ContactsPage() {
  return (
    <>
      <MarketingHeader active="contacts" showPhone />

      <section className="mkt-container mkt-page-hero">
        <div className="mkt-kicker">Контакты</div>
        <h1>Свяжитесь с нами</h1>
        <p>
          Ответим на вопросы по программам, стоимости и документам для поступления.
        </p>
      </section>

      <section id="form" className="mkt-container mkt-contacts-grid">
        <div className="mkt-contact-cards">
          <div className="mkt-contact-card">
            <div className="mkt-contact-icon">📍</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Адрес</div>
              <div style={{ color: "#4B5567", fontSize: 15, lineHeight: 1.5 }}>
                РФ, 640006, г. Курган, ул. Уральская, д. 1, стр. 3, каб. 2
              </div>
            </div>
          </div>
          <div className="mkt-contact-card">
            <div className="mkt-contact-icon">📞</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Телефоны</div>
              <div style={{ color: "#4B5567", fontSize: 15, lineHeight: 1.7 }}>
                <a href="tel:+73522263509">(3522) 26-35-09</a>
                <br />
                <a href="tel:+79195615406">+7 919 561-54-06</a>
              </div>
            </div>
          </div>
          <div className="mkt-contact-card">
            <div className="mkt-contact-icon">✉️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Почта</div>
              <a href="mailto:profi-045@yandex.ru" style={{ color: "#4B5567", fontSize: 15 }}>
                profi-045@yandex.ru
              </a>
            </div>
          </div>
          <div className="mkt-contact-card">
            <div className="mkt-contact-icon">🕘</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Часы работы</div>
              <div style={{ color: "#4B5567", fontSize: 15 }}>Пн – Пт, 09:00 – 16:00</div>
            </div>
          </div>
          <div className="mkt-map-placeholder">[ карта проезда — добавьте embed-карту ]</div>
        </div>

        <ApplicationForm variant="full" title="Оставить заявку" />
      </section>

      <MarketingFooter />
    </>
  );
}
