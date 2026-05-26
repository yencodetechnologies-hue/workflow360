/**
 * Normalize phone for lookup/storage: digits only, last 10 digits when longer (India-style).
 */
function normalizePhone(input) {
  if (input == null || input === '') return ''
  const digits = String(input).replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length > 10) return digits.slice(-10)
  return digits
}

module.exports = { normalizePhone }
