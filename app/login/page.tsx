'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Receipt, TrendUp, BookBookmark, Warning } from '@phosphor-icons/react'

import JurnalystLogo from '@/components/JurnalystLogo'

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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F6F7F5]">
      {/* BRAND HERO SECTION */}
      <div className="md:w-1/2 bg-[#1B2A4A] text-white p-8 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
        <div>
          <div className="mb-12">
            <JurnalystLogo size="xl" lightText={true} />
          </div>

          <div className="max-w-md space-y-4">
            <h1 className="font-serif-heading text-3xl md:text-4xl font-bold leading-tight text-white">
              Kelola Keuangan & Refleksi Investasi.
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Jurnal keuangan personal yang menggabungkan pencatatan arus kas harian, pemantauan nilai portofolio aset, serta evaluasi hipotesis keputusan trading.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 pt-8 border-t border-slate-800 grid grid-cols-3 gap-4">
          <div>
            <Receipt size={22} className="text-amber-400 mb-2" />
            <p className="text-xs font-semibold text-white">Cash Flow</p>
            <p className="text-[11px] text-slate-400">Pencatatan per dompet</p>
          </div>
          <div>
            <TrendUp size={22} className="text-emerald-400 mb-2" />
            <p className="text-xs font-semibold text-white">Portfolio</p>
            <p className="text-[11px] text-slate-400">Pemantauan harga real-time</p>
          </div>
          <div>
            <BookBookmark size={22} className="text-blue-300 mb-2" />
            <p className="text-xs font-semibold text-white">Journal</p>
            <p className="text-[11px] text-slate-400">Evaluasi win & loss</p>
          </div>
        </div>
      </div>

      {/* FORM SECTION */}
      <div className="md:w-1/2 p-6 md:p-16 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6 bg-white p-8 md:p-10 rounded-xl shadow-xs border border-slate-200">
          <div>
            <h2 className="font-serif-heading text-xl font-bold text-slate-900">
              Selamat datang kembali
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              Masukkan email dan kata sandi akun Jurnalyst Anda.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
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
              {loading ? 'Memproses...' : 'Masuk ke Akun'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            Belum punya akun?{' '}
            <Link href="/register" className="text-[#B8802E] font-semibold hover:underline">
              Daftar di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}