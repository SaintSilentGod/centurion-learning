import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { SECURITY_PROGRAMS, TB_PROGRAMS } from "@/lib/marketing/data";

export default function PricingPage() {
  return (
    <>
      <MarketingHeader active="pricing" />

      <section className="mkt-container mkt-page-hero">
        <div className="mkt-kicker">Стоимость обучения</div>
        <h1>Актуальные цены на 2026 год</h1>
        <p>
          Дистанционная форма для программ ТБ дешевле очной. Цены на охранные
          программы приведены для очной формы.
        </p>
      </section>

      <section id="tb" className="mkt-container mkt-pricing-section">
        <h2 className="mkt-heading mkt-pricing-section-title">Транспортная безопасность</h2>
        <div className="mkt-price-table">
          <div className="mkt-price-table-head is-tb">
            <div>Категория</div>
            <div>Программа</div>
            <div>Часы</div>
            <div>Очная</div>
            <div>Дистанционная</div>
          </div>
          {TB_PROGRAMS.map((program) => (
            <div key={program.code} className="mkt-price-table-row is-tb">
              <div className="mkt-price-col mkt-price-col-code">
                <span className="mkt-program-code">{program.code}</span>
              </div>
              <div className="mkt-price-col mkt-price-col-program">{program.title}</div>
              <div className="mkt-price-row-metrics">
                <div className="mkt-price-col mkt-price-col-hours">
                  <span className="mkt-price-mobile-label">Часы</span>
                  <span>{program.hours} ч</span>
                </div>
                <div className="mkt-price-col mkt-price-col-full">
                  <span className="mkt-price-mobile-label">Очная</span>
                  <span className="mkt-price-value">{program.priceFull} ₽</span>
                </div>
                <div className="mkt-price-col mkt-price-col-dist">
                  <span className="mkt-price-mobile-label">Дистанц.</span>
                  <span className="mkt-price-value is-dist">{program.priceDist} ₽</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="security" className="mkt-container mkt-pricing-section is-security">
        <h2 className="mkt-heading mkt-pricing-section-title">Охранная деятельность</h2>
        <div className="mkt-price-table">
          <div className="mkt-price-table-head is-security">
            <div>Программа</div>
            <div>Часы</div>
            <div>Стоимость</div>
          </div>
          {SECURITY_PROGRAMS.map((program) => (
            <div key={program.title} className="mkt-price-table-row is-security">
              <div className="mkt-price-col mkt-price-col-program">{program.title}</div>
              <div className="mkt-price-row-metrics">
                <div className="mkt-price-col mkt-price-col-hours">
                  <span className="mkt-price-mobile-label">Часы</span>
                  <span>{program.hours} ч</span>
                </div>
                <div className="mkt-price-col mkt-price-col-price">
                  <span className="mkt-price-mobile-label">Стоимость</span>
                  <span className="mkt-price-value is-gold">{program.price} ₽</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mkt-note-box">
        Стоимость актуальна на 2026 год и может уточняться при заключении договора.
        Оплата возможна для физических и юридических лиц. Документы для поступления и
        договоры высылаем по заявке.
      </div>

      <section className="mkt-strip">
        <div className="mkt-container mkt-strip-inner">
          <div>
            <h3>Нужен расчёт для группы сотрудников?</h3>
            <p>Оставьте заявку — предложим удобный формат для юридических лиц.</p>
          </div>
          <Link href="/contacts#form" className="mkt-btn-white">
            Оставить заявку
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
