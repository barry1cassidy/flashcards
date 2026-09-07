import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { translateError } from '../i18n/errors'
import { GroupBadge } from './ColorPicker'

export default function LibraryPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
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
        <div className="deck-grid">
          {groups.map((group) => (
            <Link key={group.id} to={`/library/groups/${group.id}`} className="deck-card">
              <GroupBadge group={group} />
              <h2>{group.name}</h2>
              <p className="muted">{t('library.fromEnglish')}</p>
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
      )}
    </div>
  )
}
