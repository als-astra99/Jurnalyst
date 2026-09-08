import { NextRequest, NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, ShadingType, BorderStyle } from 'docx'

type WalletSummary = { name: string; income: number; expense: number }
type PeriodSummary = { label: string; income: number; expense: number }

function formatRupiah(v: number) { return 'Rp ' + Number(v).toLocaleString('id-ID') }

function cell(text: string, opts: { bold?: boolean; width?: number; bg?: string; color?: string } = {}) {
  return new TableCell({
    width: { size: opts.width || 2000, type: WidthType.DXA },
    shading: opts.bg ? { type: ShadingType.CLEAR, fill: opts.bg } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, bold: opts.bold, size: 19, color: opts.color })]
    })],
  })
}

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 400, after: 160 },
    children: [new TextRun({ text, bold: true, size: 26, color: '0F1E36' })],
  })
}

function divider() {
  return new Paragraph({ text: '', spacing: { after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'C9973A', space: 4 } } })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    periodLabel = '',
    groups = [],
    totalIncome = 0,
    totalExpense = 0,
    walletSummary = [],
    monthlySummary = [],
    yearlySummary = [],
  } = body as {
    periodLabel: string
    groups: any[]
    totalIncome: number
    totalExpense: number
    walletSummary: WalletSummary[]
    monthlySummary: PeriodSummary[]
    yearlySummary: PeriodSummary[]
  }

  const HEADER_BG = 'DBEAFE'
  const GOLD_BG   = 'FEF3C7'
  const colWidths  = [1600, 2000, 1800, 1500, 2400, 1600]
  const rekapWidths = [3000, 2200, 2200, 2200]

  const trxRows: TableRow[] = [
    new TableRow({ children: ['Tanggal','Kategori','Dompet','Jenis','Catatan','Jumlah'].map((t,i) =>
      cell(t, { bold:true, width:colWidths[i], bg:HEADER_BG })) }),
  ]
  for (const g of groups) {
    for (const item of g.items) {
      trxRows.push(new TableRow({ children: [
        cell(g.dayLabel,                              { width:colWidths[0] }),
        cell(item.kategori,                           { width:colWidths[1] }),
        cell(item.dompet,                             { width:colWidths[2] }),
        cell(item.jenis,                              { width:colWidths[3] }),
        cell(item.catatan||'-',                       { width:colWidths[4] }),
        cell((item.jenis==='Pemasukan'?'+':'-')+formatRupiah(item.jumlah), {
          width:colWidths[5], color:item.jenis==='Pemasukan'?'059669':'DC2626', bold:true }),
      ]}))
    }
  }

  const walletRows: TableRow[] = [
    new TableRow({ children: ['Nama Dompet','Pemasukan','Pengeluaran','Sisa (Saldo)'].map((t,i) =>
      cell(t, { bold:true, width:rekapWidths[i], bg:GOLD_BG })) }),
  ]
  let gInc=0, gExp=0
  for (const w of walletSummary as WalletSummary[]) {
    const sisa=w.income-w.expense; gInc+=w.income; gExp+=w.expense
    walletRows.push(new TableRow({ children: [
      cell(w.name,                  { width:rekapWidths[0] }),
      cell(formatRupiah(w.income),  { width:rekapWidths[1], color:'059669', bold:true }),
      cell(formatRupiah(w.expense), { width:rekapWidths[2], color:'DC2626', bold:true }),
      cell(formatRupiah(sisa),      { width:rekapWidths[3], color:sisa>=0?'059669':'DC2626', bold:true }),
    ]}))
  }
  walletRows.push(new TableRow({ children: [
    cell('TOTAL SEMUA DOMPET',        { width:rekapWidths[0], bold:true, bg:'E2E8F0' }),
    cell(formatRupiah(gInc),          { width:rekapWidths[1], bold:true, color:'059669', bg:'E2E8F0' }),
    cell(formatRupiah(gExp),          { width:rekapWidths[2], bold:true, color:'DC2626', bg:'E2E8F0' }),
    cell(formatRupiah(gInc-gExp),     { width:rekapWidths[3], bold:true, color:gInc-gExp>=0?'059669':'DC2626', bg:'E2E8F0' }),
  ]}))

  const monthRows: TableRow[] = [
    new TableRow({ children: ['Bulan','Pemasukan','Pengeluaran','Saldo'].map((t,i) =>
      cell(t, { bold:true, width:rekapWidths[i], bg:HEADER_BG })) }),
  ]
  for (const m of monthlySummary as PeriodSummary[]) {
    const saldo=m.income-m.expense
    monthRows.push(new TableRow({ children: [
      cell(m.label,                { width:rekapWidths[0] }),
      cell(formatRupiah(m.income), { width:rekapWidths[1], color:'059669', bold:true }),
      cell(formatRupiah(m.expense),{ width:rekapWidths[2], color:'DC2626', bold:true }),
      cell(formatRupiah(saldo),    { width:rekapWidths[3], color:saldo>=0?'059669':'DC2626', bold:true }),
    ]}))
  }

  const yearRows: TableRow[] = [
    new TableRow({ children: ['Tahun','Pemasukan','Pengeluaran','Saldo'].map((t,i) =>
      cell(t, { bold:true, width:rekapWidths[i], bg:HEADER_BG })) }),
  ]
  for (const y of yearlySummary as PeriodSummary[]) {
    const saldo=y.income-y.expense
    yearRows.push(new TableRow({ children: [
      cell(y.label,                { width:rekapWidths[0] }),
      cell(formatRupiah(y.income), { width:rekapWidths[1], color:'059669', bold:true }),
      cell(formatRupiah(y.expense),{ width:rekapWidths[2], color:'DC2626', bold:true }),
      cell(formatRupiah(saldo),    { width:rekapWidths[3], color:saldo>=0?'059669':'DC2626', bold:true }),
    ]}))
  }

  const doc = new Document({
    sections: [{ children: [
      new Paragraph({ heading:HeadingLevel.HEADING_1, spacing:{after:100},
        children:[new TextRun({ text:'Laporan Keuangan Jurnalyst', bold:true, size:36, color:'0F1E36' })] }),
      new Paragraph({ spacing:{after:400},
        children:[new TextRun({ text:`Periode: ${periodLabel}`, italics:true, size:22, color:'64748B' })] }),

      sectionHeading('1. Riwayat Transaksi'),
      divider(),
      new Table({ width:{size:9400,type:WidthType.DXA}, columnWidths:colWidths, rows:trxRows }),
      new Paragraph({ spacing:{after:200}, alignment:AlignmentType.RIGHT,
        children:[new TextRun({ text:`Total Pemasukan: ${formatRupiah(totalIncome)}`, bold:true, size:20, color:'059669' })] }),
      new Paragraph({ spacing:{after:100}, alignment:AlignmentType.RIGHT,
        children:[new TextRun({ text:`Total Pengeluaran: ${formatRupiah(totalExpense)}`, bold:true, size:20, color:'DC2626' })] }),
      new Paragraph({ spacing:{after:600}, alignment:AlignmentType.RIGHT,
        children:[new TextRun({ text:`Saldo: ${formatRupiah(totalIncome-totalExpense)}`, bold:true, size:22, color:'0F1E36' })] }),

      sectionHeading('2. Rekap per Dompet'),
      divider(),
      new Table({ width:{size:9600,type:WidthType.DXA}, columnWidths:rekapWidths, rows:walletRows }),
      new Paragraph({ text:'', spacing:{after:600} }),

      ...(monthlySummary.length > 0 ? [
        sectionHeading('3. Rekap per Bulan'),
        divider(),
        new Table({ width:{size:9600,type:WidthType.DXA}, columnWidths:rekapWidths, rows:monthRows }),
        new Paragraph({ text:'', spacing:{after:600} }),
      ] : []),

      ...(yearlySummary.length > 0 ? [
        sectionHeading('4. Rekap per Tahun'),
        divider(),
        new Table({ width:{size:9600,type:WidthType.DXA}, columnWidths:rekapWidths, rows:yearRows }),
      ] : []),
    ]}],
  })

  const buffer = await Packer.toBuffer(doc)
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="Laporan-Jurnalyst-${String(periodLabel).replace(/\s+/g,'-')}.docx"`,
    },
  })
}
