'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'motion/react'
import SelectInput, { SelectOption } from '@/components/ui/SelectInput'
import AnimatedContent from '@/components/reactbits/AnimatedContent'
import FadeContent    from '@/components/reactbits/FadeContent'
import StaggeredMenu  from '@/components/reactbits/StaggeredMenu'
import SpotlightCard  from '@/components/reactbits/SpotlightCard'
import BlurText       from '@/components/reactbits/BlurText'
import {
  Plus, Trash, CalendarDots, Lightning, CheckCircle,
  Warning, ArrowClockwise, CalendarBlank, RepeatOnce,
} from '@phosphor-icons/react'

// ── Types ─────────────────────────────────────────────────────────────────
type Account  = { id: string; name: string }
type Category = { id: string; name: string; type: string }

type RecurringSchedule = {
  id: string
  amount: number
  type: string
  note: string | null
  frequency: 'daily' | 'monthly' | 'yearly'
  day_of_month:  number | null
  month_of_year: number | null
  start_date:    string
  end_date:      string | null
  last_generated: string | null
  is_active: boolean
  accounts:   { name: string } | null
  categories: { name: string; type: string } | null
}

// ── Constants ─────────────────────────────────────────────────────────────
const BULAN = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
]

const FREQ_LABEL: Record<string, string> = {
  daily:   'Setiap Hari',
  monthly: 'Setiap Bulan',
  yearly:  'Setiap Tahun',
}

const FREQ_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  daily:   { bg: 'bg-sky-50',    text: 'text-sky-700',    border: 'border-sky-200' },
  monthly: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  yearly:  { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
}

function formatRupiah(v: number) {
  return 'Rp ' + Number(v).toLocaleString('id-ID')
}

function scheduleLabel(s: RecurringSchedule): string {
  if (s.frequency === 'daily')   return 'Setiap hari'
  if (s.frequency === 'monthly') return `Setiap tanggal ${s.day_of_month}`
  if (s.frequency === 'yearly')  return `Setiap ${s.day_of_month} ${BULAN[(s.month_of_year ?? 1) - 1]}`
  return '-'
}

// ── Animasi variants untuk field kondisional ──────────────────────────────
const fieldVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.97, transition: { duration: 0.18, ease: 'easeIn' as const } },
  visible: { opacity: 1, y: 0, scale: 1,    transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit:   { opacity: 0, y: -8, scale: 0.96, transition: { duration: 0.15, ease: 'easeIn' as const } },
}

// ── Component ─────────────────────────────────────────────────────────────
export default function RecurringTab() {
  const supabase = createClient()

  const [accounts,   setAccounts]   = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [schedules,  setSchedules]  = useState<RecurringSchedule[]>([])

  const [generating, setGenerating] = useState(false)
  const [generated,  setGenerated]  = useState<number | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [type,        setType]        = useState('expense')
  const [accountId,   setAccountId]   = useState('')
  const [categoryId,  setCategoryId]  = useState('')
  const [amount,      setAmount]      = useState('')
  const [note,        setNote]        = useState('')
  const [frequency,   setFrequency]   = useState<'daily'|'monthly'|'yearly'>('monthly')
  const [dayOfMonth,  setDayOfMonth]  = useState('1')
  const [monthOfYear, setMonthOfYear] = useState('1')
  const [startDate,   setStartDate]   = useState(new Date().toISOString().slice(0, 10))
  const [endDate,     setEndDate]     = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const filteredCategories = categories.filter((c) => c.type === type)

  // ── Load data ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const [{ data: acc }, { data: cat }] = await Promise.all([
      supabase.from('accounts').select('id, name'),
      supabase.from('categories').select('id, name, type'),
    ])
    setAccounts(acc || [])
    setCategories(cat || [])
    await loadSchedules()
  }, [])

  const loadSchedules = async () => {
    const { data } = await supabase
      .from('recurring_transactions')
      .select('*, accounts(name), categories(name, type)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    setSchedules((data as any) || [])
  }

  // ── Auto-generate saat mount ───────────────────────────────────────────
  const runGenerate = useCallback(async () => {
    setGenerating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res  = await fetch('/api/recurring-transactions/generate', {
        method:  'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()
      if (json.generated > 0) setGenerated(json.generated)
    } catch (_) {}
    setGenerating(false)
  }, [])

  useEffect(() => { loadData(); runGenerate() }, [])

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const body: Record<string, unknown> = {
      account_id:  accountId,
      category_id: categoryId,
      amount:      parseFloat(amount),
      type,
      note:        note || null,
      frequency,
      start_date:  startDate,
      end_date:    endDate || null,
    }
    if (frequency === 'monthly' || frequency === 'yearly') body.day_of_month  = parseInt(dayOfMonth)
    if (frequency === 'yearly')                            body.month_of_year = parseInt(monthOfYear)

    const res  = await fetch('/api/recurring-transactions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body:    JSON.stringify(body),
    })
    const json = await res.json()

    if (!res.ok) { setError(json.error || 'Gagal menyimpan'); setLoading(false); return }

    setAmount(''); setNote(''); setEndDate('')
    setLoading(false)
    await loadSchedules()
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Nonaktifkan jadwal berulang ini?')) return
    setDeletingId(id)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch(`/api/recurring-transactions/${id}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    setDeletingId(null)
    await loadSchedules()
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Banner: transaksi di-generate */}
      <AnimatePresence>
        {generated !== null && generated > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,   scale: 1 }}
            exit={{    opacity: 0, y: -10,  scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 p-4 rounded-xl border text-sm font-medium"
            style={{
              background: 'linear-gradient(135deg, #F0FBF5, #E6F7EE)',
              border: '1px solid #A7D7BB',
              color: '#145C3E',
            }}
          >
            <motion.span
              animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Lightning size={18} weight="fill" className="text-emerald-500 shrink-0" />
            </motion.span>
            <span>
              <strong>{generated}</strong> transaksi berulang baru otomatis dicatat hari ini.
            </span>
            <button
              onClick={() => setGenerated(null)}
              className="ml-auto text-emerald-400 hover:text-emerald-600 transition-colors text-xs"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Form tambah jadwal ────────────────────────────────────────── */}
      <AnimatedContent distance={32} duration={0.65} threshold={0.04} delay={0}>
        <SpotlightCard
          spotlightColor="rgba(167, 139, 250, 0.12)"
          className="stitched-card p-6 rounded-2xl"
          style={{ background: '#FFFFFF' }}
        >
          {/* Header form */}
          <FadeContent duration={400} delay={100} threshold={0.01}>
            <div
              className="mb-5 pb-3 flex items-center gap-2.5"
              style={{ borderBottom: '1px solid #F0EDE5' }}
            >
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ duration: 0.25 }}
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #DDD0FF, #BBA8F5)', color: '#3B1FA8' }}
              >
                <RepeatOnce size={14} weight="bold" />
              </motion.div>
              <BlurText
                text="Tambah Jadwal Transaksi Berulang"
                className="font-serif-heading text-sm font-bold"
                animateBy="words"
                direction="top"
                stepDuration={0.25}
                delay={60}
              />
            </div>
          </FadeContent>

          {accounts.length === 0 || categories.length === 0 ? (
            <FadeContent duration={400} delay={200} threshold={0.01}>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <Warning size={18} className="shrink-0 text-amber-600 mt-0.5" />
                <span>Tambahkan minimal 1 dompet dan 1 kategori terlebih dahulu.</span>
              </div>
            </FadeContent>
          ) : (
            <form onSubmit={handleAdd} className="space-y-5">

              {/* Grid fields — stagger setiap field */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <StaggeredMenu staggerDelay={0.06} initialDelay={0.15}>

                  {/* Jenis Transaksi */}
                  <SelectInput
                    label="Jenis Transaksi"
                    value={type}
                    onChange={setType}
                    options={[
                      { value: 'expense', label: 'Pengeluaran (−)', sublabel: 'Uang keluar' },
                      { value: 'income',  label: 'Pemasukan (+)',   sublabel: 'Uang masuk'  },
                    ] as SelectOption[]}
                  />

                  {/* Dompet */}
                  <SelectInput
                    label="Dompet"
                    required
                    value={accountId}
                    onChange={setAccountId}
                    placeholder="Pilih Dompet"
                    options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                  />

                  {/* Kategori */}
                  <SelectInput
                    label="Kategori"
                    required
                    value={categoryId}
                    onChange={setCategoryId}
                    placeholder="Pilih Kategori"
                    options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))}
                  />

                  {/* Jumlah */}
                  <div>
                    <label className="form-label">Jumlah (Rp)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="500000"
                      className="form-input font-number-mono"
                    />
                  </div>

                  {/* Frekuensi */}
                  <SelectInput
                    label="Frekuensi Pengulangan"
                    value={frequency}
                    onChange={(v) => setFrequency(v as 'daily'|'monthly'|'yearly')}
                    options={[
                      { value: 'daily',   label: 'Harian',  sublabel: 'Setiap hari' },
                      { value: 'monthly', label: 'Bulanan', sublabel: 'Setiap tanggal tertentu tiap bulan' },
                      { value: 'yearly',  label: 'Tahunan', sublabel: 'Setiap tanggal + bulan tertentu tiap tahun' },
                    ] as SelectOption[]}
                  />

                  {/* Keterangan */}
                  <div>
                    <label className="form-label">Keterangan (opsional)</label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="contoh: Gaji bulanan"
                      className="form-input"
                    />
                  </div>

                </StaggeredMenu>
              </div>

              {/* Field kondisional — slide+fade saat frekuensi berubah */}
              <AnimatePresence mode="popLayout">
                {(frequency === 'monthly' || frequency === 'yearly') && (
                  <motion.div
                    key="day-field"
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <label className="form-label">
                      Tanggal{frequency === 'yearly' ? ' dalam Bulan' : ''}{' '}
                      <span className="text-amber-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="31"
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(e.target.value)}
                      placeholder="contoh: 30"
                      className="form-input font-number-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tanggal 29&ndash;31 akan menyesuaikan ke hari terakhir bulan jika bulan pendek.
                    </p>
                  </motion.div>
                )}

                {frequency === 'yearly' && (
                  <motion.div
                    key="month-field"
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <SelectInput
                      label="Bulan dalam Tahun *"
                      value={monthOfYear}
                      onChange={setMonthOfYear}
                      options={BULAN.map((b, i) => ({ value: String(i + 1), label: b }))}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tanggal mulai & akhir */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StaggeredMenu staggerDelay={0.07} initialDelay={0.3}>
                  <div>
                    <label className="form-label">Mulai Berlaku</label>
                    <input
                      type="date"
                      value={startDate}
                      min={today}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="form-input date-input-premium"
                    />
                  </div>
                  <div>
                    <label className="form-label">Berakhir (opsional)</label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="form-input date-input-premium"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Kosongkan = berlaku selamanya.</p>
                  </div>
                </StaggeredMenu>
              </div>

              {/* Preview label — FadeContent */}
              <FadeContent duration={300} delay={0} threshold={0.01}>
                <motion.div
                  key={`${type}-${frequency}-${amount}-${dayOfMonth}-${monthOfYear}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="p-3 rounded-lg text-xs flex items-center gap-2"
                  style={{ background: '#F9F6EF', border: '1px solid #EDE9E0', color: '#64748B' }}
                >
                  <CalendarDots size={14} className="text-amber-500 shrink-0" />
                  <span>
                    {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}&nbsp;
                    <strong className="text-slate-800">
                      {amount ? formatRupiah(parseFloat(amount)) : 'Rp \u2026'}
                    </strong>
                    {' '}akan dicatat otomatis{' '}
                    <strong className="text-slate-800">
                      {frequency === 'daily'
                        ? 'setiap hari'
                        : frequency === 'monthly'
                        ? `setiap tanggal ${dayOfMonth} tiap bulan`
                        : `setiap ${dayOfMonth} ${BULAN[parseInt(monthOfYear) - 1]} tiap tahun`}
                    </strong>
                    {endDate ? ` hingga ${endDate}` : ', tanpa batas waktu'}.
                  </span>
                </motion.div>
              </FadeContent>

              {error && (
                <motion.p
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-[#D14343] font-medium bg-red-50 p-2.5 rounded-lg border border-red-200"
                >
                  {error}
                </motion.p>
              )}

              <div className="flex justify-end">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.03 }}
                  whileTap={{  scale: loading ? 1 : 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="btn-primary"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <ArrowClockwise size={13} className="animate-spin" />
                      Menyimpan...
                    </span>
                  ) : 'Simpan Jadwal'}
                </motion.button>
              </div>
            </form>
          )}
        </SpotlightCard>
      </AnimatedContent>

      {/* ── Daftar jadwal aktif ──────────────────────────────────────── */}
      <AnimatedContent distance={28} duration={0.65} threshold={0.04} delay={0.08}>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', boxShadow: '0 1px 4px rgba(26,31,46,0.04)' }}
        >
          {/* Header list */}
          <div
            className="px-5 py-3.5 flex items-center justify-between"
            style={{ background: 'linear-gradient(to right, #FAFAF7, #F5F2EB)', borderBottom: '1px solid #EDE9E0' }}
          >
            <h2 className="font-serif-heading font-bold text-sm" style={{ color: '#1A1F2E' }}>
              Jadwal Aktif
            </h2>
            <div className="flex items-center gap-2">
              <AnimatePresence>
                {generating && (
                  <motion.span
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{   opacity: 0, x: 6 }}
                    className="text-[11px] text-amber-600 flex items-center gap-1"
                  >
                    <ArrowClockwise size={11} className="animate-spin" />
                    Memproses...
                  </motion.span>
                )}
              </AnimatePresence>
              <span
                className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', color: '#64748B' }}
              >
                {schedules.length} Jadwal
              </span>
            </div>
          </div>

          {schedules.length === 0 ? (
            <FadeContent duration={500} delay={200} threshold={0.01}>
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4"
                >
                  <CalendarDots size={28} />
                </motion.div>
                <p className="font-serif-heading text-base font-bold text-slate-700">Belum Ada Jadwal</p>
                <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                  Buat jadwal di atas untuk mencatat transaksi berulang secara otomatis.
                </p>
              </div>
            </FadeContent>
          ) : (
            <div className="divide-y divide-slate-100">
              <AnimatePresence initial={false}>
                {schedules.map((s, idx) => {
                  const fc = FREQ_COLOR[s.frequency]
                  return (
                    <motion.div
                      key={s.id}
                      layout
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{   opacity: 0, x: 16, height: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.3, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                      className="p-4 sm:p-5 hover:bg-slate-50/40 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Kiri */}
                        <div className="flex items-center gap-3 min-w-0">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                              s.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {s.type === 'income' ? '+' : '\u2212'}
                          </motion.div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900">
                                {s.note || s.categories?.name || 'Transaksi Berulang'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${fc.bg} ${fc.text} ${fc.border}`}>
                                {FREQ_LABEL[s.frequency]}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <CalendarBlank size={11} className="text-amber-500" />
                              <span>{scheduleLabel(s)}</span>
                              {s.accounts   && <><span>&middot;</span><span>{s.accounts.name}</span></>}
                              {s.categories && <><span>&middot;</span><span>{s.categories.name}</span></>}
                            </p>
                          </div>
                        </div>

                        {/* Kanan */}
                        <div className="flex items-center gap-4 sm:justify-end shrink-0">
                          <span className={`font-bold text-sm font-number-mono ${s.type === 'income' ? 'text-[#2F9E6E]' : 'text-[#D14343]'}`}>
                            {s.type === 'income' ? '+' : '\u2212'}{formatRupiah(s.amount)}
                          </span>
                          <motion.button
                            onClick={() => handleDelete(s.id)}
                            disabled={deletingId === s.id}
                            title="Nonaktifkan jadwal"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{  scale: 0.9 }}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
                          >
                            {deletingId === s.id
                              ? <ArrowClockwise size={14} className="animate-spin" />
                              : <Trash size={14} />
                            }
                          </motion.button>
                        </div>
                      </div>

                      {/* Footer info */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-number-mono">
                        <span>Mulai: <strong className="text-slate-600">{s.start_date}</strong></span>
                        {s.end_date && <span>Berakhir: <strong className="text-slate-600">{s.end_date}</strong></span>}
                        {s.last_generated
                          ? <span className="flex items-center gap-1">
                              <CheckCircle size={11} className="text-emerald-500" />
                              Terakhir dicatat: <strong className="text-slate-600">{s.last_generated}</strong>
                            </span>
                          : <motion.span
                              animate={{ opacity: [1, 0.5, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="text-amber-500 flex items-center gap-1"
                            >
                              <CalendarDots size={11} />
                              Belum pernah dicatat
                            </motion.span>
                        }
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </AnimatedContent>

    </div>
  )
}
