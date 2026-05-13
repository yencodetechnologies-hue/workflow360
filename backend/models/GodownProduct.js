const mongoose = require('mongoose')

const godownProductSchema = mongoose.Schema(
  {
    godownId: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
)

godownProductSchema.index({ godownId: 1, productId: 1 }, { unique: true })

module.exports = mongoose.model('GodownProduct', godownProductSchema)
