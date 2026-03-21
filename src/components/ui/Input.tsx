import { cn } from "@/lib/cn";
import { type InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, mono = false, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-[10px] border border-[#D6CFC4] bg-[#EDE8DF]",
            "px-4 py-3.5 text-sm font-medium text-[#1C1917]",
            "outline-none transition-all duration-200",
            "placeholder:text-stone-400 placeholder:font-normal",
            "focus:border-[#1C1917] focus:bg-[#F0EBE2]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-400 focus:border-red-500",
            mono && "font-mono text-xs",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
