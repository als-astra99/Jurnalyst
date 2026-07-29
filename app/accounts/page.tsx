'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Account = {
  id: string
  name: string
  type: string
  balance: number
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [name, setName] = useState('')
  const [type, setType] = useState('cash')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const loadAccounts = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false })
    setAccounts(data || [])
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('accounts').insert({
        user_id: user.id,
        name,
        type,
        balance: 0,
        })

        if (error) {
        alert('Gagal menyimpan: ' + error.message)
        setLoading(false)
        return
        }

        setName('')
        setLoading(false)
        loadAccounts()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('accounts').delete().eq('id', id)
    loadAccounts()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <a href="/dashboard" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
          ← Kembali ke Dashboard
        </a>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Dompet / Rekening</h1>

        <form onSubmit={handleAdd} className="mb-8 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nama</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: BCA, Tunai, GoPay"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Jenis</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="cash">Tunai</option>
                <option value="bank">Bank</option>
                <option value="e-wallet">E-Wallet</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            {loading ? 'Menyimpan...' : 'Tambah Dompet'}
          </button>
        </form>

        <div className="rounded-lg bg-white shadow">
          {accounts.length === 0 ? (
            <p className="p-6 text-gray-500">Belum ada dompet ditambahkan.</p>
          ) : (
            accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between border-b p-4 last:border-b-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{acc.name}</p>
                  <p className="text-sm text-gray-500">{acc.type}</p>
                </div>
                <button
                  onClick={() => handleDelete(acc.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Hapus
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}