'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppNavbar from '@/components/AppNavbar'
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
    await supabase.from('categories').delete().eq('id', id)
    loadCategories()
  }

  return (
    <AppNavbar>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-serif-heading text-2xl md:text-3xl font-bold text-slate-900">
            Kelola Kategori Transaksi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pengelompokan pengeluaran (Makan, Transport, dll) dan pemasukan (Gaji, Bonus, Dividen).
          </p>
        </div>

        {/* ADD CATEGORY FORM */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <h2 className="font-serif-heading text-base font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus size={18} className="text-[#1B2A4A]" />
            <span>Tambah Kategori Baru</span>
          </h2>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Makan & Minum, Gaji, Transportasi"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Jenis Kategori
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                >
                  <option value="expense">Pengeluaran (-)</option>
                  <option value="income">Pemasukan (+)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-[#1B2A4A] hover:bg-slate-900 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Tambah Kategori'}
              </button>
            </div>
          </form>
        </div>

        {/* CATEGORIES LIST */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 p-4 bg-slate-50/60 flex items-center justify-between">
            <h2 className="font-serif-heading font-bold text-slate-900 text-sm">
              Daftar Kategori Terdaftar
            </h2>
            <span className="text-xs text-slate-500 font-medium">{categories.length} Kategori</span>
          </div>

          {categories.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Tag size={36} className="text-slate-400 mb-2" />
              <p className="font-serif-heading text-base font-bold text-slate-800">
                Belum ada kategori ditambahkan
              </p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Tambahkan kategori pengeluaran dan pemasukan untuk merapikan analisis arus kas.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        cat.type === 'income' ? 'bg-emerald-100 text-[#2F9E6E]' : 'bg-red-100 text-[#D14343]'
                      }`}
                    >
                      {cat.type === 'income' ? <ArrowUpRight size={16} weight="bold" /> : <ArrowDownRight size={16} weight="bold" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{cat.name}</p>
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
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Hapus Kategori"
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