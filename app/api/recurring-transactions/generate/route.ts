import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, createApiClient } from '@/lib/supabase/api'

/**
 * POST /api/recurring-transactions/generate
 *
 * Dipanggil saat halaman transaksi dibuka.
 * Untuk setiap recurring_transaction aktif milik user:
 *   - Hitung semua tanggal yang belum di-generate sejak last_generated (atau start_date)
 *     hingga HARI INI.
 *   - Insert ke tabel transactions untuk setiap tanggal yang cocok.
 *   - Update last_generated ke hari ini.
 * Mengembalikan jumlah transaksi yang dibuat.
 */
export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) return NextResponse.json({ error: 'Token tidak ada' }, { status: 401 })

  const supabase = createApiClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'User tidak valid' }, { status: 401 })

  // Ambil semua jadwal aktif milik user
  const { data: schedules, error: fetchErr } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('is_active', true)

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 400 })
  if (!schedules || schedules.length === 0) return NextResponse.json({ generated: 0 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toDateStr(today)

  let totalGenerated = 0

  for (const sched of schedules) {
    // Tentukan dari tanggal berapa kita mulai cek
    const fromStr = sched.last_generated
      ? nextDayStr(sched.last_generated)   // hari setelah terakhir di-generate
      : sched.start_date                   // awal pertama kali

    const from = parseDate(fromStr)
    const endDate = sched.end_date ? parseDate(sched.end_date) : null

    if (from > today) continue  // belum waktunya

    // Kumpulkan semua tanggal yang harus di-generate
    const datesToGenerate: string[] = []
    const cursor = new Date(from)

    while (cursor <= today) {
      const curStr = toDateStr(cursor)

      // Cek batas akhir
      if (endDate && cursor > endDate) break

      if (shouldGenerate(sched, cursor)) {
        datesToGenerate.push(curStr)
      }

      cursor.setDate(cursor.getDate() + 1)
    }

    if (datesToGenerate.length === 0) continue

    // Batch insert ke transactions
    const inserts = datesToGenerate.map((d) => ({
      user_id:          user.id,
      account_id:       sched.account_id,
      category_id:      sched.category_id,
      amount:           sched.amount,
      type:             sched.type,
      note:             sched.note
        ? `[Otomatis] ${sched.note}`
        : '[Transaksi Berulang]',
      transaction_date: d,
    }))

    const { error: insertErr } = await supabase
      .from('transactions')
      .insert(inserts)

    if (insertErr) {
      console.error('Generate error for sched', sched.id, insertErr.message)
      continue
    }

    totalGenerated += datesToGenerate.length

    // Update last_generated ke hari ini
    await supabase
      .from('recurring_transactions')
      .update({ last_generated: todayStr })
      .eq('id', sched.id)
  }

  return NextResponse.json({ generated: totalGenerated })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function parseDate(str: string): Date {
  const d = new Date(str + 'T00:00:00')
  return d
}

function nextDayStr(dateStr: string): string {
  const d = parseDate(dateStr)
  d.setDate(d.getDate() + 1)
  return toDateStr(d)
}

function shouldGenerate(sched: {
  frequency: string
  day_of_month: number | null
  month_of_year: number | null
}, date: Date): boolean {
  const dom = date.getDate()          // 1-31
  const moy = date.getMonth() + 1    // 1-12

  switch (sched.frequency) {
    case 'daily':
      return true

    case 'monthly':
      // Tanggal cocok ATAU akhir bulan jika hari lebih besar dari jumlah hari bulan tsb
      if (!sched.day_of_month) return false
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
      const targetDay = Math.min(sched.day_of_month, daysInMonth)
      return dom === targetDay

    case 'yearly':
      if (!sched.day_of_month || !sched.month_of_year) return false
      if (moy !== sched.month_of_year) return false
      const daysInYearMonth = new Date(date.getFullYear(), moy, 0).getDate()
      const targetYDay = Math.min(sched.day_of_month, daysInYearMonth)
      return dom === targetYDay

    default:
      return false
  }
}
