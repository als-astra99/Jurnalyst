'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppNavbar from '@/components/AppNavbar'
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
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="font-serif-heading text-2xl md:text-3xl font-bold text-slate-900">
              Riwayat Transaksi
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Catatan rinci pemasukan dan pengeluaran harian.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all"
            >
              <Printer size={16} />
              <span>Cetak</span>
            </button>
            <button
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[#2F9E6E] hover:bg-emerald-100 text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
            >
              <FileXls size={16} />
              <span>{exportingExcel ? 'Memuat...' : 'Export Excel'}</span>
            </button>
            <button
              onClick={handleExportWord}
              disabled={exportingWord}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-[#1B2A4A] hover:bg-blue-100 text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
            >
              <FileDoc size={16} />
              <span>{exportingWord ? 'Memuat...' : 'Export Word'}</span>
            </button>
          </div>
        </div>

        {/* INPUT FORM */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs print:hidden">
          <h2 className="font-serif-heading text-base font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus size={18} className="text-[#1B2A4A]" />
            <span>Tambah Transaksi Baru</span>
          </h2>

          {accounts.length === 0 || categories.length === 0 ? (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
              <Warning size={20} className="shrink-0 text-amber-700" />
              <span>
                Tambahkan minimal 1 dompet dan 1 kategori terlebih dahulu di menu{' '}
                <a href="/accounts" className="underline font-semibold">Kelola Dompet</a> atau{' '}
                <a href="/categories" className="underline font-semibold">Kelola Kategori</a>.
              </span>
            </div>
          ) : (
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Jenis Transaksi
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

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Dompet
                  </label>
                  <select
                    required
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                  >
                    <option value="">Pilih Dompet</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Kategori
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                  >
                    <option value="">Pilih Kategori</option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Jumlah (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="50000"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-number-mono focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Catatan (opsional)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Contoh: Makan siang"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-[#1B2A4A] focus:outline-none"
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
                  {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* FILTER BAR */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
          <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-[#1B2A4A] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-[#1B2A4A] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
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
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white"
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

        {/* TRANSACTIONS LIST */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden print:hidden">
          <div className="border-b border-slate-100 p-4 bg-slate-50/60 flex items-center justify-between">
            <h2 className="font-serif-heading font-bold text-slate-900 text-sm">
              Periode — <span className="text-[#B8802E]">{periodLabel}</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {filteredTransactions.length} Transaksi
            </span>
          </div>

          {groupedByDate.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Receipt size={36} className="text-slate-400 mb-2" />
              <p className="font-serif-heading text-base font-bold text-slate-800">
                Belum Ada Transaksi
              </p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Tidak ada data pencatatan transaksi pada periode ini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {groupedByDate.map(([tgl, group]) => (
                <div key={tgl} className="p-4 sm:p-5 hover:bg-slate-50/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 gap-1">
                    <span className="font-serif-heading font-bold text-xs text-slate-800 flex items-center gap-2">
                      <CalendarBlank size={14} className="text-[#1B2A4A]" />
                      <span>{formatTanggalLengkap(tgl)}</span>
                    </span>

                    <div className="flex items-center gap-3 text-xs font-number-mono">
                      {group.income > 0 && (
                        <span className="text-[#2F9E6E] font-medium">
                          Pemasukan: +{formatRupiah(group.income)}
                        </span>
                      )}
                      {group.expense > 0 && (
                        <span className="text-[#D14343] font-medium">
                          Pengeluaran: -{formatRupiah(group.expense)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {group.items.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              t.type === 'income'
                                ? 'bg-emerald-100 text-[#2F9E6E]'
                                : 'bg-red-100 text-[#D14343]'
                            }`}
                          >
                            {t.type === 'income' ? <ArrowUpRight size={16} weight="bold" /> : <ArrowDownRight size={16} weight="bold" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {t.categories?.name || 'Tanpa Kategori'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                              <span className="font-medium text-slate-700">{t.accounts?.name || '-'}</span>
                              {t.note && <span>• {t.note}</span>}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`text-xs font-bold font-number-mono ${
                              t.type === 'income' ? 'text-[#2F9E6E]' : 'text-[#D14343]'
                            }`}
                          >
                            {t.type === 'income' ? '+' : '-'} {formatRupiah(t.amount)}
                          </span>

                          <button
                            onClick={() => handleDelete(t.id)}
                            title="Hapus Transaksi"
                            className="text-slate-400 hover:text-red-500 p-1 text-xs transition-colors"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* TOTAL FOOTER */}
              <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-300 font-semibold">
                    Total Periode
                  </p>
                  <p className="font-serif-heading text-sm font-bold text-white">
                    {periodLabel}
                  </p>
                </div>

                <div className="flex items-center gap-5 text-xs font-number-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Pemasukan</span>
                    <span className="font-bold text-[#2F9E6E]">+{formatRupiah(totalIncome)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Pengeluaran</span>
                    <span className="font-bold text-[#D14343]">-{formatRupiah(totalExpense)}</span>
                  </div>
                  <div className="pl-3 border-l border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Net</span>
                    <span className={`font-bold ${totalIncome - totalExpense >= 0 ? 'text-white' : 'text-[#D14343]'}`}>
                      {formatRupiah(totalIncome - totalExpense)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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