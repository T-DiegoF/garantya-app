// Contract detail skeleton — shown instantly while JS loads
export default function ContratoLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header card */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="h-3 w-20 rounded-full bg-stone-200" />
          <div className="h-6 w-24 rounded-full bg-stone-200" />
        </div>
        <div className="h-4 w-32 rounded-full bg-stone-200" />
        <div className="h-10 w-40 rounded-lg bg-stone-200" />
      </div>

      {/* Info card */}
      <div className="rounded-2xl border border-[#E5DFD5] bg-white p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex justify-between">
            <div className="h-3 w-20 rounded-full bg-stone-200" />
            <div className="h-3 w-28 rounded-full bg-stone-200" />
          </div>
        ))}
      </div>

      {/* Action card */}
      <div className="h-40 rounded-2xl bg-stone-200" />

      {/* Timeline */}
      <div className="rounded-2xl border border-[#E5DFD5] bg-white p-4 space-y-4">
        <div className="h-3 w-16 rounded-full bg-stone-200" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-stone-200 mt-1 flex-shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-32 rounded-full bg-stone-200" />
              <div className="h-2.5 w-20 rounded-full bg-stone-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
