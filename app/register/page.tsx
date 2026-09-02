'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Warning, CheckCircle } from '@phosphor-icons/react'

import JurnalystLogo from '@/components/JurnalystLogo'
import AnimatedContent from '@/components/reactbits/AnimatedContent'
import FadeContent from '@/components/reactbits/FadeContent'
import BlurText from '@/components/reactbits/BlurText'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
      })
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F6F7F5]">
      {/* BRAND HERO SECTION */}
      <div className="md:w-1/2 bg-[#1B2A4A] text-[#F6F7F5] p-8 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
        <div>
          <FadeContent duration={600} delay={0}>
            <div className="mb-12">
              <JurnalystLogo size="xl" lightText={true} />
            </div>
          </FadeContent>

          <AnimatedContent distance={32} duration={0.65} delay={0.2} threshold={0.05}>
            <div className="max-w-md space-y-4">
              <BlurText
                text="Mulai Kedisiplinan Finansial Anda."
                delay={50}
                animateBy="words"
                direction="top"
                threshold={0.05}
                stepDuration={0.3}
                className="font-serif-heading text-3xl md:text-4xl font-bold leading-tight text-white"
              />
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                Buat akun Jurnalyst untuk mengelola arus kas dompet, memantau posisi investasi, dan mencatat jurnal evaluasi trading.
              </p>
            </div>
          </AnimatedContent>
        </div>

        <FadeContent duration={600} delay={600}>
          <div className="mt-12 pt-8 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle size={16} className="text-emerald-400 shrink-0" />
              <span>Pencatatan arus kas harian terstruktur per kategori.</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle size={16} className="text-emerald-400 shrink-0" />
              <span>Pemantauan harga saham IDX & Kripto secara otomatis.</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle size={16} className="text-emerald-400 shrink-0" />
              <span>Jurnal hipotesis & evaluasi win-rate trading.</span>
            </div>
          </div>
        </FadeContent>
      </div>

      {/* FORM SECTION */}
      <div className="md:w-1/2 p-6 md:p-16 flex items-center justify-center">
        <AnimatedContent distance={28} duration={0.65} delay={0.1} threshold={0.05}>
          <div className="w-full max-w-md space-y-6 bg-white p-8 md:p-10 rounded-xl shadow-xs border border-slate-200">
            <div>
              <h2 className="font-serif-heading text-xl font-bold text-slate-900">
                Buat Akun Baru
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                Lengkapi data di bawah ini untuk pendaftaran akun Jurnalyst.
              </p>
            </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                placeholder="Nama Anda"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#D14343] font-medium flex items-center gap-2">
                <Warning size={16} className="shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#1B2A4A] hover:bg-slate-900 text-white font-semibold py-2.5 text-xs shadow-xs transition-all disabled:opacity-50"
            >
              {loading ? 'Membuat Akun...' : 'Daftar Sekarang'}
            </button>
          </form>

            <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
              Sudah memiliki akun?{' '}
              <Link href="/login" className="text-[#B8802E] font-semibold hover:underline">
                Masuk di sini
              </Link>
            </div>
          </div>
        </AnimatedContent>
      </div>
    </div>
  )
}
