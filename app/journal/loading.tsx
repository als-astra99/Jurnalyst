export default function JournalLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-44 bg-slate-200 rounded" />
        <div className="h-4 w-64 bg-slate-200 rounded" />
      </div>
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2"><div className="h-3 w-24 bg-slate-600 rounded" /><div className="h-5 w-40 bg-slate-600 rounded" /></div>
          <div className="h-10 w-20 bg-slate-600 rounded" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="h-5 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5"><div className="h-3 w-20 bg-slate-200 rounded" /><div className="h-10 w-full bg-slate-100 rounded-lg" /></div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex justify-between">
              <div className="flex gap-2"><div className="h-4 w-32 bg-slate-200 rounded" /><div className="h-4 w-12 bg-slate-100 rounded" /></div>
              <div className="h-4 w-20 bg-slate-100 rounded" />
            </div>
            <div className="space-y-1.5"><div className="h-3 w-full bg-slate-100 rounded" /><div className="h-3 w-3/4 bg-slate-100 rounded" /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
