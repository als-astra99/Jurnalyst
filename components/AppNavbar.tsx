'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'motion/react'
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
  CaretDoubleLeft,
  CaretDoubleRight,
} from '@phosphor-icons/react'
import JurnalystLogo from '@/components/JurnalystLogo'
import StaggeredMenu from '@/components/reactbits/StaggeredMenu'
import FadeContent from '@/components/reactbits/FadeContent'

interface AppNavbarProps {
  userEmail?: string
  userName?: string
  children: React.ReactNode
}

const SIDEBAR_EXPANDED = 256
const SIDEBAR_COLLAPSED = 64

// ── Warna aksen unik per nav item (sesuai tema navy/gold) ──────────────────
const mainNavColors = [
  // Dashboard — gold warm
  {
    activeBg:    'linear-gradient(135deg, rgba(201,151,58,0.28), rgba(232,180,85,0.18))',
    activeBorder:'rgba(201,151,58,0.45)',
    iconColor:   '#E8B455',
    dot:         '#E8B455',
  },
  // Transaksi — teal/emerald
  {
    activeBg:    'linear-gradient(135deg, rgba(47,158,110,0.28), rgba(52,211,153,0.15))',
    activeBorder:'rgba(47,158,110,0.45)',
    iconColor:   '#34D399',
    dot:         '#34D399',
  },
  // Portfolio — sky blue
  {
    activeBg:    'linear-gradient(135deg, rgba(56,189,248,0.22), rgba(14,165,233,0.14))',
    activeBorder:'rgba(56,189,248,0.4)',
    iconColor:   '#38BDF8',
    dot:         '#38BDF8',
  },
  // Journal — rose/pink
  {
    activeBg:    'linear-gradient(135deg, rgba(251,113,133,0.22), rgba(244,63,94,0.14))',
    activeBorder:'rgba(251,113,133,0.4)',
    iconColor:   '#FB7185',
    dot:         '#FB7185',
  },
]

const secondaryNavColors = [
  // Kelola Dompet — violet
  { iconColor: '#A78BFA', hoverBg: 'rgba(167,139,250,0.1)' },
  // Kelola Kategori — amber
  { iconColor: '#FBB040', hoverBg: 'rgba(251,176,64,0.1)' },
  // Daftar Aset — cyan
  { iconColor: '#22D3EE', hoverBg: 'rgba(34,211,238,0.1)' },
]

// ── Animasi label per-karakter ─────────────────────────────────────────────
const charContainerVariants = {
  visible: {
    opacity: 1,
    width: 'auto',
    transition: { staggerChildren: 0.025, delayChildren: 0.05 },
  },
  hidden: {
    opacity: 0,
    width: 0,
    transition: { staggerChildren: 0.015, staggerDirection: -1 },
  },
}

const charVariants = {
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.22, ease: 'easeOut' as const },
  },
  hidden: {
    opacity: 0,
    y: -6,
    filter: 'blur(4px)',
    transition: { duration: 0.15, ease: 'easeIn' as const },
  },
}

// Komponen label animasi per-karakter
function AnimatedLabel({ text, visible }: { text: string; visible: boolean }) {
  return (
    <motion.span
      variants={charContainerVariants}
      animate={visible ? 'visible' : 'hidden'}
      initial="hidden"
      className="overflow-hidden whitespace-nowrap flex items-center"
      style={{ display: 'inline-flex' }}
    >
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          variants={charVariants}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  )
}

const sectionLabelVariants = {
  expanded: { opacity: 1, height: 'auto', marginBottom: 8,  transition: { duration: 0.2,  ease: 'easeOut' as const } },
  collapsed:{ opacity: 0, height: 0,      marginBottom: 0,  transition: { duration: 0.15, ease: 'easeIn'  as const } },
}

export default function AppNavbar({ userEmail, userName, children }: AppNavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

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
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex md:flex-col md:fixed md:inset-y-0 z-30 sidebar-gradient text-white overflow-hidden"
      >
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
            backgroundSize: '18px 18px',
          }}
        />

        {/* Top gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#C9973A] to-transparent opacity-60" />

        {/* ── Brand + Toggle ─────────────────────────────────── */}
        <FadeContent duration={400} delay={0}>
          <div className="relative z-10 px-3 py-[1.125rem] border-b border-white/[0.07] flex items-center justify-between gap-2">
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  key="logo"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <Link href="/dashboard">
                    <JurnalystLogo size="lg" lightText={true} />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              layout
              onClick={() => setCollapsed((v) => !v)}
              title={collapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                color: 'rgba(201,151,58,0.75)',
                background: 'rgba(201,151,58,0.1)',
                border: '1px solid rgba(201,151,58,0.18)',
                marginLeft: collapsed ? 'auto' : undefined,
                marginRight: collapsed ? 'auto' : undefined,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#E8B455'
                e.currentTarget.style.background = 'rgba(201,151,58,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(201,151,58,0.75)'
                e.currentTarget.style.background = 'rgba(201,151,58,0.1)'
              }}
            >
              <motion.span
                animate={{ rotate: collapsed ? 0 : 180 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                {collapsed
                  ? <CaretDoubleRight size={13} weight="bold" />
                  : <CaretDoubleLeft  size={13} weight="bold" />
                }
              </motion.span>
            </motion.button>
          </div>
        </FadeContent>

        {/* ── Navigation ─────────────────────────────────────── */}
        <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-2 py-5 space-y-6">

          {/* Main nav */}
          <div>
            <motion.p
              animate={collapsed ? 'collapsed' : 'expanded'}
              variants={sectionLabelVariants}
              className="px-2 text-[9.5px] font-bold tracking-[0.12em] uppercase overflow-hidden whitespace-nowrap"
              style={{ color: 'rgba(201,151,58,0.65)' }}
            >
              Menu Utama
            </motion.p>

            <StaggeredMenu staggerDelay={0.06} initialDelay={0.15}>
              {mainNavItems.map((item, idx) => {
                const active = isCurrent(item.href)
                const Icon = item.icon
                const color = mainNavColors[idx]

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className="group relative flex items-center gap-3 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={{
                      padding: collapsed ? '0.625rem' : '0.625rem 0.75rem',
                      justifyContent: collapsed ? 'center' : undefined,
                      background: active ? color.activeBg : 'transparent',
                      border: active
                        ? `1px solid ${color.activeBorder}`
                        : '1px solid transparent',
                      color: active ? '#FFFFFF' : '#CBD5E1',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                        e.currentTarget.style.color = '#FFFFFF'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = '#CBD5E1'
                      }
                    }}
                  >
                    {/* Active dot indicator */}
                    {active && !collapsed && (
                      <motion.span
                        layoutId="active-dot"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                        style={{ background: color.dot }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      />
                    )}

                    {/* Icon */}
                    <motion.span
                      whileHover={{ scale: 1.15, rotate: active ? 0 : 5 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        color: active ? color.iconColor : 'inherit',
                        filter: active ? `drop-shadow(0 0 6px ${color.iconColor}55)` : 'none',
                        display: 'flex',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={17} weight={active ? 'fill' : 'regular'} />
                    </motion.span>

                    {/* Animated label per-karakter */}
                    <AnimatedLabel text={item.label} visible={!collapsed} />
                  </Link>
                )
              })}
            </StaggeredMenu>
          </div>

          {/* Secondary nav */}
          <div>
            <motion.p
              animate={collapsed ? 'collapsed' : 'expanded'}
              variants={sectionLabelVariants}
              className="px-2 text-[9.5px] font-bold tracking-[0.12em] uppercase overflow-hidden whitespace-nowrap"
              style={{ color: 'rgba(148,163,184,0.6)' }}
            >
              Pengaturan Data
            </motion.p>

            <StaggeredMenu staggerDelay={0.05} initialDelay={0.5}>
              {secondaryNavItems.map((item, idx) => {
                const active = isCurrent(item.href)
                const Icon = item.icon
                const color = secondaryNavColors[idx]

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className="group flex items-center gap-3 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{
                      padding: collapsed ? '0.5rem' : '0.5rem 0.75rem',
                      justifyContent: collapsed ? 'center' : undefined,
                      background: active ? color.hoverBg : 'transparent',
                      color: active ? '#FFFFFF' : '#94A3B8',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = color.hoverBg
                      e.currentTarget.style.color = '#E2E8F0'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = active ? color.hoverBg : 'transparent'
                      e.currentTarget.style.color = active ? '#FFFFFF' : '#94A3B8'
                    }}
                  >
                    <motion.span
                      whileHover={{ scale: 1.15 }}
                      transition={{ duration: 0.18 }}
                      style={{
                        color: active ? color.iconColor : 'inherit',
                        display: 'flex',
                        flexShrink: 0,
                        filter: active ? `drop-shadow(0 0 4px ${color.iconColor}55)` : 'none',
                      }}
                    >
                      <Icon size={14} weight={active ? 'fill' : 'regular'} />
                    </motion.span>

                    <AnimatedLabel text={item.label} visible={!collapsed} />
                  </Link>
                )
              })}
            </StaggeredMenu>
          </div>
        </div>

        {/* ── User footer ────────────────────────────────────── */}
        <FadeContent duration={500} delay={700}>
          <div
            className="relative z-10 border-t border-white/[0.07] overflow-hidden"
            style={{
              background: 'rgba(0,0,0,0.18)',
              padding: collapsed ? '0.625rem 0' : '0.875rem',
            }}
          >
            <div
              className="flex items-center gap-3"
              style={{ justifyContent: collapsed ? 'center' : undefined }}
            >
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

              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.div
                    key="user-info"
                    initial={{ opacity: 0, x: -8, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: 'auto' }}
                    exit={{ opacity: 0, x: -8, width: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="min-w-0 flex-1 overflow-hidden"
                  >
                    <p className="text-xs font-semibold text-white truncate leading-tight">
                      {userName || userEmail?.split('@')[0] || 'Pengguna'}
                    </p>
                    <p className="text-[10px] truncate mt-0.5" style={{ color: 'rgba(148,163,184,0.7)' }}>
                      {userEmail}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.button
                    key="logout-btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
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
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </FadeContent>
      </motion.aside>

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
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#C9973A]/50 to-transparent rounded-full" />

            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #E8B455, #C9973A)', color: '#3D2800' }}
                >
                  {(userName || userEmail || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-white leading-tight">
                    {userName || userEmail?.split('@')[0] || 'Pengguna'}
                  </p>
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

            <div className="space-y-2">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.12em]"
                 style={{ color: 'rgba(148,163,184,0.55)' }}>
                Kelola Data
              </p>
              <StaggeredMenu staggerDelay={0.04} initialDelay={0.05} className="grid grid-cols-1 gap-1">
                {secondaryNavItems.map((item, idx) => {
                  const Icon = item.icon
                  const color = secondaryNavColors[idx]
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl text-xs font-medium text-slate-200 hover:text-white transition-colors"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <Icon size={14} style={{ color: color.iconColor }} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </StaggeredMenu>
            </div>

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
      <motion.main
        initial={false}
        animate={{ paddingLeft: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 pb-20 md:pb-8 min-h-screen hidden md:block"
      >
        {children}
      </motion.main>

      {/* Mobile main — tanpa padding kiri */}
      <main className="flex-1 pb-20 md:pb-8 min-h-screen md:hidden">
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
        {mainNavItems.map((item, idx) => {
          const active = isCurrent(item.href)
          const Icon = item.icon
          const color = mainNavColors[idx]
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
              <Icon
                size={20}
                weight={active ? 'fill' : 'regular'}
                style={{ color: active ? color.iconColor : undefined }}
              />
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
