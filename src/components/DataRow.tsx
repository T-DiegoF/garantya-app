import { cn } from "@/lib/cn";

interface DataRowProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  accent?: boolean;
}

export function DataRow({ label, value, mono = false, accent = false }: DataRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#E8E2D8] last:border-0">
      <span className="text-xs font-medium uppercase tracking-wide text-stone-400">
        {label}
      </span>
      <span className={cn(
        "text-sm font-bold",
        mono    && "font-mono text-xs text-stone-500",
        accent  && "text-[#A07850]",
        !mono && !accent && "text-[#1C1917]"
      )}>
        {value}
      </span>
    </div>
  );
}
