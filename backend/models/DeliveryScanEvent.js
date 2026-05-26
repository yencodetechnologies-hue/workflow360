const mongoose = require('mongoose')

const deliveryScanEventSchema = mongoose.Schema(
  {
    deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery', required: true },
    tagId: { type: String, required: true, trim: true },
    action: {
      type: String,
      required: true,
      enum: ['DISPATCH', 'PICKUP', 'DELIVER', 'RETURN', 'RETURN_PICKUP'],
    },
    byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, trim: true },
  },
  { timestamps: true },
)

deliveryScanEventSchema.index({ deliveryId: 1, at: -1 })
deliveryScanEventSchema.index({ tagId: 1, at: -1 })

module.exports = mongoose.model('DeliveryScanEvent', deliveryScanEventSchema)
