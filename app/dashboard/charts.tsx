'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { ChartPie, ChartBar } from '@phosphor-icons/react'

type CategoryBreakdown = { name: string; value: number }
type MonthlyData       = { month: string; income: number; expense: number }

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

// ── Tooltips ────────────────────────────────────────────────────────────────
const PieTooltip = (props: any) => {
  const { active, payload } = props
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div style={{
      background: 'rgba(255,255,255,0.97)',
      border: '1px solid #E8E4DC',
      borderRadius: '0.75rem',
      padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(26,31,46,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: PALETTE[p?.payload?._index ?? 0] ?? PALETTE[0],
          flexShrink: 0, display: 'inline-block',
        }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1A1F2E' }}>{p.name}</span>
      </div>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#C9973A', margin: 0 }}>{fmt(Number(p.value))}</p>
    </div>
  )
}

const AreaTooltip = (props: any) => {
  const { active, payload, label } = props
  if (!active || !payload?.length) return null
  const inc = payload.find((p: any) => p.dataKey === 'income')
  const exp = payload.find((p: any) => p.dataKey === 'expense')
  const net = (inc?.value ?? 0) - (exp?.value ?? 0)
  return (
    <div style={{
      background: 'rgba(15,30,54,0.97)',
      border: '1px solid rgba(201,151,58,0.25)',
      borderRadius: '0.875rem',
      padding: '12px 16px',
      boxShadow: '0 12px 32px rgba(15,30,54,0.35)',
      minWidth: 180,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(201,151,58,0.85)', marginBottom: 10, letterSpacing: '0.04em' }}>
        {String(label)}
      </p>
      {inc && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#34D399', flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.8)' }}>Pemasukan</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#34D399' }}>{fmt(Number(inc.value))}</span>
        </div>
      )}
      {exp && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#FB7185', flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.8)' }}>Pengeluaran</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#FB7185' }}>{fmt(Number(exp.value))}</span>
        </div>
      )}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 7, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.8)' }}>Net</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: net >= 0 ? '#FFFFFF' : '#FB7185' }}>
          {net >= 0 ? '+' : ''}{fmt(net)}
        </span>
      </div>
    </div>
  )
}

// ── Legends ─────────────────────────────────────────────────────────────────
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

const AreaLegend = (props: any) => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: 24, paddingTop: 12 }}>
    {(props?.payload ?? []).map((e: any, i: number) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 20, height: 3, borderRadius: 2, background: e.color, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>{e.value}</span>
      </div>
    ))}
  </div>
)

// ── Custom Pie Label ─────────────────────────────────────────────────────────
const PieLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, name, percent } = props
  const RAD = Math.PI / 180
  const r = outerRadius + 24
  const x: number = cx + r * Math.cos(-midAngle * RAD)
  const y: number = cy + r * Math.sin(-midAngle * RAD)
  const pct = ((percent ?? 0) * 100).toFixed(0)
  if (Number(pct) < 5) return null
  return (
    <text
      x={x} y={y}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      style={{ fontSize: 10.5, fontWeight: 600, fill: '#4A5568', pointerEvents: 'none' }}
    >
      {name} ({pct}%)
    </text>
  )
}

// ── Custom dot for line ──────────────────────────────────────────────────────
const CustomDot = (props: any) => {
  const { cx, cy, stroke, value } = props
  if (!value) return null
  return (
    <circle
      cx={cx} cy={cy} r={4}
      fill="#FFFFFF"
      stroke={stroke}
      strokeWidth={2.5}
    />
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Pie Chart
// ══════════════════════════════════════════════════════════════════════════════
export function ExpensePieChart({ data }: { data: CategoryBreakdown[] }) {
  if (data.length === 0) {
    return (
      <div
        className="h-64 flex flex-col items-center justify-center text-center p-8 rounded-xl"
        style={{ background: 'linear-gradient(135deg,rgba(249,246,240,.5),rgba(243,239,230,.6))', border: '1px dashed #D6D0C4' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: 'linear-gradient(135deg,#F5E4C2,#EDD099)' }}
        >
          <ChartPie size={28} style={{ color: '#8A5E14' }} />
        </div>
        <p className="font-serif-heading text-sm font-bold" style={{ color: '#1A1F2E' }}>Belum ada data pengeluaran</p>
        <p className="text-[11px] mt-1 max-w-xs" style={{ color: '#94A3B8' }}>Pengeluaran berdasarkan kategori akan tampil di sini</p>
      </div>
    )
  }

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
          innerRadius={64}
          outerRadius={98}
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

// ══════════════════════════════════════════════════════════════════════════════
// Area + Line Chart (menggantikan BarChart)
// ══════════════════════════════════════════════════════════════════════════════
export function MonthlyBarChart({ data }: { data: MonthlyData[] }) {
  if (data.length === 0) {
    return (
      <div
        className="h-64 flex flex-col items-center justify-center text-center p-8 rounded-xl"
        style={{ background: 'linear-gradient(135deg,rgba(249,246,240,.5),rgba(243,239,230,.6))', border: '1px dashed #D6D0C4' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: 'linear-gradient(135deg,#C8D8F0,#A8C0E5)' }}
        >
          <ChartBar size={28} style={{ color: '#0F1E36' }} />
        </div>
        <p className="font-serif-heading text-sm font-bold" style={{ color: '#1A1F2E' }}>Belum ada data transaksi</p>
        <p className="text-[11px] mt-1 max-w-xs" style={{ color: '#94A3B8' }}>Grafik arus kas akan muncul di sini</p>
      </div>
    )
  }

  const formatted = data.map((d) => ({ ...d, month: fmtMonth(d.month) }))
  const maxVal = Math.max(...formatted.flatMap((d) => [d.income, d.expense]))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart
        data={formatted}
        margin={{ top: 14, right: 12, left: -4, bottom: 4 }}
      >
        <defs>
          {/* Area pemasukan — hijau */}
          <linearGradient id="areaInc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#34D399" stopOpacity={0.28} />
            <stop offset="75%"  stopColor="#34D399" stopOpacity={0.06} />
            <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
          </linearGradient>
          {/* Area pengeluaran — merah */}
          <linearGradient id="areaExp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FB7185" stopOpacity={0.24} />
            <stop offset="75%"  stopColor="#FB7185" stopOpacity={0.05} />
            <stop offset="100%" stopColor="#FB7185" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 6"
          stroke="#EDE9E0"
          strokeOpacity={0.65}
          vertical={false}
        />

        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fontWeight: 600, fill: '#94A3B8' }}
          tickLine={false}
          axisLine={{ stroke: '#E8E4DC', strokeWidth: 1 }}
          dy={4}
        />
        <YAxis
          tickFormatter={(v) => {
            if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`
            if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}rb`
            return String(v)
          }}
          tick={{ fontSize: 10, fill: '#B0BBC8' }}
          tickLine={false}
          axisLine={false}
          domain={[0, maxVal * 1.15]}
          width={48}
        />

        <Tooltip content={AreaTooltip} cursor={{ stroke: 'rgba(201,151,58,0.2)', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
        <Legend content={AreaLegend} />

        {/* Garis referensi nol */}
        <ReferenceLine y={0} stroke="#E8E4DC" strokeWidth={1} />

        {/* Area pemasukan */}
        <Area
          type="monotone"
          dataKey="income"
          name="Pemasukan"
          fill="url(#areaInc)"
          stroke="#34D399"
          strokeWidth={2.5}
          dot={<CustomDot stroke="#34D399" />}
          activeDot={{ r: 6, fill: '#34D399', stroke: '#FFFFFF', strokeWidth: 2.5 }}
        />

        {/* Area pengeluaran */}
        <Area
          type="monotone"
          dataKey="expense"
          name="Pengeluaran"
          fill="url(#areaExp)"
          stroke="#FB7185"
          strokeWidth={2.5}
          dot={<CustomDot stroke="#FB7185" />}
          activeDot={{ r: 6, fill: '#FB7185', stroke: '#FFFFFF', strokeWidth: 2.5 }}
        />

        {/* Line net (income - expense) */}
        <Line
          type="monotone"
          dataKey={(d) => d.income - d.expense}
          name="Net"
          stroke="#E8B455"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          dot={false}
          activeDot={{ r: 5, fill: '#E8B455', stroke: '#FFFFFF', strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
