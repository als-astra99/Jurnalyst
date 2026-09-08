import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, createApiClient } from '@/lib/supabase/api'

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) return NextResponse.json({ error: 'Token tidak ada' }, { status: 401 })

  const supabase = createApiClient(token)
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*, accounts(name), categories(name, type)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) return NextResponse.json({ error: 'Token tidak ada' }, { status: 401 })

  const supabase = createApiClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'User tidak valid' }, { status: 401 })

  const body = await request.json()

  // Validasi frekuensi
  if (!['daily', 'monthly', 'yearly'].includes(body.frequency)) {
    return NextResponse.json({ error: 'Frekuensi tidak valid' }, { status: 400 })
  }
  if (body.frequency === 'monthly' && !body.day_of_month) {
    return NextResponse.json({ error: 'day_of_month wajib untuk frekuensi bulanan' }, { status: 400 })
  }
  if (body.frequency === 'yearly' && (!body.day_of_month || !body.month_of_year)) {
    return NextResponse.json({ error: 'day_of_month dan month_of_year wajib untuk frekuensi tahunan' }, { status: 400 })
  }

  const { data, error } = await supabase.from('recurring_transactions').insert({
    user_id:       user.id,
    account_id:    body.account_id,
    category_id:   body.category_id,
    amount:        body.amount,
    type:          body.type,
    note:          body.note || null,
    frequency:     body.frequency,
    day_of_month:  body.day_of_month  || null,
    month_of_year: body.month_of_year || null,
    start_date:    body.start_date    || new Date().toISOString().slice(0, 10),
    end_date:      body.end_date      || null,
    is_active:     true,
  }).select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data }, { status: 201 })
}
