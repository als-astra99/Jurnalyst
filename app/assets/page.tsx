'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppNavbar from '@/components/AppNavbar'
import AnimatedContent from '@/components/reactbits/AnimatedContent'
import FadeContent from '@/components/reactbits/FadeContent'
import SelectInput from '@/components/ui/SelectInput'
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
  const [deleting, setDeleting] = useState<string | null>(null)
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

  const handleDelete = async (id: string, assetName: string) => {
    // Ambil semua holdings yang terkait aset ini
    const { data: holdings } = await supabase
      .from('portfolio_holdings')
      .select('id')
      .eq('asset_id', id)

    const holdingIds = (holdings ?? []).map((h: { id: string }) => h.id)

    // Bangun pesan konfirmasi
    let confirmMsg = `Hapus aset "${assetName}"?`
    if (holdingIds.length > 0) {
      confirmMsg =
        `Hapus aset "${assetName}"?\n\n` +
        `⚠️ Aset ini terhubung dengan ${holdingIds.length} riwayat posisi Portfolio dan semua Jurnal terkait.\n\n` +
        `Semua data berikut akan ikut terhapus:\n` +
        `• ${holdingIds.length} posisi Portfolio\n` +
        `• Semua entri Journal yang terhubung posisi tersebut\n\n` +
        `Tindakan ini tidak bisa dibatalkan.`
    }

    if (!window.confirm(confirmMsg)) return

    setDeleting(id)

    try {
      // 1. Hapus journal_entries yang punya holding_id dalam list
      if (holdingIds.length > 0) {
        const { error: jeErr } = await supabase
          .from('journal_entries')
          .delete()
          .in('holding_id', holdingIds)
        if (jeErr) throw new Error('Gagal hapus jurnal: ' + jeErr.message)

        // 2. Hapus semua holdings
        const { error: hErr } = await supabase
          .from('portfolio_holdings')
          .delete()
          .eq('asset_id', id)
        if (hErr) throw new Error('Gagal hapus posisi portfolio: ' + hErr.message)
      }

      // 3. Hapus aset
      const { error: aErr } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)
      if (aErr) throw new Error('Gagal hapus aset: ' + aErr.message)

      loadAssets()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Terjadi kesalahan saat menghapus.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <AppNavbar>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <AnimatedContent distance={28} duration={0.6} threshold={0.05}>
          <div>
            <p className="page-header-eyebrow mb-1.5">Data Master</p>
            <h1 className="font-serif-heading text-2xl md:text-[1.85rem] font-bold leading-tight" style={{ color: '#1A1F2E' }}>
              Daftar Master Aset
            </h1>
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: '#64748B' }}>
              Kelola simbol saham IDX dan ID aset kripto untuk pemantauan harga real-time di portofolio.
            </p>
          </div>
        </AnimatedContent>

        {/* ADD ASSET FORM */}
        <AnimatedContent distance={28} duration={0.65} delay={0.06} threshold={0.05}>
          <div className="stitched-card p-6 rounded-2xl">
            <h2 className="font-serif-heading text-sm font-bold mb-4 flex items-center gap-2.5 pb-3"
                style={{ color: '#1A1F2E', borderBottom: '1px solid #F0EDE5' }}>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #C8E6D8, #A8D4C0)', color: '#145C3E' }}
              >
                <Plus size={14} weight="bold" />
              </div>
              <span>Tambah Aset Baru</span>
            </h2>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SelectInput
                label="Jenis Aset"
                value={assetType}
                onChange={setAssetType}
                options={[
                  { value: 'stock',  label: 'Saham (IDX / Yahoo Finance)', sublabel: 'Kode ticker .JK' },
                  { value: 'crypto', label: 'Aset Kripto (CoinGecko)',      sublabel: 'ID dari CoinGecko' },
                ]}
              />

              <div>
                <label className="form-label">
                  {assetType === 'stock' ? 'Kode Saham (Ticker)' : 'ID Kripto CoinGecko'}
                </label>
                <input
                  type="text"
                  required
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder={assetType === 'stock' ? 'BBCA' : 'bitcoin'}
                  className="form-input font-mono"
                />
              </div>

              <div>
                <label className="form-label">Nama Aset</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bank Central Asia"
                  className="form-input"
                />
              </div>
            </div>

            {assetType === 'crypto' ? (
              <p className="text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-2" style={{ color: '#92400E' }}>
                <Info size={16} className="shrink-0" style={{ color: '#B45309' }} />
                <span>Gunakan ID resmi dari CoinGecko (URL), contoh: <code className="font-mono">bitcoin</code>, <code className="font-mono">ethereum</code>, <code className="font-mono">solana</code>.</span>
              </p>
            ) : (
              <p className="text-xs bg-blue-50 p-2.5 rounded-lg border border-blue-200 flex items-center gap-2" style={{ color: '#1E3A5F' }}>
                <Info size={16} className="shrink-0" style={{ color: '#1B2A4A' }} />
                <span>Masukkan kode saham 4 huruf (contoh: <code className="font-mono">BBCA</code>, <code className="font-mono">TLKM</code>). Akhiran <code className="font-mono">.JK</code> akan ditambahkan otomatis.</span>
              </p>
            )}

            {error && (
              <p className="text-xs text-[#D14343] font-medium bg-red-50 p-2.5 rounded-lg border border-red-200 animate-fade-in">
                {error}
              </p>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Menyimpan...' : 'Tambah Aset'}
              </button>
            </div>
          </form>
        </div>
        </AnimatedContent>

        {/* ASSETS LIST */}
        <FadeContent duration={500} delay={150} threshold={0.05}>
          <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', boxShadow: '0 1px 4px rgba(26,31,46,0.04)' }}>
            <div
              className="p-4 flex items-center justify-between"
              style={{ background: 'linear-gradient(to right, #FAFAF7, #F5F2EB)', borderBottom: '1px solid #EDE9E0' }}
            >
              <h2 className="font-serif-heading font-bold text-sm" style={{ color: '#1A1F2E' }}>
                Daftar Aset Terdaftar
              </h2>
              <span
                className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', color: '#64748B' }}
              >
                {assets.length} Aset
              </span>
            </div>

            {assets.length === 0 ? (
              <div
                className="p-16 text-center flex flex-col items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(249,246,240,0.5), rgba(243,239,230,0.6))',
                  border: '1px dashed #D6D0C4',
                  margin: '16px',
                  borderRadius: '1rem',
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #F5E4C2, #EDD099)' }}
                >
                  <Coins size={28} style={{ color: '#8A5E14' }} />
                </div>
                <p className="font-serif-heading text-sm font-bold" style={{ color: '#1A1F2E' }}>
                  Belum ada aset ditambahkan
                </p>
                <p className="text-[11px] mt-1 max-w-sm leading-relaxed" style={{ color: '#94A3B8' }}>
                  Tambahkan saham atau kripto pertama Anda untuk mulai mencatat posisi portofolio.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {assets.map((a, idx) => (
                  <AnimatedContent
                    key={a.id}
                    distance={18}
                    duration={0.4}
                    delay={idx * 0.03}
                    threshold={0.01}
                  >
                    <div className="flex items-center justify-between p-4 hover:bg-slate-50/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs font-serif-heading shrink-0"
                          style={{ background: 'linear-gradient(135deg, #162848, #0F1E36)', color: '#FFFFFF' }}
                        >
                          {a.symbol.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-xs" style={{ color: '#1A1F2E' }}>{a.name}</p>
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold"
                              style={{ background: 'rgba(100,116,139,0.1)', color: '#475569' }}
                            >
                              {a.symbol}
                            </span>
                          </div>
                          <span className="inline-block text-[11px] mt-0.5 capitalize" style={{ color: '#94A3B8' }}>
                            {a.asset_type === 'stock' ? 'Saham Indonesia (IDX)' : 'Aset Kripto'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(a.id, a.name)}
                        disabled={deleting === a.id}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-40"
                        title="Hapus Aset"
                      >
                        {deleting === a.id
                          ? <span className="block w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <Trash size={14} />
                        }
                      </button>
                    </div>
                  </AnimatedContent>
                ))}
              </div>
            )}
          </div>
        </FadeContent>
      </div>
    </AppNavbar>
  )
}