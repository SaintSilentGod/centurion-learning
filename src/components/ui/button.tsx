import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

const variants = {
  primary: "bg-blue-700 text-white hover:bg-blue-800",
  secondary:
    "border border-slate-300 bg-white text-slate-900 hover:bg-slate-100",
  danger: "bg-red-700 text-white hover:bg-red-800",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-lg font-medium disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
