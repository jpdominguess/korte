import Link from "next/link";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { initials } from "@/domain/shared/format";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "inverse";
type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary: "border-transparent bg-marinho text-white hover:bg-marinho-hover",
  secondary: "border-borda-controle bg-superficie text-marinho hover:bg-muted",
  ghost: "border-transparent bg-transparent text-marinho hover:bg-muted",
  danger: "border-transparent bg-erro text-white hover:bg-erro-escuro",
  inverse: "border-white/30 bg-transparent text-white hover:border-white/60 hover:bg-white/10 focus-visible:outline-white",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-controle border font-semibold leading-none no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 ${variantClass[variant]} ${sizeClass[size]} ${extra}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant, size, className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({
  href,
  variant,
  size,
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

export const inputClass =
  "h-10 w-full rounded-controle border border-borda-controle bg-superficie px-3 text-base text-texto transition-colors placeholder:text-texto-2 hover:border-[#bdbdb7] focus:border-destaque focus:shadow-[0_0_0_1px_var(--color-destaque)] focus:outline-none disabled:cursor-not-allowed disabled:border-borda disabled:bg-muted disabled:text-texto-2";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${inputClass} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputClass} h-auto min-h-20 resize-y py-2.5 leading-normal ${className}`} {...props} />;
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-texto-2">{hint}</p>}
    </div>
  );
}

export function Check({
  name,
  value,
  defaultChecked,
  children,
}: {
  name: string;
  value?: string;
  defaultChecked?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="inline-flex min-h-9 items-center gap-2 text-sm">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="size-4.5" />
      {children}
    </label>
  );
}

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "navy";

const badgeTone: Record<Tone, string> = {
  neutral: "bg-muted text-texto-2",
  info: "bg-info-bg text-info",
  success: "bg-sucesso-bg text-sucesso",
  warning: "bg-aviso-bg text-aviso",
  danger: "bg-erro-bg text-erro",
  navy: "bg-marinho-claro text-marinho",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-semibold ${badgeTone[tone]}`}>
      {children}
    </span>
  );
}

export function Avatar({
  name,
  src,
  size = "md",
  dark = false,
}: {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  dark?: boolean;
}) {
  const sizes = { xs: "size-6 text-[10px]", sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-base", xl: "size-16 text-lg" };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- foto servida pela própria API, já reduzida no envio
    return <img src={src} alt="" aria-hidden="true" className={`shrink-0 rounded-full bg-marinho-claro object-cover ${sizes[size]}`} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-full font-bold tracking-wide ${sizes[size]} ${dark ? "bg-marinho text-white" : "bg-marinho-claro text-marinho"}`}
    >
      {initials(name)}
    </span>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={`rounded-card border border-borda bg-superficie ${className}`}>{children}</section>;
}

const noticeTone = {
  info: { box: "bg-info-bg", icon: "text-info", Icon: Info },
  neutral: { box: "bg-muted", icon: "text-texto-2", Icon: Info },
  success: { box: "bg-sucesso-bg", icon: "text-sucesso", Icon: CircleCheck },
  warning: { box: "bg-aviso-bg", icon: "text-aviso", Icon: TriangleAlert },
  danger: { box: "bg-erro-bg", icon: "text-erro", Icon: CircleAlert },
};

export function Notice({ tone = "info", children }: { tone?: keyof typeof noticeTone; children: ReactNode }) {
  const { box, icon, Icon } = noticeTone[tone];
  return (
    <div role={tone === "danger" ? "alert" : undefined} className={`flex items-start gap-3 rounded-controle px-4 py-3 text-sm ${box}`}>
      <Icon className={`mt-0.5 size-4 shrink-0 ${icon}`} aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  return message ? <Notice tone="danger">{message}</Notice> : null;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl leading-tight font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-texto-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="font-bold">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-texto-2">{text}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
