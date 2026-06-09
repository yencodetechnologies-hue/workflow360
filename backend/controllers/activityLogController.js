const mongoose = require('mongoose')
const ActivityLog = require('../models/ActivityLog')

async function listActivityLogs(req, res) {
  try {
    const {
      category,
      action,
      actorRole,
      actorId,
      targetType,
      targetId,
      dateFrom,
      dateTo,
      page,
      limit: limitParam,
    } = req.query

    const q = {}

    if (category) q.category = String(category).toUpperCase()
    if (action) q.action = String(action).toUpperCase()
    if (actorRole) q['actor.role'] = String(actorRole).toUpperCase()
    if (actorId) q['actor.userId'] = String(actorId)
    if (targetType) q.targetType = String(targetType).toUpperCase()
    if (targetId) q.targetId = String(targetId)

    if (dateFrom || dateTo) {
      q.at = {}
      if (dateFrom) {
        const d = new Date(String(dateFrom))
        if (!isNaN(d.getTime())) q.at.$gte = d
      }
      if (dateTo) {
        const d = new Date(String(dateTo))
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 1)
          q.at.$lt = d
        }
      }
    }

    // Non-admin roles see only their own actions
    if (req.user.role !== 'ADMIN') {
      q['actor.userId'] = String(req.user.id)
    }

    const pageNum = Math.max(1, Number(page || 1))
    const limit = Math.min(200, Math.max(1, Number(limitParam || 50)))
    const skip = (pageNum - 1) * limit

    const [logs, total] = await Promise.all([
      ActivityLog.find(q).sort({ at: -1 }).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments(q),
    ])

    return res.json({
      logs: logs.map((l) => ({
        id: String(l._id),
        at: l.at,
        actor: l.actor,
        action: l.action,
        category: l.category,
        targetType: l.targetType,
        targetId: l.targetId,
        targetName: l.targetName,
        details: l.details,
        ip: l.ip,
      })),
      total,
      page: pageNum,
      limit,
      pages: Math.ceil(total / limit),
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to load activity logs' })
  }
}

module.exports = { listActivityLogs }
