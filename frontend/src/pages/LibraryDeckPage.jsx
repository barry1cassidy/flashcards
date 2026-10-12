import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { rememberLibraryReturn } from '../authRedirect'
import { isEmailVerified } from '../email'
import { translateError } from '../i18n/errors'
import { clearPageMeta, setPageMeta } from '../seo'
import { GroupBadge } from './ColorPicker'
import SpeakButton from './SpeakButton'
import ConfirmModal from './ConfirmModal'
import StudyModeModal from './StudyModeModal'
import LibraryGuestActions from './LibraryGuestActions'
import { normalizeSpeechLanguage } from '../speechLanguages'

export default function LibraryDeckPage() {
  const { t } = useTranslation()
  const { id, groupSlug, deckSlug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const verified = isEmailVerified(user)
  const [deck, setDeck] = useState(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [studyOpen, setStudyOpen] = useState(false)
  const [copyConfirmOpen, setCopyConfirmOpen] = useState(false)
  const [hardCount, setHardCount] = useState(0)
  const [againCount, setAgainCount] = useState(0)

  useEffect(() => {
    const path = groupSlug && deckSlug
      ? `/api/library/decks/${groupSlug}/${deckSlug}`
      : `/api/library/decks/${id}`
    let cancelled = false
    api(path)
      .then(async (libraryDeck) => {
        if (cancelled) {
          return
        }
        setDeck(libraryDeck)
        if (id && libraryDeck.group?.slug && libraryDeck.slug) {
          navigate(`/library/${libraryDeck.group.slug}/${libraryDeck.slug}`, { replace: true })
        }
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
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [deckSlug, groupSlug, id, navigate])

  useEffect(() => {
    if (!deck?.slug || !deck.group?.slug) {
      return undefined
    }
    const path = `/library/${deck.group.slug}/${deck.slug}`
    const description = deck.description
      ? `${deck.name}. ${deck.description}`
      : t('library.seoDeckDescription', { name: deck.name, count: deck.cards.length })
    setPageMeta({
      title: `${t('library.seoDeckTitle', { name: deck.name })} — ${t('app.name')}`,
      description,
      path,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Quiz',
        name: deck.name,
        description,
        url: `https://zipdeck.app${path}`,
        isAccessibleForFree: true,
        educationalUse: 'study',
        inLanguage: deck.sourceLanguage || 'en',
        provider: { '@id': 'https://zipdeck.app/#organization' },
        hasPart: deck.cards.slice(0, 40).map((card) => ({
          '@type': 'Question',
          name: card.front,
          acceptedAnswer: { '@type': 'Answer', text: card.back },
        })),
      },
    })
    return () => clearPageMeta()
  }, [deck, t])

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
      const copy = await api(`/api/library/decks/${deck.id}/add`, { method: 'POST' })
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
        const copy = await api(`/api/library/decks/${deck.id}/add`, { method: 'POST' })
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
      const copy = await api(`/api/library/decks/${deck.id}/add`, { method: 'POST' })
      setDeck((current) => (current ? { ...current, copiedDeckId: copy.id } : current))
      setHardCount(copy.hardCount || 0)
      setAgainCount(copy.againCount || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!deck && !loadFailed) {
    return <div className="page-loading">{t('app.loading')}</div>
  }

  const frontLanguage = normalizeSpeechLanguage(deck?.sourceLanguage, 'en-US')
  const backLanguage = normalizeSpeechLanguage(deck?.targetLanguage, 'en-US')

  return (
    <div className="page">
      {deck ? (
        <Link to={`/library/${deck.group.slug}`} className="page-back">
          {t('library.backToGroup', { name: deck.group.name })}
        </Link>
      ) : (
        <Link to="/library" className="page-back">
          {t('library.back')}
        </Link>
      )}
      {loadFailed && !deck ? <p className="muted">{t('library.loadError')}</p> : null}
      {error ? <div className="error">{translateError(t, error)}</div> : null}
      {deck ? (
        <>
          <div className="page-title">
            <div className="deck-hero">
              <GroupBadge group={deck.group} />
              <h1>{deck.name}</h1>
              {deck.description ? <p>{deck.description}</p> : null}
              <p className="muted">{t('decks.cards', { count: deck.cards.length })}</p>
              {!user ? <p className="muted library-public-note">{t('library.publicNote')}</p> : null}
            </div>
            <div className="header-actions">
              {!user ? (
                <LibraryGuestActions />
              ) : verified ? (
                <>
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
                </>
              ) : (
                <Link
                  className="btn primary"
                  to="/verify"
                  onClick={() => rememberLibraryReturn(`/library/${deck.group.slug}/${deck.slug}`)}
                >
                  {t('verify.gateCta')}
                </Link>
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
