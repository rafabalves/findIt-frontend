import type { QRCode } from './types'

export const labelBaseUrl = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '')

export function labelUrl(guid: string) {
  return `${labelBaseUrl}/qr/${guid}`
}

export async function downloadLabelsPdf(codes: QRCode[], filename: string) {
  if (codes.length === 0) throw new Error('Não há etiquetas para imprimir.')
  const [{ jsPDF }, { default: QRCodeImage }] = await Promise.all([
    import('jspdf'), import('qrcode'),
  ])
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const cardWidth = 90
  const cardHeight = 82
  const gapX = 6
  const gapY = 5
  const left = (pageWidth - 2 * cardWidth - gapX) / 2
  const top = 24

  for (const [index, code] of codes.entries()) {
    const slot = index % 6
    if (index > 0 && slot === 0) pdf.addPage()
    if (slot === 0) {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(14)
      pdf.text('FindIt | Etiquetas QR', left, 15)
    }
    const x = left + (slot % 2) * (cardWidth + gapX)
    const y = top + Math.floor(slot / 2) * (cardHeight + gapY)
    const url = labelUrl(code.guid)
    const qr = QRCodeImage.create(url, { errorCorrectionLevel: 'Q' })

    pdf.setDrawColor(130, 144, 137)
    pdf.setLineWidth(0.25)
    pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2)
    pdf.setTextColor(20, 45, 35)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.text(`FindIt - Etiqueta #${code.id}`, x + 5, y + 8)
    const cell = 48 / (qr.modules.size + 8)
    const qrX = x + (cardWidth - 48) / 2 + 4 * cell
    const qrY = y + 11 + 4 * cell
    pdf.setFillColor(0, 0, 0)
    for (let row = 0; row < qr.modules.size; row++) {
      for (let col = 0; col < qr.modules.size;) {
        if (!qr.modules.get(row, col)) { col++; continue }
        const start = col
        while (col < qr.modules.size && qr.modules.get(row, col)) col++
        pdf.rect(qrX + start * cell, qrY + row * cell, (col - start) * cell, cell + 0.005, 'F')
      }
    }
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text('Escaneie para identificar o item', x + cardWidth / 2, y + 64, { align: 'center' })
    pdf.setTextColor(70, 80, 75)
    pdf.setFontSize(6.8)
    pdf.text(pdf.splitTextToSize(url, cardWidth - 10), x + 5, y + 69)
  }
  pdf.save(filename)
}
