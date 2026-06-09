const ActivityLog = require('../models/ActivityLog')

function actorFromReq(req) {
  if (!req || !req.user) return {}
  const u = req.user
  const name = u.email || u.loginId || u.siteName || u.contactName || String(u.id)
  return { userId: String(u.id), role: u.role, name }
}

function ipFromReq(req) {
  if (!req) return undefined
  return (
    req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    undefined
  )
}

/**
 * Fire-and-forget activity log entry. Never throws — logging failures must not
 * break the request that triggered them.
 */
function logActivity({ req, actor, action, category, targetType, targetId, targetName, details } = {}) {
  const entry = {
    action,
    category,
    actor: actor || actorFromReq(req),
    targetType,
    targetId,
    targetName,
    details,
    ip: ipFromReq(req),
  }
  ActivityLog.create(entry).catch(() => {})
}

module.exports = { logActivity }
