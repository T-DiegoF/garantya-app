import { cn } from "@/lib/cn";
import { type BadgeVariant } from "@/lib/utils";

const variants: Record<BadgeVariant, string> = {
  green: "bg-green-50 text-green-800 border-green-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  red:   "bg-red-50 text-red-800 border-red-200",
  blue:  "bg-blue-50 text-blue-800 border-blue-200",
  gray:  "bg-stone-50 text-stone-500 border-stone-200",
};

interface BadgeProps {
  variant: BadgeVariant;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, pulse = false, children, className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide",
      variants[variant],
      className
    )}>
      {pulse && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
      {children}
    </span>
  );
}
