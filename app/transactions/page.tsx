'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Account = { id: string; name: string }
type Category = { id: string; name: string; type: string }
type Transaction = {
  id: string
  amount: number
  type: string
  note: string
  transaction_date: string
  accounts: { name: string } | null
  categories: { name: string } | null
}

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const loadData = async () => {
    const { data: acc } = await supabase.from('accounts').select('id, name')
    const { data: cat } = await supabase.from('categories').select('id, name, type')
    const { data: trx } = await supabase
      .from('transactions')
      .select('id, amount, type, note, transaction_date, accounts(name), categories(name)')
      .order('transaction_date', { ascending: false })
      .limit(20)

    setAccounts(acc || [])
    setCategories(cat || [])
    setTransactions((trx as any) || [])
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredCategories = categories.filter((c) => c.type === type)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      account_id: accountId,
      category_id: categoryId,
      amount: parseFloat(amount),
      type,
      note,
      transaction_date: date,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setAmount('')
    setNote('')
    setLoading(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id)
    loadData()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <a href="/dashboard" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
          ← Kembali ke Dashboard
        </a>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Transaksi</h1>

        {accounts.length === 0 || categories.length === 0 ? (
          <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
            Tambahkan minimal 1 dompet dan 1 kategori dulu sebelum input transaksi.{' '}
            <a href="/accounts" className="underline">Kelola Dompet</a> ·{' '}
            <a href="/categories" className="underline">Kelola Kategori</a>
          </div>
        ) : (
          <form onSubmit={handleAdd} className="mb-8 rounded-lg bg-white p-6 shadow">
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Jenis</label>
                <select
                  value={type}
                  onChange={(e) => { setType(e.target.value); setCategoryId('') }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Jumlah (Rp)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Dompet</label>
                <select
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Pilih dompet</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Pilih kategori</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tanggal</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Catatan (opsional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Makan siang"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              {loading ? 'Menyimpan...' : 'Tambah Transaksi'}
            </button>
          </form>
        )}

        <div className="rounded-lg bg-white shadow">
          <h2 className="border-b p-4 font-semibold text-gray-900">Riwayat Transaksi</h2>
          {transactions.length === 0 ? (
            <p className="p-6 text-gray-500">Belum ada transaksi.</p>
          ) : (
            transactions.map((trx) => (
              <div key={trx.id} className="flex items-center justify-between border-b p-4 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">
                    {trx.categories?.name} · {trx.accounts?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {trx.transaction_date} {trx.note && `· ${trx.note}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={trx.type === 'income' ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                    {trx.type === 'income' ? '+' : '-'} Rp {trx.amount.toLocaleString('id-ID')}
                  </span>
                  <button onClick={() => handleDelete(trx.id)} className="text-sm text-red-600 hover:underline">
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}