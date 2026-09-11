const INVISIBLE_CHARS = /[\s\u200B-\u200D\u2060\uFEFF]/gu

export function normalizeAnswer(value) {
  return String(value ?? '')
    .normalize('NFC')
    .replace(INVISIBLE_CHARS, '')
    .toLowerCase()
}

export function answersMatch(expected, actual) {
  return normalizeAnswer(expected) === normalizeAnswer(actual)
}

export function diffAnswers(expected, actual) {
  const expectedChars = graphemes(String(expected ?? ''))
  const actualChars = graphemes(String(actual ?? ''))
  const table = lcsTable(expectedChars, actualChars)
  const expectedParts = []
  const actualParts = []
  let i = expectedChars.length
  let j = actualChars.length
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && expectedChars[i - 1] === actualChars[j - 1]) {
      expectedParts.push({ text: expectedChars[i - 1], kind: 'same' })
      actualParts.push({ text: actualChars[j - 1], kind: 'same' })
      i -= 1
      j -= 1
    } else if (j > 0 && (i === 0 || table[i][j - 1] >= table[i - 1][j])) {
      actualParts.push({ text: actualChars[j - 1], kind: 'extra' })
      j -= 1
    } else {
      expectedParts.push({ text: expectedChars[i - 1], kind: 'missing' })
      i -= 1
    }
  }
  expectedParts.reverse()
  actualParts.reverse()
  return {
    expected: mergeParts(expectedParts),
    actual: mergeParts(actualParts),
  }
}

function graphemes(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(
      (part) => part.segment,
    )
  }
  return Array.from(text)
}

function lcsTable(left, right) {
  const rows = left.length
  const cols = right.length
  const table = Array.from({ length: rows + 1 }, () => Array(cols + 1).fill(0))
  for (let i = 1; i <= rows; i += 1) {
    for (let j = 1; j <= cols; j += 1) {
      table[i][j] =
        left[i - 1] === right[j - 1] ? table[i - 1][j - 1] + 1 : Math.max(table[i - 1][j], table[i][j - 1])
    }
  }
  return table
}

function mergeParts(parts) {
  const merged = []
  for (const part of parts) {
    const last = merged[merged.length - 1]
    if (last && last.kind === part.kind) {
      last.text += part.text
    } else {
      merged.push({ text: part.text, kind: part.kind })
    }
  }
  return merged
}
