import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExpensePieChart, MonthlyBarChart } from './charts'

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
    const month = t.transaction_date.slice(0, 7) // format: YYYY-MM
    if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expense: 0 }
    if (t.type === 'income') monthlyMap[month].income += Number(t.amount)
    else monthlyMap[month].expense += Number(t.amount)
  })
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, val]) => ({ month, ...val }))

  const formatRupiah = (value: number) => 'Rp ' + value.toLocaleString('id-ID')

  const handleLogout = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Selamat datang, {profile?.full_name || user.email}
            </h1>
            <p className="text-gray-600">Dashboard Jurnalyst</p>
            <div className="mt-2 flex gap-4">
              <a href="/accounts" className="text-sm text-blue-600 hover:underline">Kelola Dompet</a>
              <a href="/categories" className="text-sm text-blue-600 hover:underline">Kelola Kategori</a>
              <a href="/transactions" className="text-sm text-blue-600 hover:underline">Transaksi</a>
             <a href="/assets" className="text-sm text-blue-600 hover:underline">Aset</a>
             <a href="/portfolio" className="text-sm text-blue-600 hover:underline">Portfolio</a>
             <a href="/journal" className="text-sm text-blue-600 hover:underline">Journal</a>
            </div>
          </div>
          <form action={handleLogout}>
            <button type="submit" className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">
              Keluar
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-500">Total Pemasukan</p>
            <p className="mt-2 text-2xl font-bold text-green-600">{formatRupiah(totalIncome)}</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-500">Total Pengeluaran</p>
            <p className="mt-2 text-2xl font-bold text-red-600">{formatRupiah(totalExpense)}</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-500">Saldo</p>
            <p className={`mt-2 text-2xl font-bold ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {formatRupiah(balance)}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 font-semibold text-gray-900">Pengeluaran per Kategori</h2>
            <ExpensePieChart data={pieData} />
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 font-semibold text-gray-900">Arus Kas Bulanan</h2>
            <MonthlyBarChart data={monthlyData} />
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <a href="/transactions" className="text-blue-600 hover:underline">
            Lihat & tambah transaksi →
          </a>
        </div>
      </div>
    </div>
  )
}