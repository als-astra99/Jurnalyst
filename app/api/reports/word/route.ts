import { NextRequest, NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, ShadingType } from 'docx'

function formatRupiah(v: number) {
  return 'Rp ' + v.toLocaleString('id-ID')
}

function cell(text: string, opts: { header?: boolean; width?: number } = {}) {
  return new TableCell({
    width: { size: opts.width || 2000, type: WidthType.DXA },
    shading: opts.header ? { type: ShadingType.CLEAR, fill: 'DBEAFE' } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: !!opts.header, size: 19 })] })],
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { periodLabel, groups, totalIncome, totalExpense } = body

  const colWidths = [1800, 2200, 1800, 1600, 2400, 1600]

  const rows: TableRow[] = [
    new TableRow({
      children: ['Tanggal', 'Kategori', 'Dompet', 'Jenis', 'Catatan', 'Jumlah'].map((t, i) =>
        cell(t, { header: true, width: colWidths[i] })
      ),
    }),
  ]

  for (const g of groups) {
    for (const item of g.items) {
      rows.push(
        new TableRow({
          children: [
            cell(g.dayLabel, { width: colWidths[0] }),
            cell(item.kategori, { width: colWidths[1] }),
            cell(item.dompet, { width: colWidths[2] }),
            cell(item.jenis, { width: colWidths[3] }),
            cell(item.catatan || '-', { width: colWidths[4] }),
            cell((item.jenis === 'Pemasukan' ? '+' : '-') + formatRupiah(item.jumlah), { width: colWidths[5] }),
          ],
        })
      )
    }
  }

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: 'Riwayat Transaksi - Jurnalyst', bold: true, size: 32 })],
          }),
          new Paragraph({
            spacing: { after: 300 },
            children: [new TextRun({ text: `Periode: ${periodLabel}`, italics: true, size: 22 })],
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            columnWidths: colWidths,
            rows,
          }),
          new Paragraph({ text: '', spacing: { after: 300 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `Total Pemasukan: ${formatRupiah(totalIncome)}`, bold: true, size: 22, color: '059669' })],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `Total Pengeluaran: ${formatRupiah(totalExpense)}`, bold: true, size: 22, color: 'DC2626' })],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `Saldo: ${formatRupiah(totalIncome - totalExpense)}`, bold: true, size: 24 })],
          }),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="Riwayat-Transaksi.docx"`,
    },
  })
}
