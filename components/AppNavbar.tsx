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
  X
} from '@phosphor-icons/react'
import JurnalystLogo from '@/components/JurnalystLogo'

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
    { href: '/dashboard', label: 'Dashboard', icon: SquaresFour },
    { href: '/transactions', label: 'Transaksi', icon: Receipt },
    { href: '/portfolio', label: 'Portfolio', icon: TrendUp },
    { href: '/journal', label: 'Journal', icon: BookBookmark },
  ]

  const secondaryNavItems = [
    { href: '/accounts', label: 'Kelola Dompet', icon: Wallet },
    { href: '/categories', label: 'Kelola Kategori', icon: Tag },
    { href: '/assets', label: 'Daftar Aset', icon: Coins },
  ]

  const isCurrent = (path: string) => pathname === path

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F6F7F5] text-slate-800">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 bg-[#1B2A4A] text-white border-r border-slate-800">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80">
          <Link href="/dashboard">
            <JurnalystLogo size="lg" lightText={true} />
          </Link>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
          <div>
            <p className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
              Menu Utama
            </p>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const active = isCurrent(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-[#B8802E] text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <Icon size={18} weight={active ? 'fill' : 'regular'} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div>
            <p className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
              Pengaturan Data
            </p>
            <nav className="space-y-1">
              {secondaryNavItems.map((item) => {
                const active = isCurrent(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Icon size={16} weight={active ? 'fill' : 'regular'} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {userName || 'User Jurnalyst'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Keluar"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <SignOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE TOP HEADER */}
      <header className="md:hidden sticky top-0 z-40 bg-[#1B2A4A] text-white px-4 py-3 flex items-center justify-between shadow-xs">
        <Link href="/dashboard">
          <JurnalystLogo size="sm" lightText={true} />
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-slate-300 hover:bg-slate-800 rounded-lg text-xs font-medium flex items-center gap-1.5"
        >
          <SlidersHorizontal size={18} />
          <span>Pengaturan</span>
        </button>
      </header>

      {/* MOBILE MENU SHEET */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-[#1B2A4A] text-white p-5 rounded-t-2xl space-y-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <p className="font-semibold text-sm text-white">{userName || 'User Jurnalyst'}</p>
                <p className="text-xs text-slate-400">{userEmail}</p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 p-1 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Kelola Data
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/60 text-slate-200 hover:bg-slate-800 hover:text-white text-xs font-medium"
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-2.5 bg-red-950/40 border border-red-900/50 text-red-300 rounded-lg hover:bg-red-900/60 font-medium text-xs"
              >
                <SignOut size={16} />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 md:pl-64 pb-20 md:pb-8 min-h-screen">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-sm">
        {mainNavItems.map((item) => {
          const active = isCurrent(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
                active ? 'text-[#1B2A4A] font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={20} weight={active ? 'fill' : 'regular'} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          )
        })}

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <SlidersHorizontal size={20} />
          <span className="text-[10px] mt-0.5">Lainnya</span>
        </button>
      </nav>
    </div>
  )
}
