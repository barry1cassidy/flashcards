export const PRESET_COLORS = [
  '#4C6FFF',
  '#FF6B57',
  '#F2B84B',
  '#3FCF8E',
  '#7C3AED',
  '#DB2777',
  '#0891B2',
  '#EA580C',
  '#4F46E5',
  '#64748B',
]

export function normalizeHex(value) {
  if (!value) {
    return PRESET_COLORS[0]
  }
  const hex = value.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return hex.toUpperCase()
  }
  return PRESET_COLORS[0]
}

export function contrastText(hex) {
  const value = normalizeHex(hex).slice(1)
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 160 ? '#0B0E17' : '#ffffff'
}
