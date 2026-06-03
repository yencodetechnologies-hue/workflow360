const fs = require('fs')
const path = require('path')

const LOGO_PATH = path.join(__dirname, '../assets/workflowlogo.jpeg')

const BRAND = {
  primary: '#667eea',
  primaryDark: '#5a67d8',
  text: '#334155',
  muted: '#64748b',
  border: '#e2e8f0',
  panel: '#f8fafc',
  zebra: '#f1f5f9',
  white: '#ffffff',
}

const MARGIN = 40
const PAGE_WIDTH = 595.28
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const PAGE_BOTTOM = 801

const COL = {
  num: MARGIN,
  particulars: MARGIN + 28,
  sku: MARGIN + 268,
  unit: MARGIN + 358,
  qty: MARGIN + 418,
}

function formatDateTime(d) {
  if (!d) return '—'
  const dt = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(dt.getTime())) return '—'
  return dt.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatStatus(status) {
  if (!status) return '—'
  return String(status).replace(/_/g, ' ')
}

function godownName(delivery) {
  const g = delivery.fromGodownId
  if (!g) return '—'
  if (typeof g === 'object' && g.name) return g.name
  return '—'
}

function siteLine(delivery) {
  const parts = [delivery.siteName, delivery.siteAddress].filter(Boolean)
  return parts.length ? parts.join(', ') : '—'
}

function drawHeader(doc) {
  const headerH = 76
  doc.save()
  doc.rect(MARGIN, MARGIN, CONTENT_WIDTH, headerH).fill(BRAND.primary)
  doc.restore()

  const logoSize = 52
  const logoX = MARGIN + 14
  const logoY = MARGIN + 12

  if (fs.existsSync(LOGO_PATH)) {
    try {
      doc.image(LOGO_PATH, logoX, logoY, {
        fit: [logoSize, logoSize],
        align: 'center',
        valign: 'center',
      })
    } catch {
      /* skip logo if unreadable */
    }
  }

  const textX = logoX + logoSize + 14
  doc.fillColor(BRAND.white).font('Helvetica-Bold').fontSize(18)
  doc.text('Workflow360', textX, MARGIN + 18, { lineBreak: false })
  doc.font('Helvetica').fontSize(9)
  doc.text('Logistics & delivery management', textX, MARGIN + 40, { lineBreak: false })

  doc.font('Helvetica-Bold').fontSize(14)
  doc.text('DELIVERY CHALLAN', MARGIN, MARGIN + 28, {
    width: CONTENT_WIDTH - 14,
    align: 'right',
    lineBreak: false,
  })

  doc.y = MARGIN + headerH + 16
  doc.fillColor(BRAND.text)
}

function drawMetaPanel(doc, delivery) {
  const panelTop = doc.y
  const colW = CONTENT_WIDTH / 2 - 8
  const leftX = MARGIN + 14
  const rightX = MARGIN + CONTENT_WIDTH / 2 + 4
  const rowH = 14
  const labelW = 78

  const leftRows = [
    ['Challan No', delivery.challanNo || delivery.deliveryNo || '—'],
    ['Delivery No', delivery.deliveryNo || '—'],
    ['Delivery at', formatDateTime(delivery.deliveryAt)],
    ['Status', formatStatus(delivery.status)],
  ]

  const rightRows = [
    ['Customer', delivery.customerName || '—'],
    ['Phone', delivery.contactPhone || '—'],
    ['Site', siteLine(delivery)],
    ['Vehicle', delivery.vehicleLabel || '—'],
    ['Godown', godownName(delivery)],
    ['Generated', formatDateTime(new Date())],
  ]

  const rowCount = Math.max(leftRows.length, rightRows.length)
  const panelH = rowCount * rowH + 24

  doc.save()
  doc.roundedRect(MARGIN, panelTop, CONTENT_WIDTH, panelH, 6).fill(BRAND.panel)
  doc.roundedRect(MARGIN, panelTop, CONTENT_WIDTH, panelH, 6).lineWidth(0.5).strokeColor(BRAND.border).stroke()
  doc.restore()

  doc.font('Helvetica').fontSize(9)
  let y = panelTop + 12

  for (let i = 0; i < rowCount; i += 1) {
    if (leftRows[i]) {
      doc.fillColor(BRAND.muted).text(leftRows[i][0], leftX, y, { width: labelW, lineBreak: false })
      doc.fillColor(BRAND.text).font('Helvetica-Bold')
      doc.text(String(leftRows[i][1]), leftX + labelW, y, {
        width: colW - labelW,
        lineBreak: false,
      })
      doc.font('Helvetica')
    }
    if (rightRows[i]) {
      doc.fillColor(BRAND.muted).text(rightRows[i][0], rightX, y, { width: labelW, lineBreak: false })
      doc.fillColor(BRAND.text).font('Helvetica-Bold')
      doc.text(String(rightRows[i][1]), rightX + labelW, y, {
        width: colW - labelW,
        lineBreak: false,
      })
      doc.font('Helvetica')
    }
    y += rowH
  }

  doc.y = panelTop + panelH + 18
  doc.fillColor(BRAND.text)
}

function ensureSpace(doc, needed) {
  if (doc.y + needed > PAGE_BOTTOM) {
    doc.addPage()
    doc.y = MARGIN
  }
}

function drawTableHeader(doc) {
  const headerH = 22
  const y = doc.y
  doc.save()
  doc.rect(MARGIN, y, CONTENT_WIDTH, headerH).fill(BRAND.primaryDark)
  doc.restore()

  doc.fillColor(BRAND.white).font('Helvetica-Bold').fontSize(9)
  const textY = y + 7
  doc.text('#', COL.num + 4, textY, { width: 20, lineBreak: false })
  doc.text('Particulars', COL.particulars, textY, { width: 230, lineBreak: false })
  doc.text('SKU', COL.sku, textY, { width: 80, lineBreak: false })
  doc.text('Unit', COL.unit, textY, { width: 50, lineBreak: false })
  doc.text('Qty', COL.qty, textY, { width: 50, align: 'right', lineBreak: false })

  doc.y = y + headerH
  doc.fillColor(BRAND.text).font('Helvetica')
}

function measureRowHeight(doc, name, rowH) {
  doc.fontSize(9)
  const h = doc.heightOfString(String(name), { width: 248 })
  return Math.max(rowH, h + 8)
}

function drawTableRow(doc, index, line, zebra) {
  const p = line.productId
  const name = p?.particulars || p?.name || 'Item'
  const sku = p?.sku || p?.s_no || '—'
  const unit = p?.unit || '—'
  const qty = line.qty ?? '—'

  const rowH = 18
  const rowHeight = measureRowHeight(doc, name, rowH)
  ensureSpace(doc, rowHeight + 4)

  const y = doc.y

  if (zebra) {
    doc.save()
    doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight).fill(BRAND.zebra)
    doc.restore()
  }

  doc.fontSize(9).fillColor(BRAND.muted)
  doc.text(String(index), COL.num + 4, y + 5, { width: 20, lineBreak: false })

  doc.fillColor(BRAND.text).font('Helvetica')
  doc.text(String(name), COL.particulars, y + 5, { width: 248 })
  doc.text(String(sku), COL.sku, y + 5, { width: 80, lineBreak: false })
  doc.text(String(unit), COL.unit, y + 5, { width: 50, lineBreak: false })
  doc.font('Helvetica-Bold')
  doc.text(String(qty), COL.qty, y + 5, { width: 50, align: 'right', lineBreak: false })
  doc.font('Helvetica')

  doc.y = y + rowHeight
}

function drawSummary(doc, lineCount, totalQty) {
  ensureSpace(doc, 36)
  doc.moveDown(0.3)
  const y = doc.y
  doc.save()
  doc.rect(MARGIN, y, CONTENT_WIDTH, 28).fill(BRAND.panel)
  doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_WIDTH, y).strokeColor(BRAND.border).lineWidth(0.5).stroke()
  doc.restore()

  doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND.text)
  doc.text(`Line items: ${lineCount}`, MARGIN + 12, y + 9, { lineBreak: false })
  doc.text(`Total quantity: ${totalQty}`, MARGIN, y + 9, {
    width: CONTENT_WIDTH - 12,
    align: 'right',
    lineBreak: false,
  })
  doc.y = y + 36
}

function drawSignatures(doc) {
  ensureSpace(doc, 100)
  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').fontSize(11).fillColor(BRAND.text)
  doc.text('Acknowledgement', MARGIN, doc.y, { lineBreak: false })
  doc.moveDown(0.6)

  const boxW = (CONTENT_WIDTH - 16) / 2
  const boxH = 64
  const y = doc.y

  const boxes = [
    { label: 'Customer signature', x: MARGIN },
    { label: 'Delivery staff', x: MARGIN + boxW + 16 },
  ]

  for (const box of boxes) {
    doc.save()
    doc.roundedRect(box.x, y, boxW, boxH, 4).lineWidth(0.5).strokeColor(BRAND.border).stroke()
    doc.restore()
    doc.font('Helvetica').fontSize(9).fillColor(BRAND.muted)
    doc.text(box.label, box.x + 10, y + 10, { lineBreak: false })
    doc.moveTo(box.x + 10, y + boxH - 18)
      .lineTo(box.x + boxW - 10, y + boxH - 18)
      .strokeColor('#94a3b8')
      .lineWidth(0.5)
      .stroke()
  }

  doc.y = y + boxH + 12
}

function drawFooter(doc) {
  const footerY = 812
  doc.font('Helvetica').fontSize(8).fillColor(BRAND.muted)
  doc.text(
    `Workflow360 · Generated on ${formatDateTime(new Date())}`,
    MARGIN,
    footerY,
    { width: CONTENT_WIDTH, align: 'center', lineBreak: false },
  )
}

/**
 * Renders a branded delivery challan onto an existing PDFKit document.
 * @param {import('pdfkit')} doc
 * @param {object} delivery - lean delivery with populated lines.productId and fromGodownId
 */
function renderChallanPdf(doc, delivery) {
  const lines = delivery.lines || []
  let totalQty = 0
  for (const line of lines) {
    totalQty += Number(line.qty) || 0
  }

  drawHeader(doc)
  drawMetaPanel(doc, delivery)

  doc.font('Helvetica-Bold').fontSize(11).fillColor(BRAND.text)
  doc.text('Items', MARGIN, doc.y, { lineBreak: false })
  doc.moveDown(0.5)

  drawTableHeader(doc)

  if (lines.length === 0) {
    ensureSpace(doc, 24)
    doc.font('Helvetica').fontSize(9).fillColor(BRAND.muted)
    doc.text('No items on this delivery.', MARGIN + 8, doc.y + 6, { lineBreak: false })
    doc.moveDown(1.2)
  } else {
    lines.forEach((line, i) => {
      drawTableRow(doc, i + 1, line, i % 2 === 1)
    })
  }

  doc.save()
  doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + CONTENT_WIDTH, doc.y).strokeColor(BRAND.border).lineWidth(0.5).stroke()
  doc.restore()
  doc.moveDown(0.2)

  drawSummary(doc, lines.length, totalQty)
  drawSignatures(doc)
  drawFooter(doc)
}

module.exports = { renderChallanPdf }
