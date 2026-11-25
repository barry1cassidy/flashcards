import { useMemo } from 'react'

function hashText(value) {
  let hash = 2166136261
  const text = String(value || 'card')
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function trackBars(seed, count = 48) {
  let hash = hashText(seed)
  const bars = []
  for (let i = 0; i < count; i += 1) {
    hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0
    const wave = Math.sin((i / count) * Math.PI * 4) * 0.22 + 0.62
    const noise = (hash % 100) / 100
    bars.push(Math.round(18 + (wave * 0.7 + noise * 0.3) * 82))
  }
  return bars
}

export default function AudioTrack({ text, progress = 0, active = false }) {
  const bars = useMemo(() => trackBars(text), [text])
  const played = Math.max(0, Math.min(1, progress))
  return (
    <div className={`listen-track${active ? ' is-speaking' : ''}`} aria-hidden="true">
      {bars.map((height, index) => (
        <span
          key={`${text}-${index}`}
          className={index / bars.length < played ? 'is-played' : ''}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  )
}
