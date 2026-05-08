const mongoose = require('mongoose')

const assetTagSchema = mongoose.Schema(
  {
    tagId: { type: String, required: true, unique: true, trim: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    status: {
      type: String,
      required: true,
      enum: ['IN_STOCK', 'IN_DELIVERY', 'DAMAGED', 'LOST'],
      default: 'IN_STOCK',
    },
    currentGodownId: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown' },
    currentDeliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
  },
  { timestamps: true },
)

assetTagSchema.index({ productId: 1, status: 1 })
assetTagSchema.index({ currentGodownId: 1 })
assetTagSchema.index({ currentDeliveryId: 1 })

module.exports = mongoose.model('AssetTag', assetTagSchema)

