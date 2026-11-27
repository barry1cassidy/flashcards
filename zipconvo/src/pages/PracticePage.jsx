import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { translateError } from '../i18n/errors'
import { languageName } from '../languages'
import SpeakButton from './SpeakButton'

export default function PracticePage() {
  const { id, slug } = useParams()
  const [searchParams] = useSearchParams()
  const sample = Boolean(slug)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [conversation, setConversation] = useState(null)
  const [error, setError] = useState('')
  const [turn, setTurn] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [rating, setRating] = useState(false)
  const [finished, setFinished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deck, setDeck] = useState(undefined)
  const [making, setMaking] = useState(false)
  const [makeError, setMakeError] = useState('')

  useEffect(() => {
    if (!conversation) {
      return undefined
    }
    if (!conversation.deckId) {
      setDeck(null)
      return undefined
    }
    let cancelled = false
    setDeck(undefined)
    api(`/api/decks/${conversation.deckId}`)
      .then((found) => {
        if (!cancelled) {
          setDeck(found)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDeck(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [conversation])

  useEffect(() => {
    let cancelled = false
    const nativeLanguage = searchParams.get('native') || 'en-US'
    const targetLanguage = searchParams.get('target') || 'es-ES'
    const request = sample
      ? api(
          `/api/zipconvo/samples/${encodeURIComponent(slug)}?nativeLanguage=${encodeURIComponent(nativeLanguage)}&targetLanguage=${encodeURIComponent(targetLanguage)}`,
        ).then((found) => ({ ...found, id: found.slug }))
      : api(`/api/language-studio/conversations/${id}`)
    request
      .then((found) => {
        if (!cancelled) {
          setConversation(found)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, sample, slug, searchParams])

  async function makeDeck() {
    if (making) {
      return
    }
    setMaking(true)
    setMakeError('')
    try {
      const saved = await api(`/api/language-studio/conversations/${id}/deck`, { method: 'POST' })
      navigate(`/conversations/${saved.id}/cards/edit`)
    } catch (err) {
      setMakeError(err.message)
      setMaking(false)
    }
  }

  if (error) {
    return (
      <main className="screen">
        <p className="error">{translateError(error)}</p>
        <Link className="btn email" to="/conversations">
          {t('practice.backToList')}
        </Link>
      </main>
    )
  }

  if (!conversation) {
    return (
      <main className="screen">
        <p className="empty">{t('loading')}</p>
      </main>
    )
  }

  const turns = conversation.turns || []
  const last = turn + 1 >= turns.length
  const shown = turns.slice(0, turn + 1)
  const current = shown[turn]

  function nextTurn() {
    if (last) {
      if (sample) {
        setFinished(true)
        return
      }
      setRating(true)
      return
    }
    setTurn((value) => value + 1)
    setRevealed(false)
  }

  async function choose(status) {
    if (saving) {
      return
    }
    setSaving(true)
    setError('')
    try {
      await api(`/api/language-studio/conversations/${conversation.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      navigate('/conversations')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <main className="screen practice">
      <button className="back" type="button" onClick={() => (rating ? setRating(false) : navigate('/conversations'))}>
        {t('back')}
      </button>
      {error ? <p className="error">{translateError(error)}</p> : null}

      {rating ? (
        <div className="rate">
          <div className="screen-copy">
            <h1>{t('practice.how')}</h1>
            <p>{t('practice.gradeWhole', { title: conversation.title })}</p>
          </div>
          <div className="rate-list">
            {[
              { status: 'LEARNING', label: t('grades.practicing'), hint: t('grades.practicingHint') },
              { status: 'LEARNED', label: t('grades.learned'), hint: t('grades.learnedHint') },
            ].map((option) => (
              <button
                key={option.status}
                className={`rate-choice grade-${option.status.toLowerCase()}`}
                type="button"
                disabled={saving}
                onClick={() => choose(option.status)}
              >
                <span>{option.label}</span>
                <small>{option.hint}</small>
              </button>
            ))}
          </div>
          <p className="rate-note">{t('practice.note')}</p>
        </div>
      ) : finished ? (
        <div className="screen-copy">
          <h1>{conversation.title}</h1>
          <p>{t('practice.sampleDone')}</p>
          <div className="practice-bar">
            <Link
              className="btn email"
              to={`/listen/sample/${slug}?native=${encodeURIComponent(conversation.nativeLanguage)}&target=${encodeURIComponent(conversation.targetLanguage)}`}
            >
              {t('practice.listenScene')}
            </Link>
            <Link className="btn google" to="/scenes">
              {t('practice.backToScenes')}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="screen-copy">
            <h1>{conversation.title}</h1>
            <p>
              {t('practice.turn', {
                current: turn + 1,
                total: turns.length,
                role: conversation.yourRole,
                native: languageName(conversation.nativeLanguage),
                target: languageName(conversation.targetLanguage),
              })}
            </p>
          </div>
          {sample ? null : (
          <section className="conv-cards">
            <h2>{t('cards.title')}</h2>
            {conversation.deckId && deck === undefined ? <p>{t('loading')}</p> : null}
            {deck ? (
              <>
                <p>{t('cards.count', { count: deck.cardCount })}</p>
                <div className="conv-cards-actions">
                  <Link className="btn email" to={`/conversations/${id}/cards/study`}>
                    {t('cards.study')}
                  </Link>
                  <Link className="btn google" to={`/conversations/${id}/cards/edit`}>
                    {t('cards.edit')}
                  </Link>
                </div>
              </>
            ) : null}
            {deck === null ? (
              <>
                <p>{t('cards.makeLead')}</p>
                {makeError ? <p className="error">{translateError(makeError)}</p> : null}
                <button className="btn email" type="button" disabled={making} onClick={makeDeck}>
                  {making ? t('cards.makeBusy') : t('cards.make')}
                </button>
              </>
            ) : null}
          </section>
          )}
          <div className="chat" aria-live="polite">
            {shown.map((item, index) => {
              const yours = item.role === 'you'
              const open = !yours || index < turn || revealed
              return (
                <article key={`${item.speaker}-${index}`} className={`turn ${yours ? 'you' : 'them'}`}>
                  <p className="speaker">{item.speaker}</p>
                  {yours ? (
                    <>
                      <SpokenLine text={item.nativeText} lang={conversation.nativeLanguage} className="line" />
                      {open ? (
                        <SpokenLine text={item.targetText} lang={conversation.targetLanguage} className="meaning" />
                      ) : (
                        <p className="meaning">{t('practice.sayThenReveal', { language: languageName(conversation.targetLanguage) })}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <SpokenLine text={item.targetText} lang={conversation.targetLanguage} className="line" />
                      <SpokenLine text={item.nativeText} lang={conversation.nativeLanguage} className="meaning" />
                    </>
                  )}
                </article>
              )
            })}
          </div>
          <div className="practice-bar">
            {current?.role === 'you' && !revealed ? (
              <button className="btn email" type="button" onClick={() => setRevealed(true)}>
                {t('practice.reveal', { language: languageName(conversation.targetLanguage) })}
              </button>
            ) : (
              <button className="btn email" type="button" onClick={nextTurn}>
                {last ? t('practice.finish') : t('practice.next')}
              </button>
            )}
          </div>
        </>
      )}
    </main>
  )
}

function SpokenLine({ text, lang, className }) {
  return (
    <div className="spoken-line">
      <p className={className}>{text}</p>
      <SpeakButton text={text} lang={lang} />
    </div>
  )
}
