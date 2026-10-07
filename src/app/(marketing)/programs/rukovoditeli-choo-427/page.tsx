import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationForm } from "@/components/marketing/application-form";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { CHOO_427_PLAN } from "@/lib/marketing/data";

export const metadata: Metadata = {
  title: "Повышение квалификации руководителей ЧОО по № 427-ФЗ — ЧОУ «Профессионал»",
  description:
    "Обязательное повышение квалификации действующих руководителей ЧОО по ч. 4 ст. 36 № 427-ФЗ: 16 академических часов, очно-заочно, удостоверение о повышении квалификации.",
};

const FACTS = [
  { label: "Объём", value: "16 ак. часов" },
  { label: "Срок обучения", value: "2 учебных дня" },
  { label: "Форма", value: "Очно-заочная" },
  { label: "Документ", value: "Удостоверение о ПК" },
];

const DETAILS: Array<[string, string]> = [
  ["Для кого", "Руководители ЧОО и филиалов ЧОО, работники, исполняющие их обязанности"],
  ["Требование к образованию", "Высшее образование (ч. 1 ст. 14 № 427-ФЗ)"],
  ["Пройти до", "01.09.2027 — для действующих руководителей (ч. 4 ст. 36 № 427-ФЗ)"],
  ["День 1", "Вебинар с применением дистанционных технологий"],
  ["День 2", "Очно в аудитории, итоговое тестирование в компьютерном классе"],
  ["Основа программы", "Типовая программа, утверждённая приказом Росгвардии от 18.06.2026 № 213"],
];

export default function Choo427ProgramPage() {
  return (
    <>
      <MarketingHeader active="programs" />

      <section className="mkt-container mkt-page-hero">
        <div className="mkt-kicker">Охранная деятельность · повышение квалификации</div>
        <h1>Повышение квалификации руководителей ЧОО по № 427-ФЗ</h1>
        <p>
          С 01.09.2026 действует новый закон «О частной охранной деятельности». Действующие
          руководители ЧОО обязаны пройти повышение квалификации до 01.09.2027. Программа
          разбирает новый порядок лицензирования, договоры, должностные инструкции, личные
          карточки, работу с БПЛА и мобильными группами охраны.
        </p>
      </section>

      <section className="mkt-container mkt-facts-grid">
        {FACTS.map((item) => (
          <div key={item.label} className="mkt-fact-card">
            <div className="mkt-fact-label">{item.label}</div>
            <div className="mkt-fact-value">{item.value}</div>
          </div>
        ))}
      </section>

      <section className="mkt-container mkt-about-grid">
        <div className="mkt-info-card">
          <h2>Кто проходит и как</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {DETAILS.map(([label, value]) => (
              <div key={label} className="mkt-info-row">
                <span>{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mkt-director-card">
          <div className="mkt-heading" style={{ fontSize: 19, marginBottom: 8 }}>
            Стоимость — по запросу
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.7 }}>
            Оставьте заявку или позвоните — подскажем ближайшие даты группы и подготовим
            договор для организации.
          </div>
          <Link href="#form" className="mkt-btn-white" style={{ marginTop: 20 }}>
            Оставить заявку
          </Link>
        </div>
      </section>

      <section className="mkt-container mkt-program-section">
        <h2 className="mkt-heading" style={{ fontSize: 22, margin: "0 0 20px" }}>
          Учебный план
        </h2>
        <div className="mkt-program-list">
          {CHOO_427_PLAN.map((block, index) => (
            <details key={block.title} className="mkt-program-details is-security" open={index === 0}>
              <summary>
                <div className="mkt-program-title">
                  {index < CHOO_427_PLAN.length - 1 ? `Блок ${index + 1}. ` : ""}
                  {block.title}
                </div>
                <div className="mkt-program-hours">{block.hours} ак. ч</div>
              </summary>
              <div className="mkt-program-body">
                <ul
                  style={{
                    margin: "16px 0 0",
                    paddingLeft: 20,
                    listStyle: "disc",
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "var(--mkt-muted)",
                  }}
                >
                  {block.topics.map((topic) => (
                    <li key={topic}>{topic}</li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section id="form" className="mkt-container" style={{ paddingBottom: 72, maxWidth: 640 }}>
        <ApplicationForm variant="full" title="Записаться на обучение" />
      </section>

      <MarketingFooter />
    </>
  );
}
