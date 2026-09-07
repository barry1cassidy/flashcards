import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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

function stripInfoboxes(wikitext) {
  let out = ''
  let i = 0
  while (i < wikitext.length) {
    const start = wikitext.indexOf('{{', i)
    if (start < 0) {
      out += wikitext.slice(i)
      break
    }
    out += wikitext.slice(i, start)
    let depth = 0
    let j = start
    while (j < wikitext.length) {
      if (wikitext.startsWith('{{', j)) {
        depth += 1
        j += 2
        continue
      }
      if (wikitext.startsWith('}}', j)) {
        depth -= 1
        j += 2
        if (depth === 0) {
          break
        }
        continue
      }
      j += 1
    }
    i = j
  }
  return out
}

function stripWiki(value) {
  return String(value || '')
    .replace(/\[\[[^\|\]]+\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/'''+([^']+)'''+/g, '$1')
    .replace(/''([^']+)''/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function italics(value) {
  return [...String(value).matchAll(/''([^']+)''/g)].map((match) => match[1].trim()).filter(Boolean)
}

function parsePhrase(line, targetLanguage) {
  const match = line.match(/^;\s*(.+?)\s*:\s*(.+)$/)
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

  const spoken = italics(rawBack).find((part) => PINYIN.test(part) && part.length < 80)

  if (targetLanguage === 'zh-CN') {
    const hint = spoken ? spoken.replace(/[.’']+$/g, '').trim() : null
    let simplified = rawBack.replace(/''[^']+''/g, ' ').trim()
    const splitTrad = simplified.match(/^(.*?)\s*[\(（]([\u3400-\u9FFF].*)$/)
    if (splitTrad) {
      simplified = splitTrad[1]
    }
    const back = simplified
      .replace(/[A-Za-züÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ].*$/g, '')
      .replace(/[,;:]+$/g, '')
      .replace(/\s+/g, '')
      .trim()
    if (!CJK.test(back)) {
      return null
    }
    return { front, back, hint }
  }

  let back = rawBack
    .replace(/\s*\(''[^']+''\)\s*/g, ' ')
    .replace(/''[^']+''/g, ' ')
    .replace(/\s*\([^)]*\)\s*$/g, ' ')
  back = stripWiki(back).replace(/^[:\-\s]+/, '').trim()
  if (!back || back.length > 180) {
    return null
  }
  const hint = spoken && !back.toLowerCase().includes(spoken.toLowerCase()) ? spoken : null
  return { front, back, hint }
}

function phrasesBySection(wikitext) {
  const cleaned = stripInfoboxes(wikitext)
  const start = cleaned.search(/^==\s*(phrase list|[^=]*phrases)\s*==/im)
  const body = start >= 0 ? cleaned.slice(start) : cleaned
  const sections = new Map()
  let current = 'other'
  for (const rawLine of body.split(/\n/)) {
    const heading = rawLine.match(/^(={2,4})\s*([^=]+?)\s*\1\s*$/)
    if (heading) {
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
    if (!line.startsWith(';')) {
      continue
    }
    if (!sections.has(current)) {
      sections.set(current, [])
    }
    sections.get(current).push(line)
  }
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

async function ingest(onlySlug) {
  const groups = []
  const selected = onlySlug ? LANGUAGES.filter((language) => language.slug === onlySlug) : LANGUAGES
  if (onlySlug && selected.length === 0) {
    throw new Error(`Unknown language slug: ${onlySlug}`)
  }
  for (const language of selected) {
    process.stderr.write(`Fetching ${language.page}…\n`)
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
    await new Promise((resolve) => setTimeout(resolve, 2500))
  }
  return { source: 'Wikivoyage', license: 'CC BY-SA 4.0', groups }
}

const root = dirname(fileURLToPath(import.meta.url))
const out = join(root, '..', 'src', 'main', 'resources', 'library', 'phrasebooks.json')
const onlySlug = process.argv[2]
const catalog = await ingest(onlySlug)
if (onlySlug) {
  const existing = JSON.parse(readFileSync(out, 'utf8'))
  existing.groups = existing.groups.map((group) => (group.slug === onlySlug ? catalog.groups[0] : group))
  if (!existing.groups.some((group) => group.slug === onlySlug)) {
    existing.groups.push(catalog.groups[0])
  }
  writeFileSync(out, `${JSON.stringify(existing, null, 2)}\n`)
} else {
  writeFileSync(out, `${JSON.stringify(catalog, null, 2)}\n`)
}
process.stderr.write(`Wrote ${out}\n`)
