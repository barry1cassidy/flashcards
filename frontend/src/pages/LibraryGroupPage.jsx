import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { translateError } from '../i18n/errors'
import { isLanguageLibraryGroup } from '../libraryGroup'
import { GroupBadge } from './ColorPicker'

export default function LibraryGroupPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [group, setGroup] = useState(null)
  const [error, setError] = useState('')
  const [addingId, setAddingId] = useState(null)

  useEffect(() => {
    api(`/api/library/groups/${id}`)
      .then(setGroup)
      .catch((err) => setError(err.message))
  }, [id])

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

  if (!group && !error) {
    return <div className="page-loading">{t('app.loading')}</div>
  }

  return (
    <div className="page">
      <Link to="/library" className="page-back">
        {t('library.back')}
      </Link>
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
            </div>
          </div>
          <div className="library-grid">
            {group.decks.map((deck) => (
              <article key={deck.id} className="deck-card library-card">
                <Link to={`/library/decks/${deck.id}`} className="deck-card-main">
                  <h2>{deck.name}</h2>
                  {deck.description ? <p>{deck.description}</p> : null}
                  <p className="muted">{t('decks.cards', { count: deck.cardCount })}</p>
                </Link>
                <div className="deck-card-actions">
                  {deck.copiedDeckId ? (
                    <Link className="btn" to={`/decks/${deck.copiedDeckId}`}>
                      {t('library.openInMyDecks')}
                    </Link>
                  ) : (
                    <button
                      className="btn primary"
                      type="button"
                      disabled={addingId != null}
                      onClick={() => addDeck(deck.id)}
                    >
                      {addingId === deck.id ? t('library.adding') : t('library.addToMyDecks')}
                    </button>
                  )}
                </div>
              </article>
            ))}
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
