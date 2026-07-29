import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, createApiClient } from '@/lib/supabase/api'

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) return NextResponse.json({ error: 'Token tidak ada' }, { status: 401 })

  const supabase = createApiClient(token)
  const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false })

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

  const { data, error } = await supabase.from('assets').insert({
    user_id: user.id,
    symbol: body.symbol,
    name: body.name,
    asset_type: body.asset_type,
  }).select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data }, { status: 201 })
}