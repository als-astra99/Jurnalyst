'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppNavbar from '@/components/AppNavbar'
import SelectInput from '@/components/ui/SelectInput'
import AnimatedContent from '@/components/reactbits/AnimatedContent'
import FadeContent from '@/components/reactbits/FadeContent'
import {
  Printer,
  FileXls,
  FileDoc,
  Plus,
  Trash,
  Receipt,
  CalendarBlank,
  ArrowUpRight,
  ArrowDownRight,
  CaretLeft,
  CaretRight,
  Warning
} from '@phosphor-icons/react'

type Account = { id: string; name: string }
type Category = { id: string; name: string; type: string }
type Transaction = {
  id: string
  amount: number
  type: string
  note: string
  transaction_date: string
  accounts: { name: string } | null
  categories: { name: string } | null
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function formatTanggalLengkap(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

function formatRupiah(v: number) {
  return 'Rp ' + v.toLocaleString('id-ID')
}

function getWeekRange(anchor: Date) {
  const d = new Date(anchor)
  const day = d.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { monday, sunday }
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])

  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exportingWord, setExportingWord] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)

  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [weekAnchor, setWeekAnchor] = useState(new Date())

  const supabase = createClient()

  const loadData = async () => {
    const { data: acc } = await supabase.from('accounts').select('id, name')
    const { data: cat } = await supabase.from('categories').select('id, name, type')
    const { data: trx } = await supabase
      .from('transactions')
      .select('id, amount, type, note, transaction_date, accounts(name), categories(name)')
      .order('transaction_date', { ascending: true })

    setAccounts(acc || [])
    setCategories(cat || [])
    setAllTransactions((trx as any) || [])
  }

  useEffect(() => { loadData() }, [])

  const filteredCategories = categories.filter((c) => c.type === type)

  const { periodLabel, filteredTransactions } = useMemo(() => {
    if (viewMode === 'month') {
      const [y, m] = selectedMonth.split('-')
      const label = `${BULAN[parseInt(m) - 1]} ${y}`
      const filtered = allTransactions.filter((t) => t.transaction_date.startsWith(selectedMonth))
      return { periodLabel: label, filteredTransactions: filtered }
    } else {
      const { monday, sunday } = getWeekRange(weekAnchor)
      const startStr = toDateStr(monday)
      const endStr = toDateStr(sunday)
      const label = `${monday.getDate()} ${BULAN[monday.getMonth()]} - ${sunday.getDate()} ${BULAN[sunday.getMonth()]} ${sunday.getFullYear()}`
      const filtered = allTransactions.filter((t) => t.transaction_date >= startStr && t.transaction_date <= endStr)
      return { periodLabel: label, filteredTransactions: filtered }
    }
  }, [viewMode, selectedMonth, weekAnchor, allTransactions])

  const groupedByDate = useMemo(() => {
    const map: Record<string, { income: number; expense: number; items: Transaction[] }> = {}
    for (const t of filteredTransactions) {
      if (!map[t.transaction_date]) map[t.transaction_date] = { income: 0, expense: 0, items: [] }
      if (t.type === 'income') map[t.transaction_date].income += Number(t.amount)
      else map[t.transaction_date].expense += Number(t.amount)
      map[t.transaction_date].items.push(t)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredTransactions])

  const totalIncome = filteredTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = filteredTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      account_id: accountId,
      category_id: categoryId,
      amount: parseFloat(amount),
      type,
      note,
      transaction_date: date,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setAmount('')
    setNote('')
    setLoading(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id)
    loadData()
  }

  const handlePrint = () => window.print()

  const handleExportExcel = async () => {
    setExportingExcel(true)
    try {
      const res = await fetch('/api/reports/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodLabel,
          groups: groupedByDate.map(([tgl, g]) => ({
            date: tgl,
            items: g.items.map((t) => ({
              kategori: t.categories?.name || '-',
              dompet: t.accounts?.name || '-',
              jenis: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
              catatan: t.note || '',
              jumlah: t.amount,
            })),
          })),
          totalIncome,
          totalExpense,
        }),
      })

      if (!res.ok) throw new Error('Gagal membuat file Excel')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Riwayat-Transaksi-${periodLabel.replace(/\s+/g, '-')}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Gagal export Excel: ' + (err as Error).message)
    }
    setExportingExcel(false)
  }

  const handleExportWord = async () => {
    setExportingWord(true)
    try {
      const res = await fetch('/api/reports/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodLabel,
          groups: groupedByDate.map(([tgl, g]) => ({
            date: tgl,
            dayLabel: formatTanggalLengkap(tgl),
            items: g.items.map((t) => ({
              kategori: t.categories?.name || '-',
              dompet: t.accounts?.name || '-',
              jenis: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
              catatan: t.note || '',
              jumlah: t.amount,
            })),
          })),
          totalIncome,
          totalExpense,
        }),
      })

      if (!res.ok) throw new Error('Gagal membuat file Word')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Riwayat-Transaksi-${periodLabel.replace(/\s+/g, '-')}.docx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Gagal export Word: ' + (err as Error).message)
    }
    setExportingWord(false)
  }

  return (
    <AppNavbar>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 print:p-0">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <AnimatedContent distance={28} duration={0.6} threshold={0.05} className="print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="page-header-eyebrow mb-1">Pencatatan</p>
              <h1 className="font-serif-heading text-2xl md:text-[1.85rem] font-bold leading-tight" style={{ color: '#1A1F2E' }}>
                Riwayat Transaksi
              </h1>
              <p className="text-sm mt-1.5" style={{ color: '#64748B' }}>
                Catatan rinci pemasukan dan pengeluaran harian.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button onClick={handlePrint} className="btn-ghost">
                <Printer size={15} />
                <span>Cetak</span>
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exportingExcel}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[#2F9E6E] hover:bg-emerald-100 text-xs font-semibold transition-all disabled:opacity-50 hover:-translate-y-px"
              >
                <FileXls size={15} />
                <span>{exportingExcel ? 'Memuat...' : 'Excel'}</span>
              </button>
              <button
                onClick={handleExportWord}
                disabled={exportingWord}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-[#1B2A4A] hover:bg-blue-100 text-xs font-semibold transition-all disabled:opacity-50 hover:-translate-y-px"
              >
                <FileDoc size={15} />
                <span>{exportingWord ? 'Memuat...' : 'Word'}</span>
              </button>
            </div>
          </div>
        </AnimatedContent>

        {/* ── INPUT FORM ─────────────────────────────────────── */}
        <AnimatedContent distance={28} duration={0.65} delay={0.06} threshold={0.05} className="print:hidden">
          <div className="stitched-card p-6 rounded-2xl">
            <h2 className="font-serif-heading text-sm font-bold mb-4 flex items-center gap-2.5 pb-3"
                style={{ color: '#1A1F2E', borderBottom: '1px solid #F0EDE5' }}>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #C8D8F0, #A8C0E5)', color: '#0F1E36' }}
              >
                <Plus size={14} weight="bold" />
              </div>
              <span>Tambah Transaksi Baru</span>
            </h2>

            {accounts.length === 0 || categories.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <Warning size={18} className="shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Tambahkan minimal 1 dompet dan 1 kategori terlebih dahulu di menu{' '}
                  <a href="/accounts" className="underline font-semibold">Kelola Dompet</a> atau{' '}
                  <a href="/categories" className="underline font-semibold">Kelola Kategori</a>.
                </span>
              </div>
            ) : (
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <SelectInput
                    label="Jenis Transaksi"
                    value={type}
                    onChange={setType}
                    options={[
                      { value: 'expense', label: 'Pengeluaran (-)', sublabel: 'Uang keluar' },
                      { value: 'income',  label: 'Pemasukan (+)',   sublabel: 'Uang masuk' },
                    ]}
                  />

                  <SelectInput
                    label="Dompet"
                    required
                    value={accountId}
                    onChange={setAccountId}
                    placeholder="Pilih Dompet"
                    options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                  />

                  <SelectInput
                    label="Kategori"
                    required
                    value={categoryId}
                    onChange={setCategoryId}
                    placeholder="Pilih Kategori"
                    options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))}
                  />

                  <div>
                    <label className="form-label">Jumlah (Rp)</label>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="50000"
                      className="form-input font-number-mono"
                    />
                  </div>

                  <div>
                    <label className="form-label">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="form-input date-input-premium"
                    />
                  </div>

                  <div>
                    <label className="form-label">Catatan (opsional)</label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Contoh: Makan siang"
                      className="form-input"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-[#D14343] font-medium bg-red-50 p-2.5 rounded-lg border border-red-200 animate-fade-in">
                    {error}
                  </p>
                )}

                <div className="pt-1 flex justify-end">
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </AnimatedContent>

        {/* ── FILTER BAR ─────────────────────────────────────── */}
        <FadeContent duration={500} delay={200} threshold={0.05} className="print:hidden">
          <div
            className="rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
            style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', boxShadow: '0 1px 4px rgba(26,31,46,0.04)' }}
          >
            <div className="inline-flex p-1 rounded-lg" style={{ background: '#F5F2EB' }}>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'month'
                    ? 'bg-white shadow-sm'
                    : 'hover:text-slate-900'
                }`}
                style={viewMode === 'month'
                  ? { color: '#0F1E36', border: '1px solid #E8E4DC' }
                  : { color: '#64748B' }
                }
              >
                Bulanan
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'week'
                    ? 'bg-white shadow-sm'
                    : 'hover:text-slate-900'
                }`}
                style={viewMode === 'week'
                  ? { color: '#0F1E36', border: '1px solid #E8E4DC' }
                  : { color: '#64748B' }
                }
              >
                Mingguan
              </button>
            </div>

          <div className="flex items-center gap-2">
            {viewMode === 'month' ? (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="date-input-premium"
              />
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const prev = new Date(weekAnchor)
                    prev.setDate(prev.getDate() - 7)
                    setWeekAnchor(prev)
                  }}
                  className="p-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                >
                  <CaretLeft size={14} />
                  <span>Sebelumnya</span>
                </button>
                <button
                  onClick={() => setWeekAnchor(new Date())}
                  className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Minggu Ini
                </button>
                <button
                  onClick={() => {
                    const next = new Date(weekAnchor)
                    next.setDate(next.getDate() + 7)
                    setWeekAnchor(next)
                  }}
                  className="p-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                >
                  <span>Selanjutnya</span>
                  <CaretRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
        </FadeContent>

        {/* ── TRANSACTIONS LIST ──────────────────────────────── */}
        <AnimatedContent distance={24} duration={0.65} delay={0.1} threshold={0.05} className="print:hidden">
          <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', boxShadow: '0 1px 4px rgba(26,31,46,0.04)' }}>
            <div
              className="px-5 py-3.5 flex items-center justify-between"
              style={{ background: 'linear-gradient(to right, #FAFAF7, #F5F2EB)', borderBottom: '1px solid #EDE9E0' }}
            >
              <h2 className="font-serif-heading font-bold text-sm" style={{ color: '#1A1F2E' }}>
                Periode —{' '}
                <span style={{ color: '#C9973A' }}>{periodLabel}</span>
              </h2>
              <span
                className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', color: '#64748B' }}
              >
                {filteredTransactions.length} Transaksi
              </span>
            </div>

            {groupedByDate.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                  <Receipt size={28} />
                </div>
                <p className="font-serif-heading text-base font-bold text-slate-700">
                  Belum Ada Transaksi
                </p>
                <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                  Tidak ada data pencatatan pada periode ini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {groupedByDate.map(([tgl, group]) => (
                  <div key={tgl} className="p-4 sm:p-5 hover:bg-slate-50/40 transition-colors">
                    {/* Date header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 mb-3 gap-1.5">
                      <span className="font-serif-heading font-bold text-xs text-slate-800 flex items-center gap-2">
                        <CalendarBlank size={13} className="text-[#1B2A4A]" />
                        <span>{formatTanggalLengkap(tgl)}</span>
                      </span>
                      <div className="flex items-center gap-3 text-[11px] font-number-mono">
                        {group.income > 0 && (
                          <span className="badge-income">
                            +{formatRupiah(group.income)}
                          </span>
                        )}
                        {group.expense > 0 && (
                          <span className="badge-expense">
                            -{formatRupiah(group.expense)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Transaction rows */}
                    <div className="space-y-1.5">
                      {group.items.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:border-slate-200 hover:bg-white transition-all duration-150"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                t.type === 'income'
                                  ? 'bg-emerald-100 text-[#2F9E6E]'
                                  : 'bg-red-100 text-[#D14343]'
                              }`}
                            >
                              {t.type === 'income'
                                ? <ArrowUpRight size={15} weight="bold" />
                                : <ArrowDownRight size={15} weight="bold" />
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {t.categories?.name || 'Tanpa Kategori'}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                <span className="font-medium text-slate-600">{t.accounts?.name || '-'}</span>
                                {t.note && <span> · {t.note}</span>}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={`text-xs font-bold font-number-mono ${
                                t.type === 'income' ? 'text-[#2F9E6E]' : 'text-[#D14343]'
                              }`}
                            >
                              {t.type === 'income' ? '+' : '-'}&nbsp;{formatRupiah(t.amount)}
                            </span>
                            <button
                              onClick={() => handleDelete(t.id)}
                              title="Hapus"
                              className="text-slate-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-all"
                            >
                              <Trash size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Total footer */}
                <div
                  className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  style={{
                    background: 'linear-gradient(135deg, #0F1E36 0%, #162848 60%, #1A2F54 100%)',
                    borderTop: '1px solid rgba(201,151,58,0.15)',
                  }}
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'rgba(201,151,58,0.8)' }}>
                      Total Periode
                    </p>
                    <p className="font-serif-heading text-sm font-bold text-white mt-0.5">{periodLabel}</p>
                  </div>
                  <div className="flex items-center gap-6 text-xs font-number-mono">
                    <div>
                      <span className="text-[10px] block mb-0.5" style={{ color: 'rgba(148,163,184,0.65)' }}>Pemasukan</span>
                      <span className="font-bold" style={{ color: '#4ADE80' }}>+{formatRupiah(totalIncome)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block mb-0.5" style={{ color: 'rgba(148,163,184,0.65)' }}>Pengeluaran</span>
                      <span className="font-bold" style={{ color: '#F87171' }}>-{formatRupiah(totalExpense)}</span>
                    </div>
                    <div className="pl-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.12)' }}>
                      <span className="text-[10px] block mb-0.5" style={{ color: 'rgba(148,163,184,0.65)' }}>Net</span>
                      <span
                        className="font-bold"
                        style={{ color: totalIncome - totalExpense >= 0 ? '#FFFFFF' : '#F87171' }}
                      >
                        {formatRupiah(totalIncome - totalExpense)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AnimatedContent>

        {/* PRINT TABLE */}
        <div className="hidden print:block space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Riwayat Transaksi — {periodLabel}</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1.5 text-left">Tanggal</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left">Kategori</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left">Dompet</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left">Jenis</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left">Catatan</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {groupedByDate.flatMap(([tgl, group]) =>
                group.items.map((t) => (
                  <tr key={t.id}>
                    <td className="border border-gray-300 px-2 py-1.5">{formatTanggalLengkap(tgl)}</td>
                    <td className="border border-gray-300 px-2 py-1.5">{t.categories?.name}</td>
                    <td className="border border-gray-300 px-2 py-1.5">{t.accounts?.name}</td>
                    <td className="border border-gray-300 px-2 py-1.5">{t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td>
                    <td className="border border-gray-300 px-2 py-1.5">{t.note || '-'}</td>
                    <td className={`border border-gray-300 px-2 py-1.5 text-right font-semibold ${t.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                      {t.type === 'income' ? '+' : '-'} {formatRupiah(t.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td colSpan={5} className="border border-gray-300 px-2 py-1.5 text-right">Total Pemasukan</td>
                <td className="border border-gray-300 px-2 py-1.5 text-right text-green-700">{formatRupiah(totalIncome)}</td>
              </tr>
              <tr className="bg-gray-50 font-bold">
                <td colSpan={5} className="border border-gray-300 px-2 py-1.5 text-right">Total Pengeluaran</td>
                <td className="border border-gray-300 px-2 py-1.5 text-right text-red-700">{formatRupiah(totalExpense)}</td>
              </tr>
              <tr className="bg-gray-100 font-bold">
                <td colSpan={5} className="border border-gray-300 px-2 py-1.5 text-right">Saldo</td>
                <td className="border border-gray-300 px-2 py-1.5 text-right">{formatRupiah(totalIncome - totalExpense)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>
    </AppNavbar>
  )
}