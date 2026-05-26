const mongoose = require('mongoose')

const orderLineSchema = mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    godownId: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown' },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false },
)

const orderSchema = mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    siteName: { type: String, trim: true },
    siteAddress: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    deliveryAt: { type: Date, required: true },
    returnExpectedAt: { type: Date },
    fromGodownId: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown' },
    lines: { type: [orderLineSchema], default: [] },
    status: {
      type: String,
      required: true,
      enum: ['CREATED', 'ALLOCATED', 'DISPATCHED', 'DELIVERED', 'CLOSED', 'CANCELLED'],
      default: 'CREATED',
    },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

orderSchema.index({ deliveryAt: 1 })
orderSchema.index({ status: 1, deliveryAt: 1 })
orderSchema.index({ fromGodownId: 1, deliveryAt: -1 })

module.exports = mongoose.model('Order', orderSchema)

