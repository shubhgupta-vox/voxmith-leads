import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

const base = "inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
export const primary = `${base} bg-brand text-white hover:bg-brand-dark`;
export const secondary = `${base} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`;

export const Button = ({ variant = "primary", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }) => (
  <button {...p} className={`${variant === "primary" ? primary : secondary} ${className}`} />
);
export const LinkButton = ({ to, children }: { to: string; children: ReactNode }) => <Link to={to} className={primary}>{children}</Link>;

export const inputCls = "mt-1 block w-full min-h-11 rounded-lg border border-slate-400 px-3 py-2 text-base";

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: (p: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode }) {
  const id = "f-" + label.replace(/\W+/g, "-").toLowerCase();
  const d = error ? id + "-err" : hint ? id + "-hint" : undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      {children({ id, "aria-describedby": d, "aria-invalid": error ? true : undefined })}
      {hint && !error && <p id={id + "-hint"} className="mt-1 text-sm text-slate-600">{hint}</p>}
      {error && <p id={id + "-err"} className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export const ErrorNote = ({ children }: { children: ReactNode }) => (
  <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{children}</p>
);
