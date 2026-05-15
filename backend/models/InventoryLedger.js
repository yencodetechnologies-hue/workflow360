const mongoose = require('mongoose')

const inventoryLedgerSchema = mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    godownId: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qtyDelta: { type: Number, required: true },
    reason: {
      type: String,
      required: true,
      enum: ['DISPATCH', 'RETURN', 'TRANSFER_OUT', 'TRANSFER_IN', 'DAMAGE', 'LOSS', 'ADJUSTMENT'],
    },
    refType: { type: String, trim: true },
    refId: { type: String, trim: true },
    note: { type: String, trim: true, maxlength: 500 },
    byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

inventoryLedgerSchema.index({ godownId: 1, productId: 1, at: -1 })
inventoryLedgerSchema.index({ at: -1 })

module.exports = mongoose.model('InventoryLedger', inventoryLedgerSchema)

