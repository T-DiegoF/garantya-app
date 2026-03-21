"use client";

export default function GlobalError({
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <p className="text-base font-bold text-stone-700">Something went wrong</p>
      <p className="text-sm text-stone-400">An unexpected error occurred. Please try again.</p>
      <button
        onClick={reset}
        className="text-sm text-stone-500 underline underline-offset-2 hover:text-stone-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
