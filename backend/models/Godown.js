const mongoose = require('mongoose')

const godownSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
    address: { type: String, trim: true },
    mobile: { type: String, trim: true },
    location: { type: String, trim: true },
    city: { type: String, trim: true },
    manager: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

godownSchema.index({ name: 1 })
godownSchema.index({ code: 1 }, { unique: true, sparse: true })

module.exports = mongoose.model('Godown', godownSchema)

