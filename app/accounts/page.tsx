'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppNavbar from '@/components/AppNavbar'
import AnimatedContent from '@/components/reactbits/AnimatedContent'
import FadeContent from '@/components/reactbits/FadeContent'
import SelectInput from '@/components/ui/SelectInput'
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
    // Cek apakah dompet masih digunakan oleh transaksi
    const { data: usedBy } = await supabase
      .from('transactions')
      .select('id')
      .eq('account_id', id)
      .limit(1)

    if (usedBy && usedBy.length > 0) {
      alert('Dompet tidak bisa dihapus karena masih memiliki riwayat transaksi.\n\nHapus semua transaksi yang menggunakan dompet ini terlebih dahulu.')
      return
    }

    const { error } = await supabase.from('accounts').delete().eq('id', id)
    if (error) {
      alert('Gagal menghapus dompet: ' + error.message)
      return
    }
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
        <AnimatedContent distance={28} duration={0.6} threshold={0.05}>
          <div>
            <p className="page-header-eyebrow mb-1.5">Data Master</p>
            <h1 className="font-serif-heading text-2xl md:text-[1.85rem] font-bold leading-tight" style={{ color: '#1A1F2E' }}>
              Kelola Dompet & Rekening
            </h1>
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: '#64748B' }}>
              Daftar sumber dana pemasukan dan pengeluaran Anda (Bank, E-Wallet, Tunai).
            </p>
          </div>
        </AnimatedContent>

        {/* ADD ACCOUNT FORM */}
        <AnimatedContent distance={28} duration={0.65} delay={0.06} threshold={0.05}>
          <div className="stitched-card p-6 rounded-2xl">
            <h2 className="font-serif-heading text-sm font-bold mb-4 flex items-center gap-2.5 pb-3"
                style={{ color: '#1A1F2E', borderBottom: '1px solid #F0EDE5' }}>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #C8D8F0, #A8C0E5)', color: '#0F1E36' }}
              >
                <Plus size={14} weight="bold" />
              </div>
              <span>Tambah Dompet Baru</span>
            </h2>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Nama Dompet / Rekening</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: BCA Utama, Tunai, GoPay"
                  className="form-input"
                />
              </div>

              <SelectInput
                label="Jenis Dompet"
                value={type}
                onChange={setType}
                options={[
                  { value: 'bank',     label: 'Bank',     sublabel: 'BCA, Mandiri, BNI, dll' },
                  { value: 'e-wallet', label: 'E-Wallet', sublabel: 'GoPay, OVO, ShopeePay' },
                  { value: 'cash',     label: 'Tunai',    sublabel: 'Cash / Dompet Fisik' },
                ]}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Menyimpan...' : 'Tambah Dompet'}
              </button>
            </div>
          </form>
        </div>
        </AnimatedContent>

        {/* ACCOUNTS LIST */}
        <FadeContent duration={500} delay={150} threshold={0.05}>
          <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', boxShadow: '0 1px 4px rgba(26,31,46,0.04)' }}>
            <div
              className="p-4 flex items-center justify-between"
              style={{ background: 'linear-gradient(to right, #FAFAF7, #F5F2EB)', borderBottom: '1px solid #EDE9E0' }}
            >
              <h2 className="font-serif-heading font-bold text-sm" style={{ color: '#1A1F2E' }}>
                Daftar Dompet Terdaftar
              </h2>
              <span
                className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', color: '#64748B' }}
              >
                {accounts.length} Dompet
              </span>
            </div>

            {accounts.length === 0 ? (
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
                  style={{ background: 'linear-gradient(135deg, #C8D8F0, #A8C0E5)' }}
                >
                  <Wallet size={28} style={{ color: '#0F1E36' }} />
                </div>
                <p className="font-serif-heading text-sm font-bold" style={{ color: '#1A1F2E' }}>
                  Belum ada dompet ditambahkan
                </p>
                <p className="text-[11px] mt-1 max-w-sm leading-relaxed" style={{ color: '#94A3B8' }}>
                  Tambahkan akun bank, dompet digital, atau tunai Anda di atas.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {accounts.map((acc, idx) => (
                  <AnimatedContent
                    key={acc.id}
                    distance={18}
                    duration={0.4}
                    delay={idx * 0.03}
                    threshold={0.01}
                  >
                    <div className="flex items-center justify-between p-4 hover:bg-slate-50/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(100, 116, 139, 0.1)', color: '#475569' }}
                        >
                          {getAccountIcon(acc.type)}
                        </div>
                        <div>
                          <p className="font-bold text-xs" style={{ color: '#1A1F2E' }}>{acc.name}</p>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase border mt-0.5 ${getTypeBadge(acc.type)}`}>
                            {acc.type === 'bank' ? 'Bank' : acc.type === 'e-wallet' ? 'E-Wallet' : 'Tunai'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(acc.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        title="Hapus Dompet"
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