"use client";

import { useState, type FormEvent } from "react";

type ApplicationFormProps = {
  variant?: "compact" | "full";
  title?: string;
};

export function ApplicationForm({
  variant = "compact",
  title,
}: ApplicationFormProps) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mkt-form-card">
        <div className="mkt-form-success">
          <div className="mkt-form-success-icon">✅</div>
          <div style={{ fontWeight: 700, fontSize: variant === "full" ? 18 : 17, marginBottom: 6 }}>
            {variant === "full" ? "Спасибо, заявка отправлена!" : "Заявка отправлена"}
          </div>
          <div style={{ color: "#4B5567", fontSize: 14 }}>
            {variant === "full"
              ? "Мы свяжемся с вами в ближайшее время по указанному телефону."
              : "Мы свяжемся с вами в ближайшее время."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="mkt-form-card" onSubmit={handleSubmit}>
      {title ? <h2>{title}</h2> : null}

      {variant === "full" ? (
        <>
          <label className="mkt-label">
            Имя
            <input
              className="mkt-input"
              name="name"
              placeholder="Иван Иванов"
              required
            />
          </label>
          <label className="mkt-label">
            Телефон
            <input
              className="mkt-input"
              name="phone"
              placeholder="+7 900 000-00-00"
              required
            />
          </label>
          <label className="mkt-label">
            Программа
            <select className="mkt-select" name="program" defaultValue="">
              <option value="">Не выбрано</option>
              <option value="tb">Транспортная безопасность</option>
              <option value="security">Охранная деятельность</option>
            </select>
          </label>
          <label className="mkt-label">
            Комментарий
            <textarea
              className="mkt-textarea"
              name="comment"
              placeholder="Расскажите, что вас интересует"
              rows={3}
            />
          </label>
          <button type="submit" className="mkt-btn-primary-lg" style={{ width: "100%" }}>
            Отправить заявку
          </button>
          <div className="mkt-form-note">
            Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
          </div>
        </>
      ) : (
        <>
          <input
            className="mkt-input"
            name="name"
            placeholder="Ваше имя"
            required
          />
          <input
            className="mkt-input"
            name="phone"
            placeholder="Телефон"
            required
          />
          <select className="mkt-select" name="program" defaultValue="">
            <option value="">Программа обучения (необязательно)</option>
            <option value="tb">Транспортная безопасность</option>
            <option value="security">Охранная деятельность</option>
          </select>
          <button type="submit" className="mkt-btn-primary-lg" style={{ width: "100%" }}>
            Отправить заявку
          </button>
        </>
      )}
    </form>
  );
}
