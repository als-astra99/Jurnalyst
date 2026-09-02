import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExpensePieChart, MonthlyBarChart } from './charts'
import AppNavbar from '@/components/AppNavbar'
import DashboardClient from './DashboardClient'
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
  Coins,
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

  const totalIncome  = trx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = trx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = totalIncome - totalExpense

  // Pie chart data
  const expenseByCategory: Record<string, number> = {}
  trx.filter((t) => t.type === 'expense').forEach((t) => {
    const cat = t.categories?.name || 'Lainnya'
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(t.amount)
  })
  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }))

  // Bar chart data — last 6 months
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

  return (
    <AppNavbar userEmail={user.email} userName={profile?.full_name}>
      <DashboardClient
        userName={profile?.full_name || user.email || ''}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        balance={balance}
        pieData={pieData}
        monthlyData={monthlyData}
      />
    </AppNavbar>
  )
}
