'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
        // lewati kalau gagal, biarkan harga kosong untuk aset itu
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <a href="/dashboard" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
          ← Kembali ke Dashboard
        </a>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
          <a href="/assets" className="text-sm text-blue-600 hover:underline">Kelola Daftar Aset →</a>
        </div>

        {assets.length === 0 ? (
          <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
            Tambahkan aset dulu di <a href="/assets" className="underline">Kelola Daftar Aset</a>.
          </div>
        ) : (
          <form onSubmit={handleAdd} className="mb-8 rounded-lg bg-white p-6 shadow">
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Aset</label>
                <select required value={assetId} onChange={(e) => setAssetId(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2">
                  <option value="">Pilih aset</option>
                  {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.symbol})</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Jumlah</label>
                <input type="number" step="any" required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="10" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Harga Beli Rata-rata</label>
                <input type="number" required value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="9500" />
              </div>
            </div>
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
              {loading ? 'Menyimpan...' : 'Tambah Posisi'}
            </button>
          </form>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Posisi Terbuka</h2>
          <button onClick={fetchPrices} disabled={loadingPrices} className="text-sm text-blue-600 hover:underline">
            {loadingPrices ? 'Memuat harga...' : '🔄 Refresh Harga'}
          </button>
        </div>

        <div className="rounded-lg bg-white shadow">
          {holdings.length === 0 ? (
            <p className="p-6 text-gray-500">Belum ada posisi terbuka.</p>
          ) : (
            holdings.map((h) => {
              const currentPrice = h.assets ? prices[h.assets.symbol] : undefined
              const invested = h.quantity * h.avg_buy_price
              const currentValue = currentPrice ? h.quantity * currentPrice : null
              const pnl = currentValue !== null ? currentValue - invested : null
              const pnlPercent = pnl !== null ? (pnl / invested) * 100 : null

              return (
                <div key={h.id} className="border-b p-4 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{h.assets?.name} ({h.assets?.symbol})</p>
                      <p className="text-sm text-gray-500">
                        {h.quantity} unit @ {formatRupiah(h.avg_buy_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      {currentPrice ? (
                        <>
                          <p className="text-sm text-gray-500">Harga sekarang: {formatRupiah(currentPrice)}</p>
                          <p className={`font-semibold ${pnl! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pnl! >= 0 ? '+' : ''}{formatRupiah(pnl!)} ({pnlPercent!.toFixed(1)}%)
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">Harga belum dimuat</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleClose(h.id)} className="mt-2 text-sm text-red-600 hover:underline">
                    Tutup Posisi
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}