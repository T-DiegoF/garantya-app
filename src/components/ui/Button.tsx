import { cn } from "@/lib/cn";
import { type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "outline" | "danger" | "success";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-[#1C1917] text-[#F5F0E8] hover:bg-[#0D0A09] border-transparent",
  outline: "bg-transparent text-[#1C1917] border-[#1C1917]/25 hover:border-[#1C1917] hover:bg-[#1C1917]/[0.04]",
  danger:  "bg-[#C0392B] text-white hover:bg-[#96281B] border-transparent",
  success: "bg-[#166534] text-white hover:bg-[#14532D] border-transparent",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border px-5 py-3.5",
        "text-[14px] font-bold tracking-[-0.01em]",
        "transition-all duration-150 ease-out",
        "hover:-translate-y-px active:scale-[0.98] active:translate-y-0",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0",
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 opacity-70" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Procesando...
        </>
      ) : children}
    </button>
  );
}
