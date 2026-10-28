import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { isLanguageLibraryGroup } from '../libraryGroup'

const FEATURED_SLUGS = [
  'spanish',
  'french',
  'japanese',
  'german',
  'biology-terms',
  'chemistry-basics',
  'world-geography',
  'us-history',
]

export default function DeckWelcome({ onCreate, shareOpen, onShowShare, shareForm }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [samples, setSamples] = useState(null)

  useEffect(() => {
    let cancelled = false
    api('/api/library')
      .then((groups) => {
        if (cancelled) {
          return
        }
        const bySlug = new Map((groups || []).map((group) => [group.slug, group]))
        setSamples(FEATURED_SLUGS.map((slug) => bySlug.get(slug)).filter(Boolean))
      })
      .catch(() => {
        if (!cancelled) {
          setSamples([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  function searchSamples(event) {
    event.preventDefault()
    const next = query.trim()
    navigate(next ? `/library?q=${encodeURIComponent(next)}` : '/library')
  }

  const languages = (samples || []).filter((group) => isLanguageLibraryGroup(group))
  const subjects = (samples || []).filter((group) => !isLanguageLibraryGroup(group))

  return (
    <section className="deck-welcome" aria-labelledby="deck-welcome-prompt">
      <h1 id="deck-welcome-prompt">{t('decks.welcomePrompt')}</h1>
      <form className="deck-welcome-search" onSubmit={searchSamples}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('decks.welcomeSearch')}
          aria-label={t('decks.welcomeSearch')}
          autoComplete="off"
          enterKeyHint="search"
        />
        <button className="btn" type="submit">
          {t('library.search')}
        </button>
      </form>
      <ChipGroup title={t('decks.welcomeLanguages')} groups={languages} cap={3} />
      <ChipGroup title={t('decks.welcomeSubjects')} groups={subjects} cap={2} />
      <button className="btn deck-welcome-create" type="button" onClick={onCreate}>
        <span className="deck-welcome-create-plus" aria-hidden="true">+</span>
        {t('decks.welcomeCreate')}
      </button>
      <div className="deck-welcome-links">
        <Link className="deck-welcome-browse" to="/library">
          {t('decks.welcomeBrowse')}
        </Link>
        {shareOpen ? null : (
          <button className="btn ghost deck-welcome-share" type="button" onClick={onShowShare}>
            {t('decks.welcomeShare')}
          </button>
        )}
      </div>
      {shareOpen ? shareForm : null}
    </section>
  )
}

function ChipGroup({ title, groups, cap }) {
  if (!groups.length) {
    return null
  }
  return (
    <div className="deck-welcome-group">
      <h3>{title}</h3>
      <div className="deck-welcome-chips" data-cap={cap}>
        {groups.map((group) => (
          <Link key={group.id} className="library-suggestion" to={`/library/${group.slug}`}>
            {group.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
