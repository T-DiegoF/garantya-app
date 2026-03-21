"use client";

import Link from "next/link";

export default function ContractError({
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <p className="text-base font-bold text-stone-700">Failed to load contract</p>
      <p className="text-sm text-stone-400">
        The contract could not be loaded. Check the address and try again.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="text-sm text-stone-500 underline underline-offset-2 hover:text-stone-700 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="text-sm text-stone-500 underline underline-offset-2 hover:text-stone-700 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
