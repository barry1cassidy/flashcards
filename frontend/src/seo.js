const ORIGIN = 'https://zipdeck.app'
const DEFAULT_TITLE = 'Zipdeck — Flashcards for language learning & exam study'
const DEFAULT_DESCRIPTION =
  'Zipdeck is a free flashcard app at zipdeck.app for language learning, exam prep, and memorization. Study with flip, quiz, write, match, and audio — plus spaced repetition and Create with AI.'

export function setPageMeta({ title, description, path, index = true, jsonLd = null }) {
  const url = `${ORIGIN}${path}`
  const summary = clip(description)
  document.title = title
  setMeta('name', 'description', summary)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', summary)
  setMeta('property', 'og:url', url)
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', summary)
  setMeta('name', 'robots', index ? 'index,follow,max-image-preview:large' : 'noindex,follow')
  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', url)
  let script = document.getElementById('page-jsonld')
  if (jsonLd) {
    if (!script) {
      script = document.createElement('script')
      script.id = 'page-jsonld'
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(jsonLd)
  } else if (script) {
    script.remove()
  }
}

export function clearPageMeta() {
  setPageMeta({
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: '/',
    index: true,
    jsonLd: null,
  })
}

function clip(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (clean.length <= 180) {
    return clean
  }
  return `${clean.slice(0, 177).trim()}…`
}

function setMeta(attribute, name, content) {
  let meta = document.querySelector(`meta[${attribute}="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attribute, name)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}
