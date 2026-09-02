'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { ChartPie, ChartBar } from '@phosphor-icons/react'

type CategoryBreakdown = { name: string; value: number }
type MonthlyData      = { month: string; income: number; expense: number }

const PALETTE = [
  '#C9973A', '#1A7A54', '#C0392B', '#162848',
  '#7C3AED', '#0E7490', '#B45309', '#2563EB',
]

const fmt = (v: number) => 'Rp ' + v.toLocaleString('id-ID')

const fmtMonth = (raw: string) => {
  const parts = raw.split('-')
  if (parts.length < 2) return raw
  const NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
  return `${NAMES[parseInt(parts[1]) - 1] ?? parts[1]} '${parts[0].slice(2)}`
}

// ── Tooltips (typed as any — Recharts v3 generics) ─────────
const PieTooltip = (props: any) => {
  const { active, payload } = props
  if (!active || !payload?.length) return null
  const p = payload[0]
  const color: string = p?.payload?.fill?.startsWith('url')
    ? PALETTE[p?.payload?.index ?? 0] ?? PALETTE[0]
    : (p?.payload?.fill ?? PALETTE[0])
  return (
    <div style={{
      background: 'rgba(255,255,255,0.97)',
      border: '1px solid #E8E4DC',
      borderRadius: '0.75rem',
      padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(26,31,46,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: PALETTE[payload[0]?.payload?._index ?? 0] ?? PALETTE[0], flexShrink: 0, display: 'inline-block' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1A1F2E' }}>{p.name}</span>
      </div>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#C9973A', margin: 0 }}>{fmt(Number(p.value))}</p>
    </div>
  )
}

const BarTooltip = (props: any) => {
  const { active, payload, label } = props
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(255,255,255,0.97)',
      border: '1px solid #E8E4DC',
      borderRadius: '0.75rem',
      padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(26,31,46,0.12)',
      minWidth: 160,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 8 }}>
        {String(label)}
      </p>
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: entry.color, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#64748B' }}>{entry.name}</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: entry.color }}>{fmt(Number(entry.value))}</span>
        </div>
      ))}
    </div>
  )
}

// ── Legends ────────────────────────────────────────────────
const PieLegend = (props: any) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 14px', paddingTop: 10 }}>
    {(props?.payload ?? []).map((e: any, i: number) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#4A5568' }}>{e.value}</span>
      </div>
    ))}
  </div>
)

const BarLegend = (props: any) => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: 20, paddingTop: 10 }}>
    {(props?.payload ?? []).map((e: any, i: number) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: e.color, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#4A5568' }}>{e.value}</span>
      </div>
    ))}
  </div>
)

// ── Custom Pie Label ───────────────────────────────────────
const PieLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, name, percent } = props
  const RAD = Math.PI / 180
  const r = outerRadius + 24
  const x: number = cx + r * Math.cos(-midAngle * RAD)
  const y: number = cy + r * Math.sin(-midAngle * RAD)
  const pct = ((percent ?? 0) * 100).toFixed(0)
  if (Number(pct) < 5) return null
  return (
    <text x={x} y={y}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      style={{ fontSize: 10.5, fontWeight: 600, fill: '#4A5568', pointerEvents: 'none' }}
    >
      {name} ({pct}%)
    </text>
  )
}

// ══════════════════════════════════════════════════════════
// Pie Chart
// ══════════════════════════════════════════════════════════
export function ExpensePieChart({ data }: { data: CategoryBreakdown[] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-8 rounded-xl"
        style={{ background: 'linear-gradient(135deg,rgba(249,246,240,.5),rgba(243,239,230,.6))', border: '1px dashed #D6D0C4' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: 'linear-gradient(135deg,#F5E4C2,#EDD099)' }}>
          <ChartPie size={28} style={{ color: '#8A5E14' }} />
        </div>
        <p className="font-serif-heading text-sm font-bold" style={{ color: '#1A1F2E' }}>Belum ada data pengeluaran</p>
        <p className="text-[11px] mt-1 max-w-xs" style={{ color: '#94A3B8' }}>Pengeluaran berdasarkan kategori akan tampil di sini</p>
      </div>
    )
  }

  // Add index to each datum so PieLabel / tooltip can pick color
  const indexed = data.map((d, i) => ({ ...d, _index: i }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart margin={{ top: 10, right: 36, bottom: 0, left: 36 }}>
        <defs>
          {PALETTE.map((c, i) => (
            <linearGradient key={i} id={`pg${i}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor={c} stopOpacity={1} />
              <stop offset="100%" stopColor={c} stopOpacity={0.78} />
            </linearGradient>
          ))}
        </defs>
        <Pie
          data={indexed}
          dataKey="value"
          nameKey="name"
          cx="50%" cy="50%"
          innerRadius={64} outerRadius={98}
          paddingAngle={3}
          labelLine={false}
          label={PieLabel}
        >
          {indexed.map((_, i) => (
            <Cell
              key={i}
              fill={`url(#pg${i % PALETTE.length})`}
              stroke="#FFFFFF"
              strokeWidth={2.5}
            />
          ))}
        </Pie>
        <Tooltip content={PieTooltip} />
        <Legend content={PieLegend} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ══════════════════════════════════════════════════════════
// Bar Chart
// ══════════════════════════════════════════════════════════
export function MonthlyBarChart({ data }: { data: MonthlyData[] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-8 rounded-xl"
        style={{ background: 'linear-gradient(135deg,rgba(249,246,240,.5),rgba(243,239,230,.6))', border: '1px dashed #D6D0C4' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: 'linear-gradient(135deg,#C8D8F0,#A8C0E5)' }}>
          <ChartBar size={28} style={{ color: '#0F1E36' }} />
        </div>
        <p className="font-serif-heading text-sm font-bold" style={{ color: '#1A1F2E' }}>Belum ada data transaksi</p>
        <p className="text-[11px] mt-1 max-w-xs" style={{ color: '#94A3B8' }}>Grafik perbandingan arus kas akan muncul di sini</p>
      </div>
    )
  }

  const formatted = data.map((d) => ({ ...d, month: fmtMonth(d.month) }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={formatted}
        margin={{ top: 10, right: 8, left: -8, bottom: 4 }}
        barGap={4}
        barCategoryGap="28%"
      >
        <defs>
          <linearGradient id="bar-in" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#22A06B" stopOpacity={1} />
            <stop offset="100%" stopColor="#1A7A54" stopOpacity={0.88} />
          </linearGradient>
          <linearGradient id="bar-ex" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#E55347" stopOpacity={1} />
            <stop offset="100%" stopColor="#C0392B" stopOpacity={0.88} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="4 4" stroke="#EDE9E0" strokeOpacity={0.7} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }}
          tickLine={false}
          axisLine={{ stroke: '#E8E4DC' }}
        />
        <YAxis
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={BarTooltip} cursor={{ fill: 'rgba(201,151,58,0.05)' } as any} />
        <Legend content={BarLegend} />
        <Bar dataKey="income"  name="Pemasukan"  fill="url(#bar-in)" radius={[6,6,0,0]} maxBarSize={52} />
        <Bar dataKey="expense" name="Pengeluaran" fill="url(#bar-ex)" radius={[6,6,0,0]} maxBarSize={52} />
      </BarChart>
    </ResponsiveContainer>
  )
}
