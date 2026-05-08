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
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

userSchema.index({ email: 1 }, { unique: true })

const User = mongoose.model('User', userSchema)

module.exports = User

