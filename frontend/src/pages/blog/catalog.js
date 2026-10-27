import { comparePosts } from './comparePosts.js'
import { featurePosts } from './featurePosts.js'
import { guidePosts } from './guidePosts.js'
import { COVERS, HIGHLIGHTS } from './presentation.js'

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'comparisons', label: 'Comparisons' },
  { id: 'features', label: 'Features' },
  { id: 'guides', label: 'How to use it' },
]

// Spread across about 18 months so the index does not share one publish day.
// The 2026 comparison stays the newest. Change that date with the year in the heading.
const DATES = {
  'learn-chinese-with-flashcards': '2025-04-27',
  'memorize-a-best-man-speech': '2025-05-20',
  'learn-lines-for-a-play': '2025-06-18',
  'prepare-an-acting-audition': '2025-07-24',
  'memorize-a-presentation': '2025-08-19',
  'flashcards-for-exams': '2025-09-30',
  'learn-a-language-on-a-walk': '2025-11-06',
  'study-modes': '2025-12-03',
  'spaced-repetition': '2026-01-14',
  'sample-sets-and-csv': '2026-02-11',
  'share-a-deck-or-a-class': '2026-03-05',
  'pictures-on-flashcards': '2026-03-31',
  'offline-flashcards': '2026-04-23',
  'rehearse-in-order': '2026-05-19',
  'create-decks-with-ai': '2026-06-10',
  'edit-cards-with-ai': '2026-07-01',
  'listen-to-flashcards': '2026-07-23',
  'language-studio': '2026-08-12',
  'study-mixes': '2026-08-27',
  'zipdeck-features': '2026-09-16',
  'zipdeck-vs-quizlet': '2026-10-07',
  'zipdeck-vs-anki': '2026-10-19',
  'best-flashcard-apps-2026': '2026-10-27',
}

export const POSTS = [...comparePosts, ...featurePosts, ...guidePosts].map((post) => ({
  cover: COVERS[post.slug],
  highlights: HIGHLIGHTS[post.slug],
  ...post,
  date: DATES[post.slug],
}))

const bySlug = new Map(POSTS.map((post) => [post.slug, post]))

export function postBySlug(slug) {
  return bySlug.get(slug) || null
}

export function categoryLabel(id) {
  return CATEGORIES.find((category) => category.id === id)?.label || 'Blog'
}

export function relatedPosts(post) {
  return (post.related || []).map((slug) => bySlug.get(slug)).filter(Boolean)
}

export function readingMinutes(post) {
  const count = words(post.sections) + words(post.faqs) + words(post.lede)
  return Math.max(4, Math.round(count / 220))
}

function words(value) {
  if (!value) {
    return 0
  }
  if (typeof value === 'string') {
    return value.trim().split(/\s+/).filter(Boolean).length
  }
  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + words(item), 0)
  }
  if (typeof value === 'object') {
    return Object.values(value).reduce((total, item) => total + words(item), 0)
  }
  return 0
}

export function formatPostDate(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
