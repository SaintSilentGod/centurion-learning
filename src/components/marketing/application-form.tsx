"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { submitApplicationAction } from "@/actions/marketing/applications";
import {
  APPLICATION_COMMENT_MAX,
  APPLICATION_NAME_MAX,
} from "@/lib/application-limits";

type ApplicationFormProps = {
  variant?: "compact" | "full";
  title?: string;
};

export function ApplicationForm({
  variant = "compact",
  title,
}: ApplicationFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("source", variant === "full" ? "contacts" : "home");
    formData.set("startedAt", String(startedAtRef.current));

    const result = await submitApplicationAction(formData);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
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

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p>
      ) : null}

      {/* Ловушка для ботов: человек это поле не видит и не заполняет. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-10000px", width: 1, height: 1, opacity: 0 }}
      />

      {variant === "full" ? (
        <>
          <label className="mkt-label">
            Имя
            <input
              className="mkt-input"
              name="name"
              maxLength={APPLICATION_NAME_MAX}
              placeholder="Иван Иванов"
              required
              disabled={submitting}
            />
          </label>
          <label className="mkt-label">
            Телефон
            <input
              className="mkt-input"
              name="phone"
              placeholder="+7 900 000-00-00"
              required
              disabled={submitting}
            />
          </label>
          <label className="mkt-label">
            Программа
            <select className="mkt-select" name="program" defaultValue="" disabled={submitting}>
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
              maxLength={APPLICATION_COMMENT_MAX}
              placeholder="Расскажите, что вас интересует"
              rows={3}
              disabled={submitting}
            />
          </label>
          <button
            type="submit"
            className="mkt-btn-primary-lg"
            style={{ width: "100%" }}
            disabled={submitting}
          >
            {submitting ? "Отправка…" : "Отправить заявку"}
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
            maxLength={APPLICATION_NAME_MAX}
            placeholder="Ваше имя"
            required
            disabled={submitting}
          />
          <input
            className="mkt-input"
            name="phone"
            placeholder="Телефон"
            required
            disabled={submitting}
          />
          <select className="mkt-select" name="program" defaultValue="" disabled={submitting}>
            <option value="">Программа обучения (необязательно)</option>
            <option value="tb">Транспортная безопасность</option>
            <option value="security">Охранная деятельность</option>
          </select>
          <button
            type="submit"
            className="mkt-btn-primary-lg"
            style={{ width: "100%" }}
            disabled={submitting}
          >
            {submitting ? "Отправка…" : "Отправить заявку"}
          </button>
        </>
      )}
    </form>
  );
}
