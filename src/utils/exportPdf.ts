import type { Channel } from '../types'

// jsPDF domyślnie używa Helvetica bez obsługi polskich znaków —
// zamieniamy diakrytyki na ASCII żeby uniknąć „?" w pliku
function norm(s: string): string {
  return s
    .replace(/[ąĄ]/g, a => a === 'ą' ? 'a' : 'A')
    .replace(/[ćĆ]/g, a => a === 'ć' ? 'c' : 'C')
    .replace(/[ęĘ]/g, a => a === 'ę' ? 'e' : 'E')
    .replace(/[łŁ]/g, a => a === 'ł' ? 'l' : 'L')
    .replace(/[ńŃ]/g, a => a === 'ń' ? 'n' : 'N')
    .replace(/[óÓ]/g, a => a === 'ó' ? 'o' : 'O')
    .replace(/[śŚ]/g, a => a === 'ś' ? 's' : 'S')
    .replace(/[źŹ]/g, a => a === 'ź' ? 'z' : 'Z')
    .replace(/[żŻ]/g, a => a === 'ż' ? 'z' : 'Z')
}

export interface PdfExportOptions {
  channels: Channel[]
  title: string
  subtitle?: string
  getCategoryLabel: (lcn: number) => string
}

async function buildDoc({ channels, title, subtitle, getCategoryLabel }: PdfExportOptions) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const date = new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })

  doc.setFontSize(16)
  doc.setTextColor(13, 27, 75)
  doc.text(norm(title), 14, 18)

  let y = 26
  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text(norm(subtitle), 14, y)
    y += 7
  }

  doc.setFontSize(8)
  doc.setTextColor(130, 130, 130)
  doc.text(`Wygenerowano: ${date}   |   Kanalow: ${channels.length}`, 14, y)

  autoTable(doc, {
    startY: y + 5,
    head: [['Nr', 'Nazwa kanalu', 'Czest. (MHz)', 'TP', 'Kategoria']],
    body: channels.map(ch => [
      ch.lcn,
      norm(ch.name),
      ch.frequency,
      ch.transponder,
      norm(getCategoryLabel(ch.lcn)),
    ]),
    styles: { fontSize: 7.5, cellPadding: 1.8 },
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

  // Numeracja stron
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
  const win = window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return win
}
