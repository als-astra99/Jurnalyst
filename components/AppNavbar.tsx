'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  SquaresFour,
  Receipt,
  TrendUp,
  BookBookmark,
  Wallet,
  Tag,
  Coins,
  SignOut,
  SlidersHorizontal,
  X,
} from '@phosphor-icons/react'
import JurnalystLogo from '@/components/JurnalystLogo'
import StaggeredMenu from '@/components/reactbits/StaggeredMenu'
import FadeContent from '@/components/reactbits/FadeContent'

interface AppNavbarProps {
  userEmail?: string
  userName?: string
  children: React.ReactNode
}

export default function AppNavbar({ userEmail, userName, children }: AppNavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const mainNavItems = [
    { href: '/dashboard',    label: 'Dashboard', icon: SquaresFour },
    { href: '/transactions', label: 'Transaksi',  icon: Receipt },
    { href: '/portfolio',    label: 'Portfolio',  icon: TrendUp },
    { href: '/journal',      label: 'Journal',    icon: BookBookmark },
  ]

  const secondaryNavItems = [
    { href: '/accounts',   label: 'Kelola Dompet',   icon: Wallet },
    { href: '/categories', label: 'Kelola Kategori', icon: Tag },
    { href: '/assets',     label: 'Daftar Aset',     icon: Coins },
  ]

  const isCurrent = (path: string) => pathname === path

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F5F4F0] text-[#1A1F2E]">

      {/* ── DESKTOP SIDEBAR ──────────────────────────────────── */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 sidebar-gradient text-white overflow-hidden">

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
            backgroundSize: '18px 18px',
          }}
        />

        {/* Top gold accent line */}
        {/* eslint-disable-next-line react/self-closing-comp */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#C9973A] to-transparent opacity-60"></div>

        {/* Brand */}
        <FadeContent duration={400} delay={0}>
          <div className="relative z-10 px-5 py-[1.125rem] border-b border-white/[0.07]">
            <Link href="/dashboard" className="block">
              <JurnalystLogo size="lg" lightText={true} />
            </Link>
          </div>
        </FadeContent>

        {/* Navigation */}
        <div className="relative z-10 flex-1 overflow-y-auto px-3 py-5 space-y-6">

          {/* Main nav */}
          <div>
            <FadeContent duration={400} delay={100}>
              <p className="px-3 mb-2 text-[9.5px] font-bold tracking-[0.12em] uppercase"
                 style={{ color: 'rgba(201,151,58,0.65)' }}>
                Menu Utama
              </p>
            </FadeContent>
            <StaggeredMenu staggerDelay={0.06} initialDelay={0.15}>
              {mainNavItems.map((item) => {
                const active = isCurrent(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                      transition-all duration-200
                      ${active
                        ? 'nav-active-pill text-white'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.07]'
                      }
                    `}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white/50 rounded-r-full" />
                    )}
                    <Icon
                      size={17}
                      weight={active ? 'fill' : 'regular'}
                      className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                    />
                    <span className="tracking-tight">{item.label}</span>
                  </Link>
                )
              })}
            </StaggeredMenu>
          </div>

          {/* Secondary nav */}
          <div>
            <FadeContent duration={400} delay={400}>
              <p className="px-3 mb-2 text-[9.5px] font-bold tracking-[0.12em] uppercase"
                 style={{ color: 'rgba(148,163,184,0.6)' }}>
                Pengaturan Data
              </p>
            </FadeContent>
            <StaggeredMenu staggerDelay={0.05} initialDelay={0.5}>
              {secondaryNavItems.map((item) => {
                const active = isCurrent(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium
                      transition-all duration-200
                      ${active
                        ? 'bg-white/[0.1] text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                      }
                    `}
                  >
                    <Icon
                      size={14}
                      weight={active ? 'fill' : 'regular'}
                      className="shrink-0 transition-transform group-hover:scale-110 duration-200"
                    />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </StaggeredMenu>
          </div>
        </div>

        {/* User footer */}
        <FadeContent duration={500} delay={700}>
          <div className="relative z-10 p-3.5 border-t border-white/[0.07]"
               style={{ background: 'rgba(0,0,0,0.18)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold select-none"
                style={{
                  background: 'linear-gradient(135deg, #E8B455, #C9973A)',
                  color: '#3D2800',
                  boxShadow: '0 2px 6px rgba(201,151,58,0.3)',
                }}
              >
                {(userName || userEmail || 'U')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {userName || userEmail?.split('@')[0] || 'Pengguna'}
                </p>
                <p className="text-[10px] truncate mt-0.5" style={{ color: 'rgba(148,163,184,0.7)' }}>
                  {userEmail}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Keluar"
                className="p-1.5 rounded-lg transition-all shrink-0"
                style={{ color: 'rgba(148,163,184,0.6)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#F87171'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(148,163,184,0.6)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <SignOut size={16} />
              </button>
            </div>
          </div>
        </FadeContent>
      </aside>

      {/* ── MOBILE HEADER ────────────────────────────────────── */}
      <header
        className="md:hidden sticky top-0 z-40 text-white px-4 py-3 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #0F1E36, #162848)',
          borderBottom: '1px solid rgba(201,151,58,0.15)',
        }}
      >
        <Link href="/dashboard">
          <JurnalystLogo size="sm" lightText={true} />
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors text-slate-300 hover:text-white hover:bg-white/10"
        >
          <SlidersHorizontal size={17} />
          <span>Pengaturan</span>
        </button>
      </header>

      {/* ── MOBILE SHEET ─────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(10,15,25,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setMobileMenuOpen(false) }}
        >
          <div
            className="text-white p-5 rounded-t-2xl space-y-5 max-h-[82vh] overflow-y-auto animate-fade-up"
            style={{ background: 'linear-gradient(180deg, #162848, #0F1E36)' }}
          >
            {/* Top gold line */}
            {/* eslint-disable-next-line react/self-closing-comp */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#C9973A]/50 to-transparent rounded-full"></div>

            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #E8B455, #C9973A)', color: '#3D2800' }}
                >
                  {(userName || userEmail || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-white leading-tight">{userName || userEmail?.split('@')[0] || 'Pengguna'}</p>
                  <p className="text-[11px] text-slate-400">{userEmail}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Secondary nav */}
            <div className="space-y-2">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.12em]"
                 style={{ color: 'rgba(148,163,184,0.55)' }}>
                Kelola Data
              </p>
              <StaggeredMenu staggerDelay={0.04} initialDelay={0.05} className="grid grid-cols-1 gap-1">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl text-xs font-medium text-slate-200 hover:text-white transition-colors"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <Icon size={14} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </StaggeredMenu>
            </div>

            {/* Logout */}
            <div className="pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl font-medium text-xs text-red-300 hover:text-red-200 transition-colors"
                style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.2)' }}
              >
                <SignOut size={14} />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <main className="flex-1 md:pl-64 pb-20 md:pb-8 min-h-screen">
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAV ────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-1 py-1 flex items-center justify-around"
        style={{
          background: 'rgba(255,253,249,0.96)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid #E8E4DC',
          boxShadow: '0 -4px 20px rgba(26,31,46,0.06)',
        }}
      >
        {mainNavItems.map((item) => {
          const active = isCurrent(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-xs font-medium transition-all duration-200"
              style={active ? {
                color: '#0F1E36',
                background: 'linear-gradient(135deg, #F0EDE5, #E8E4DC)',
              } : {
                color: '#94A3B8',
              }}
            >
              <Icon size={20} weight={active ? 'fill' : 'regular'} />
              <span className="text-[10px] mt-0.5 font-semibold">{item.label}</span>
            </Link>
          )
        })}

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-xs font-medium transition-all"
          style={{ color: '#94A3B8' }}
        >
          <SlidersHorizontal size={20} />
          <span className="text-[10px] mt-0.5 font-semibold">Lainnya</span>
        </button>
      </nav>

    </div>
  )
}
