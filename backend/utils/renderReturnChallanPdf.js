const {
  formatDateTime,
  formatStatus,
  godownName,
  siteLine,
  drawHeader,
  drawMetaPanel,
  drawSignatures,
  drawFooter,
  renderItemsSection,
  BRAND,
  MARGIN,
  CONTENT_WIDTH,
} = require('./challanPdfShared')

function buildReturnLines(delivery) {
  const items = []
  const seen = new Set()

  for (const line of delivery.lines || []) {
    const returnedQty = Number(line.returnedQty) || 0
    if (returnedQty > 0) {
      const key = `ret-${line.productId}`
      if (!seen.has(key)) {
        seen.add(key)
        items.push({ ...line, _qtyField: 'returnedQty' })
      }
    }
  }

  for (const line of delivery.billerMissingLines || []) {
    const key = `missing-${line.productId}`
    if (!seen.has(key) && (line.qty || 0) > 0) {
      seen.add(key)
      items.push({
        productId: line.productId,
        particulars: line.particulars,
        sku: line.sku,
        unit: line.unit,
        qty: line.qty,
        _qtyField: 'qty',
        _note: 'Missing',
      })
    }
  }

  for (const line of delivery.billerDamagedLines || []) {
    const key = `damaged-${line.productId}`
    if (!seen.has(key) && (line.qty || 0) > 0) {
      seen.add(key)
      items.push({
        productId: line.productId,
        particulars: line.particulars,
        sku: line.sku,
        unit: line.unit,
        qty: line.qty,
        _qtyField: 'qty',
        _note: 'Damaged',
      })
    }
  }

  return items
}

/**
 * Renders a branded return challan onto an existing PDFKit document.
 * @param {import('pdfkit')} doc
 * @param {object} delivery - delivery with populated lines and biller return lines
 */
function renderReturnChallanPdf(doc, delivery) {
  const leftRows = [
    ['Challan No', delivery.challanNo || delivery.deliveryNo || '—'],
    ['Delivery No', delivery.deliveryNo || '—'],
    ['Return expected', formatDateTime(delivery.returnExpectedAt)],
    ['Status', formatStatus(delivery.status)],
    ['Biller return', delivery.billerReturnSubmittedAt ? formatDateTime(delivery.billerReturnSubmittedAt) : '—'],
  ]

  const rightRows = [
    ['Customer', delivery.customerName || '—'],
    ['Phone', delivery.contactPhone || '—'],
    ['Site', siteLine(delivery)],
    ['Return vehicle', delivery.returnPickupVehicleLabel || '—'],
    ['Godown', godownName(delivery)],
    ['Generated', formatDateTime(new Date())],
  ]

  drawHeader(doc, 'RETURN CHALLAN')
  drawMetaPanel(doc, leftRows, rightRows)

  const returnLines = buildReturnLines(delivery)

  renderItemsSection(doc, {
    title: 'Return items',
    lines: returnLines,
    emptyMessage: 'No return items recorded.',
    qtyLabel: 'Return qty',
    summaryLabel: 'Total return qty',
  })

  const boxW = (CONTENT_WIDTH - 16) / 2
  drawSignatures(doc, [
    { label: 'Customer signature', x: MARGIN },
    { label: 'Godown staff', x: MARGIN + boxW + 16 },
  ])
  drawFooter(doc)
}

module.exports = { renderReturnChallanPdf, buildReturnLines, BRAND, MARGIN }
