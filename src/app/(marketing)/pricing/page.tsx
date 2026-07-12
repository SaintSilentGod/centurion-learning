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

      <section id="tb" className="mkt-container" style={{ padding: "32px 32px" }}>
        <h2 className="mkt-heading" style={{ fontSize: 22, marginBottom: 20 }}>
          Транспортная безопасность
        </h2>
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
              <div className="mkt-program-code">{program.code}</div>
              <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>
                {program.title}
              </div>
              <div style={{ fontSize: 14, color: "#6B7686" }}>{program.hours} ч</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{program.priceFull} ₽</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1D4ED8" }}>
                {program.priceDist} ₽
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="security" className="mkt-container" style={{ padding: "24px 32px 56px" }}>
        <h2 className="mkt-heading" style={{ fontSize: 22, marginBottom: 20 }}>
          Охранная деятельность
        </h2>
        <div className="mkt-price-table">
          <div className="mkt-price-table-head is-security">
            <div>Программа</div>
            <div>Часы</div>
            <div>Стоимость</div>
          </div>
          {SECURITY_PROGRAMS.map((program) => (
            <div key={program.title} className="mkt-price-table-row is-security">
              <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>
                {program.title}
              </div>
              <div style={{ fontSize: 14, color: "#6B7686" }}>{program.hours} ч</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#C98A2E" }}>
                {program.price} ₽
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
