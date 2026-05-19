import type { Channel } from '../types'
import type { AnalogChannel } from '../data/channels-analog'

export interface PdfExportOptions {
  channels: Channel[]
  title: string
  subtitle?: string
  getCategoryLabel: (lcn: number) => string
}

const fontCache: Record<string, string> = {}

async function loadFont(url: string): Promise<string> {
  if (fontCache[url]) return fontCache[url]
  const res = await fetch(url)
  const buf = await res.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let b64 = ''
  for (let i = 0; i < bytes.length; i += 3000) {
    b64 += String.fromCharCode(...bytes.subarray(i, i + 3000))
  }
  fontCache[url] = btoa(b64)
  return fontCache[url]
}

async function buildDoc({ channels, title, subtitle, getCategoryLabel }: PdfExportOptions) {
  const [{ jsPDF }, { default: autoTable }, fontRegular, fontBold] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadFont('/fonts/Roboto-Regular.ttf'),
    loadFont('/fonts/Roboto-Bold.ttf'),
  ])

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  doc.addFileToVFS('Roboto-Regular.ttf', fontRegular)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.addFileToVFS('Roboto-Bold.ttf', fontBold)
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')
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

// ── Analog ────────────────────────────────────────────────────────────────────

async function buildAnalogDoc(channels: AnalogChannel[], title: string, subtitle: string) {
  const [{ jsPDF }, { default: autoTable }, fontRegular, fontBold] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadFont('/fonts/Roboto-Regular.ttf'),
    loadFont('/fonts/Roboto-Bold.ttf'),
  ])

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  doc.addFileToVFS('Roboto-Regular.ttf', fontRegular)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.addFileToVFS('Roboto-Bold.ttf', fontBold)
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')
  doc.setFont('Roboto')

  const date = new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })

  doc.setFontSize(16)
  doc.setTextColor(13, 27, 75)
  doc.text(title, 14, 18)

  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(subtitle, 14, 26)

  doc.setFontSize(8)
  doc.setTextColor(130, 130, 130)
  doc.text(`Wygenerowano: ${date}   |   Kanałów: ${channels.length}`, 14, 33)

  autoTable(doc, {
    startY: 38,
    head: [['Kanał', 'Częst. (MHz)', 'Program', 'Typ']],
    body: channels.map(ch => {
      const isWolny   = ch.program.toLowerCase().includes('wolny')
      const isLokalny = ch.program.toLowerCase().includes('lokalny')
      const typ = isWolny ? 'Wolny' : isLokalny ? 'Lokalny' : 'TV'
      return [ch.id, ch.frequency.toFixed(2), ch.program, typ]
    }),
    styles: { fontSize: 8, cellPadding: 2, font: 'Roboto' },
    headStyles: { fillColor: [13, 27, 75], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 100 },
      3: { cellWidth: 22, halign: 'center' },
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

export async function downloadAnalogPdf(channels: AnalogChannel[], title: string, subtitle: string, filename: string) {
  const doc = await buildAnalogDoc(channels, title, subtitle)
  doc.save(filename)
}

export async function printAnalogPdf(channels: AnalogChannel[], title: string, subtitle: string) {
  const doc = await buildAnalogDoc(channels, title, subtitle)
  doc.autoPrint()
  const url = URL.createObjectURL(doc.output('blob'))
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
