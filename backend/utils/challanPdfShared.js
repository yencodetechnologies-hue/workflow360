const fs = require('fs')
const path = require('path')

const LOGO_PATH = path.join(__dirname, '../assets/workflowlogo.jpeg')

const BRAND = {
  primary: '#059669',
  primaryDark: '#047857',
  accent: '#10b981',
  text: '#334155',
  muted: '#64748b',
  border: '#bbf7d0',
  panel: '#f0fdf4',
  zebra: '#ecfdf5',
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
  if (delivery.godownLabel) return delivery.godownLabel
  const lines = delivery.lines || []
  const fromLines = [...new Set(lines.map((l) => l.godownName).filter(Boolean))]
  if (fromLines.length) return fromLines.join(', ')
  const g = delivery.fromGodownId
  if (!g) return '—'
  if (typeof g === 'object' && g.name) return g.name
  return '—'
}

function groupLinesByGodownForPdf(lines, fallbackGodownId, godownNameById = {}) {
  const groups = new Map()
  for (const line of lines || []) {
    const godownId = line.godownId ? String(line.godownId) : fallbackGodownId ? String(fallbackGodownId) : ''
    if (!godownId) continue
    const resolvedName = line.godownName || godownNameById[godownId] || 'Godown'
    const existing = groups.get(godownId)
    if (existing) {
      existing.lines.push(line)
      if (existing.godownName === 'Godown' && resolvedName !== 'Godown') existing.godownName = resolvedName
    } else {
      groups.set(godownId, {
        godownId,
        godownName: resolvedName,
        lines: [line],
      })
    }
  }
  return [...groups.values()].sort((a, b) => a.godownName.localeCompare(b.godownName))
}

function siteLine(delivery) {
  const parts = [delivery.siteName, delivery.siteAddress].filter(Boolean)
  return parts.length ? parts.join(', ') : '—'
}

function drawHeader(doc, title) {
  const headerH = 82
  doc.save()
  doc.rect(MARGIN, MARGIN, CONTENT_WIDTH, headerH).fill(BRAND.primary)
  doc.restore()

  const logoSize = 52
  const logoX = MARGIN + 14
  const logoY = MARGIN + 15

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
  doc.text('Workflow360', textX, MARGIN + 20, { lineBreak: false })
  doc.font('Helvetica').fontSize(9)
  doc.text('Logistics & delivery management', textX, MARGIN + 42, { lineBreak: false })

  doc.font('Helvetica-Bold').fontSize(14)
  doc.text(title, MARGIN, MARGIN + 32, {
    width: CONTENT_WIDTH - 14,
    align: 'right',
    lineBreak: false,
  })

  doc.y = MARGIN + headerH + 16
  doc.fillColor(BRAND.text)
}

function drawMetaPanel(doc, leftRows, rightRows) {
  const panelTop = doc.y
  const colW = CONTENT_WIDTH / 2 - 8
  const leftX = MARGIN + 14
  const rightX = MARGIN + CONTENT_WIDTH / 2 + 4
  const rowH = 14
  const labelW = 88
  const rowCount = Math.max(leftRows.length, rightRows.length)
  const panelH = rowCount * rowH + 32

  doc.save()
  doc.roundedRect(MARGIN, panelTop, CONTENT_WIDTH, panelH, 6).fill(BRAND.panel)
  doc.roundedRect(MARGIN, panelTop, CONTENT_WIDTH, panelH, 6).lineWidth(0.5).strokeColor(BRAND.border).stroke()
  doc.restore()

  doc.font('Helvetica-Bold').fontSize(8).fillColor(BRAND.primaryDark)
  doc.text('Delivery info', leftX, panelTop + 8, { lineBreak: false })
  doc.text('Customer info', rightX, panelTop + 8, { lineBreak: false })

  doc.font('Helvetica').fontSize(9)
  let y = panelTop + 22

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

function drawTableHeader(doc, qtyLabel = 'Qty') {
  const headerH = 24
  const y = doc.y
  doc.save()
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, headerH, 4).fill(BRAND.primaryDark)
  doc.restore()

  doc.fillColor(BRAND.white).font('Helvetica-Bold').fontSize(9)
  const textY = y + 8
  doc.text('#', COL.num + 4, textY, { width: 20, lineBreak: false })
  doc.text('Particulars', COL.particulars, textY, { width: 230, lineBreak: false })
  doc.text('SKU', COL.sku, textY, { width: 80, lineBreak: false })
  doc.text('Unit', COL.unit, textY, { width: 50, lineBreak: false })
  doc.text(qtyLabel, COL.qty, textY, { width: 50, align: 'right', lineBreak: false })

  doc.y = y + headerH
  doc.fillColor(BRAND.text).font('Helvetica')
}

function measureRowHeight(doc, name, rowH) {
  doc.fontSize(9)
  const h = doc.heightOfString(String(name), { width: 248 })
  return Math.max(rowH, h + 8)
}

function drawTableRow(doc, index, { name, sku, unit, qty }, zebra) {
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

function drawSummary(doc, lineCount, totalQty, label = 'Total quantity') {
  ensureSpace(doc, 36)
  doc.moveDown(0.3)
  const y = doc.y
  doc.save()
  doc.rect(MARGIN, y, CONTENT_WIDTH, 28).fill(BRAND.panel)
  doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_WIDTH, y).strokeColor(BRAND.border).lineWidth(0.5).stroke()
  doc.restore()

  doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND.text)
  doc.text(`Line items: ${lineCount}`, MARGIN + 12, y + 9, { lineBreak: false })
  doc.text(`${label}: ${totalQty}`, MARGIN, y + 9, {
    width: CONTENT_WIDTH - 12,
    align: 'right',
    lineBreak: false,
  })
  doc.y = y + 36
}

function drawSignatures(doc, boxes = null) {
  ensureSpace(doc, 100)
  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').fontSize(11).fillColor(BRAND.text)
  doc.text('Acknowledgement', MARGIN, doc.y, { lineBreak: false })
  doc.moveDown(0.6)

  const boxW = (CONTENT_WIDTH - 16) / 2
  const boxH = 64
  const y = doc.y

  const defaultBoxes = [
    { label: 'Customer signature', x: MARGIN },
    { label: 'Delivery staff', x: MARGIN + boxW + 16 },
  ]

  for (const box of boxes || defaultBoxes) {
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
  const footerY = 808
  doc.moveTo(MARGIN, footerY - 10)
    .lineTo(MARGIN + CONTENT_WIDTH, footerY - 10)
    .strokeColor(BRAND.accent)
    .lineWidth(1)
    .stroke()
  doc.font('Helvetica').fontSize(8).fillColor(BRAND.muted)
  doc.text(
    `Workflow360 · Generated on ${formatDateTime(new Date())}`,
    MARGIN,
    footerY,
    { width: CONTENT_WIDTH, align: 'center', lineBreak: false },
  )
}

function lineFromProduct(line, qtyField = 'qty') {
  const p = line.productId
  return {
    name: p?.particulars || p?.name || line.particulars || 'Item',
    sku: p?.sku || p?.s_no || line.sku || '—',
    unit: p?.unit || line.unit || '—',
    qty: line[qtyField] ?? line.qty ?? '—',
  }
}

function renderItemsGroupedByGodown(doc, {
  title,
  lines,
  fallbackGodownId,
  godownNameById,
  emptyMessage,
  qtyLabel,
  summaryLabel,
}) {
  const groups = groupLinesByGodownForPdf(lines, fallbackGodownId, godownNameById)
  doc.font('Helvetica-Bold').fontSize(11).fillColor(BRAND.text)
  doc.text(title, MARGIN, doc.y, { lineBreak: false })
  doc.moveDown(0.5)

  if (!groups.length) {
    ensureSpace(doc, 24)
    doc.font('Helvetica').fontSize(9).fillColor(BRAND.muted)
    doc.text(emptyMessage, MARGIN + 8, doc.y + 6, { lineBreak: false })
    doc.moveDown(1.2)
    drawSummary(doc, 0, 0, summaryLabel)
    return
  }

  let totalQty = 0
  let lineCount = 0

  for (const group of groups) {
    ensureSpace(doc, 40)
    doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND.primaryDark)
    doc.text(group.godownName, MARGIN, doc.y, { lineBreak: false })
    doc.moveDown(0.35)

    drawTableHeader(doc, qtyLabel)
    group.lines.forEach((line, i) => {
      const row = lineFromProduct(line, line._qtyField || 'qty')
      totalQty += Number(row.qty) || 0
      lineCount += 1
      drawTableRow(doc, i + 1, row, i % 2 === 1)
    })
    doc.moveDown(0.4)
  }

  doc.save()
  doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + CONTENT_WIDTH, doc.y).strokeColor(BRAND.border).lineWidth(0.5).stroke()
  doc.restore()
  doc.moveDown(0.2)
  drawSummary(doc, lineCount, totalQty, summaryLabel)
}

function renderItemsSection(doc, { title, lines, emptyMessage, qtyLabel, summaryLabel }) {
  doc.font('Helvetica-Bold').fontSize(11).fillColor(BRAND.text)
  doc.text(title, MARGIN, doc.y, { lineBreak: false })
  doc.moveDown(0.5)

  drawTableHeader(doc, qtyLabel)

  if (lines.length === 0) {
    ensureSpace(doc, 24)
    doc.font('Helvetica').fontSize(9).fillColor(BRAND.muted)
    doc.text(emptyMessage, MARGIN + 8, doc.y + 6, { lineBreak: false })
    doc.moveDown(1.2)
  } else {
    let totalQty = 0
    lines.forEach((line, i) => {
      const row = lineFromProduct(line, line._qtyField || 'qty')
      totalQty += Number(row.qty) || 0
      drawTableRow(doc, i + 1, row, i % 2 === 1)
    })

    doc.save()
    doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + CONTENT_WIDTH, doc.y).strokeColor(BRAND.border).lineWidth(0.5).stroke()
    doc.restore()
    doc.moveDown(0.2)

    drawSummary(doc, lines.length, totalQty, summaryLabel)
    return
  }

  doc.save()
  doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + CONTENT_WIDTH, doc.y).strokeColor(BRAND.border).lineWidth(0.5).stroke()
  doc.restore()
  doc.moveDown(0.2)
  drawSummary(doc, 0, 0, summaryLabel)
}

module.exports = {
  BRAND,
  MARGIN,
  CONTENT_WIDTH,
  formatDateTime,
  formatStatus,
  godownName,
  groupLinesByGodownForPdf,
  renderItemsGroupedByGodown,
  siteLine,
  drawHeader,
  drawMetaPanel,
  ensureSpace,
  drawTableHeader,
  drawTableRow,
  drawSummary,
  drawSignatures,
  drawFooter,
  lineFromProduct,
  renderItemsSection,
}
