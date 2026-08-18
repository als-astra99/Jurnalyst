'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppNavbar from '@/components/AppNavbar'
import {
  ArrowClockwise,
  Coins,
  Plus,
  TrendUp,
  TrendDown,
  Briefcase,
  Warning,
  CheckCircle
} from '@phosphor-icons/react'

type Asset = { id: string; symbol: string; name: string; asset_type: string }
type Holding = {
  id: string
  quantity: number
  avg_buy_price: number
  status: string
  assets: Asset | null
}

export default function PortfolioPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loadingPrices, setLoadingPrices] = useState(false)

  const [assetId, setAssetId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const loadData = async () => {
    const { data: assetData } = await supabase.from('assets').select('id, symbol, name, asset_type')
    const { data: holdingData } = await supabase
      .from('portfolio_holdings')
      .select('id, quantity, avg_buy_price, status, assets(id, symbol, name, asset_type)')
      .eq('status', 'open')

    setAssets(assetData || [])
    setHoldings((holdingData as any) || [])
  }

  useEffect(() => { loadData() }, [])

  const fetchPrices = async () => {
    setLoadingPrices(true)
    const newPrices: Record<string, number> = {}

    for (const h of holdings) {
      if (!h.assets) continue
      try {
        const res = await fetch(`/api/price?symbol=${h.assets.symbol}&type=${h.assets.asset_type}`)
        const data = await res.json()
        if (data.price) newPrices[h.assets.symbol] = data.price
      } catch {
        // biarkan jika gagal
      }
    }

    setPrices(newPrices)
    setLoadingPrices(false)
  }

  useEffect(() => {
    if (holdings.length > 0) fetchPrices()
  }, [holdings.length])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('portfolio_holdings').insert({
      user_id: user.id,
      asset_id: assetId,
      quantity: parseFloat(quantity),
      avg_buy_price: parseFloat(buyPrice),
      status: 'open',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setQuantity('')
    setBuyPrice('')
    setLoading(false)
    loadData()
  }

  const handleClose = async (id: string) => {
    await supabase.from('portfolio_holdings').update({
      status: 'closed',
      closed_at: new Date().toISOString(),
    }).eq('id', id)
    loadData()
  }

  const formatRupiah = (v: number) => 'Rp ' + v.toLocaleString('id-ID')

  const totalInvested = holdings.reduce((sum, h) => sum + (h.quantity * h.avg_buy_price), 0)
  
  let totalCurrentValue = 0
  let hasPrices = false
  holdings.forEach((h) => {
    if (h.assets && prices[h.assets.symbol]) {
      totalCurrentValue += h.quantity * prices[h.assets.symbol]
      hasPrices = true
    } else {
      totalCurrentValue += h.quantity * h.avg_buy_price
    }
  })

  const totalPnL = hasPrices ? totalCurrentValue - totalInvested : 0
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

  return (
    <AppNavbar>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif-heading text-2xl md:text-3xl font-bold text-slate-900">
              Portfolio Tracker
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Pantau aset investasi saham dan kripto secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchPrices}
              disabled={loadingPrices}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
            >
              <ArrowClockwise size={16} className={loadingPrices ? 'animate-spin' : ''} />
              <span>{loadingPrices ? 'Memuat Harga...' : 'Refresh Harga'}</span>
            </button>
            <a
              href="/assets"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1B2A4A] text-white hover:bg-slate-900 text-xs font-semibold shadow-2xs transition-all"
            >
              <Coins size={16} />
              <span>Daftar Aset</span>
            </a>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="stitched-card stripe-navy p-6 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Modal Investasi
            </span>
            <div className="mt-4">
              <p className="font-serif-heading text-2xl md:text-3xl font-bold text-slate-900 font-number-mono">
                {formatRupiah(totalInvested)}
              </p>
              <p className="text-xs text-slate-400 mt-1">{holdings.length} posisi terbuka</p>
            </div>
          </div>

          <div className="stitched-card stripe-brass p-6 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Estimasi Nilai Pasar
            </span>
            <div className="mt-4">
              <p className="font-serif-heading text-2xl md:text-3xl font-bold text-[#B8802E] font-number-mono">
                {formatRupiah(totalCurrentValue)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Berdasarkan harga terbaru</p>
            </div>
          </div>

          <div className={`stitched-card p-6 flex flex-col justify-between ${totalPnL >= 0 ? 'stripe-green' : 'stripe-red'}`}>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Unrealized Profit / Loss
            </span>
            <div className="mt-4">
              <p className={`font-serif-heading text-2xl md:text-3xl font-bold font-number-mono ${totalPnL >= 0 ? 'text-[#2F9E6E]' : 'text-[#D14343]'}`}>
                {totalPnL >= 0 ? '+' : ''}{formatRupiah(totalPnL)}
              </p>
              <p className={`text-xs font-semibold mt-1 flex items-center gap-1 ${totalPnL >= 0 ? 'text-[#2F9E6E]' : 'text-[#D14343]'}`}>
                {totalPnL >= 0 ? <TrendUp size={14} weight="bold" /> : <TrendDown size={14} weight="bold" />}
                <span>{totalPnLPercent.toFixed(2)}% dari modal</span>
              </p>
            </div>
          </div>
        </div>

        {/* ADD POSITION FORM */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <h2 className="font-serif-heading text-base font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus size={18} className="text-[#1B2A4A]" />
            <span>Tambah Posisi Investasi Baru</span>
          </h2>

          {assets.length === 0 ? (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Warning size={18} className="shrink-0 text-amber-700" />
                <span>Belum ada aset terdaftar di master data. Tambahkan aset terlebih dahulu.</span>
              </div>
              <a href="/assets" className="px-3 py-1.5 bg-[#B8802E] text-white text-xs font-semibold rounded-md hover:bg-amber-700">
                Kelola Aset →
              </a>
            </div>
          ) : (
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Pilih Aset
                  </label>
                  <select
                    required
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                  >
                    <option value="">Pilih Saham / Kripto</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Jumlah Lot / Unit
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Contoh: 100"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-number-mono focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Harga Beli Rata-rata (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="Contoh: 9250"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-number-mono focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
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
                  {loading ? 'Menyimpan...' : 'Simpan Posisi'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* HOLDINGS LIST */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 p-4 bg-slate-50/60 flex items-center justify-between">
            <h2 className="font-serif-heading font-bold text-slate-900 text-sm">
              Posisi Terbuka
            </h2>
            <span className="text-xs font-medium text-slate-500">
              {holdings.length} Aset
            </span>
          </div>

          {holdings.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Briefcase size={36} className="text-slate-400 mb-2" />
              <p className="font-serif-heading text-base font-bold text-slate-800">
                Belum Ada Posisi Terbuka
              </p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Gunakan form di atas untuk mencatat posisi investasi Anda.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {holdings.map((h) => {
                const currentPrice = h.assets ? prices[h.assets.symbol] : undefined
                const invested = h.quantity * h.avg_buy_price
                const currentValue = currentPrice ? h.quantity * currentPrice : null
                const pnl = currentValue !== null ? currentValue - invested : null
                const pnlPercent = pnl !== null ? (pnl / invested) * 100 : null

                return (
                  <div key={h.id} className="p-5 hover:bg-slate-50/40 transition-colors space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#1B2A4A] text-white flex items-center justify-center font-bold text-xs font-serif-heading shrink-0">
                          {h.assets?.symbol?.slice(0, 2).toUpperCase() || 'AS'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm">
                              {h.assets?.name || 'Aset'}
                            </h3>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono font-semibold">
                              {h.assets?.symbol}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-[#B8802E] text-[10px] font-semibold uppercase">
                              {h.assets?.asset_type === 'stock' ? 'Saham' : 'Kripto'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-number-mono mt-0.5">
                            {h.quantity} unit @ {formatRupiah(h.avg_buy_price)} (Modal: {formatRupiah(invested)})
                          </p>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        {currentPrice !== undefined ? (
                          <div>
                            <p className="text-xs text-slate-500 font-number-mono">
                              Harga saat ini: <span className="font-semibold text-slate-800">{formatRupiah(currentPrice)}</span>
                            </p>
                            <p className={`font-serif-heading font-bold text-sm font-number-mono mt-0.5 ${pnl! >= 0 ? 'text-[#2F9E6E]' : 'text-[#D14343]'}`}>
                              {pnl! >= 0 ? '+' : ''}{formatRupiah(pnl!)} ({pnlPercent!.toFixed(2)}%)
                            </p>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">
                            Klik &quot;Refresh Harga&quot; untuk update harga real-time
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-emerald-600" />
                        <span>Status: <strong className="text-slate-800 font-semibold">Terbuka (Open)</strong></span>
                      </span>
                      <button
                        onClick={() => handleClose(h.id)}
                        className="px-2.5 py-1 rounded bg-red-50 text-[#D14343] hover:bg-red-100 font-semibold text-[11px] transition-colors"
                      >
                        Tutup Posisi (Sell)
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </AppNavbar>
  )
}