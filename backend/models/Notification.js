const mongoose = require('mongoose')

const notificationSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    godownId: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown' },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, trim: true },
    refType: { type: String, trim: true },
    refId: { type: String, trim: true },
    readAt: { type: Date },
  },
  { timestamps: true },
)

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
