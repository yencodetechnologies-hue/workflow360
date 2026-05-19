const mongoose = require('mongoose')

const userSchema = mongoose.Schema(
  {
    email: { type: String, lowercase: true, trim: true },
    loginId: { type: String, trim: true, uppercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['ADMIN', 'GODOWN', 'DELIVERY', 'BILLER'],
    },
    godownId: { type: String },
    siteName: { type: String, trim: true },
    siteAddress: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    contactName: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

userSchema.index({ email: 1 }, { unique: true, sparse: true })
userSchema.index({ loginId: 1 }, { unique: true, sparse: true })

const User = mongoose.model('User', userSchema)

module.exports = User
