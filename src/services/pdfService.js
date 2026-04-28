import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoImg from '../../assets/images/logo_dynamic.png'

// ─── Brand colors ──────────────────────────────────────────────────────────
const NAVY    = [22,  50,  79]   // #16324F
const GOLD    = [200, 169, 107]  // #C8A96B
const CHARCOAL= [34,  38,  43]   // #22262B
const IVORY   = [247, 245, 240]  // #F7F5F0
const IVORY2  = [237, 233, 225]  // slightly darker ivory for alternating rows
const WHITE   = [255, 255, 255]
const MUTED   = [130, 135, 140]  // subdued label color

// ─── Layout (all values in mm, A4 = 210 × 297) ────────────────────────────
const W       = 210
const H       = 297
const ML      = 14   // left margin
const MR      = 14   // right margin
const CW      = W - ML - MR  // content width = 182

// ─── Company info ──────────────────────────────────────────────────────────
const CO = {
  name:    'DB Enterprises',
  tagline: 'Roofing  ·  Siding  ·  Construction',
  address: 'Geneva, NE',
  phone:   '(402) 641-4482',
  email:   'info@dbenterprises.com',
  website: 'www.dbenterprises.com',
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const currency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

const loadImage = (src) =>
  new Promise((res, rej) => {
    const img = new Image()
    img.onload  = () => res(img)
    img.onerror = rej
    img.src = src
  })

/**
 * Generate and download a branded PDF for an invoice or job estimate.
 *
 * @param {object} data   Invoice or Job object from Firestore
 * @param {'INVOICE'|'ESTIMATE'} type
 */
export async function generateInvoicePDF(data, type = 'INVOICE') {
  const isEstimate = type === 'ESTIMATE'
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  // ── Load logo ────────────────────────────────────────────────────────────
  let logo = null
  try { logo = await loadImage(logoImg) } catch (_) {}

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 1 — HEADER  (ivory background, 46mm tall)
  // ═══════════════════════════════════════════════════════════════════════
  const HEADER_H = 46

  doc.setFillColor(...IVORY)
  doc.rect(0, 0, W, HEADER_H, 'F')

  // Logo (28 × 28 mm square)
  const LOGO_SIZE = 28
  const LOGO_X    = ML
  const LOGO_Y    = 9
  if (logo) {
    // White backing card so the logo pop against ivory cleanly
    doc.setFillColor(...WHITE)
    doc.roundedRect(LOGO_X - 1, LOGO_Y - 1, LOGO_SIZE + 2, LOGO_SIZE + 2, 2, 2, 'F')
    doc.addImage(logo, 'PNG', LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE)
  }

  // Company name
  const TX = LOGO_X + LOGO_SIZE + 7  // text starts after logo
  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(CO.name.toUpperCase(), TX, 20)

  // Tagline in gold
  doc.setTextColor(...GOLD)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(CO.tagline, TX, 27)

  // Contact line
  doc.setTextColor(...MUTED)
  doc.setFontSize(7.5)
  doc.text(`${CO.address}  ·  ${CO.phone}  ·  ${CO.email}`, TX, 34)

  // Document type — large, right-aligned
  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.text(type, W - MR, 24, { align: 'right' })

  // ─ Gold accent line beneath header ──────────────────────────────────────
  doc.setFillColor(...GOLD)
  doc.rect(0, HEADER_H, W, 1.2, 'F')

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 2 — METADATA STRIP  (navy, 24mm tall)
  // ═══════════════════════════════════════════════════════════════════════
  const META_Y  = HEADER_H + 1.2
  const META_H  = 24

  doc.setFillColor(...NAVY)
  doc.rect(0, META_Y, W, META_H, 'F')

  // Column positions for 4 meta cells
  const COL = [ML, ML + 46, ML + 92, ML + 138]
  const LABEL_Y = META_Y + 8
  const VALUE_Y = META_Y + 16

  const metaFields = isEstimate
    ? [
        { label: 'ESTIMATE #',  value: data.id?.slice(0, 8).toUpperCase() || '—' },
        { label: 'DATE',        value: data.issueDate || new Date().toISOString().slice(0, 10) },
        { label: 'JOB STATUS',  value: (data.status || 'Estimate').replace('_', ' ').toUpperCase() },
        { label: 'PREPARED BY', value: CO.name },
      ]
    : [
        { label: 'INVOICE #',   value: data.invoiceNumber || '—' },
        { label: 'ISSUE DATE',  value: data.issueDate || '—' },
        { label: 'DUE DATE',    value: data.dueDate   || '—' },
        { label: 'STATUS',      value: (data.status || 'Draft').toUpperCase() },
      ]

  metaFields.forEach(({ label, value }, i) => {
    doc.setTextColor(...GOLD)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.text(label, COL[i], LABEL_Y)

    doc.setTextColor(...WHITE)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(String(value), COL[i], VALUE_Y)
  })

  // Thin dividers between cells
  doc.setDrawColor(255, 255, 255)
  if (typeof doc.setGlobalAlpha === 'function') doc.setGlobalAlpha(0.15)
  ;[1, 2, 3].forEach(i => {
    doc.line(COL[i] - 4, META_Y + 5, COL[i] - 4, META_Y + META_H - 5)
  })
  if (typeof doc.setGlobalAlpha === 'function') doc.setGlobalAlpha(1)

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 3 — BILL TO / JOB INFO  (white bg)
  // ═══════════════════════════════════════════════════════════════════════
  const BODY_Y  = META_Y + META_H        // where white body starts
  const BILL_Y  = BODY_Y + 12            // Bill To block top

  doc.setFillColor(...WHITE)
  doc.rect(0, BODY_Y, W, H - BODY_Y, 'F')

  // "BILL TO" / "PREPARED FOR" label
  doc.setTextColor(...GOLD)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text(isEstimate ? 'PREPARED FOR' : 'BILL TO', ML, BILL_Y)

  // Gold underline beneath label
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.4)
  doc.line(ML, BILL_Y + 1.5, ML + 30, BILL_Y + 1.5)

  // Client name
  const clientName    = data.clientName || 'Valued Customer'
  const clientAddress = isEstimate ? (data.address || '') : (data.clientAddress || '')
  const clientEmail   = isEstimate ? '' : (data.clientEmail || '')

  let cy = BILL_Y + 8
  doc.setTextColor(...CHARCOAL)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(clientName, ML, cy)

  if (clientAddress) {
    cy += 6.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text(clientAddress, ML, cy)
  }

  if (clientEmail) {
    cy += 5.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text(clientEmail, ML, cy)
  }

  // Job title (estimates only) on the right side of bill-to row
  if (isEstimate && data.title) {
    doc.setTextColor(...NAVY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text('JOB TITLE', W - MR, BILL_Y, { align: 'right' })
    doc.setDrawColor(...NAVY)
    doc.setLineWidth(0.4)
    doc.line(W - MR - 30, BILL_Y + 1.5, W - MR, BILL_Y + 1.5)
    doc.setTextColor(...CHARCOAL)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(data.title, W - MR, BILL_Y + 8, { align: 'right', maxWidth: 80 })
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 4 — LINE ITEMS TABLE
  // ═══════════════════════════════════════════════════════════════════════
  // Fixed table start — always leaves enough room for bill-to block
  const TABLE_START = BODY_Y + 52

  // Build rows
  const rows = []

  if (isEstimate) {
    ;(data.laborItems || []).forEach((r) => {
      const qty   = parseFloat(r.squareFeet) || 0
      const rate  = parseFloat(r.ratePerSqft) || 0
      const total = qty * rate
      if (!total && !r.description) return
      const desc = r.description || `Labor`
      const detail = qty > 0 ? `${qty.toLocaleString()} sqft @ ${currency(rate)}/sqft` : ''
      rows.push([detail ? `${desc}\n${detail}` : desc, '', '', currency(total)])
    })
    ;(data.lineItems || []).forEach((r) => {
      const desc  = r.description || r.preset || ''
      const qty   = parseFloat(r.qty) || 0
      const price = parseFloat(r.unitPrice) || 0
      if (!desc && !qty) return
      rows.push([desc, qty > 0 ? qty.toString() : '—', currency(price), currency(qty * price)])
    })
  } else {
    ;(data.lineItems || []).forEach((r) => {
      const desc  = r.description || r.preset || ''
      const qty   = parseFloat(r.qty) || 0
      const price = parseFloat(r.unitPrice) || 0
      rows.push([desc, qty.toString(), currency(price), currency(qty * price)])
    })
  }

  if (rows.length === 0) rows.push(['No line items', '', '', currency(0)])

  autoTable(doc, {
    startY: TABLE_START,
    head:   [['Description', 'Qty', 'Unit Price', 'Amount']],
    body:   rows,
    theme:  'plain',
    margin: { left: ML, right: MR },
    styles: {
      fontSize:    9,
      cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
      textColor:   CHARCOAL,
      lineColor:   IVORY2,
      lineWidth:   0.3,
    },
    headStyles: {
      fillColor:   NAVY,
      textColor:   WHITE,
      fontStyle:   'bold',
      fontSize:    8,
      cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
    },
    columnStyles: {
      0: { cellWidth: CW - 20 - 30 - 30 },  // Description fills remaining
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right'  },
      3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: IVORY },
    // Bottom border on each row
    didParseCell(hookData) {
      if (hookData.section === 'body') {
        hookData.cell.styles.lineColor  = IVORY2
        hookData.cell.styles.lineWidth  = { bottom: 0.3, top: 0, left: 0, right: 0 }
      }
    },
  })

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 5 — TOTALS
  // ═══════════════════════════════════════════════════════════════════════
  let fy = doc.lastAutoTable.finalY + 8   // start 8mm below table

  const subtotal  = data.subtotal  || 0
  const taxAmount = data.taxAmount || 0
  const taxRate   = data.taxRate   || 0
  const total     = data.total     || 0

  const TOT_X     = W - MR - 60   // left edge of totals block
  const TOT_W     = 60            // width of totals block
  const NUM_X     = W - MR        // right-aligned numbers

  // Subtotal row
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text('Subtotal', TOT_X + 2, fy)
  doc.setTextColor(...CHARCOAL)
  doc.text(currency(subtotal), NUM_X, fy, { align: 'right' })

  // Tax row (only if applicable)
  if (taxAmount > 0) {
    fy += 6.5
    doc.setTextColor(...MUTED)
    doc.text(`Tax (${taxRate}%)`, TOT_X + 2, fy)
    doc.setTextColor(...CHARCOAL)
    doc.text(currency(taxAmount), NUM_X, fy, { align: 'right' })
  }

  // Separator line above total
  fy += 4
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.5)
  doc.line(TOT_X, fy, W - MR, fy)

  // Total DUE box (navy fill, gold text)
  fy += 2
  const BOX_H = 13
  doc.setFillColor(...NAVY)
  doc.roundedRect(TOT_X, fy, TOT_W, BOX_H, 2, 2, 'F')

  doc.setTextColor(...GOLD)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('TOTAL DUE', TOT_X + 5, fy + 5.5)

  doc.setFontSize(11)
  doc.text(currency(total), NUM_X - 3, fy + 9, { align: 'right' })

  fy += BOX_H + 12

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 6 — NOTES  (only if present)
  // ═══════════════════════════════════════════════════════════════════════
  if (data.notes && data.notes.trim()) {
    // Add new page if notes would overlap footer
    if (fy > H - 60) {
      doc.addPage()
      fy = 20
    }

    // Notes label
    doc.setTextColor(...NAVY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text('NOTES & PAYMENT TERMS', ML, fy)
    doc.setDrawColor(...GOLD)
    doc.setLineWidth(0.4)
    doc.line(ML, fy + 1.5, ML + 46, fy + 1.5)

    fy += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...CHARCOAL)
    const noteLines = doc.splitTextToSize(data.notes, CW)
    doc.text(noteLines, ML, fy)
    fy += noteLines.length * 5 + 8
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 7 — SIGNATURE LINES
  // ═══════════════════════════════════════════════════════════════════════
  // Pin signature to a fixed Y if there's room; otherwise just below notes
  const SIG_Y = Math.max(fy + 10, H - 52)

  if (SIG_Y < H - 30) {
    doc.setDrawColor(...IVORY2)
    doc.setLineWidth(0.6)
    // Left sig line
    doc.line(ML, SIG_Y, ML + 68, SIG_Y)
    doc.setTextColor(...MUTED)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text('Authorized Signature — DB Enterprises', ML, SIG_Y + 5)

    // Right sig line
    doc.line(W - MR - 68, SIG_Y, W - MR, SIG_Y)
    doc.text('Customer Acceptance', W - MR - 68, SIG_Y + 5)

    // Date lines beneath each
    doc.setFontSize(6.5)
    doc.setTextColor(180, 183, 186)
    doc.text('Date: _______________', ML, SIG_Y + 11)
    doc.text('Date: _______________', W - MR - 68, SIG_Y + 11)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 8 — FOOTER  (navy, 14mm)
  // ═══════════════════════════════════════════════════════════════════════
  // Gold accent line above footer
  doc.setFillColor(...GOLD)
  doc.rect(0, H - 15, W, 0.8, 'F')

  doc.setFillColor(...NAVY)
  doc.rect(0, H - 14.2, W, 14.2, 'F')

  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(CO.name.toUpperCase(), W / 2, H - 8, { align: 'center' })

  doc.setTextColor(...GOLD)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(
    `${CO.website}  ·  ${CO.phone}  ·  ${CO.email}`,
    W / 2, H - 3.5, { align: 'center' }
  )

  // ─── Save ────────────────────────────────────────────────────────────────
  const filename = isEstimate
    ? `estimate-${(data.title || 'job').replace(/\s+/g, '-').toLowerCase()}.pdf`
    : `${data.invoiceNumber || 'invoice'}.pdf`

  doc.save(filename)
}
