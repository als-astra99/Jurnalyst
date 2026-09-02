'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppNavbar from '@/components/AppNavbar'
import AnimatedContent from '@/components/reactbits/AnimatedContent'
import FadeContent from '@/components/reactbits/FadeContent'
import SelectInput from '@/components/ui/SelectInput'
import { Tag, Plus, Trash, ArrowUpRight, ArrowDownRight } from '@phosphor-icons/react'

type Category = {
  id: string
  name: string
  type: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [type, setType] = useState('expense')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false })
    setCategories(data || [])
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('categories').insert({
      user_id: user.id,
      name,
      type,
    })

    setName('')
    setLoading(false)
    loadCategories()
  }

  const handleDelete = async (id: string) => {
    // Cek apakah kategori masih digunakan oleh transaksi
    const { data: usedBy } = await supabase
      .from('transactions')
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (usedBy && usedBy.length > 0) {
      alert('Kategori tidak bisa dihapus karena masih digunakan oleh transaksi.\n\nHapus semua transaksi yang menggunakan kategori ini terlebih dahulu.')
      return
    }

    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      alert('Gagal menghapus kategori: ' + error.message)
      return
    }
    loadCategories()
  }

  return (
    <AppNavbar>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <AnimatedContent distance={28} duration={0.6} threshold={0.05}>
          <div>
            <p className="page-header-eyebrow mb-1.5">Data Master</p>
            <h1 className="font-serif-heading text-2xl md:text-[1.85rem] font-bold leading-tight" style={{ color: '#1A1F2E' }}>
              Kelola Kategori Transaksi
            </h1>
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: '#64748B' }}>
              Pengelompokan pengeluaran (Makan, Transport, dll) dan pemasukan (Gaji, Bonus, Dividen).
            </p>
          </div>
        </AnimatedContent>

        {/* ADD CATEGORY FORM */}
        <AnimatedContent distance={28} duration={0.65} delay={0.06} threshold={0.05}>
          <div className="stitched-card p-6 rounded-2xl">
            <h2 className="font-serif-heading text-sm font-bold mb-4 flex items-center gap-2.5 pb-3"
                style={{ color: '#1A1F2E', borderBottom: '1px solid #F0EDE5' }}>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #F5E4C2, #EDD099)', color: '#8A5E14' }}
              >
                <Plus size={14} weight="bold" />
              </div>
              <span>Tambah Kategori Baru</span>
            </h2>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Nama Kategori</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Makan & Minum, Gaji, Transportasi"
                  className="form-input"
                />
              </div>

              <SelectInput
                label="Jenis Kategori"
                value={type}
                onChange={setType}
                options={[
                  { value: 'expense', label: 'Pengeluaran (-)', sublabel: 'Makan, transport, dll' },
                  { value: 'income',  label: 'Pemasukan (+)',   sublabel: 'Gaji, bonus, dividen' },
                ]}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Menyimpan...' : 'Tambah Kategori'}
              </button>
            </div>
          </form>
        </div>
        </AnimatedContent>

        {/* CATEGORIES LIST */}
        <FadeContent duration={500} delay={150} threshold={0.05}>
          <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', boxShadow: '0 1px 4px rgba(26,31,46,0.04)' }}>
            <div
              className="p-4 flex items-center justify-between"
              style={{ background: 'linear-gradient(to right, #FAFAF7, #F5F2EB)', borderBottom: '1px solid #EDE9E0' }}
            >
              <h2 className="font-serif-heading font-bold text-sm" style={{ color: '#1A1F2E' }}>
                Daftar Kategori Terdaftar
              </h2>
              <span
                className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', color: '#64748B' }}
              >
                {categories.length} Kategori
              </span>
            </div>

            {categories.length === 0 ? (
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
                  <Tag size={28} style={{ color: '#8A5E14' }} />
                </div>
                <p className="font-serif-heading text-sm font-bold" style={{ color: '#1A1F2E' }}>
                  Belum ada kategori ditambahkan
                </p>
                <p className="text-[11px] mt-1 max-w-sm leading-relaxed" style={{ color: '#94A3B8' }}>
                  Tambahkan kategori pengeluaran dan pemasukan untuk merapikan analisis arus kas.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {categories.map((cat, idx) => (
                  <AnimatedContent
                    key={cat.id}
                    distance={18}
                    duration={0.4}
                    delay={idx * 0.03}
                    threshold={0.01}
                  >
                    <div className="flex items-center justify-between p-4 hover:bg-slate-50/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            cat.type === 'income' ? 'bg-emerald-100 text-[#2F9E6E]' : 'bg-red-100 text-[#D14343]'
                          }`}
                        >
                          {cat.type === 'income' ? <ArrowUpRight size={16} weight="bold" /> : <ArrowDownRight size={16} weight="bold" />}
                        </div>
                        <div>
                          <p className="font-bold text-xs" style={{ color: '#1A1F2E' }}>{cat.name}</p>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border mt-0.5 ${
                              cat.type === 'income'
                                ? 'bg-emerald-50 text-[#2F9E6E] border-emerald-200'
                                : 'bg-red-50 text-[#D14343] border-red-200'
                            }`}
                          >
                            {cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        title="Hapus Kategori"
                      >
                        <Trash size={14} />
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