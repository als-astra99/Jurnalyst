'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { ChartPie, ChartBar } from '@phosphor-icons/react'

type CategoryBreakdown = { name: string; value: number }
type MonthlyData = { month: string; income: number; expense: number }

const LEDGER_COLORS = ['#B8802E', '#2F9E6E', '#D14343', '#1B2A4A', '#7C3AED', '#2563EB', '#059669', '#D97706']

export function ExpensePieChart({ data }: { data: CategoryBreakdown[] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <ChartPie size={32} className="text-slate-400 mb-2" />
        <p className="text-xs font-semibold text-slate-600">Belum ada data pengeluaran</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Pengeluaran berdasarkan kategori akan tampil di sini</p>
      </div>
    )
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
          innerRadius={50}
          outerRadius={85}
          paddingAngle={3}
          label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={LEDGER_COLORS[index % LEDGER_COLORS.length]} stroke="#fff" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => 'Rp ' + Number(value).toLocaleString('id-ID')} />
        <Legend wrapperStyle={{ paddingTop: '10px' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function MonthlyBarChart({ data }: { data: MonthlyData[] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <ChartBar size={32} className="text-slate-400 mb-2" />
        <p className="text-xs font-semibold text-slate-600">Belum ada data transaksi</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Grafik perbandingan arus kas akan muncul di sini</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} />
        <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="#64748B" fontSize={12} tickLine={false} />
        <Tooltip formatter={(value) => 'Rp ' + Number(value).toLocaleString('id-ID')} />
        <Legend wrapperStyle={{ paddingTop: '10px' }} />
        <Bar dataKey="income" name="Pemasukan" fill="#2F9E6E" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Pengeluaran" fill="#D14343" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}