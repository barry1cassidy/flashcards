import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { translateError } from '../i18n/errors'
import { isLanguageLibraryGroup } from '../libraryGroup'
import { GroupBadge } from './ColorPicker'

const PAGE_SIZE = 6

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
  const [groups, setGroups] = useState([])
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
    const path = query ? `/api/library?q=${encodeURIComponent(query)}` : '/api/library'
    api(path)
      .then(setGroups)
      .catch((err) => setError(err.message))
  }, [query])

  const totalPages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE))
  const page = Math.min(requestedPage, totalPages)
  const pageGroups = groups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>{t('library.title')}</h1>
          <p className="muted">{t('library.subtitle')}</p>
        </div>
      </div>
      {error ? <div className="error">{translateError(t, error)}</div> : null}
      <label className="library-search">
        {t('library.search')}
        <input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('library.searchPlaceholder')}
          autoComplete="off"
        />
      </label>
      {groups.length === 0 ? (
        <div className="empty">{query ? t('library.emptySearch') : t('library.empty')}</div>
      ) : (
        <>
          <div className="library-grid">
            {pageGroups.map((group) => (
              <Link key={group.id} to={`/library/groups/${group.id}`} className="deck-card library-card">
                <GroupBadge group={group} />
                <h2>{group.name}</h2>
                {isLanguageLibraryGroup(group) ? <p className="muted">{t('library.fromEnglish')}</p> : null}
                <p className="muted">
                  {t('library.decks', { count: group.deckCount })} · {t('decks.cards', { count: group.cardCount })}
                </p>
                {query ? (
                  <ul className="library-hit-list">
                    {group.decks.slice(0, 3).map((deck) => (
                      <li key={deck.id}>{deck.name}</li>
                    ))}
                  </ul>
                ) : null}
              </Link>
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="library-pager">
              {page > 1 ? (
                <button className="btn" type="button" onClick={() => goToPage(page - 1)}>
                  {t('library.previous')}
                </button>
              ) : null}
              {page < totalPages ? (
                <button className="btn" type="button" onClick={() => goToPage(page + 1)}>
                  {t('library.next')}
                </button>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
