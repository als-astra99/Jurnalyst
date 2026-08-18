import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

function formatRupiahNum(v: number) {
  return v
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { periodLabel, groups, totalIncome, totalExpense } = body

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Jurnalyst'
  const sheet = workbook.addWorksheet('Riwayat Transaksi', {
    views: [{ state: 'frozen', ySplit: 2 }],
  })

  // Kolom — tanpa header otomatis (kita tulis manual)
  sheet.columns = [
    { key: 'tanggal', width: 14 },
    { key: 'hari', width: 10 },
    { key: 'kategori', width: 18 },
    { key: 'dompet', width: 14 },
    { key: 'jenis', width: 14 },
    { key: 'catatan', width: 26 },
    { key: 'jumlah', width: 16 },
  ]

  // ===== Baris 1: Judul =====
  sheet.mergeCells('A1:G1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = `Riwayat Transaksi Jurnalyst — ${periodLabel}`
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF1D4ED8' } }
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' }
  sheet.getRow(1).height = 26

  // ===== Baris 2: Header =====
  const headerRow = sheet.getRow(2)
  headerRow.values = ['Tanggal', 'Hari', 'Kategori', 'Dompet', 'Jenis', 'Catatan', 'Jumlah']
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    }
  })
  headerRow.height = 20

  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

  let rowIndex = 3
  for (const g of groups) {
    for (const item of g.items) {
      const row = sheet.getRow(rowIndex)
      const hariNama = HARI[new Date(g.date + 'T00:00:00').getDay()]
      row.values = [g.date, hariNama, item.kategori, item.dompet, item.jenis, item.catatan || '-', item.jumlah]

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        }
        if (colNumber === 7) {
          cell.numFmt = '"Rp" #,##0'
          cell.font = { color: { argb: item.jenis === 'Pemasukan' ? 'FF059669' : 'FFDC2626' }, bold: true }
          cell.alignment = { horizontal: 'right' }
        }
      })

      // warna selang-seling per baris supaya mudah dibaca
      if (rowIndex % 2 === 0) {
        row.eachCell((cell) => {
          if (!cell.fill || cell.fill.type !== 'pattern') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
          }
        })
      }

      rowIndex++
    }
  }

  // ===== Baris total =====
  rowIndex += 1
  const addTotalRow = (label: string, value: number, color: string) => {
    const row = sheet.getRow(rowIndex)
    row.getCell(5).value = label
    row.getCell(5).font = { bold: true }
    row.getCell(7).value = value
    row.getCell(7).numFmt = '"Rp" #,##0'
    row.getCell(7).font = { bold: true, color: { argb: color } }
    row.getCell(7).alignment = { horizontal: 'right' }
    rowIndex++
  }

  addTotalRow('TOTAL PEMASUKAN', totalIncome, 'FF059669')
  addTotalRow('TOTAL PENGELUARAN', totalExpense, 'FFDC2626')
  addTotalRow('SALDO', totalIncome - totalExpense, 'FF111827')

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Riwayat-Transaksi.xlsx"`,
    },
  })
}