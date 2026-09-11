import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { translateError } from '../i18n/errors'
import { GroupBadge } from './ColorPicker'
import SpeakButton from './SpeakButton'
import ConfirmModal from './ConfirmModal'
import StudyModeModal from './StudyModeModal'
import { normalizeSpeechLanguage } from '../speechLanguages'

export default function LibraryDeckPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [deck, setDeck] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [studyOpen, setStudyOpen] = useState(false)
  const [copyConfirmOpen, setCopyConfirmOpen] = useState(false)
  const [hardCount, setHardCount] = useState(0)
  const [againCount, setAgainCount] = useState(0)

  useEffect(() => {
    api(`/api/library/decks/${id}`)
      .then(async (libraryDeck) => {
        setDeck(libraryDeck)
        if (!libraryDeck.copiedDeckId) {
          setHardCount(0)
          setAgainCount(0)
          return
        }
        try {
          const copy = await api(`/api/decks/${libraryDeck.copiedDeckId}`)
          setHardCount(copy.hardCount || 0)
          setAgainCount(copy.againCount || 0)
        } catch {
          setHardCount(0)
          setAgainCount(0)
        }
      })
      .catch((err) => setError(err.message))
  }, [id])

  function onStudyClick() {
    if (deck?.copiedDeckId) {
      setStudyOpen(true)
      return
    }
    setCopyConfirmOpen(true)
  }

  async function confirmCopyThenPickMode() {
    setCopyConfirmOpen(false)
    setError('')
    setBusy(true)
    try {
      const copy = await api(`/api/library/decks/${id}/add`, { method: 'POST' })
      setDeck((current) => (current ? { ...current, copiedDeckId: copy.id } : current))
      setHardCount(copy.hardCount || 0)
      setAgainCount(copy.againCount || 0)
      setStudyOpen(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function addAndStudy(mode, filter = 'due') {
    setError('')
    setBusy(true)
    try {
      let deckId = deck?.copiedDeckId
      if (!deckId) {
        const copy = await api(`/api/library/decks/${id}/add`, { method: 'POST' })
        deckId = copy.id
      }
      const path = `/decks/${deckId}/study/${mode}`
      navigate(filter === 'hard' || filter === 'again' ? `${path}?filter=${filter}` : path)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function addOnly() {
    setError('')
    setBusy(true)
    try {
      const copy = await api(`/api/library/decks/${id}/add`, { method: 'POST' })
      setDeck((current) => (current ? { ...current, copiedDeckId: copy.id } : current))
      setHardCount(copy.hardCount || 0)
      setAgainCount(copy.againCount || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!deck && !error) {
    return <div className="page-loading">{t('app.loading')}</div>
  }

  const frontLanguage = normalizeSpeechLanguage(deck?.sourceLanguage, 'en-US')
  const backLanguage = normalizeSpeechLanguage(deck?.targetLanguage, 'en-US')

  return (
    <div className="page">
      {deck ? (
        <Link to={`/library/groups/${deck.group.id}`} className="page-back">
          {t('library.backToGroup', { name: deck.group.name })}
        </Link>
      ) : (
        <Link to="/library" className="page-back">
          {t('library.back')}
        </Link>
      )}
      {error ? <div className="error">{translateError(t, error)}</div> : null}
      {deck ? (
        <>
          <div className="page-title">
            <div className="deck-hero">
              <GroupBadge group={deck.group} />
              <h1>{deck.name}</h1>
              {deck.description ? <p>{deck.description}</p> : null}
              <p className="muted">{t('decks.cards', { count: deck.cards.length })}</p>
            </div>
            <div className="header-actions">
              <button className="btn primary" type="button" disabled={busy} onClick={onStudyClick}>
                {t('decks.study')}
              </button>
              {deck.copiedDeckId ? (
                <Link className="btn" to={`/decks/${deck.copiedDeckId}`}>
                  {t('library.openInMyDecks')}
                </Link>
              ) : (
                <button className="btn" type="button" disabled={busy} onClick={addOnly}>
                  {busy ? t('library.adding') : t('library.addToMyDecks')}
                </button>
              )}
            </div>
          </div>

          <section className="deck-section" aria-labelledby="library-cards-heading">
            <h2 id="library-cards-heading" className="section-heading">
              {t('decks.cardsSection')}
            </h2>
            <div className="card-list">
              {deck.cards.map((card) => (
                <div key={card.id} className="card-row">
                  <div className="card-row-body">
                    <div className="card-side-line">
                      <span className="card-side-text">{card.front}</span>
                      <SpeakButton text={card.front} lang={frontLanguage} />
                    </div>
                    <p className="muted card-side-line">
                      <span className="card-side-text">{card.back}</span>
                      <SpeakButton text={card.back} lang={backLanguage} />
                    </p>
                    {card.hint ? <p className="muted card-hint">{t('decks.hint')}: {card.hint}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
      {copyConfirmOpen ? (
        <ConfirmModal
          title={t('library.copyConfirmTitle')}
          message={t('library.copyConfirmMessage')}
          confirmLabel={t('library.copyConfirm')}
          onConfirm={confirmCopyThenPickMode}
          onCancel={() => setCopyConfirmOpen(false)}
        />
      ) : null}
      {studyOpen ? (
        <StudyModeModal
          hardCount={hardCount}
          againCount={againCount}
          onSelect={(mode, filter) => {
            setStudyOpen(false)
            addAndStudy(mode, filter)
          }}
          onCancel={() => setStudyOpen(false)}
        />
      ) : null}
    </div>
  )
}
