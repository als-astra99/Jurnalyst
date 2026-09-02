'use client'

import { ExpensePieChart, MonthlyBarChart } from './charts'
import AnimatedContent from '@/components/reactbits/AnimatedContent'
import CountUp from '@/components/reactbits/CountUp'
import SpotlightCard from '@/components/reactbits/SpotlightCard'
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
} from '@phosphor-icons/react'

type Props = {
  userName: string
  totalIncome: number
  totalExpense: number
  balance: number
  pieData: { name: string; value: number }[]
  monthlyData: { month: string; income: number; expense: number }[]
}

export default function DashboardClient({ userName, totalIncome, totalExpense, balance, pieData, monthlyData }: Props) {
  const isPositive = balance >= 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">

      {/* ── WELCOME HEADER ─────────────────────────────────── */}
      <AnimatedContent distance={28} duration={0.6} threshold={0.05}>
        <div className="welcome-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="page-header-eyebrow mb-1.5">Ringkasan Akun</p>
            <h1 className="font-serif-heading text-2xl md:text-[1.85rem] font-bold leading-tight"
                style={{ color: '#1A1F2E' }}>
              Selamat Datang, {userName}
            </h1>
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: '#64748B' }}>
              Ringkasan arus kas, alokasi pengeluaran, dan posisi portofolio Anda.
            </p>
          </div>
          <div className="shrink-0">
            <a href="/transactions" className="btn-primary">
              <Plus size={14} weight="bold" />
              <span>Catat Transaksi</span>
            </a>
          </div>
        </div>
      </AnimatedContent>

      {/* ── SUMMARY CARDS ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Income Card */}
        <AnimatedContent distance={36} duration={0.65} delay={0.05} threshold={0.05}>
          <div className="stitched-card card-income p-5 flex flex-col justify-between h-full rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#1A7A54' }}>
                  Total Pemasukan
                </p>
              </div>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #C8F0DC, #A8E5C4)',
                  color: '#145C3E',
                }}
              >
                <TrendUp size={17} weight="bold" />
              </div>
            </div>
            <div className="mt-5">
              <p className="text-[11px] font-bold font-number-mono mb-0.5" style={{ color: '#5A9E7A' }}>Rp</p>
              <p className="font-serif-heading text-2xl md:text-[1.75rem] font-bold font-number-mono leading-none"
                 style={{ color: '#145C3E' }}>
                <CountUp to={totalIncome} duration={1.8} separator="." />
              </p>
              <p className="text-xs mt-1.5" style={{ color: '#5A9E7A' }}>Akumulasi seluruh pemasukan</p>
            </div>
          </div>
        </AnimatedContent>

        {/* Expense Card */}
        <AnimatedContent distance={36} duration={0.65} delay={0.12} threshold={0.05}>
          <div className="stitched-card card-expense p-5 flex flex-col justify-between h-full rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#C0392B' }}>
                  Total Pengeluaran
                </p>
              </div>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #FAD4D0, #F5B8B2)',
                  color: '#922B21',
                }}
              >
                <TrendDown size={17} weight="bold" />
              </div>
            </div>
            <div className="mt-5">
              <p className="text-[11px] font-bold font-number-mono mb-0.5" style={{ color: '#C0736C' }}>Rp</p>
              <p className="font-serif-heading text-2xl md:text-[1.75rem] font-bold font-number-mono leading-none"
                 style={{ color: '#922B21' }}>
                <CountUp to={totalExpense} duration={1.8} separator="." />
              </p>
              <p className="text-xs mt-1.5" style={{ color: '#C0736C' }}>Akumulasi seluruh pengeluaran</p>
            </div>
          </div>
        </AnimatedContent>

        {/* Balance Card */}
        <AnimatedContent distance={36} duration={0.65} delay={0.19} threshold={0.05}>
          <div className={`stitched-card ${isPositive ? 'card-balance' : 'card-balance-negative'} p-5 flex flex-col justify-between h-full rounded-2xl`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5"
                   style={{ color: isPositive ? '#162848' : '#C0392B' }}>
                  Saldo Bersih
                </p>
              </div>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={isPositive ? {
                  background: 'linear-gradient(135deg, #C8D8F0, #A8C0E5)',
                  color: '#0F1E36',
                } : {
                  background: 'linear-gradient(135deg, #FAD4D0, #F5B8B2)',
                  color: '#922B21',
                }}
              >
                <Wallet size={17} weight="bold" />
              </div>
            </div>
            <div className="mt-5">
              <p className="text-[11px] font-bold font-number-mono mb-0.5"
                 style={{ color: isPositive ? '#8090A8' : '#C0736C' }}>
                {!isPositive && '−'} Rp
              </p>
              <p className="font-serif-heading text-2xl md:text-[1.75rem] font-bold font-number-mono leading-none"
                 style={{ color: isPositive ? '#0F1E36' : '#922B21' }}>
                <CountUp to={Math.abs(balance)} duration={2} separator="." />
              </p>
              <p className="text-xs mt-1.5" style={{ color: '#8090A8' }}>Selisih pemasukan & pengeluaran</p>
            </div>
          </div>
        </AnimatedContent>

      </div>

      {/* ── CHARTS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatedContent distance={28} duration={0.7} delay={0.1} threshold={0.05}>
          <div className="stitched-card p-6 h-full rounded-2xl">
            <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: '1px solid #F0EDE5' }}>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #F5E4C2, #EDD099)', color: '#8A5E14' }}
              >
                <ChartPie size={14} weight="bold" />
              </div>
              <h2 className="font-serif-heading text-sm font-bold" style={{ color: '#1A1F2E' }}>
                Pengeluaran per Kategori
              </h2>
            </div>
            <ExpensePieChart data={pieData} />
          </div>
        </AnimatedContent>

        <AnimatedContent distance={28} duration={0.7} delay={0.18} threshold={0.05}>
          <div className="stitched-card p-6 h-full rounded-2xl">
            <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: '1px solid #F0EDE5' }}>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #C8D8F0, #A8C0E5)', color: '#0F1E36' }}
              >
                <ChartBar size={14} weight="bold" />
              </div>
              <h2 className="font-serif-heading text-sm font-bold" style={{ color: '#1A1F2E' }}>
                Arus Kas Bulanan
              </h2>
            </div>
            <MonthlyBarChart data={monthlyData} />
          </div>
        </AnimatedContent>
      </div>

      {/* ── QUICK NAV CARDS ────────────────────────────────── */}
      <AnimatedContent distance={24} duration={0.65} delay={0.08} threshold={0.05}>
        <div
          className="rounded-2xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, #0F1E36 0%, #162848 45%, #1A2F54 80%, #0F1E36 100%)',
            border: '1px solid rgba(201,151,58,0.2)',
          }}
        >
          {/* dot texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)`,
              backgroundSize: '20px 20px',
            }}
          />
          {/* top gold shimmer */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(201,151,58,0.5) 40%, rgba(232,180,85,0.5) 60%, transparent)' }}
          />

          <div className="relative p-6">
            <div className="mb-5">
              <p
                className="text-[10px] uppercase tracking-[0.15em] font-bold mb-1"
                style={{ color: 'rgba(201,151,58,0.75)' }}
              >
                Navigasi Cepat
              </p>
              <h2 className="font-serif-heading text-lg font-bold text-white">
                Kelola Keuangan & Investasi
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  href: '/transactions',
                  icon: Receipt,
                  accentColor: '#E8B455',
                  iconBg: 'rgba(232,180,85,0.15)',
                  title: 'Cash Flow',
                  desc: 'Pencatatan transaksi harian per dompet dan kategori.',
                },
                {
                  href: '/portfolio',
                  icon: Coins,
                  accentColor: '#4ADE80',
                  iconBg: 'rgba(74,222,128,0.12)',
                  title: 'Portfolio Tracker',
                  desc: 'Pemantauan posisi aset saham & kripto real-time.',
                },
                {
                  href: '/journal',
                  icon: BookBookmark,
                  accentColor: '#93C5FD',
                  iconBg: 'rgba(147,197,253,0.12)',
                  title: 'Investment Journal',
                  desc: 'Jurnal evaluasi trading, target price, dan win rate.',
                },
              ].map(({ href, icon: Icon, accentColor, iconBg, title, desc }) => (
                <SpotlightCard
                  key={href}
                  spotlightColor="rgba(201, 151, 58, 0.1)"
                  className="group cursor-pointer transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: '0.875rem',
                    padding: '1rem',
                  } as React.CSSProperties}
                >
                  <a href={href} className="block">
                    <div className="flex items-center justify-between mb-3.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: iconBg, border: `1px solid ${accentColor}22` }}
                      >
                        <Icon size={18} style={{ color: accentColor }} />
                      </div>
                      <ArrowRight
                        size={14}
                        className="group-hover:translate-x-1 transition-transform duration-200"
                        style={{ color: 'rgba(255,255,255,0.25)' }}
                      />
                    </div>
                    <h3 className="font-semibold text-white text-sm mb-1.5 tracking-tight">{title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(148,163,184,0.75)' }}>{desc}</p>
                  </a>
                </SpotlightCard>
              ))}
            </div>
          </div>
        </div>
      </AnimatedContent>

    </div>
  )
}
