import type { ReactNode } from "react";

export function Card({
  title,
  children,
  actions,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title ? <h2 className="text-xl font-semibold">{title}</h2> : null}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
