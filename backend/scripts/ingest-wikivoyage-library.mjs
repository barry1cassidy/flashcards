import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const USER_AGENT = 'FlashcardsLibraryBot/1.0 (localhost; educational Wikivoyage reuse)'
const CARD_LIMIT = 20
const CJK = /[\u3400-\u9FFF]/
const PINYIN = /[A-Za-züÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/

const LANGUAGES = [
  { slug: 'spanish', name: 'Spanish', page: 'Spanish_phrasebook', targetLanguage: 'es-ES' },
  { slug: 'french', name: 'French', page: 'French_phrasebook', targetLanguage: 'fr-FR' },
  { slug: 'german', name: 'German', page: 'German_phrasebook', targetLanguage: 'de-DE' },
  { slug: 'italian', name: 'Italian', page: 'Italian_phrasebook', targetLanguage: 'it-IT' },
  { slug: 'portuguese', name: 'Portuguese', page: 'Portuguese_phrasebook', targetLanguage: 'pt-BR' },
  { slug: 'chinese', name: 'Chinese (Mandarin)', page: 'Chinese_phrasebook', targetLanguage: 'zh-CN' },
  { slug: 'japanese', name: 'Japanese', page: 'Japanese_phrasebook', targetLanguage: 'ja-JP' },
  { slug: 'korean', name: 'Korean', page: 'Korean_phrasebook', targetLanguage: 'ko-KR' },
  { slug: 'arabic', name: 'Arabic', page: 'Arabic_phrasebook', targetLanguage: 'ar-SA' },
  { slug: 'russian', name: 'Russian', page: 'Russian_phrasebook', targetLanguage: 'ru-RU' },
  { slug: 'hindi', name: 'Hindi', page: 'Hindi_phrasebook', targetLanguage: 'hi-IN' },
  { slug: 'turkish', name: 'Turkish', page: 'Turkish_phrasebook', targetLanguage: 'tr-TR' },
  { slug: 'dutch', name: 'Dutch', page: 'Dutch_phrasebook', targetLanguage: 'nl-NL' },
  { slug: 'polish', name: 'Polish', page: 'Polish_phrasebook', targetLanguage: 'pl-PL' },
  { slug: 'swedish', name: 'Swedish', page: 'Swedish_phrasebook', targetLanguage: 'sv-SE' },
  { slug: 'greek', name: 'Greek', page: 'Greek_phrasebook', targetLanguage: 'el-GR' },
  { slug: 'vietnamese', name: 'Vietnamese', page: 'Vietnamese_phrasebook', targetLanguage: 'vi-VN' },
  { slug: 'thai', name: 'Thai', page: 'Thai_phrasebook', targetLanguage: 'th-TH' },
  { slug: 'indonesian', name: 'Indonesian', page: 'Indonesian_phrasebook', targetLanguage: 'id-ID' },
  { slug: 'hebrew', name: 'Hebrew', page: 'Hebrew_phrasebook', targetLanguage: 'he-IL' },
]

const MORE_LANGUAGES = [
  { slug: 'irish', name: 'Irish', page: 'Irish_phrasebook', targetLanguage: 'ga-IE' },
  { slug: 'cantonese', name: 'Cantonese', page: 'Cantonese_phrasebook', targetLanguage: 'zh-HK' },
  { slug: 'ukrainian', name: 'Ukrainian', page: 'Ukrainian_phrasebook', targetLanguage: 'uk-UA' },
  { slug: 'danish', name: 'Danish', page: 'Danish_phrasebook', targetLanguage: 'da-DK' },
  { slug: 'finnish', name: 'Finnish', page: 'Finnish_phrasebook', targetLanguage: 'fi-FI' },
  { slug: 'czech', name: 'Czech', page: 'Czech_phrasebook', targetLanguage: 'cs-CZ' },
  { slug: 'romanian', name: 'Romanian', page: 'Romanian_phrasebook', targetLanguage: 'ro-RO' },
  { slug: 'tagalog', name: 'Tagalog', page: 'Tagalog_phrasebook', targetLanguage: 'tl-PH' },
  { slug: 'swahili', name: 'Swahili', page: 'Swahili_phrasebook', targetLanguage: 'sw-KE' },
  { slug: 'welsh', name: 'Welsh', page: 'Welsh_phrasebook', targetLanguage: 'cy-GB' },
  { slug: 'norwegian', name: 'Norwegian', page: 'Norwegian_phrasebook', targetLanguage: 'nb-NO' },
  { slug: 'hungarian', name: 'Hungarian', page: 'Hungarian_phrasebook', targetLanguage: 'hu-HU' },
]

const DECKS = [
  { slug: 'greetings-courtesy', name: 'Greetings & courtesy', description: 'Hello, names, please, and thanks.' },
  { slug: 'survival-phrases', name: 'Survival phrases', description: 'When you do not understand, need the toilet, or need help.' },
  { slug: 'numbers', name: 'Numbers', description: 'Counting for tickets, prices, and times.' },
  { slug: 'time-dates', name: 'Time & dates', description: 'Now, today, days, and clock time.' },
  { slug: 'getting-around', name: 'Getting around', description: 'Tickets, directions, taxis, and the airport.' },
  { slug: 'somewhere-to-stay', name: 'Somewhere to stay', description: 'Rooms, nights, and checkout.' },
  { slug: 'money', name: 'Money', description: 'Cards, cash, and how much it costs.' },
  { slug: 'eating-out', name: 'Eating out', description: 'Tables, menus, and the check.' },
  { slug: 'shopping', name: 'Shopping', description: 'Prices, sizes, and everyday needs.' },
  { slug: 'help-emergencies', name: 'Help & emergencies', description: 'Lost, sick, police, and asking for help.' },
]

// Wiki italic/bold uses runs of apostrophes. A single apostrophe inside a word
// (na'am, Dziękuję, traveler's) must not end the span. Bold is '''term''';
// italics are ''pronunciation''. Matching '' first would treat bold as italics
// and throw the term away, leaving a stray quote on each side.
const WIKI_BI = /'''''((?:[^']|'(?!'))+?)'''''/g
const WIKI_BOLD = /'''((?:[^']|'(?!'))+?)'''/g
const WIKI_ITALIC = /''((?:[^']|'(?!'))+?)''/g
const FOREIGN_SCRIPT = {
  'ar-SA': /[\u0600-\u06FF]/,
  'he-IL': /[\u0590-\u05FF]/,
  'el-GR': /[\u0370-\u03FF]/,
  'ru-RU': /[\u0400-\u04FF]/,
  'uk-UA': /[\u0400-\u04FF]/,
  'zh-CN': /[\u3400-\u9FFF]/,
  'zh-HK': /[\u3400-\u9FFF]/,
  'ja-JP': /[\u3040-\u30FF\u3400-\u9FFF]/,
  'ko-KR': /[\uAC00-\uD7AF]/,
  'hi-IN': /[\u0900-\u097F]/,
  'th-TH': /[\u0E00-\u0E7F]/,
}

function expandTemplate(body) {
  const parts = body.split('|').map((part) => part.trim())
  const name = (parts[0] || '').toLowerCase()
  // {{Lang|ar|سَلاَم}} is the translation. Dropping every template deletes it
  // and leaves the comma that separated two alternatives.
  if (name === 'lang' || name === 'ipa' || name === 'transl' || name.startsWith('lang-')) {
    return parts.length > 1 ? parts[parts.length - 1] : ''
  }
  if (name === 'w' || name === 'wikt') {
    return parts[1] || ''
  }
  return ''
}

export function prepareWikitext(wikitext) {
  let out = String(wikitext || '')
  for (let pass = 0; pass < 12; pass += 1) {
    const next = out.replace(/\{\{([^{}]*)\}\}/g, (_, body) => expandTemplate(body))
    if (next === out) {
      break
    }
    out = next
  }
  return out.replace(/\[\[(?:file|image|media):[^\]]+\]\]/gi, ' ')
}

function unwrapBold(value) {
  WIKI_BI.lastIndex = 0
  WIKI_BOLD.lastIndex = 0
  return String(value || '').replace(WIKI_BI, '$1').replace(WIKI_BOLD, '$1')
}

function italics(value) {
  WIKI_ITALIC.lastIndex = 0
  return [...unwrapBold(value).matchAll(WIKI_ITALIC)].map((match) => match[1].trim()).filter(Boolean)
}

function hasWords(value) {
  return /[\p{L}\p{N}]/u.test(value)
}

function foreignScript(text, targetLanguage) {
  const script = FOREIGN_SCRIPT[targetLanguage]
  return script ? script.test(text) : false
}

function separatePronunciation(value, targetLanguage) {
  const unwrapped = unwrapBold(value)
  WIKI_ITALIC.lastIndex = 0
  const hints = []
  const text = unwrapped.replace(WIKI_ITALIC, (_, raw) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      return ' '
    }
    if (foreignScript(trimmed, targetLanguage)) {
      return ` ${trimmed} `
    }
    hints.push(trimmed)
    return ' '
  })
  if (!hasWords(text) && hints.length > 0) {
    return { text: hints.join(' / '), hints: [] }
  }
  return { text, hints }
}

function balanceParens(value) {
  let out = ''
  const opens = []
  for (const ch of value) {
    if (ch === '(') {
      opens.push(out.length)
      out += ch
      continue
    }
    if (ch === ')') {
      if (opens.length > 0) {
        opens.pop()
        out += ch
      }
      continue
    }
    out += ch
  }
  let trimmed = out
  for (let i = opens.length - 1; i >= 0; i -= 1) {
    trimmed = `${trimmed.slice(0, opens[i])}${trimmed.slice(opens[i] + 1)}`
  }
  return trimmed
}

function unwrapOuterParens(value) {
  let out = value.trim()
  while (out.startsWith('(') && out.endsWith(')')) {
    let depth = 0
    let wrapsAll = true
    for (let i = 0; i < out.length; i += 1) {
      if (out[i] === '(') {
        depth += 1
      } else if (out[i] === ')') {
        depth -= 1
      }
      if (depth === 0 && i < out.length - 1) {
        wrapsAll = false
        break
      }
    }
    if (!wrapsAll || depth !== 0) {
      break
    }
    out = out.slice(1, -1).trim()
  }
  return out
}

function cleanHint(value) {
  let hint = unwrapOuterParens(balanceParens(String(value || '')))
  hint = hint.replace(/\s+/g, ' ').trim()
  if (!hint || hint.length > 180 || !/\p{L}/u.test(hint)) {
    return null
  }
  return hint
}

function joinHints(parts, back) {
  const cleaned = []
  const folded = back.toLowerCase()
  for (const part of parts) {
    const hint = cleanHint(part)
    if (!hint || folded.includes(hint.toLowerCase())) {
      continue
    }
    cleaned.push(hint)
  }
  if (cleaned.length === 0) {
    return null
  }
  let joined = cleaned[0]
  for (let i = 1; i < cleaned.length; i += 1) {
    const next = `${joined}; ${cleaned[i]}`
    if (next.length > 180) {
      break
    }
    joined = next
  }
  return joined
}

function stripWiki(value) {
  WIKI_ITALIC.lastIndex = 0
  return unwrapBold(value)
    .replace(WIKI_ITALIC, '$1')
    .replace(/\[\[[^\|\]]+\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanBack(value) {
  return balanceParens(value)
    .replace(/\/[^/\n]*[^\u0000-\u007F][^/\n]*\//g, ' ')
    .replace(/\(\s*[,/.\s]*\)/g, ' ')
    .replace(/\(\s*\)/g, ' ')
    .replace(/\s+Note:.*$/i, '')
    .replace(/\s*\([^)]*\)\s*$/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/\s+([.!?؟])/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,;:'"()]+|[\s,;:'"()]+$/g, '')
    .trim()
}

export function parsePhrase(line, targetLanguage) {
  const match = prepareWikitext(line).match(/^;\s*(.+?)\s*:(?!\d)\s*(.+)$/)
  if (!match) {
    return null
  }
  const front = stripWiki(match[1]).replace(/\s+\([^)]*\)$/g, '').trim()
  const rawBack = match[2].trim()
  if (!front || front.length > 160 || !rawBack) {
    return null
  }
  if (/^OPEN|CLOSED|ENTRANCE|EXIT|PUSH|PULL|MEN|WOMEN$/i.test(front) && front === front.toUpperCase()) {
    return null
  }

  if (targetLanguage === 'zh-CN' || targetLanguage === 'zh-HK') {
    const spoken = italics(rawBack).find((part) => PINYIN.test(part) && part.length < 80)
    const hint = spoken ? spoken.replace(/[.’']+$/g, '').trim() : null
    WIKI_ITALIC.lastIndex = 0
    let simplified = unwrapBold(rawBack).replace(WIKI_ITALIC, ' ').trim()
    const splitTrad = simplified.match(/^(.*?)\s*[\(（]([\u3400-\u9FFF].*)$/)
    if (splitTrad) {
      simplified = splitTrad[1]
    }
    const back = simplified
      .replace(/\(\s*\)/g, '')
      .replace(/[A-Za-züÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ].*$/g, '')
      .replace(/[,;:]+$/g, '')
      .replace(/\s+/g, '')
      .trim()
    if (!CJK.test(back)) {
      return null
    }
    return { front, back, hint }
  }

  const separated = separatePronunciation(rawBack, targetLanguage)
  const back = cleanBack(stripWiki(separated.text))
  if (!back || back.length > 180 || /^[\s.,;:'"()[\]-]+$/.test(back)) {
    return null
  }
  const hint = joinHints(separated.hints, back)
  return { front, back, hint }
}

export function phrasesBySection(wikitext) {
  const cleaned = prepareWikitext(wikitext)
  const start = cleaned.search(/^==\s*(phrase list|[^=]*phrases)\s*==/im)
  const body = start >= 0 ? cleaned.slice(start) : cleaned
  const sections = new Map()
  let current = 'other'
  let pending = null
  const flush = () => {
    if (!pending) {
      return
    }
    if (!sections.has(current)) {
      sections.set(current, [])
    }
    sections.get(current).push(pending)
    pending = null
  }
  for (const rawLine of body.split(/\n/)) {
    const heading = rawLine.match(/^(={2,4})\s*([^=]+?)\s*\1\s*$/)
    if (heading) {
      flush()
      const level = heading[1].length
      const title = heading[2].trim().toLowerCase()
      if (level === 2 && !title.includes('phrase')) {
        break
      }
      if (level === 3) {
        current = title
      }
      continue
    }
    const line = rawLine.trim()
    if (line.startsWith(';')) {
      flush()
      pending = line
      continue
    }
    if (pending && line.startsWith(':')) {
      pending += ` ${line.replace(/^:+/, '').trim()}`
    }
  }
  flush()
  return sections
}

function take(phrases, targetLanguage, limit = CARD_LIMIT) {
  const seen = new Set()
  const cards = []
  for (const line of phrases) {
    const card = parsePhrase(line, targetLanguage)
    if (!card) {
      continue
    }
    const key = `${card.front.toLowerCase()}|${card.back.toLowerCase()}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    cards.push(card)
    if (cards.length >= limit) {
      break
    }
  }
  return cards
}

function collect(sections, names) {
  const lines = []
  for (const [title, phrases] of sections) {
    if (names.some((name) => title === name || title.startsWith(name))) {
      lines.push(...phrases)
    }
  }
  return lines
}

function buildDecks(sections, targetLanguage) {
  const basics = collect(sections, ['basics'])
  const greetings = take(basics, targetLanguage, CARD_LIMIT)
  const survivalSource = basics.slice(greetings.length)
  const problems = collect(sections, ['problems', 'going to the doctor', 'emergencies'])
  const survival = take(survivalSource.length >= 8 ? survivalSource : [...survivalSource, ...problems], targetLanguage)
  const help = take(
    [...problems, ...collect(sections, ['authority'])],
    targetLanguage,
  )
  const bySlug = {
    'greetings-courtesy': greetings,
    'survival-phrases': survival,
    numbers: take(collect(sections, ['numbers']), targetLanguage),
    'time-dates': take(collect(sections, ['time']), targetLanguage),
    'getting-around': take(collect(sections, ['transportation']), targetLanguage),
    'somewhere-to-stay': take(collect(sections, ['lodging']), targetLanguage),
    money: take(collect(sections, ['money']), targetLanguage),
    'eating-out': take(collect(sections, ['eating']), targetLanguage),
    shopping: take(collect(sections, ['shopping']), targetLanguage),
    'help-emergencies': help,
  }
  return DECKS.map((deck, index) => ({
    slug: deck.slug,
    name: deck.name,
    description: deck.description,
    position: index,
    cards: bySlug[deck.slug] || [],
  })).filter((deck) => deck.cards.length >= 8)
}

async function fetchPage(page) {
  const url = new URL('https://en.wikivoyage.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('format', 'json')
  url.searchParams.set('formatversion', '2')
  url.searchParams.set('redirects', '1')
  url.searchParams.set('prop', 'revisions|info')
  url.searchParams.set('rvprop', 'content')
  url.searchParams.set('rvslots', 'main')
  url.searchParams.set('titles', page)
  let lastError = null
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (response.status === 429) {
      const wait = 8000 * (attempt + 1)
      process.stderr.write(`  429 for ${page}, waiting ${wait}ms\n`)
      await new Promise((resolve) => setTimeout(resolve, wait))
      lastError = new Error(`${page} HTTP 429`)
      continue
    }
    if (!response.ok) {
      throw new Error(`${page} HTTP ${response.status}`)
    }
    const data = await response.json()
    const doc = data.query?.pages?.[0]
    const wikitext = doc?.revisions?.[0]?.slots?.main?.content || doc?.revisions?.[0]?.content
    if (!wikitext) {
      throw new Error(`${page} has no wikitext`)
    }
    return { title: doc.title, wikitext }
  }
  throw lastError
}

async function ingest(languages, { skipFailures = false } = {}) {
  const groups = []
  for (const language of languages) {
    process.stderr.write(`Fetching ${language.page}…\n`)
    try {
      const { title, wikitext } = await fetchPage(language.page)
      const decks = buildDecks(phrasesBySection(wikitext), language.targetLanguage)
      const cardCount = decks.reduce((sum, deck) => sum + deck.cards.length, 0)
      process.stderr.write(`  ${title}: ${decks.length} decks, ${cardCount} cards\n`)
      if (decks.length === 0) {
        throw new Error(`${language.page} produced no decks`)
      }
      groups.push({
        slug: language.slug,
        name: language.name,
        sourceLanguage: 'en-US',
        targetLanguage: language.targetLanguage,
        sourceUrl: `https://en.wikivoyage.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`,
        sourceTitle: title,
        attribution: `Text from English Wikivoyage article “${title}”, licensed under CC BY-SA 4.0.`,
        decks,
      })
    } catch (error) {
      if (!skipFailures) {
        throw error
      }
      process.stderr.write(`  skipping ${language.page}: ${error.message}\n`)
    }
    await new Promise((resolve) => setTimeout(resolve, 2500))
  }
  return { source: 'Wikivoyage', license: 'CC BY-SA 4.0', groups }
}

function parseArgs(argv) {
  const args = argv.slice(2)
  let more = false
  let morePath = null
  let onlySlug = null
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--more') {
      more = true
      const next = args[i + 1]
      if (next && (next.endsWith('.json') || next.includes('/') || next.includes('\\'))) {
        morePath = next
        i += 1
      }
      continue
    }
    if (!arg.startsWith('-')) {
      onlySlug = arg
    }
  }
  return { more, morePath, onlySlug }
}

function mergeGroups(existing, incoming) {
  const groups = [...(existing.groups || [])]
  for (const group of incoming) {
    const index = groups.findIndex((item) => item.slug === group.slug)
    if (index >= 0) {
      groups[index] = group
    } else {
      groups.push(group)
    }
  }
  return {
    source: existing.source || 'Wikivoyage',
    license: existing.license || 'CC BY-SA 4.0',
    groups,
  }
}

async function main() {
  const root = dirname(fileURLToPath(import.meta.url))
  const defaultOut = join(root, '..', 'src', 'main', 'resources', 'library', 'phrasebooks.json')
  const defaultMoreOut = join(root, '..', 'src', 'main', 'resources', 'library', 'phrasebooks-more.json')
  const { more, morePath, onlySlug } = parseArgs(process.argv)
  const pool = more ? MORE_LANGUAGES : LANGUAGES
  const selected = onlySlug ? pool.filter((language) => language.slug === onlySlug) : pool
  if (onlySlug && selected.length === 0) {
    throw new Error(`Unknown language slug: ${onlySlug}`)
  }
  const out = more ? morePath || defaultMoreOut : defaultOut
  const catalog = await ingest(selected, { skipFailures: more && !onlySlug })
  if (onlySlug || more) {
    let existing = { source: 'Wikivoyage', license: 'CC BY-SA 4.0', groups: [] }
    try {
      existing = JSON.parse(readFileSync(out, 'utf8'))
    } catch {
      // New extra catalog or first merge into an empty file.
    }
    const merged = mergeGroups(existing, catalog.groups)
    writeFileSync(out, `${JSON.stringify(merged, null, 2)}\n`)
  } else {
    writeFileSync(out, `${JSON.stringify(catalog, null, 2)}\n`)
  }
  process.stderr.write(`Wrote ${out}\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
