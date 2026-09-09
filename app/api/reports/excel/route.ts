import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

/* eslint-disable @typescript-eslint/no-explicit-any */

type WalletSummary = { name: string; income: number; expense: number }
type PeriodSummary = { label: string; income: number; expense: number }

const HARI   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
const NAVY   = 'FF0F1E36'
const GOLD   = 'FFC9973A'
const GREEN  = 'FF059669'
const RED    = 'FFDC2626'
const WHITE  = 'FFFFFFFF'
const LIGHT  = 'FFF9F6EF'
const LIGHT2 = 'FFFEF7EC'

function borders(): ExcelJS.Borders {
  const s: ExcelJS.BorderStyle = 'thin'
  return {
    top:      { style: s, color: { argb: 'FFE5E7EB' } },
    bottom:   { style: s, color: { argb: 'FFE5E7EB' } },
    left:     { style: s, color: { argb: 'FFE5E7EB' } },
    right:    { style: s, color: { argb: 'FFE5E7EB' } },
    diagonal: {},
  }
}

function styleHeader(cell: ExcelJS.Cell, bg = NAVY) {
  cell.font      = { bold: true, color: { argb: WHITE }, size: 10 }
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
  cell.border    = borders()
}

function rupiahCell(cell: ExcelJS.Cell, value: number, color?: string) {
  cell.value     = value
  cell.numFmt    = '"Rp" #,##0'
  cell.alignment = { horizontal: 'right', vertical: 'middle' }
  cell.border    = borders()
  if (color) cell.font = { bold: true, color: { argb: color } }
}

function makeTitleRow(sh: ExcelJS.Worksheet, text: string, cols: number) {
  sh.mergeCells('A1:' + String.fromCharCode(64 + cols) + '1')
  const c   = sh.getCell('A1')
  c.value   = text
  c.font    = { bold: true, size: 13, color: { argb: NAVY } }
  c.alignment = { horizontal: 'left', vertical: 'middle' }
  sh.getRow(1).height = 26
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    periodLabel   = '',
    groups        = [],
    totalIncome   = 0,
    totalExpense  = 0,
    walletSummary  = [],
    monthlySummary = [],
    yearlySummary  = [],
  } = body as {
    periodLabel:    string
    groups:         any[]
    totalIncome:    number
    totalExpense:   number
    walletSummary:  WalletSummary[]
    monthlySummary: PeriodSummary[]
    yearlySummary:  PeriodSummary[]
  }

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Jurnalyst'
  wb.created = new Date()

  // Sheet 1: Riwayat Transaksi
  {
    const sh = wb.addWorksheet('Riwayat Transaksi', { views: [{ state: 'frozen', ySplit: 2 }] })
    sh.columns = [
      { width: 13 }, { width: 10 }, { width: 20 }, { width: 16 },
      { width: 14 }, { width: 28 }, { width: 18 },
    ]
    makeTitleRow(sh, 'Riwayat Transaksi - ' + periodLabel, 7)

    const hRow = sh.getRow(2)
    hRow.values = ['Tanggal', 'Hari', 'Kategori', 'Dompet', 'Jenis', 'Catatan', 'Jumlah']
    hRow.height = 22
    hRow.eachCell((c) => styleHeader(c))

    let ri = 3
    for (const g of groups) {
      for (const item of g.items) {
        const row  = sh.getRow(ri)
        const hari = HARI[new Date(g.date + 'T00:00:00').getDay()]
        row.values = [g.date, hari, item.kategori, item.dompet, item.jenis, item.catatan || '-', item.jumlah]
        row.eachCell((c, col) => {
          c.border    = borders()
          c.alignment = { vertical: 'middle' }
          if (col === 7) {
            c.numFmt    = '"Rp" #,##0'
            c.font      = { color: { argb: item.jenis === 'Pemasukan' ? GREEN : RED }, bold: true }
            c.alignment = { horizontal: 'right', vertical: 'middle' }
          }
          if (ri % 2 === 0 && col !== 7) {
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } }
          }
        })
        ri++
      }
    }

    ri++
    const addTot = (label: string, val: number, color: string) => {
      sh.getCell(ri, 5).value = label
      sh.getCell(ri, 5).font  = { bold: true, size: 10 }
      rupiahCell(sh.getCell(ri, 7), val, color)
      ri++
    }
    addTot('TOTAL PEMASUKAN',   totalIncome,              GREEN)
    addTot('TOTAL PENGELUARAN', totalExpense,              RED)
    addTot('SALDO',             totalIncome - totalExpense, NAVY)
  }

  // Sheet 2: Rekap per Dompet
  {
    const sh = wb.addWorksheet('Rekap per Dompet')
    sh.columns = [{ width: 28 }, { width: 22 }, { width: 22 }, { width: 22 }]
    makeTitleRow(sh, 'Rekap per Dompet - ' + periodLabel, 4)

    const hRow = sh.getRow(2)
    hRow.values = ['Nama Dompet', 'Pemasukan', 'Pengeluaran', 'Sisa (Saldo)']
    hRow.height = 22
    hRow.eachCell((c) => styleHeader(c, GOLD))

    let ri = 3, gInc = 0, gExp = 0
    for (const w of walletSummary) {
      const sisa = w.income - w.expense
      gInc += w.income
      gExp += w.expense
      const row = sh.getRow(ri)
      row.getCell(1).value     = w.name
      row.getCell(1).border    = borders()
      row.getCell(1).alignment = { vertical: 'middle' }
      if (ri % 2 === 0) {
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT2 } }
      }
      rupiahCell(row.getCell(2), w.income,  GREEN)
      rupiahCell(row.getCell(3), w.expense, RED)
      rupiahCell(row.getCell(4), sisa, sisa >= 0 ? GREEN : RED)
      ri++
    }

    ri++
    const totRow = sh.getRow(ri)
    for (let c = 1; c <= 4; c++) {
      totRow.getCell(c).fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
      totRow.getCell(c).font   = { bold: true, color: { argb: WHITE } }
      totRow.getCell(c).border = borders()
    }
    totRow.getCell(1).value     = 'TOTAL SEMUA DOMPET'
    totRow.getCell(1).alignment = { vertical: 'middle' }
    rupiahCell(totRow.getCell(2), gInc, GREEN)
    rupiahCell(totRow.getCell(3), gExp, RED)
    rupiahCell(totRow.getCell(4), gInc - gExp, gInc - gExp >= 0 ? GREEN : RED)
    for (let c = 1; c <= 4; c++) {
      totRow.getCell(c).font = { bold: true, color: { argb: WHITE } }
    }
    totRow.height = 22
  }

  // Sheet 3: Rekap per Bulan
  {
    const sh = wb.addWorksheet('Rekap per Bulan')
    sh.columns = [{ width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }]
    makeTitleRow(sh, 'Rekap per Bulan - Semua Periode', 4)

    const hRow = sh.getRow(2)
    hRow.values = ['Bulan', 'Pemasukan', 'Pengeluaran', 'Saldo']
    hRow.height = 22
    hRow.eachCell((c) => styleHeader(c))

    let ri = 3
    for (const m of monthlySummary) {
      const saldo = m.income - m.expense
      const row   = sh.getRow(ri)
      row.getCell(1).value     = m.label
      row.getCell(1).border    = borders()
      row.getCell(1).alignment = { vertical: 'middle' }
      if (ri % 2 === 0) {
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } }
      }
      rupiahCell(row.getCell(2), m.income,  GREEN)
      rupiahCell(row.getCell(3), m.expense, RED)
      rupiahCell(row.getCell(4), saldo, saldo >= 0 ? GREEN : RED)
      ri++
    }
  }

  // Sheet 4: Rekap per Tahun
  {
    const sh = wb.addWorksheet('Rekap per Tahun')
    sh.columns = [{ width: 16 }, { width: 22 }, { width: 22 }, { width: 22 }]
    makeTitleRow(sh, 'Rekap per Tahun', 4)

    const hRow = sh.getRow(2)
    hRow.values = ['Tahun', 'Pemasukan', 'Pengeluaran', 'Saldo']
    hRow.height = 22
    hRow.eachCell((c) => styleHeader(c))

    let ri = 3
    for (const y of yearlySummary) {
      const saldo = y.income - y.expense
      const row   = sh.getRow(ri)
      row.getCell(1).value     = y.label
      row.getCell(1).border    = borders()
      row.getCell(1).alignment = { vertical: 'middle' }
      if (ri % 2 === 0) {
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } }
      }
      rupiahCell(row.getCell(2), y.income,  GREEN)
      rupiahCell(row.getCell(3), y.expense, RED)
      rupiahCell(row.getCell(4), saldo, saldo >= 0 ? GREEN : RED)
      ri++
    }
  }

  const buffer = await wb.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Laporan-Jurnalyst-${String(periodLabel).replace(/\s+/g, '-')}.xlsx"`,
    },
  })
}