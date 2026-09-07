import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { translateError } from '../i18n/errors'
import { GroupBadge } from './ColorPicker'
import SpeakButton from './SpeakButton'
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

  useEffect(() => {
    api(`/api/library/decks/${id}`)
      .then(setDeck)
      .catch((err) => setError(err.message))
  }, [id])

  async function addAndStudy(mode) {
    setError('')
    setBusy(true)
    try {
      const copy = await api(`/api/library/decks/${id}/add`, { method: 'POST' })
      navigate(`/decks/${copy.id}/study/${mode}`)
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
              <button className="btn primary" type="button" disabled={busy} onClick={() => setStudyOpen(true)}>
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
                  <div>
                    <p>
                      <SpeakButton text={card.front} lang={frontLanguage} /> {card.front}
                    </p>
                    <p>
                      <SpeakButton text={card.back} lang={backLanguage} /> {card.back}
                    </p>
                    {card.hint ? <p className="muted">{t('decks.hint')}: {card.hint}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
      {studyOpen ? (
        <StudyModeModal
          hint={t('library.studyHint')}
          onSelect={(mode) => {
            setStudyOpen(false)
            addAndStudy(mode)
          }}
          onCancel={() => setStudyOpen(false)}
        />
      ) : null}
    </div>
  )
}
