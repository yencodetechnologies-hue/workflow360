const mongoose = require('mongoose')

const activityLogSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now, index: true },
    actor: {
      userId: { type: String },
      role: { type: String },
      name: { type: String },
    },
    action: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    targetType: { type: String },
    targetId: { type: String },
    targetName: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
  },
  { versionKey: false },
)

activityLogSchema.index({ at: -1 })
activityLogSchema.index({ category: 1, at: -1 })
activityLogSchema.index({ 'actor.userId': 1, at: -1 })

module.exports = mongoose.model('ActivityLog', activityLogSchema)
