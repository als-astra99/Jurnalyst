import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, createApiClient } from '@/lib/supabase/api'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = getTokenFromRequest(request)
  if (!token) return NextResponse.json({ error: 'Token tidak ada' }, { status: 401 })

  const supabase = createApiClient(token)
  const body = await request.json()

  const { data, error } = await supabase.from('categories').update(body).eq('id', id).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = getTokenFromRequest(request)
  if (!token) return NextResponse.json({ error: 'Token tidak ada' }, { status: 401 })

  const supabase = createApiClient(token)
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}