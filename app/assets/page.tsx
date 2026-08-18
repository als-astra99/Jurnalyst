'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppNavbar from '@/components/AppNavbar'
import { Coins, Plus, Trash, Info } from '@phosphor-icons/react'

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

    let formattedSymbol = symbol.trim()
    if (assetType === 'stock') {
      formattedSymbol = formattedSymbol.toUpperCase()
      if (!formattedSymbol.endsWith('.JK')) {
        formattedSymbol += '.JK'
      }
    } else {
      formattedSymbol = formattedSymbol.toLowerCase()
    }

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
    <AppNavbar>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-serif-heading text-2xl md:text-3xl font-bold text-slate-900">
            Daftar Master Aset
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola simbol saham IDX dan ID aset kripto untuk pemantauan harga real-time di portofolio.
          </p>
        </div>

        {/* ADD ASSET FORM */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <h2 className="font-serif-heading text-base font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus size={18} className="text-[#1B2A4A]" />
            <span>Tambah Aset Baru</span>
          </h2>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Jenis Aset
                </label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                >
                  <option value="stock">Saham (IDX / Yahoo Finance)</option>
                  <option value="crypto">Aset Kripto (CoinGecko)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  {assetType === 'stock' ? 'Kode Saham (Ticker)' : 'ID Kripto CoinGecko'}
                </label>
                <input
                  type="text"
                  required
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder={assetType === 'stock' ? 'BBCA' : 'bitcoin'}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Nama Aset
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bank Central Asia"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                />
              </div>
            </div>

            {assetType === 'crypto' ? (
              <p className="text-xs text-slate-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-2">
                <Info size={16} className="text-amber-700 shrink-0" />
                <span>Gunakan ID resmi dari CoinGecko (URL), contoh: <code>bitcoin</code>, <code>ethereum</code>, <code>solana</code>.</span>
              </p>
            ) : (
              <p className="text-xs text-slate-600 bg-blue-50 p-2.5 rounded-lg border border-blue-200 flex items-center gap-2">
                <Info size={16} className="text-blue-700 shrink-0" />
                <span>Masukkan kode saham 4 huruf (contoh: <code>BBCA</code>, <code>TLKM</code>). Akhiran <code>.JK</code> akan ditambahkan otomatis.</span>
              </p>
            )}

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
                {loading ? 'Menyimpan...' : 'Tambah Aset'}
              </button>
            </div>
          </form>
        </div>

        {/* ASSETS LIST */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 p-4 bg-slate-50/60 flex items-center justify-between">
            <h2 className="font-serif-heading font-bold text-slate-900 text-sm">
              Daftar Aset Terdaftar
            </h2>
            <span className="text-xs text-slate-500 font-medium">{assets.length} Aset</span>
          </div>

          {assets.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Coins size={36} className="text-slate-400 mb-2" />
              <p className="font-serif-heading text-base font-bold text-slate-800">
                Belum ada aset ditambahkan
              </p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Tambahkan saham atau kripto pertama Anda untuk mulai mencatat posisi portofolio.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {assets.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1B2A4A] text-white flex items-center justify-center font-bold text-xs font-serif-heading shrink-0">
                      {a.symbol.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 text-xs">{a.name}</p>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold">
                          {a.symbol}
                        </span>
                      </div>
                      <span className="inline-block text-[11px] text-slate-500 mt-0.5 capitalize">
                        {a.asset_type === 'stock' ? 'Saham Indonesia (IDX)' : 'Aset Kripto'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(a.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Hapus Aset"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppNavbar>
  )
}