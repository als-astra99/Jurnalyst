import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, createApiClient } from '@/lib/supabase/api'

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) return NextResponse.json({ error: 'Token tidak ada' }, { status: 401 })

  const supabase = createApiClient(token)
  const { data, error } = await supabase
    .from('transactions')
    .select('*, accounts(name), categories(name)')
    .order('transaction_date', { ascending: false })

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

  // Validasi: pastikan type transaksi cocok dengan type kategori
  const { data: category } = await supabase
    .from('categories')
    .select('type')
    .eq('id', body.category_id)
    .single()

  if (category && category.type !== body.type) {
    return NextResponse.json(
      { error: `Kategori ini bertipe '${category.type}', tapi transaksi dikirim sebagai '${body.type}'` },
      { status: 400 }
    )
  }

  const { data, error } = await supabase.from('transactions').insert({
    user_id: user.id,
    account_id: body.account_id,
    category_id: body.category_id,
    amount: body.amount,
    type: body.type,
    note: body.note,
    transaction_date: body.transaction_date,
  }).select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data }, { status: 201 })
}