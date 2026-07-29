'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Asset = {
  id: string
  symbol: string
  name: string
  asset_type: string
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [assetType, setAssetType] = useState('stock')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const loadAssets = async () => {
    const { data } = await supabase.from('assets').select('*').order('created_at', { ascending: false })
    setAssets(data || [])
  }

  useEffect(() => { loadAssets() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Format symbol otomatis: saham IDX butuh akhiran .JK untuk Yahoo Finance
    const formattedSymbol = assetType === 'stock' ? symbol.toUpperCase() + '.JK' : symbol.toLowerCase()

    const { error } = await supabase.from('assets').insert({
      user_id: user.id,
      symbol: formattedSymbol,
      name,
      asset_type: assetType,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSymbol('')
    setName('')
    setLoading(false)
    loadAssets()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('assets').delete().eq('id', id)
    loadAssets()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <a href="/dashboard" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
          ← Kembali ke Dashboard
        </a>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Daftar Aset</h1>

        <form onSubmit={handleAdd} className="mb-8 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Jenis</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="stock">Saham (IDX)</option>
                <option value="crypto">Kripto</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {assetType === 'stock' ? 'Kode Saham' : 'ID Kripto'}
              </label>
              <input
                type="text"
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder={assetType === 'stock' ? 'BBCA' : 'bitcoin'}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nama</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bank Central Asia"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          {assetType === 'crypto' && (
            <p className="mb-4 text-xs text-gray-500">
              Gunakan ID resmi dari CoinGecko, contoh: <code>bitcoin</code>, <code>ethereum</code> (bukan simbol seperti BTC/ETH)
            </p>
          )}
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            {loading ? 'Menyimpan...' : 'Tambah Aset'}
          </button>
        </form>

        <div className="rounded-lg bg-white shadow">
          {assets.length === 0 ? (
            <p className="p-6 text-gray-500">Belum ada aset ditambahkan.</p>
          ) : (
            assets.map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b p-4 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{a.name} ({a.symbol})</p>
                  <p className="text-sm text-gray-500">{a.asset_type === 'stock' ? 'Saham' : 'Kripto'}</p>
                </div>
                <button onClick={() => handleDelete(a.id)} className="text-sm text-red-600 hover:underline">
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