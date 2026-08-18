'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppNavbar from '@/components/AppNavbar'
import {
  BookBookmark,
  NotePencil,
  Trash,
  Target,
  ShieldWarning,
  Lightbulb,
  CheckCircle,
  XCircle,
  Hourglass
} from '@phosphor-icons/react'

type Holding = {
  id: string
  quantity: number
  avg_buy_price: number
  status: string
  assets: { name: string; symbol: string } | null
}

type JournalEntry = {
  id: string
  entry_type: string
  hypothesis: string | null
  target_price: number | null
  stop_loss: number | null
  result: string | null
  reflection: string | null
  entry_date: string
  holding_id: string | null
  portfolio_holdings: { assets: { name: string; symbol: symbol } | null } | null
}

export default function JournalPage() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [filter, setFilter] = useState<'all' | 'win' | 'loss' | 'ongoing'>('all')

  const [holdingId, setHoldingId] = useState('')
  const [entryType, setEntryType] = useState('buy')
  const [hypothesis, setHypothesis] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [result, setResult] = useState('ongoing')
  const [reflection, setReflection] = useState('')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const loadData = async () => {
    const { data: holdingData } = await supabase
      .from('portfolio_holdings')
      .select('id, quantity, avg_buy_price, status, assets(name, symbol)')

    const { data: entryData } = await supabase
      .from('journal_entries')
      .select('*, portfolio_holdings(assets(name, symbol))')
      .order('entry_date', { ascending: false })

    setHoldings((holdingData as any) || [])
    setEntries((entryData as any) || [])
  }

  useEffect(() => { loadData() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('journal_entries').insert({
      user_id: user.id,
      holding_id: holdingId || null,
      entry_type: entryType,
      hypothesis,
      target_price: targetPrice ? parseFloat(targetPrice) : null,
      stop_loss: stopLoss ? parseFloat(stopLoss) : null,
      result,
      reflection: reflection || null,
      entry_date: entryDate,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setHypothesis('')
    setTargetPrice('')
    setStopLoss('')
    setReflection('')
    setResult('ongoing')
    setLoading(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('journal_entries').delete().eq('id', id)
    loadData()
  }

  const filteredEntries = entries.filter((e) => filter === 'all' || e.result === filter)

  const closedEntries = entries.filter((e) => e.result === 'win' || e.result === 'loss')
  const winCount = entries.filter((e) => e.result === 'win').length
  const lossCount = entries.filter((e) => e.result === 'loss').length
  const winRate = closedEntries.length > 0 ? (winCount / closedEntries.length) * 100 : 0

  const getResultStripe = (res: string | null) => {
    switch (res) {
      case 'win': return 'stripe-green'
      case 'loss': return 'stripe-red'
      case 'breakeven': return 'stripe-navy'
      default: return 'stripe-brass'
    }
  }

  const getResultBadgeClass = (res: string | null) => {
    switch (res) {
      case 'win': return 'bg-emerald-100 text-[#2F9E6E] border-emerald-200'
      case 'loss': return 'bg-red-100 text-[#D14343] border-red-200'
      case 'breakeven': return 'bg-slate-100 text-slate-700 border-slate-200'
      default: return 'bg-amber-100 text-[#B8802E] border-amber-200'
    }
  }

  const formatRupiah = (v: number) => 'Rp ' + v.toLocaleString('id-ID')

  return (
    <AppNavbar>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div>
          <h1 className="font-serif-heading text-2xl md:text-3xl font-bold text-slate-900">
            Investment Journal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Jurnal evaluasi keputusan investasi, hipotesis trading, dan refleksi post-trade.
          </p>
        </div>

        {/* WIN RATE HIGHLIGHT CARD */}
        <div className="bg-[#1B2A4A] text-white p-6 rounded-xl shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-amber-300 font-semibold">
                Performa Jurnal
              </span>
              <h2 className="font-serif-heading text-lg font-bold text-white mt-1">
                Tingkat Kemenangan (Win Rate)
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Berdasarkan {closedEntries.length} posisi yang telah diselesaikan.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="font-serif-heading text-3xl md:text-4xl font-bold text-amber-300 font-number-mono">
                {winRate.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-300 font-medium mt-1 flex items-center justify-end gap-2">
                <span className="text-emerald-400 font-bold">{winCount} Win</span>
                <span>•</span>
                <span className="text-red-400 font-bold">{lossCount} Loss</span>
              </p>
            </div>
          </div>
        </div>

        {/* NEW ENTRY FORM */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <h2 className="font-serif-heading text-base font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <NotePencil size={18} className="text-[#1B2A4A]" />
            <span>Tulis Catatan Jurnal Baru</span>
          </h2>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Posisi Terkait (Opsional)
                </label>
                <select
                  value={holdingId}
                  onChange={(e) => setHoldingId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                >
                  <option value="">Tidak ada / Catatan Umum</option>
                  {holdings.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.assets?.name} ({h.assets?.symbol}) — {h.status === 'open' ? 'Terbuka' : 'Ditutup'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Jenis Keputusan
                </label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                >
                  <option value="buy">Buy (Beli)</option>
                  <option value="sell">Sell (Jual)</option>
                  <option value="hold">Hold (Tahan)</option>
                  <option value="note">Catatan Analisa</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Hipotesis & Alasan Keputusan
                </label>
                <textarea
                  required
                  rows={3}
                  value={hypothesis}
                  onChange={(e) => setHypothesis(e.target.value)}
                  placeholder="Tuliskan analisa teknikal/fundamental, katalis pasar, atau alasan masuk posisi..."
                  className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Target Price (Rp)
                </label>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="Contoh: 10500"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-number-mono focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Stop Loss (Rp)
                </label>
                <input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="Contoh: 8900"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-number-mono focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Hasil / Status
                </label>
                <select
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                >
                  <option value="ongoing">Masih Berjalan (Ongoing)</option>
                  <option value="win">Win (Profit)</option>
                  <option value="loss">Loss (Rugi)</option>
                  <option value="breakeven">Breakeven (Impasse)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Tanggal Tangkapan
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Evaluasi & Refleksi
                </label>
                <textarea
                  rows={2}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Refleksi emosi atau pelajaran yang didapat setelah posisi selesai..."
                  className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-[#D14343] font-medium bg-red-50 p-2.5 rounded-lg border border-red-200">
                {error}
              </p>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-[#1B2A4A] hover:bg-slate-900 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Jurnal'}
              </button>
            </div>
          </form>
        </div>

        {/* FILTER PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2">
            Status:
          </span>
          {(['all', 'ongoing', 'win', 'loss'] as const).map((f) => {
            const active = filter === f
            const labelMap = { all: 'Semua', ongoing: 'Berjalan', win: 'Win', loss: 'Loss' }
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#1B2A4A] text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {labelMap[f]}
              </button>
            )
          })}
        </div>

        {/* JOURNAL LIST */}
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 flex flex-col items-center justify-center">
              <BookBookmark size={36} className="text-slate-400 mb-2" />
              <p className="font-serif-heading text-base font-bold text-slate-800">
                Belum Ada Catatan Jurnal
              </p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Tulis hipotesis investasi pertama Anda untuk melatih kedisiplinan trading.
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className={`stitched-card p-5 hover:border-slate-300 transition-all ${getResultStripe(entry.result)}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif-heading font-bold text-slate-900 text-sm">
                      {entry.portfolio_holdings?.assets
                        ? `${entry.portfolio_holdings.assets.name} (${entry.portfolio_holdings.assets.symbol})`
                        : 'Catatan Umum'}
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase">
                      {entry.entry_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${getResultBadgeClass(entry.result)}`}>
                      {entry.result}
                    </span>
                    <span className="text-xs text-slate-400 font-number-mono">
                      {entry.entry_date}
                    </span>
                  </div>
                </div>

                {entry.hypothesis && (
                  <p className="text-xs text-slate-700 leading-relaxed mb-3">
                    {entry.hypothesis}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs font-number-mono p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 mb-3">
                  {entry.target_price && (
                    <span className="flex items-center gap-1">
                      <Target size={14} className="text-[#2F9E6E]" />
                      <span>Target: <strong className="text-[#2F9E6E]">{formatRupiah(entry.target_price)}</strong></span>
                    </span>
                  )}
                  {entry.stop_loss && (
                    <span className="flex items-center gap-1">
                      <ShieldWarning size={14} className="text-[#D14343]" />
                      <span>Stop Loss: <strong className="text-[#D14343]">{formatRupiah(entry.stop_loss)}</strong></span>
                    </span>
                  )}
                </div>

                {entry.reflection && (
                  <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/60 text-xs text-slate-800 space-y-1">
                    <p className="font-semibold text-[#B8802E] flex items-center gap-1.5 text-[11px]">
                      <Lightbulb size={14} />
                      <span>Evaluasi & Refleksi:</span>
                    </p>
                    <p className="leading-relaxed text-slate-700">{entry.reflection}</p>
                  </div>
                )}

                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                  >
                    <Trash size={14} />
                    <span>Hapus Entry</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </AppNavbar>
  )
}
