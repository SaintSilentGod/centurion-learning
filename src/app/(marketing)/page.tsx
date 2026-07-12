import Image from "next/image";
import Link from "next/link";
import { ApplicationForm } from "@/components/marketing/application-form";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Reveal } from "@/components/marketing/reveal";
import { PRICING_TEASER, STEPS } from "@/lib/marketing/data";

export default function HomePage() {
  return (
    <>
      <MarketingHeader active="home" />

      <section className="mkt-container mkt-hero">
        <Reveal>
          <div className="mkt-badge">
            Лицензия № 1190 от 17.02.2017 · Действует с 2017 года
          </div>
          <h1>Обучение по транспортной безопасности и охранной деятельности</h1>
          <p className="mkt-hero-lead">
            13 аккредитованных программ повышения квалификации для сотрудников
            субъектов транспортной инфраструктуры и частных охранных организаций.
            Очно в Кургане или дистанционно из любого региона.
          </p>
          <div className="mkt-hero-actions">
            <Link href="/contacts#form" className="mkt-btn-primary-lg">
              Оставить заявку
            </Link>
            <Link href="/programs" className="mkt-btn-secondary-lg">
              Смотреть программы
            </Link>
          </div>
          <div className="mkt-stats">
            <div>
              <div className="mkt-stat-value">13</div>
              <div className="mkt-stat-label">программ обучения</div>
            </div>
            <div>
              <div className="mkt-stat-value">2</div>
              <div className="mkt-stat-label">формы: очно и дистанционно</div>
            </div>
            <div>
              <div className="mkt-stat-value">7+</div>
              <div className="mkt-stat-label">лет опыта в отрасли</div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="mkt-transport-card">
            <div className="mkt-transport-card-title">Виды транспортной инфраструктуры</div>
            <div className="mkt-transport-grid">
              {[
                { icon: "/icons/road.svg", label: "Автомобильный" },
                { icon: "/icons/railway.svg", label: "Железнодорожный" },
                { icon: "/icons/plane.svg", label: "Авиационный" },
                { icon: "/icons/boat.svg", label: "Морской и речной" },
              ].map((item) => (
                <div key={item.label} className="mkt-transport-item">
                  <Image src={item.icon} alt="" width={40} height={40} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mkt-transport-note">
              Программы категорий ТБ-01 – ТБ-08 охватывают все виды транспорта: авто,
              железнодорожный, авиационный и морской.
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mkt-container mkt-section">
        <Reveal>
          <div className="mkt-kicker">Направления обучения</div>
          <h2>Два направления, тринадцать программ</h2>
        </Reveal>
        <div className="mkt-directions-grid" style={{ marginTop: 32 }}>
          <Reveal>
            <Link href="/programs#tb" className="mkt-direction-card">
              <div className="mkt-direction-icon is-blue">
                <Image src="/icons/road.svg" alt="" width={26} height={26} />
              </div>
              <h3>Транспортная безопасность</h3>
              <p>
                8 программ повышения квалификации для лиц, ответственных за ТБ,
                групп быстрого реагирования, персонала досмотра и наблюдения —
                категории ТБ-01 – ТБ-08.
              </p>
              <div className="mkt-direction-link is-blue">Смотреть программы →</div>
            </Link>
          </Reveal>
          <Reveal>
            <Link href="/programs#security" className="mkt-direction-card">
              <div className="mkt-direction-icon is-gold">
                <Image src="/icons/railway.svg" alt="" width={26} height={26} />
              </div>
              <h3>Охранная деятельность</h3>
              <p>
                5 программ для охранников 4 разряда и руководителей ЧОО:
                профподготовка, повышение квалификации, охрана образовательных
                организаций.
              </p>
              <div className="mkt-direction-link is-gold">Смотреть программы →</div>
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="mkt-process-section">
        <div className="mkt-container">
          <Reveal>
            <div className="mkt-kicker">Процесс</div>
            <h2>Как проходит обучение</h2>
          </Reveal>
          <div className="mkt-steps-grid" style={{ marginTop: 36 }}>
            {STEPS.map((step) => (
              <Reveal key={step.n}>
                <div className="mkt-step">
                  <div className="mkt-step-num">{step.n}</div>
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-container mkt-section">
        <Reveal>
          <div className="mkt-pricing-header">
            <div>
              <div className="mkt-kicker">Стоимость</div>
              <h2>Прозрачные цены без скрытых платежей</h2>
            </div>
            <Link href="/pricing" style={{ fontWeight: 600, fontSize: 15 }}>
              Все цены и категории →
            </Link>
          </div>
        </Reveal>
        <div className="mkt-pricing-grid">
          {PRICING_TEASER.map((item) => (
            <Reveal key={item.category}>
              <div className="mkt-pricing-card">
                <div className="mkt-pricing-card-category">{item.category}</div>
                <div className="mkt-pricing-card-title">{item.title}</div>
                <div className="mkt-pricing-card-price">от {item.priceFrom} ₽</div>
                <div className="mkt-pricing-card-meta">
                  {item.hours} ак. часов · дистанционно / очно
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="form" className="mkt-cta-band">
        <div className="mkt-container mkt-cta-band-inner">
          <Reveal>
            <h2>Готовы начать обучение?</h2>
            <p>
              Оставьте заявку — мы перезвоним, поможем выбрать программу и форму
              обучения.
            </p>
            <div className="mkt-cta-contacts">
              <div>📍 г. Курган, ул. Уральская, д. 1, стр. 3, каб. 2</div>
              <div>
                📞{" "}
                <a href="tel:+79195615406">+7 919 561-54-06</a> · (3522) 26-35-09
              </div>
              <div>
                ✉️ <a href="mailto:profi-045@yandex.ru">profi-045@yandex.ru</a>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <ApplicationForm />
          </Reveal>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
