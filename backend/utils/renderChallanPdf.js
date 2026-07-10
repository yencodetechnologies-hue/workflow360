// const {
//   formatDateTime,
//   formatStatus,
//   godownName,
//   siteLine,
//   drawHeader,
//   drawMetaPanel,
//   drawSignatures,
//   drawFooter,
//   renderItemsGroupedByGodown,
//   BRAND,
//   MARGIN,
// } = require('./challanPdfShared')

// /**
//  * Renders a branded delivery challan onto an existing PDFKit document.
//  * @param {import('pdfkit')} doc
//  * @param {object} delivery - lean delivery with populated lines.productId and fromGodownId
//  */
// function renderChallanPdf(doc, delivery) {
//   const leftRows = [
//     ['Challan No', delivery.challanNo || delivery.deliveryNo || '—'],
//     ['Delivery No', delivery.deliveryNo || '—'],
//     ['Delivery at', formatDateTime(delivery.deliveryAt)],
//     ['Status', formatStatus(delivery.status)],
//   ]

//   const rightRows = [
//     ['Customer', delivery.customerName || '—'],
//     ['Phone', delivery.contactPhone || '—'],
//     ['Site', siteLine(delivery)],
//     ['Vehicle', delivery.vehicleLabel || '—'],
//     ['Godown', godownName(delivery)],
//     ['Generated', formatDateTime(new Date())],
//   ]

//   drawHeader(doc, 'DELIVERY CHALLAN')
//   drawMetaPanel(doc, leftRows, rightRows)

//   const godownNameById = Object.fromEntries(
//     (delivery.pickupLocations || [])
//       .filter((p) => p.godownId && p.name)
//       .map((p) => [String(p.godownId), p.name]),
//   )

//   renderItemsGroupedByGodown(doc, {
//     title: 'Items by godown',
//     lines: delivery.lines || [],
//     fallbackGodownId: delivery.fromGodownId,
//     godownNameById,
//     emptyMessage: 'No items on this delivery.',
//     qtyLabel: 'Qty',
//     summaryLabel: 'Total quantity',
//   })

//   drawSignatures(doc)
//   drawFooter(doc)
// }

// module.exports = { renderChallanPdf, BRAND, MARGIN }

const {
  formatDateTime,
  godownName,
  siteLine,
  drawHeader,
  drawMetaPanel,
  drawSignatures,
  drawFooter,
  renderItemsGroupedByGodown,
  BRAND,
  MARGIN,
} = require('./challanPdfShared')

/**
 * Renders a branded delivery challan onto an existing PDFKit document.
 * @param {import('pdfkit')} doc
 * @param {object} delivery - lean delivery with populated lines.productId and fromGodownId
 */
function renderChallanPdf(doc, delivery) {
  const leftRows = [
    ['Challan No', delivery.challanNo || delivery.deliveryNo || '—'],
    ['Delivery at', formatDateTime(delivery.deliveryAt)],
  ]

  const rightRows = [
    ['Customer', delivery.customerName || '—'],
    ['Phone', delivery.contactPhone || '—'],
    ['Site', siteLine(delivery)],
    ['Vehicle', delivery.vehicleLabel || '—'],
    ['Godown', godownName(delivery)],
    ['Generated', formatDateTime(new Date())],
  ]

  drawHeader(doc, 'DELIVERY CHALLAN')
  drawMetaPanel(doc, leftRows, rightRows)

  const godownNameById = Object.fromEntries(
    (delivery.pickupLocations || [])
      .filter((p) => p.godownId && p.name)
      .map((p) => [String(p.godownId), p.name]),
  )

  renderItemsGroupedByGodown(doc, {
    title: 'Items by godown',
    lines: delivery.lines || [],
    fallbackGodownId: delivery.fromGodownId,
    godownNameById,
    emptyMessage: 'No items on this delivery.',
    qtyLabel: 'Qty',
    summaryLabel: 'Total quantity',
  })

  drawSignatures(doc)
  drawFooter(doc)
}

module.exports = { renderChallanPdf, BRAND, MARGIN }
