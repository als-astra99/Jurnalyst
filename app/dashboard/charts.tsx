'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

type CategoryBreakdown = { name: string; value: number }
type MonthlyData = { month: string; income: number; expense: number }

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6']

export function ExpensePieChart({ data }: { data: CategoryBreakdown[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500">Belum ada data pengeluaran.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={(entry) => entry.name}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => 'Rp ' + Number(value).toLocaleString('id-ID')} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function MonthlyBarChart({ data }: { data: MonthlyData[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500">Belum ada data transaksi.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(v) => `${v / 1000}k`} />
        <Tooltip formatter={(value) => 'Rp ' + Number(value).toLocaleString('id-ID')} />
        <Legend />
        <Bar dataKey="income" name="Pemasukan" fill="#10b981" />
        <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  )
}