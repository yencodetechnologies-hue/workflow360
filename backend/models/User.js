const mongoose = require('mongoose')

const userSchema = mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['ADMIN', 'GODOWN', 'DELIVERY', 'BILLER'],
    },
    godownId: { type: String },
    siteName: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)


const User = mongoose.model('User', userSchema)

module.exports = User

