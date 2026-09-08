import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, createApiClient } from '@/lib/supabase/api'

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) return NextResponse.json({ error: 'Token tidak ada' }, { status: 401 })

  const supabase = createApiClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'User tidak valid' }, { status: 401 })

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
    // Tentukan titik mulai:
    // - Jika sudah pernah di-generate, mulai dari hari SETELAH last_generated
    // - Jika belum pernah, mulai dari start_date
    // - Tidak boleh lebih awal dari start_date
    const afterLastGen = sched.last_generated
      ? nextDayStr(sched.last_generated)
      : sched.start_date

    const fromStr = afterLastGen >= sched.start_date ? afterLastGen : sched.start_date
    const from    = parseDate(fromStr)
    const endDate = sched.end_date ? parseDate(sched.end_date) : null

    // Belum waktunya
    if (from > today) continue

    // Kumpulkan tanggal yang harus di-generate
    const datesToGenerate: string[] = []
    const cursor = new Date(from)

    while (cursor <= today) {
      if (endDate && cursor > endDate) break
      if (shouldGenerate(sched, cursor)) {
        datesToGenerate.push(toDateStr(cursor))
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    // Selalu update last_generated ke hari ini agar tidak generate ulang
    await supabase
      .from('recurring_transactions')
      .update({ last_generated: todayStr })
      .eq('id', sched.id)

    if (datesToGenerate.length === 0) continue

    // Cek duplikat: ambil transaksi yang sudah ada untuk jadwal ini di tanggal-tanggal tsb
    // Identifikasi via note prefix "[Otomatis]" + account_id + category_id + tanggal
    const notePrefix = sched.note ? `[Otomatis] ${sched.note}` : '[Transaksi Berulang]'

    const { data: existing } = await supabase
      .from('transactions')
      .select('transaction_date')
      .eq('account_id',  sched.account_id)
      .eq('category_id', sched.category_id)
      .eq('amount',      sched.amount)
      .eq('type',        sched.type)
      .eq('note',        notePrefix)
      .in('transaction_date', datesToGenerate)

    const existingDates = new Set((existing || []).map((t: { transaction_date: string }) => t.transaction_date))

    // Filter hanya tanggal yang belum ada
    const newDates = datesToGenerate.filter((d) => !existingDates.has(d))

    if (newDates.length === 0) continue

    const inserts = newDates.map((d) => ({
      user_id:          user.id,
      account_id:       sched.account_id,
      category_id:      sched.category_id,
      amount:           sched.amount,
      type:             sched.type,
      note:             notePrefix,
      transaction_date: d,
    }))

    const { error: insertErr } = await supabase
      .from('transactions')
      .insert(inserts)

    if (insertErr) {
      console.error('Generate error for sched', sched.id, insertErr.message)
      continue
    }

    totalGenerated += newDates.length
  }

  return NextResponse.json({ generated: totalGenerated })
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function parseDate(str: string): Date {
  return new Date(str + 'T00:00:00')
}

function nextDayStr(dateStr: string): string {
  const d = parseDate(dateStr)
  d.setDate(d.getDate() + 1)
  return toDateStr(d)
}

function shouldGenerate(
  sched: { frequency: string; day_of_month: number | null; month_of_year: number | null },
  date: Date
): boolean {
  const dom = date.getDate()
  const moy = date.getMonth() + 1

  switch (sched.frequency) {
    case 'daily':
      return true

    case 'monthly': {
      if (!sched.day_of_month) return false
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
      return dom === Math.min(sched.day_of_month, daysInMonth)
    }

    case 'yearly': {
      if (!sched.day_of_month || !sched.month_of_year) return false
      if (moy !== sched.month_of_year) return false
      const daysInYearMonth = new Date(date.getFullYear(), moy, 0).getDate()
      return dom === Math.min(sched.day_of_month, daysInYearMonth)
    }

    default:
      return false
  }
}
