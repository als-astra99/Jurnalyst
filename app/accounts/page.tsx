'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppNavbar from '@/components/AppNavbar'
import { Wallet, Plus, Trash, Bank, CreditCard, Money } from '@phosphor-icons/react'

type Account = {
  id: string
  name: string
  type: string
  balance: number
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [name, setName] = useState('')
  const [type, setType] = useState('bank')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const loadAccounts = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false })
    setAccounts(data || [])
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('accounts').insert({
      user_id: user.id,
      name,
      type,
      balance: 0,
    })

    if (error) {
      alert('Gagal menyimpan: ' + error.message)
      setLoading(false)
      return
    }

    setName('')
    setLoading(false)
    loadAccounts()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('accounts').delete().eq('id', id)
    loadAccounts()
  }

  const getTypeBadge = (t: string) => {
    switch (t) {
      case 'bank': return 'bg-blue-50 text-[#1B2A4A] border-blue-200'
      case 'e-wallet': return 'bg-purple-50 text-purple-700 border-purple-200'
      default: return 'bg-emerald-50 text-[#2F9E6E] border-emerald-200'
    }
  }

  const getAccountIcon = (t: string) => {
    switch (t) {
      case 'bank': return <Bank size={18} />
      case 'e-wallet': return <CreditCard size={18} />
      default: return <Money size={18} />
    }
  }

  return (
    <AppNavbar>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-serif-heading text-2xl md:text-3xl font-bold text-slate-900">
            Kelola Dompet & Rekening
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftar sumber dana pemasukan dan pengeluaran Anda (Bank, E-Wallet, Tunai).
          </p>
        </div>

        {/* ADD ACCOUNT FORM */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <h2 className="font-serif-heading text-base font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus size={18} className="text-[#1B2A4A]" />
            <span>Tambah Dompet Baru</span>
          </h2>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Nama Dompet / Rekening
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: BCA Utama, Tunai, GoPay"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Jenis Dompet
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                >
                  <option value="bank">Bank (BCA, Mandiri, dll)</option>
                  <option value="e-wallet">E-Wallet (GoPay, OVO, ShopeePay)</option>
                  <option value="cash">Tunai (Cash / Dompet Fisik)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-[#1B2A4A] hover:bg-slate-900 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Tambah Dompet'}
              </button>
            </div>
          </form>
        </div>

        {/* ACCOUNTS LIST */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 p-4 bg-slate-50/60 flex items-center justify-between">
            <h2 className="font-serif-heading font-bold text-slate-900 text-sm">
              Daftar Dompet Terdaftar
            </h2>
            <span className="text-xs text-slate-500 font-medium">{accounts.length} Dompet</span>
          </div>

          {accounts.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Wallet size={36} className="text-slate-400 mb-2" />
              <p className="font-serif-heading text-base font-bold text-slate-800">
                Belum ada dompet ditambahkan
              </p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Tambahkan akun bank, dompet digital, atau tunai Anda di atas.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{acc.name}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border mt-0.5 ${getTypeBadge(acc.type)}`}>
                        {acc.type === 'bank' ? 'Bank' : acc.type === 'e-wallet' ? 'E-Wallet' : 'Tunai'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Hapus Dompet"
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