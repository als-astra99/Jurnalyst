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
    // Aturan generate:
    // 1. Hanya generate untuk HARI INI saja (tidak backfill hari-hari yang terlewat)
    // 2. Tidak boleh generate jika hari ini sudah pernah di-generate (last_generated === today)
    // 3. Tidak boleh generate sebelum start_date
    // 4. Tidak boleh generate setelah end_date

    // Sudah di-generate hari ini — skip
    if (sched.last_generated === todayStr) continue

    // Hari ini sebelum start_date — skip
    if (todayStr < sched.start_date) continue

    // Hari ini setelah end_date — skip
    if (sched.end_date && todayStr > sched.end_date) continue

    // Cek apakah hari ini memenuhi pola frekuensi
    if (!shouldGenerate(sched, today)) {
      // Tandai sudah dicek hari ini agar tidak cek ulang
      await supabase
        .from('recurring_transactions')
        .update({ last_generated: todayStr })
        .eq('id', sched.id)
      continue
    }

    const notePrefix = sched.note
      ? '[Otomatis] ' + sched.note
      : '[Transaksi Berulang]'

    // Cek duplikat untuk hari ini saja
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('account_id',       sched.account_id)
      .eq('category_id',      sched.category_id)
      .eq('amount',           sched.amount)
      .eq('type',             sched.type)
      .eq('note',             notePrefix)
      .eq('transaction_date', todayStr)
      .limit(1)

    if (existing && existing.length > 0) {
      // Sudah ada — tandai last_generated dan skip insert
      await supabase
        .from('recurring_transactions')
        .update({ last_generated: todayStr })
        .eq('id', sched.id)
      continue
    }

    // Insert transaksi hari ini
    const { error: insertErr } = await supabase
      .from('transactions')
      .insert({
        user_id:          user.id,
        account_id:       sched.account_id,
        category_id:      sched.category_id,
        amount:           sched.amount,
        type:             sched.type,
        note:             notePrefix,
        transaction_date: todayStr,
      })

    if (insertErr) {
      console.error('Generate error for sched', sched.id, insertErr.message)
      continue
    }

    // Update last_generated setelah berhasil insert
    await supabase
      .from('recurring_transactions')
      .update({ last_generated: todayStr })
      .eq('id', sched.id)

    totalGenerated++
  }

  return NextResponse.json({ generated: totalGenerated })
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function shouldGenerate(
  sched: { frequency: string; day_of_month: number | null; month_of_year: number | null },
  date: Date
): boolean {
  const dom = date.getDate()
  const moy = date.getMonth() + 1

  switch (sched.frequency) {
    case 'daily':
      // Setiap hari — selalu true
      return true

    case 'monthly': {
      // Hanya di tanggal yang ditentukan tiap bulan
      if (!sched.day_of_month) return false
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
      return dom === Math.min(sched.day_of_month, daysInMonth)
    }

    case 'yearly': {
      // Hanya di tanggal + bulan yang ditentukan tiap tahun
      if (!sched.day_of_month || !sched.month_of_year) return false
      if (moy !== sched.month_of_year) return false
      const daysInYearMonth = new Date(date.getFullYear(), moy, 0).getDate()
      return dom === Math.min(sched.day_of_month, daysInYearMonth)
    }

    default:
      return false
  }
}
