import { access, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const origin = 'https://zipdeck.app'

export async function writeLibrarySitemap({ root }) {
  const sitemapPath = path.join(root, 'public', 'sitemap.xml')
  const catalogDir = await findCatalog(root)
  if (!catalogDir) {
    return { skipped: true, groups: 0, urls: 0 }
  }

  const groups = new Map()
  const files = (await readdir(catalogDir)).filter((name) => name.endsWith('.json'))
  for (const file of files) {
    const catalog = JSON.parse(await readFile(path.join(catalogDir, file), 'utf8'))
    for (const group of catalog.groups || []) {
      if (!group.slug || !Array.isArray(group.decks) || group.decks.length === 0) {
        continue
      }
      const decks = groups.get(group.slug) || new Set()
      for (const deck of group.decks) {
        if (deck.slug) {
          decks.add(deck.slug)
        }
      }
      groups.set(group.slug, decks)
    }
  }

  const urls = [
    entry('/', 'weekly', '1.0'),
    entry('/library', 'weekly', '0.9'),
    entry('/memorize', 'monthly', '0.8'),
    entry('/memorize/chinese-flashcards', 'monthly', '0.8'),
    entry('/memorize/wedding-speech', 'monthly', '0.8'),
    entry('/memorize/business-presentation', 'monthly', '0.8'),
    entry('/memorize/script-lines', 'monthly', '0.8'),
    entry('/quizlet-alternative', 'monthly', '0.8'),
    entry('/audio-flashcards', 'monthly', '0.8'),
    entry('/language-conversations', 'monthly', '0.8'),
    entry('/teachers', 'monthly', '0.8'),
    entry('/help', 'monthly', '0.6'),
    entry('/privacy', 'yearly', '0.3'),
  ]
  const groupSlugs = [...groups.keys()].sort()
  for (const groupSlug of groupSlugs) {
    urls.push(entry(`/library/${encodeURIComponent(groupSlug)}`, 'monthly', '0.7'))
    for (const deckSlug of [...groups.get(groupSlug)].sort()) {
      urls.push(
        entry(
          `/library/${encodeURIComponent(groupSlug)}/${encodeURIComponent(deckSlug)}`,
          'monthly',
          '0.8',
        ),
      )
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`
  await writeFile(sitemapPath, xml)
  return { groups: groupSlugs.length, urls: urls.length }
}

async function findCatalog(root) {
  const candidates = [
    path.resolve(root, '../backend/src/main/resources/library'),
    path.resolve(root, 'backend/src/main/resources/library'),
  ]
  for (const dir of candidates) {
    try {
      await access(dir)
      return dir
    } catch {
      // The web image builds from frontend/ alone, so the catalog is absent there.
    }
  }
  return null
}

function entry(pathname, changefreq, priority) {
  return `  <url>
    <loc>${origin}${pathname}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const result = await writeLibrarySitemap({ root })
  if (result.skipped) {
    console.log('sitemap kept; library catalog not found')
  } else {
    console.log(`sitemap ${result.urls} urls, ${result.groups} groups`)
  }
}
