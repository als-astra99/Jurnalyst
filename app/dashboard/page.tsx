import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExpensePieChart, MonthlyBarChart } from './charts'
import AppNavbar from '@/components/AppNavbar'
import {
  TrendUp,
  TrendDown,
  Wallet,
  Plus,
  ArrowRight,
  ChartPie,
  ChartBar,
  Receipt,
  BookBookmark,
  Coins
} from '@phosphor-icons/react/dist/ssr'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, type, transaction_date, categories(name)')

  const trx = (transactions as any[]) || []

  const totalIncome = trx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = trx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = totalIncome - totalExpense

  // Breakdown pengeluaran per kategori (untuk pie chart)
  const expenseByCategory: Record<string, number> = {}
  trx.filter((t) => t.type === 'expense').forEach((t) => {
    const catName = t.categories?.name || 'Lainnya'
    expenseByCategory[catName] = (expenseByCategory[catName] || 0) + Number(t.amount)
  })
  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }))

  // Data per bulan (untuk bar chart) — 6 bulan terakhir
  const monthlyMap: Record<string, { income: number; expense: number }> = {}
  trx.forEach((t) => {
    const month = t.transaction_date.slice(0, 7)
    if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expense: 0 }
    if (t.type === 'income') monthlyMap[month].income += Number(t.amount)
    else monthlyMap[month].expense += Number(t.amount)
  })
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, val]) => ({ month, ...val }))

  const formatRupiah = (value: number) => 'Rp ' + value.toLocaleString('id-ID')

  return (
    <AppNavbar userEmail={user.email} userName={profile?.full_name}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* WELCOME HEADER */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-[#B8802E] block mb-1">
              Ringkasan Akun
            </span>
            <h1 className="font-serif-heading text-2xl md:text-3xl font-bold text-slate-900">
              Selamat Datang, {profile?.full_name || user.email}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Ringkasan arus kas, alokasi pengeluaran, dan posisi portofolio Anda.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <a
              href="/transactions"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1B2A4A] hover:bg-slate-900 text-white text-xs font-semibold transition-all shadow-xs"
            >
              <Plus size={16} weight="bold" />
              <span>Catat Transaksi</span>
            </a>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card Total Pemasukan */}
          <div className="stitched-card stripe-green p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Pemasukan
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#2F9E6E] flex items-center justify-center">
                <TrendUp size={18} weight="bold" />
              </div>
            </div>
            <div className="mt-4">
              <p className="font-serif-heading text-2xl md:text-3xl font-bold text-[#2F9E6E] font-number-mono">
                {formatRupiah(totalIncome)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Akumulasi seluruh pemasukan</p>
            </div>
          </div>

          {/* Card Total Pengeluaran */}
          <div className="stitched-card stripe-red p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Pengeluaran
              </span>
              <div className="w-8 h-8 rounded-lg bg-red-50 text-[#D14343] flex items-center justify-center">
                <TrendDown size={18} weight="bold" />
              </div>
            </div>
            <div className="mt-4">
              <p className="font-serif-heading text-2xl md:text-3xl font-bold text-[#D14343] font-number-mono">
                {formatRupiah(totalExpense)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Akumulasi seluruh pengeluaran</p>
            </div>
          </div>

          {/* Card Saldo Bersih */}
          <div className="stitched-card stripe-navy p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Saldo Bersih
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1B2A4A] flex items-center justify-center">
                <Wallet size={18} weight="bold" />
              </div>
            </div>
            <div className="mt-4">
              <p className={`font-serif-heading text-2xl md:text-3xl font-bold font-number-mono ${balance >= 0 ? 'text-slate-900' : 'text-[#D14343]'}`}>
                {formatRupiah(balance)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Selisih pemasukan & pengeluaran</p>
            </div>
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="stitched-card p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h2 className="font-serif-heading text-base font-bold text-slate-900 flex items-center gap-2">
                <ChartPie size={18} className="text-[#B8802E]" />
                <span>Pengeluaran per Kategori</span>
              </h2>
            </div>
            <ExpensePieChart data={pieData} />
          </div>

          <div className="stitched-card p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h2 className="font-serif-heading text-base font-bold text-slate-900 flex items-center gap-2">
                <ChartBar size={18} className="text-[#1B2A4A]" />
                <span>Arus Kas Bulanan</span>
              </h2>
            </div>
            <MonthlyBarChart data={monthlyData} />
          </div>
        </div>

        {/* MODULE CARDS */}
        <div className="p-6 bg-[#1B2A4A] text-white rounded-xl border border-slate-800 shadow-sm">
          <div className="mb-4">
            <span className="text-xs uppercase tracking-wider text-amber-300 font-semibold">
              Navigasi Cepat
            </span>
            <h2 className="font-serif-heading text-lg font-bold text-white mt-0.5">
              Kelola Keuangan & Investasi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <a
              href="/transactions"
              className="p-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-all block group"
            >
              <div className="flex items-center justify-between mb-2">
                <Receipt size={22} className="text-amber-300" />
                <ArrowRight size={14} className="text-amber-300 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-semibold text-white text-sm">Cash Flow</h3>
              <p className="text-xs text-slate-300 mt-1">
                Pencatatan transaksi harian per dompet dan kategori.
              </p>
            </a>

            <a
              href="/portfolio"
              className="p-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-all block group"
            >
              <div className="flex items-center justify-between mb-2">
                <Coins size={22} className="text-emerald-400" />
                <ArrowRight size={14} className="text-amber-300 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-semibold text-white text-sm">Portfolio Tracker</h3>
              <p className="text-xs text-slate-300 mt-1">
                Pemantauan posisi aset saham & kripto real-time.
              </p>
            </a>

            <a
              href="/journal"
              className="p-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-all block group"
            >
              <div className="flex items-center justify-between mb-2">
                <BookBookmark size={22} className="text-blue-300" />
                <ArrowRight size={14} className="text-amber-300 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-semibold text-white text-sm">Investment Journal</h3>
              <p className="text-xs text-slate-300 mt-1">
                Jurnal evaluasi trading, target price, dan win rate.
              </p>
            </a>
          </div>
        </div>

      </div>
    </AppNavbar>
  )
}