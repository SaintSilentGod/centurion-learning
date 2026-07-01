import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-base font-medium text-slate-800">
        {label}
      </label>
      <input
        id={inputId}
        className={`min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 ${className}`}
        {...props}
      />
      {error ? <p className="text-base text-red-700">{error}</p> : null}
    </div>
  );
}
