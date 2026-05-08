const mongoose = require('mongoose')

const godownSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, trim: true },
    manager: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

godownSchema.index({ name: 1 })

module.exports = mongoose.model('Godown', godownSchema)

