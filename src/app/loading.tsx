// Home page skeleton — shown instantly while JS loads
export default function HomeLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero */}
      <div className="space-y-3 pt-4">
        <div className="h-3 w-28 rounded-full bg-stone-200" />
        <div className="h-9 w-64 rounded-lg bg-stone-200" />
        <div className="h-9 w-48 rounded-lg bg-stone-200" />
        <div className="h-4 w-80 rounded-full bg-stone-200" />
      </div>
      {/* Role cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-28 rounded-2xl bg-stone-200" />
        <div className="h-28 rounded-2xl bg-stone-200" />
      </div>
    </div>
  );
}
