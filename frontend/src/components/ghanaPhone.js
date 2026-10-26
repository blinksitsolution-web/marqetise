export const GHANA_PHONE_HINT = 'A Ghana number, such as 024 123 4567 or +233 24 123 4567.'
export const GHANA_PHONE_ERROR = 'Enter a valid Ghanaian phone number, e.g. 024 123 4567 or +233 24 123 4567.'
export const GHANA_PHONE_PLACEHOLDER = '024 123 4567'

const MOBILE_PREFIXES = new Set(['20', '23', '24', '25', '26', '27', '28', '50', '53', '54', '55', '56', '57', '59'])

export function ghanaNational(value) {
  const compact = String(value || '').trim().replace(/[\s().-]/g, '')
  if (!/^\+?\d+$/.test(compact)) return ''
  const digits = compact.startsWith('+') ? compact.slice(1) : compact
  let national = ''
  if (digits.startsWith('233') && digits.length === 12) national = digits.slice(3)
  else if (digits.startsWith('0') && digits.length === 10) national = digits.slice(1)
  else return ''
  const prefix = national.slice(0, 2)
  if (!prefix.startsWith('3') && !MOBILE_PREFIXES.has(prefix)) return ''
  return national
}

export function ghanaE164(value) {
  const national = ghanaNational(value)
  return national ? `+233${national}` : ''
}

export function ghanaDisplay(value) {
  const national = ghanaNational(value)
  if (!national) return String(value || '').trim()
  return `+233 ${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`
}
