import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, createApiClient } from '@/lib/supabase/api'

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) return NextResponse.json({ error: 'Token tidak ada' }, { status: 401 })

  const supabase = createApiClient(token)
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*, portfolio_holdings(assets(name, symbol))')
    .order('entry_date', { ascending: false })

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

  const { data, error } = await supabase.from('journal_entries').insert({
    user_id: user.id,
    holding_id: body.holding_id || null,
    entry_type: body.entry_type,
    hypothesis: body.hypothesis,
    target_price: body.target_price || null,
    stop_loss: body.stop_loss || null,
    result: body.result,
    reflection: body.reflection || null,
    entry_date: body.entry_date,
  }).select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data }, { status: 201 })
}