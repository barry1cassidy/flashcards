export function deckPhrases(turns) {
  const seen = new Set()
  const cards = []
  for (const turn of turns || []) {
    const front = String(turn?.nativeText || '').trim()
    const back = String(turn?.targetText || '').trim()
    if (!front || !back) {
      continue
    }
    const key = `${front}\n${back}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    cards.push({ front, back })
  }
  return cards
}
