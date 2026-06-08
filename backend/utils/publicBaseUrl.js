const PRODUCTION_FRONTEND_URL = 'https://workflow360.octosofttechnologies.in'
const DEV_FRONTEND_URL = 'http://localhost:5173'

function trimTrailingSlash(url) {
  return String(url).replace(/\/$/, '')
}

function originFromRequest(req) {
  if (!req?.get) return null

  const origin = req.get('origin')
  if (origin) {
    try {
      return trimTrailingSlash(new URL(origin).origin)
    } catch {
      /* ignore */
    }
  }

  const referer = req.get('referer')
  if (referer) {
    try {
      return trimTrailingSlash(new URL(referer).origin)
    } catch {
      /* ignore */
    }
  }

  return null
}

function isDeployedApiHost(host) {
  const h = String(host || '').toLowerCase()
  return h.includes('workflow360.octosofttechnologies.in') || h.includes('octosofttechnologies.in')
}

function publicBaseUrl(req) {
  const envUrl = process.env.FRONTEND_PUBLIC_URL
  if (envUrl) return trimTrailingSlash(envUrl)

  const fromRequest = originFromRequest(req)
  if (fromRequest) return fromRequest

  const host = req?.get?.('host') || ''
  if (isDeployedApiHost(host) || process.env.NODE_ENV === 'production') {
    return PRODUCTION_FRONTEND_URL
  }

  return DEV_FRONTEND_URL
}

module.exports = { publicBaseUrl, PRODUCTION_FRONTEND_URL, DEV_FRONTEND_URL }
