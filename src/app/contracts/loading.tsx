// /mis-contratos skeleton — shown instantly while JS loads
export default function MisContratosLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 rounded-full bg-stone-200" />
          <div className="h-8 w-36 rounded-lg bg-stone-200" />
        </div>
        <div className="h-9 w-20 rounded-xl bg-stone-200" />
      </div>

      {/* Search card */}
      <div className="h-20 rounded-2xl bg-stone-200" />

      {/* Section label */}
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-stone-200" />
        {/* Contract items */}
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-2xl bg-stone-200" />
        ))}
      </div>
    </div>
  );
}
