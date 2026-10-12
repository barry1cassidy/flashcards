import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { normalizeHex } from '../colors'
import { isLanguageLibraryGroup } from '../libraryGroup'
import { clearPageMeta, setPageMeta } from '../seo'

const PAGE_SIZE = 6

const SUGGESTIONS = [
  { q: 'Spanish greetings', labelKey: 'library.suggestSpanish' },
  { q: 'SAT math', labelKey: 'library.suggestSat' },
  { q: 'state capitals', labelKey: 'library.suggestCapitals' },
  { q: 'cell biology', labelKey: 'library.suggestBiology' },
  { q: 'chemistry', labelKey: 'library.suggestChemistry' },
  { q: 'times tables', labelKey: 'library.suggestTimes' },
]

function pageFromSearch(searchParams) {
  const raw = Number(searchParams.get('page') || '1')
  if (!Number.isFinite(raw) || raw < 1) {
    return 1
  }
  return Math.floor(raw)
}

export default function LibraryPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const requestedPage = pageFromSearch(searchParams)
  const [draft, setDraft] = useState(query)
  const [groups, setGroups] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setDraft(query)
  }, [query])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = draft.trim()
      if (next === query) {
        return
      }
      setSearchParams(next ? { q: next } : {})
    }, 250)
    return () => window.clearTimeout(handle)
  }, [draft, query, setSearchParams])

  useEffect(() => {
    setPageMeta({
      title: `${t('library.title')} — ${t('app.name')}`,
      description: t('library.seoDescription'),
      path: '/library',
      index: !query,
      jsonLd: query
        ? null
        : {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: t('library.title'),
            description: t('library.seoDescription'),
            url: 'https://zipdeck.app/library',
            isPartOf: { '@id': 'https://zipdeck.app/#website' },
          },
    })
    return () => clearPageMeta()
  }, [query, t])

  useEffect(() => {
    let cancelled = false
    setError('')
    const path = query ? `/api/library?q=${encodeURIComponent(query)}` : '/api/library'
    api(path)
      .then((next) => {
        if (!cancelled) {
          setGroups(next)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGroups([])
          setError('load')
        }
      })
    return () => {
      cancelled = true
    }
  }, [query])

  const loaded = Array.isArray(groups)
  const totalPages = Math.max(1, Math.ceil((groups?.length || 0) / PAGE_SIZE))
  const page = Math.min(requestedPage, totalPages)
  const pageGroups = (groups || []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function goToPage(nextPage) {
    const params = {}
    if (query) {
      params.q = query
    }
    if (nextPage > 1) {
      params.page = String(nextPage)
    }
    setSearchParams(params)
  }

  function applySuggestion(nextQuery) {
    setDraft(nextQuery)
    setSearchParams({ q: nextQuery })
  }

  return (
    <div className="page library-home">
      <header className="library-hero">
        <p className="kicker">{t('library.title')}</p>
        <h1>{t('library.ask')}</h1>
        <p className="muted library-intro">{t('library.intro')}</p>
        <label className="library-search">
          {t('library.searchPrompt')}
          <input
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('library.searchPlaceholder')}
            autoComplete="off"
          />
        </label>
        <div className="library-suggestions">
          <span className="muted">{t('library.tryLabel')}</span>
          {SUGGESTIONS.map((item) => (
            <button
              key={item.q}
              className={query.toLowerCase() === item.q.toLowerCase() ? 'library-suggestion is-active' : 'library-suggestion'}
              type="button"
              onClick={() => applySuggestion(item.q)}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      </header>
      {error ? <p className="muted">{t('library.loadError')}</p> : null}
      {!loaded ? <p className="muted">{t('app.loading')}</p> : null}
      {loaded && !error && groups.length === 0 ? (
        <div className="empty">{query ? t('library.emptySearch') : t('library.empty')}</div>
      ) : null}
      {loaded && groups.length > 0 ? (
        <>
          <h2 className="section-heading">{query ? t('library.results') : t('library.browse')}</h2>
          <div className="library-grid">
            {pageGroups.map((group) => (
              <article
                key={group.id}
                className="deck-card library-card"
                style={{ '--library-accent': normalizeHex(group.color) }}
              >
                <Link to={`/library/${group.slug}`} className="deck-card-main">
                  <h2 title={group.name}>{group.name}</h2>
                  {isLanguageLibraryGroup(group) ? <p className="muted">{t('library.fromEnglish')}</p> : null}
                  <p className="muted">
                    {t('library.decks', { count: group.deckCount })} · {t('decks.cards', { count: group.cardCount })}
                  </p>
                </Link>
                {group.decks?.length ? (
                  <ul className="library-deck-links">
                    {group.decks.slice(0, 3).map((deck) => (
                      <li key={deck.id}>
                        <Link to={`/library/${group.slug}/${deck.slug}`}>{deck.name}</Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="library-pager">
              {page > 1 ? (
                <button className="btn" type="button" onClick={() => goToPage(page - 1)}>
                  {t('library.previous')}
                </button>
              ) : null}
              <span className="muted">
                {t('offline.pageStatus', { page, total: totalPages })}
              </span>
              {page < totalPages ? (
                <button className="btn" type="button" onClick={() => goToPage(page + 1)}>
                  {t('library.next')}
                </button>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
