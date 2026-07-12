import Image from "next/image";
import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { SECURITY_PROGRAMS, TB_PROGRAMS } from "@/lib/marketing/data";

export default function ProgramsPage() {
  return (
    <>
      <MarketingHeader active="programs" />

      <section className="mkt-container mkt-page-hero">
        <div className="mkt-kicker">Программы обучения</div>
        <h1>13 программ по двум направлениям</h1>
        <p>
          Все программы реализуются очно в Кургане или дистанционно. Нажмите на
          карточку программы, чтобы увидеть часы, стоимость и краткое описание.
        </p>
      </section>

      <section id="tb" className="mkt-container mkt-program-section">
        <div className="mkt-program-section-header">
          <div className="mkt-direction-icon is-blue">
            <Image src="/icons/road.svg" alt="" width={26} height={26} />
          </div>
          <div>
            <h2>Транспортная безопасность</h2>
            <p>
              Категории ТБ-01 – ТБ-08 · дополнительные профессиональные программы
              повышения квалификации
            </p>
          </div>
        </div>
        <div className="mkt-program-list">
          {TB_PROGRAMS.map((program) => (
            <details key={program.code} className="mkt-program-details is-tb">
              <summary>
                <div className="mkt-program-code">{program.code}</div>
                <div className="mkt-program-title">{program.title}</div>
                <div className="mkt-program-hours">{program.hours} ак. часов</div>
                <div className="mkt-program-price">от {program.priceDist} ₽</div>
              </summary>
              <div className="mkt-program-body is-tb">
                <p>{program.desc}</p>
                <div className="mkt-price-tags">
                  <div className="mkt-price-tag">
                    <div className="mkt-price-tag-label">Очная форма</div>
                    <div className="mkt-price-tag-value">{program.priceFull} ₽</div>
                  </div>
                  <div className="mkt-price-tag">
                    <div className="mkt-price-tag-label">Дистанционная форма</div>
                    <div className="mkt-price-tag-value">{program.priceDist} ₽</div>
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section id="security" className="mkt-container mkt-program-section" style={{ paddingTop: 24, paddingBottom: 72 }}>
        <div className="mkt-program-section-header">
          <div className="mkt-direction-icon is-gold">
            <Image src="/icons/railway.svg" alt="" width={26} height={26} />
          </div>
          <div>
            <h2>Охранная деятельность</h2>
            <p>
              Для охранников 4 разряда и руководителей частных охранных организаций
            </p>
          </div>
        </div>
        <div className="mkt-program-list">
          {SECURITY_PROGRAMS.map((program) => (
            <details key={program.title} className="mkt-program-details is-security">
              <summary>
                <div className="mkt-program-title">{program.title}</div>
                <div className="mkt-program-hours">{program.hours} ак. часов</div>
                <div className="mkt-program-price">{program.price} ₽</div>
              </summary>
              <div className="mkt-program-body">
                <p>{program.desc}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="mkt-strip">
        <div className="mkt-container mkt-strip-inner">
          <div>
            <h3>Не нашли нужную программу?</h3>
            <p>Позвоните — подберём программу под вашу задачу.</p>
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
