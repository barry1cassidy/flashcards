import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { rememberLibraryReturn } from '../authRedirect'
import { isEmailVerified } from '../email'
import { translateError } from '../i18n/errors'
import { isLanguageLibraryGroup } from '../libraryGroup'
import { clearPageMeta, setPageMeta } from '../seo'
import { GroupBadge } from './ColorPicker'
import LibraryGuestActions from './LibraryGuestActions'

export default function LibraryGroupPage() {
  const { t } = useTranslation()
  const { id, groupSlug } = useParams()
  const key = groupSlug || id
  const navigate = useNavigate()
  const { user } = useAuth()
  const verified = isEmailVerified(user)
  const [group, setGroup] = useState(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [error, setError] = useState('')
  const [addingId, setAddingId] = useState(null)

  useEffect(() => {
    let cancelled = false
    api(`/api/library/groups/${key}`)
      .then((next) => {
        if (cancelled) {
          return
        }
        setGroup(next)
        if (id && next.slug) {
          navigate(`/library/${next.slug}`, { replace: true })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, key, navigate])

  useEffect(() => {
    if (!group?.slug) {
      return undefined
    }
    const path = `/library/${group.slug}`
    const description = t('library.seoGroupDescription', { name: group.name })
    setPageMeta({
      title: `${group.name} — ${t('library.title')} — ${t('app.name')}`,
      description,
      path,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: group.name,
        description,
        url: `https://zipdeck.app${path}`,
        isPartOf: { '@id': 'https://zipdeck.app/#website' },
      },
    })
    return () => clearPageMeta()
  }, [group, t])

  async function addDeck(deckId) {
    setError('')
    setAddingId(deckId)
    try {
      const copy = await api(`/api/library/decks/${deckId}/add`, { method: 'POST' })
      setGroup((current) =>
        current
          ? {
              ...current,
              decks: current.decks.map((deck) =>
                deck.id === deckId ? { ...deck, copiedDeckId: copy.id } : deck,
              ),
            }
          : current,
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setAddingId(null)
    }
  }

  if (!group && !loadFailed) {
    return <div className="page-loading">{t('app.loading')}</div>
  }

  return (
    <div className="page">
      <Link to="/library" className="page-back">
        {t('library.back')}
      </Link>
      {loadFailed && !group ? <p className="muted">{t('library.loadError')}</p> : null}
      {error ? <div className="error">{translateError(t, error)}</div> : null}
      {group ? (
        <>
          <div className="page-title">
            <div className="deck-hero">
              <GroupBadge group={group} />
              <h1>{group.name}</h1>
              <p className="muted">
                {isLanguageLibraryGroup(group)
                  ? t('library.groupSubtitle', { language: group.name })
                  : t('library.groupSubjectSubtitle')}
              </p>
              {!user ? <p className="muted library-public-note">{t('library.publicNote')}</p> : null}
            </div>
          </div>
          <div className="library-grid">
            {group.decks.map((deck) => {
              const deckPath = `/library/${group.slug}/${deck.slug}`
              return (
              <article key={deck.id} className="deck-card library-card">
                <Link to={deckPath} className="deck-card-main">
                  <h2 title={deck.name}>{deck.name}</h2>
                  {deck.description ? <p>{deck.description}</p> : null}
                  <p className="muted">{t('decks.cards', { count: deck.cardCount })}</p>
                </Link>
                <div className="deck-card-actions">
                  {deck.copiedDeckId && user ? (
                    <Link className="btn" to={`/decks/${deck.copiedDeckId}`}>
                      {t('library.openInMyDecks')}
                    </Link>
                  ) : !user ? (
                    <LibraryGuestActions returnPath={deckPath} signIn={false} label={t('decks.study')} />
                  ) : verified ? (
                    <button
                      className="btn primary"
                      type="button"
                      disabled={addingId != null}
                      onClick={() => addDeck(deck.id)}
                    >
                      {addingId === deck.id ? t('library.adding') : t('library.addToMyDecks')}
                    </button>
                  ) : (
                    <Link
                      className="btn primary"
                      to="/verify"
                      onClick={() => rememberLibraryReturn(deckPath)}
                    >
                      {t('verify.gateCta')}
                    </Link>
                  )}
                </div>
              </article>
              )
            })}
          </div>
          <p className="muted small">
            {group.attribution}
            {group.sourceUrl ? (
              <>
                {' '}
                <a href={group.sourceUrl} target="_blank" rel="noreferrer">
                  {group.sourceTitle}
                </a>
              </>
            ) : null}
          </p>
        </>
      ) : null}
    </div>
  )
}
