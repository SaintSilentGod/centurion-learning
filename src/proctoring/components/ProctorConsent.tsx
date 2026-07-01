"use client";

type ProctorConsentProps = {
  onAccept: () => void;
  onDecline: () => void;
};

export function ProctorConsent({ onAccept, onDecline }: ProctorConsentProps) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold">Согласие на прокторинг</h2>
      <p className="mt-3 text-slate-600">
        Перед началом экзамена вы соглашаетесь со следующими условиями:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
        <li>Веб-камера будет анализироваться для контроля присутствия и внимания</li>
        <li>Микрофон будет анализироваться на голосовую активность (без полной записи)</li>
        <li>Требуется полноэкранный режим и демонстрация экрана</li>
        <li>Подозрительные события и risk score будут сохранены для проверки</li>
        <li>При серьёзных событиях могут сохраняться снимки с камеры</li>
        <li>Система не принимает решение автоматически — итог определяет администратор</li>
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onAccept}
          className="min-h-12 rounded-lg bg-blue-700 px-6 text-lg font-medium text-white hover:bg-blue-800"
        >
          Согласен и продолжить
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="min-h-12 rounded-lg border border-slate-300 px-6 text-lg hover:bg-slate-50"
        >
          Отказаться
        </button>
      </div>
    </div>
  );
}
