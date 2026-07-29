import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol')
  const type = request.nextUrl.searchParams.get('type')

  if (!symbol || !type) {
    return NextResponse.json({ error: 'symbol dan type wajib diisi' }, { status: 400 })
  }

  try {
    if (type === 'crypto') {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=idr`
      )
      const data = await res.json()
      const price = data[symbol]?.idr
      if (!price) return NextResponse.json({ error: 'Harga tidak ditemukan' }, { status: 404 })
      return NextResponse.json({ price })
    }

    if (type === 'stock') {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
      )
      const data = await res.json()
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
      if (!price) return NextResponse.json({ error: 'Harga tidak ditemukan' }, { status: 404 })
      return NextResponse.json({ price })
    }

    return NextResponse.json({ error: 'Tipe tidak dikenal' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: 'Gagal mengambil harga' }, { status: 500 })
  }
}