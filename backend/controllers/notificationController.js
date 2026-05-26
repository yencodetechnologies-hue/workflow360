const Notification = require('../models/Notification')

function mapRow(n) {
  return {
    id: String(n._id),
    type: n.type,
    title: n.title,
    body: n.body,
    refType: n.refType,
    refId: n.refId,
    readAt: n.readAt,
    createdAt: n.createdAt,
  }
}

async function listNotifications(req, res) {
  try {
    const limit = Math.min(100, Number(req.query.limit || 50))
    const unreadOnly = req.query.unread === '1' || req.query.unread === 'true'

    const filter = { userId: req.user.id }
    if (unreadOnly) filter.readAt = { $exists: false }

    const rows = await Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean()
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      readAt: { $exists: false },
    })

    return res.json({
      items: rows.map(mapRow),
      unreadCount,
    })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'List notifications failed' })
  }
}

async function markRead(req, res) {
  try {
    const n = await Notification.findOne({ _id: req.params.id, userId: req.user.id })
    if (!n) return res.status(404).json({ message: 'Not found' })
    n.readAt = new Date()
    await n.save()
    return res.json(mapRow(n.toObject()))
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Mark read failed' })
  }
}

async function markAllRead(req, res) {
  try {
    await Notification.updateMany(
      { userId: req.user.id, readAt: { $exists: false } },
      { $set: { readAt: new Date() } },
    )
    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Mark all read failed' })
  }
}

module.exports = { listNotifications, markRead, markAllRead }
