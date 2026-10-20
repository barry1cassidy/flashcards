const ALPHABET = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/

export function shareCodeFromInput(raw) {
  const text = String(raw || '').trim()
  if (!text) {
    return ''
  }
  let candidate = text
  try {
    const url = new URL(text)
    const parts = url.pathname.split('/').filter(Boolean)
    const shareAt = parts.findIndex((part) => part.toLowerCase() === 'share')
    if (shareAt >= 0 && parts[shareAt + 1]) {
      candidate = parts[shareAt + 1]
    }
  } catch {
    const match = text.match(/\/share\/([^/?#\s]+)/i)
    if (match) {
      candidate = match[1]
    }
  }
  candidate = candidate.toUpperCase()
  if (!ALPHABET.test(candidate) || (candidate.length !== 6 && candidate.length !== 8)) {
    return ''
  }
  return candidate
}
