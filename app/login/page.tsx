'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Receipt, TrendUp, BookBookmark, Warning, ArrowRight } from '@phosphor-icons/react'

import JurnalystLogo from '@/components/JurnalystLogo'
import BlurText from '@/components/reactbits/BlurText'
import FadeContent from '@/components/reactbits/FadeContent'
import AnimatedContent from '@/components/reactbits/AnimatedContent'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: '#F5F4F0' }}>

      {/* ── BRAND HERO ───────────────────────────────────────── */}
      <div
        className="md:w-[52%] text-white flex flex-col justify-between relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0F1E36 0%, #162848 40%, #1A2F54 75%, #0F1E36 100%)',
        }}
      >
        {/* dot texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.028,
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Gold gradient glow — top right */}
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(201,151,58,0.14) 0%, transparent 70%)',
          }}
        />

        {/* Bottom left ambient */}
        <div
          className="absolute -bottom-20 -left-16 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(26,47,84,0.6) 0%, transparent 70%)',
          }}
        />

        {/* Top gold line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(201,151,58,0.45) 40%, rgba(232,180,85,0.45) 60%, transparent)' }}
        />

        <div className="relative z-10 p-8 md:p-14 lg:p-16 flex flex-col h-full justify-between">
          <div>
            <FadeContent duration={600} delay={0} threshold={0.01}>
              <div className="mb-12 md:mb-14">
                <JurnalystLogo size="xl" lightText={true} />
              </div>
            </FadeContent>

            <div className="max-w-md space-y-5">
              <BlurText
                text="Kelola Keuangan & Refleksi Investasi."
                delay={110}
                animateBy="words"
                direction="top"
                className="font-serif-heading text-3xl md:text-[2.5rem] font-bold leading-tight text-white"
              />
              <FadeContent duration={700} delay={650} threshold={0.01}>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(203,213,225,0.8)' }}>
                  Jurnal keuangan personal yang menggabungkan pencatatan arus kas harian,
                  pemantauan nilai portofolio aset, serta evaluasi hipotesis keputusan trading.
                </p>
              </FadeContent>
            </div>
          </div>

          {/* Feature Highlights */}
          <FadeContent duration={700} delay={950} threshold={0.01}>
            <div className="mt-12 pt-7" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Receipt,      iconColor: '#E8B455', iconBg: 'rgba(232,180,85,0.14)',  label: 'Cash Flow',  sub: 'Pencatatan per dompet' },
                  { icon: TrendUp,      iconColor: '#4ADE80', iconBg: 'rgba(74,222,128,0.11)',  label: 'Portfolio',  sub: 'Pemantauan harga real-time' },
                  { icon: BookBookmark, iconColor: '#93C5FD', iconBg: 'rgba(147,197,253,0.11)', label: 'Journal',    sub: 'Evaluasi win & loss' },
                ].map(({ icon: Icon, iconColor, iconBg, label, sub }) => (
                  <div key={label} className="group">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-all duration-200 group-hover:scale-105"
                      style={{
                        background: iconBg,
                        border: `1px solid ${iconColor}22`,
                      }}
                    >
                      <Icon size={17} style={{ color: iconColor }} />
                    </div>
                    <p className="text-xs font-semibold text-white">{label}</p>
                    <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'rgba(148,163,184,0.7)' }}>
                      {sub}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </FadeContent>
        </div>
      </div>

      {/* ── FORM SECTION ─────────────────────────────────────── */}
      <div className="md:w-[48%] flex items-center justify-center p-6 md:p-12 lg:p-16">
        <AnimatedContent distance={28} duration={0.65} delay={0.15} threshold={0.05} className="w-full max-w-md">
          <div
            className="rounded-2xl p-8 md:p-10 space-y-7"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E4DC',
              boxShadow: '0 2px 16px rgba(26,31,46,0.06), 0 1px 4px rgba(26,31,46,0.04)',
            }}
          >
            {/* Header */}
            <div>
              <p className="page-header-eyebrow mb-1.5">Masuk Akun</p>
              <h2 className="font-serif-heading text-2xl font-bold leading-snug" style={{ color: '#1A1F2E' }}>
                Selamat datang kembali
              </h2>
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#64748B' }}>
                Masukkan email dan kata sandi akun Jurnalyst Anda.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="nama@email.com"
                />
              </div>

              <div>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div
                  className="p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in"
                  style={{ background: '#FEF2F1', border: '1px solid #FACDC9', color: '#922B21' }}
                >
                  <Warning size={14} style={{ color: '#C0392B', flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3 text-[0.8125rem]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memproses...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Masuk ke Akun
                      <ArrowRight size={14} weight="bold" />
                    </span>
                  )}
                </button>
              </div>
            </form>

            <div
              className="pt-5 text-center text-xs"
              style={{ borderTop: '1px solid #F0EDE5', color: '#94A3B8' }}
            >
              Belum punya akun?{' '}
              <Link
                href="/register"
                className="font-semibold hover:underline"
                style={{ color: '#C9973A' }}
              >
                Daftar di sini
              </Link>
            </div>
          </div>
        </AnimatedContent>
      </div>

    </div>
  )
}
