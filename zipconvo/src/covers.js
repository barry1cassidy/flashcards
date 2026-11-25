export const COVER_MOTIFS = ['table', 'headset', 'pair', 'bench', 'stroll', 'listen']

export const COVER_PALETTES = {
  periwinkle: { bg: '#e4eafc', wash: '#c9d5fb', figure: '#4f68c8', accent: '#8aa2ff', ink: '#1b2433', surface: '#f7f8fc' },
  mint: { bg: '#e3f6ef', wash: '#bfe8d4', figure: '#2f8f72', accent: '#7ed9b8', ink: '#1b2433', surface: '#f7fbf9' },
  sand: { bg: '#f8f1e6', wash: '#f0ddc4', figure: '#b8885c', accent: '#e2c09a', ink: '#3a2c22', surface: '#fffaf4' },
  clay: { bg: '#f8eee9', wash: '#f3d4c8', figure: '#b86a52', accent: '#e0a48a', ink: '#3a2420', surface: '#fff8f5' },
  slate: { bg: '#eef1f6', wash: '#d5dde8', figure: '#5c6b82', accent: '#9aabc4', ink: '#1b2433', surface: '#f7f8fb' },
  dusk: { bg: '#eceaf6', wash: '#d5d1ea', figure: '#5a5478', accent: '#9b94cc', ink: '#241f33', surface: '#f7f6fb' },
}

export const COVER_PALETTE_NAMES = Object.keys(COVER_PALETTES)

export function customCover(id) {
  const n = hashId(String(id ?? ''))
  return {
    motif: COVER_MOTIFS[n % COVER_MOTIFS.length],
    palette: COVER_PALETTE_NAMES[(n >>> 8) % COVER_PALETTE_NAMES.length],
  }
}

function hashId(value) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
