import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { ABOUT_DOCUMENTS } from "@/lib/marketing/data";

export default function AboutPage() {
  return (
    <>
      <MarketingHeader active="about" />

      <section className="mkt-container mkt-page-hero">
        <div className="mkt-kicker">О компании</div>
        <h1>Частное учреждение дополнительного профессионального образования</h1>
        <p>
          ЧОУ «Профессионал» работает в Кургане с 2017 года и обучает специалистов
          транспортной отрасли и охранных предприятий по всей России — очно и
          дистанционно.
        </p>
      </section>

      <section className="mkt-container mkt-facts-grid">
        {[
          { label: "Дата создания", value: "17.02.2017" },
          { label: "Лицензия", value: "№ 1190" },
          { label: "Формы обучения", value: "Очная, дистанционная" },
          { label: "Уровень образования", value: "Дополнительное проф." },
        ].map((item) => (
          <div key={item.label} className="mkt-fact-card">
            <div className="mkt-fact-label">{item.label}</div>
            <div className="mkt-fact-value">{item.value}</div>
          </div>
        ))}
      </section>

      <section className="mkt-container mkt-about-grid">
        <div className="mkt-info-card">
          <h2>Сведения об образовательной деятельности</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              ["Лицензия на образовательную деятельность", "№ 1190 от 17.02.2017"],
              ["Выдана", "Департаментом образования и науки Курганской области"],
              ["ИНН / КПП", "4501145660 / 450101001"],
              ["ОГРН", "1084500000826"],
              ["Язык преподавания", "Русский"],
              ["Нормативный срок обучения", "Согласно образовательным программам"],
            ].map(([label, value]) => (
              <div key={label} className="mkt-info-row">
                <span>{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mkt-director-card">
          <div className="mkt-director-avatar">ОЧ</div>
          <div className="mkt-heading" style={{ fontSize: 19, marginBottom: 4 }}>
            Чечикова Ольга Александровна
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginBottom: 20 }}>
            Директор ЧОУ «Профессионал»
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.15)",
              paddingTop: 18,
              fontSize: 14,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.7,
            }}
          >
            Часы работы: 09:00 – 16:00
            <br />
            г. Курган, ул. Уральская, д. 1, стр. 3, каб. 2
          </div>
        </div>
      </section>

      <section className="mkt-container" style={{ paddingBottom: 16 }}>
        <h2 className="mkt-heading" style={{ fontSize: 22, margin: "0 0 20px" }}>
          Учредительные и регистрационные документы
        </h2>
      </section>
      <section className="mkt-container mkt-documents-grid">
        {ABOUT_DOCUMENTS.map((doc) => (
          <a
            key={doc.file}
            href={doc.file}
            target="_blank"
            rel="noreferrer"
            className="mkt-document-link"
          >
            <div className="mkt-document-icon">📄</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#101826", lineHeight: 1.4 }}>
              {doc.label}
            </div>
          </a>
        ))}
      </section>

      <section className="mkt-strip">
        <div className="mkt-container mkt-strip-inner">
          <div>
            <h3>Остались вопросы?</h3>
            <p>Свяжитесь с нами любым удобным способом.</p>
          </div>
          <Link href="/contacts" className="mkt-btn-white">
            Контакты
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
