const Notification = require('../models/Notification')
const User = require('../models/User')

async function notifyUser(userId, payload) {
  if (!userId) return null
  return Notification.create({
    userId,
    godownId: payload.godownId || undefined,
    type: payload.type,
    title: payload.title,
    body: payload.body || undefined,
    refType: payload.refType || undefined,
    refId: payload.refId ? String(payload.refId) : undefined,
  })
}

async function notifyGodownUsers(godownIds, payload) {
  const ids = [...new Set((godownIds || []).filter(Boolean).map(String))]
  if (!ids.length) return []

  const users = await User.find({
    role: 'GODOWN',
    active: true,
    godownId: { $in: ids },
  })
    .select('_id godownId')
    .lean()

  const created = []
  for (const u of users) {
    const n = await notifyUser(u._id, {
      ...payload,
      godownId: u.godownId,
    })
    created.push(n)
  }
  return created
}

module.exports = { notifyUser, notifyGodownUsers }
