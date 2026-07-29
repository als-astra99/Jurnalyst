'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  portfolio_holdings: { assets: { name: string; symbol: string } | null } | null
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

  // Hitung win rate
  const closedEntries = entries.filter((e) => e.result === 'win' || e.result === 'loss')
  const winCount = entries.filter((e) => e.result === 'win').length
  const winRate = closedEntries.length > 0 ? (winCount / closedEntries.length) * 100 : 0

  const resultBadge = (result: string | null) => {
    const map: Record<string, string> = {
      win: 'bg-green-100 text-green-700',
      loss: 'bg-red-100 text-red-700',
      breakeven: 'bg-gray-100 text-gray-700',
      ongoing: 'bg-blue-100 text-blue-700',
    }
    return map[result || 'ongoing'] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <a href="/dashboard" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
          ← Kembali ke Dashboard
        </a>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Investment Journal</h1>
        <p className="mb-6 text-sm text-gray-600">
          Win Rate: <span className="font-semibold text-gray-900">{winRate.toFixed(1)}%</span>{' '}
          ({winCount} win dari {closedEntries.length} posisi selesai)
        </p>

        <form onSubmit={handleAdd} className="mb-8 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Kaitkan ke Posisi (opsional)</label>
              <select value={holdingId} onChange={(e) => setHoldingId(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2">
                <option value="">Tidak ada / catatan umum</option>
                {holdings.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.assets?.name} ({h.assets?.symbol}) — {h.status === 'open' ? 'Terbuka' : 'Ditutup'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Jenis Entry</label>
              <select value={entryType} onChange={(e) => setEntryType(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2">
                <option value="buy">Buy (Beli)</option>
                <option value="sell">Sell (Jual)</option>
                <option value="hold">Hold (Tahan)</option>
                <option value="note">Catatan</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Hipotesis / Alasan</label>
              <textarea
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                rows={3}
                placeholder="Kenapa masuk/keluar posisi ini? Apa dasarnya?"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Target Price</label>
              <input type="number" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="10500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Stop Loss</label>
              <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="9000" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Hasil</label>
              <select value={result} onChange={(e) => setResult(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2">
                <option value="ongoing">Masih Berjalan</option>
                <option value="win">Win</option>
                <option value="loss">Loss</option>
                <option value="breakeven">Breakeven</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tanggal</label>
              <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Refleksi / Evaluasi (opsional)</label>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={2}
                placeholder="Setelah posisi ditutup, apa pelajaran yang didapat?"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
            {loading ? 'Menyimpan...' : 'Simpan Entry'}
          </button>
        </form>

        <div className="mb-4 flex items-center gap-2">
          {(['all', 'win', 'loss', 'ongoing'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-sm ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              {f === 'all' ? 'Semua' : f === 'win' ? 'Win' : f === 'loss' ? 'Loss' : 'Berjalan'}
            </button>
          ))}
        </div>

        <div className="rounded-lg bg-white shadow">
          {filteredEntries.length === 0 ? (
            <p className="p-6 text-gray-500">Belum ada entry jurnal.</p>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="border-b p-4 last:border-b-0">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium text-gray-900">
                    {entry.portfolio_holdings?.assets
                      ? `${entry.portfolio_holdings.assets.name} (${entry.portfolio_holdings.assets.symbol})`
                      : 'Catatan Umum'}
                    {' · '}
                    <span className="text-sm font-normal text-gray-500 capitalize">{entry.entry_type}</span>
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${resultBadge(entry.result)}`}>
                    {entry.result}
                  </span>
                </div>
                {entry.hypothesis && <p className="mb-1 text-sm text-gray-700">{entry.hypothesis}</p>}
                <div className="flex gap-4 text-xs text-gray-500">
                  {entry.target_price && <span>Target: Rp {entry.target_price.toLocaleString('id-ID')}</span>}
                  {entry.stop_loss && <span>Stop Loss: Rp {entry.stop_loss.toLocaleString('id-ID')}</span>}
                  <span>{entry.entry_date}</span>
                </div>
                {entry.reflection && (
                  <p className="mt-2 rounded bg-gray-50 p-2 text-sm text-gray-600">💡 {entry.reflection}</p>
                )}
                <button onClick={() => handleDelete(entry.id)} className="mt-2 text-sm text-red-600 hover:underline">
                  Hapus
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
