"use client";

type SingleTabBlockerProps = {
  blocked: boolean;
  onRetry: () => void;
};

export function SingleTabBlocker({ blocked, onRetry }: SingleTabBlockerProps) {
  if (!blocked) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-6">
      <div className="max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-900">
          Закройте другие вкладки экзамена
        </h2>
        <p className="mt-3 text-slate-600">
          Экзамен можно проходить только в одной вкладке. Закройте все остальные
          вкладки с этим сайтом и нажмите «Проверить снова».
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Открытие новых вкладок во время экзамена запрещено. Если вы открыли
          вторую вкладку — закройте её или вернитесь в эту.
        </p>
        <button
          type="button"
          className="mt-6 min-h-12 w-full rounded-lg bg-blue-700 px-5 text-white hover:bg-blue-800"
          onClick={() => void onRetry()}
        >
          Проверить снова
        </button>
      </div>
    </div>
  );
}
