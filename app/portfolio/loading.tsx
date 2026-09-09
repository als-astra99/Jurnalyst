export default function PortfolioLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-16 bg-slate-200 rounded" />
          <div className="h-7 w-44 bg-slate-200 rounded" />
          <div className="h-4 w-60 bg-slate-200 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-slate-200 rounded-lg" />
          <div className="h-9 w-24 bg-slate-200 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="h-3 w-32 bg-slate-200 rounded" />
            <div className="space-y-1"><div className="h-3 w-6 bg-slate-200 rounded" /><div className="h-7 w-40 bg-slate-200 rounded" /></div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="h-5 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5"><div className="h-3 w-20 bg-slate-200 rounded" /><div className="h-10 w-full bg-slate-100 rounded-lg" /></div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100"><div className="h-4 w-28 bg-slate-200 rounded" /></div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-5 border-b border-slate-100 last:border-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="flex gap-2"><div className="h-4 w-28 bg-slate-200 rounded" /><div className="h-4 w-16 bg-slate-100 rounded" /></div>
                  <div className="h-3 w-44 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="text-right space-y-1"><div className="h-3 w-32 bg-slate-100 rounded" /><div className="h-4 w-24 bg-slate-200 rounded" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
