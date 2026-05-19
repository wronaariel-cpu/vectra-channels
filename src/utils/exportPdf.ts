import type { Channel } from '../types'

export interface PdfExportOptions {
  channels: Channel[]
  title: string
  subtitle?: string
  getCategoryLabel: (lcn: number) => string
}

let cachedFontB64: string | null = null

async function loadFont(): Promise<string> {
  if (cachedFontB64) return cachedFontB64
  const res = await fetch('/fonts/Roboto-Regular.ttf')
  const buf = await res.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let b64 = ''
  for (let i = 0; i < bytes.length; i += 3000) {
    b64 += String.fromCharCode(...bytes.subarray(i, i + 3000))
  }
  cachedFontB64 = btoa(b64)
  return cachedFontB64
}

async function buildDoc({ channels, title, subtitle, getCategoryLabel }: PdfExportOptions) {
  const [{ jsPDF }, { default: autoTable }, fontB64] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadFont(),
  ])

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  doc.addFileToVFS('Roboto-Regular.ttf', fontB64)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.setFont('Roboto')

  const date = new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })

  doc.setFontSize(16)
  doc.setTextColor(13, 27, 75)
  doc.text(title, 14, 18)

  let y = 26
  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text(subtitle, 14, y)
    y += 7
  }

  doc.setFontSize(8)
  doc.setTextColor(130, 130, 130)
  doc.text(`Wygenerowano: ${date}   |   Kanałów: ${channels.length}`, 14, y)

  autoTable(doc, {
    startY: y + 5,
    head: [['Nr', 'Nazwa kanału', 'Częst. (MHz)', 'TP', 'Kategoria']],
    body: channels.map(ch => [
      ch.lcn,
      ch.name,
      ch.frequency,
      ch.transponder,
      getCategoryLabel(ch.lcn),
    ]),
    styles: { fontSize: 7.5, cellPadding: 1.8, font: 'Roboto' },
    headStyles: { fillColor: [13, 27, 75], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 72 },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 13, halign: 'center' },
      4: { cellWidth: 42 },
    },
    margin: { left: 14, right: 14 },
  })

  const pageCount = (doc as any).internal.getNumberOfPages()
  doc.setFontSize(7)
  doc.setTextColor(160, 160, 160)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(`Strona ${i} / ${pageCount}`, 196, 290, { align: 'right' })
  }

  return doc
}

export async function downloadPdf(options: PdfExportOptions, filename: string) {
  const doc = await buildDoc(options)
  doc.save(filename)
}

export async function printPdf(options: PdfExportOptions) {
  const doc = await buildDoc(options)
  doc.autoPrint()
  const url = URL.createObjectURL(doc.output('blob'))
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
