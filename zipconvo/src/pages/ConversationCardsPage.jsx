import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { translateError } from '../i18n/errors'
import { languageName } from '../languages'
import SpeakButton from './SpeakButton'

export default function ConversationCardsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const mode = location.pathname.endsWith('/study')
    ? 'study'
    : location.pathname.endsWith('/edit')
      ? 'edit'
      : 'make'
  const [conversation, setConversation] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api(`/api/language-studio/conversations/${id}`)
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
  }, [id])

  useEffect(() => {
    if (conversation?.deckId && mode === 'make') {
      navigate(`/conversations/${id}/cards/edit`, { replace: true })
    }
  }, [conversation, mode, id, navigate])

  function back() {
    navigate(`/conversations/${id}`)
  }

  if (!conversation) {
    return (
      <main className="screen">
        <button className="back" type="button" onClick={back}>
          {t('back')}
        </button>
        {error ? <p className="error">{translateError(error)}</p> : <p>{t('loading')}</p>}
      </main>
    )
  }

  if (!conversation.deckId) {
    return <MakeAndOpen conversation={conversation} onBack={back} />
  }
  if (mode === 'edit') {
    return <EditView deckId={conversation.deckId} title={conversation.title} onBack={back} onDeleted={back} />
  }
  if (mode === 'study') {
    return (
      <StudyView
        deckId={conversation.deckId}
        title={conversation.title}
        nativeLanguage={conversation.nativeLanguage}
        targetLanguage={conversation.targetLanguage}
        onBack={back}
      />
    )
  }
  return (
    <main className="screen">
      <p>{t('loading')}</p>
    </main>
  )
}

function MakeAndOpen({ conversation, onBack }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api(`/api/language-studio/conversations/${conversation.id}/deck`, { method: 'POST' })
      .then((saved) => {
        if (!cancelled) {
          navigate(`/conversations/${saved.id}/cards/edit`, { replace: true })
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
  }, [conversation.id, navigate])

  return (
    <main className="screen">
      <button className="back" type="button" onClick={onBack}>
        {t('back')}
      </button>
      {error ? <p className="error">{translateError(error)}</p> : <p>{t('cards.makeBusy')}</p>}
    </main>
  )
}

function StudyView({ deckId, title, nativeLanguage, targetLanguage, onBack }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const dueToday = user?.restudyWait === 'IMMEDIATE'
  const [run, setRun] = useState(0)
  const [session, setSession] = useState(null)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [finished, setFinished] = useState(false)
  const [retries, setRetries] = useState(() => new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setSession(null)
    setIndex(0)
    setFlipped(false)
    setHintOpen(false)
    setFinished(false)
    setRetries(new Set())
    setError('')
    api(`/api/decks/${deckId}/study?mode=flip&filter=due`)
      .then((found) => {
        if (!cancelled) {
          setSession(found)
          setBusy(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setBusy(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [deckId, run])

  const cards = session?.cards || []
  const card = cards[index]

  async function rate(rating) {
    if (!card || busy) {
      return
    }
    setBusy(true)
    setError('')
    const seeAgain = rating === 'AGAIN' && !retries.has(card.id)
    try {
      await api(`/api/cards/${card.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating }),
      })
      const length = seeAgain ? cards.length + 1 : cards.length
      if (seeAgain) {
        setRetries((ids) => new Set(ids).add(card.id))
        setSession((current) => (current ? { ...current, cards: [...current.cards, card] } : current))
      }
      if (index + 1 >= length) {
        setFinished(true)
      } else {
        setIndex(index + 1)
        setFlipped(false)
        setHintOpen(false)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function studyAll() {
    setBusy(true)
    setError('')
    try {
      await api(`/api/decks/${deckId}/study/reset-due`, { method: 'POST' })
      setRun((value) => value + 1)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <main className="screen">
      <button className="back" type="button" onClick={onBack}>
        {t('back')}
      </button>
      <div className="screen-copy">
        <h1>{t('cards.title')}</h1>
        <p>{title}</p>
      </div>
      {error ? <p className="error">{translateError(error)}</p> : null}
      {!session && !error ? <p>{t('loading')}</p> : null}
      {session && cards.length === 0 ? (
        <div className="cards-end">
          <p>{session.cardCount > 0 ? t('cards.noneDue') : t('cards.emptyDeck')}</p>
          {session.cardCount > 0 ? (
            <button className="btn email" type="button" disabled={busy} onClick={studyAll}>
              {t('cards.studyAll')}
            </button>
          ) : null}
        </div>
      ) : null}
      {session && finished ? (
        <div className="cards-end">
          <p>{t('cards.done')}</p>
          <button className="btn email" type="button" disabled={busy} onClick={() => setRun((value) => value + 1)}>
            {t('cards.again')}
          </button>
        </div>
      ) : null}
      {card && !finished ? (
        <div className="study-session">
          <div className="flip-stage">
            <div className="flip-toolbar">
              <p className="flip-kicker">
                {flipped ? languageName(targetLanguage) : languageName(nativeLanguage)}
              </p>
              {card.hint ? (
                <button className="hint-btn" type="button" onClick={() => setHintOpen((open) => !open)}>
                  {hintOpen ? t('cards.hideHint') : t('cards.showHint')}
                </button>
              ) : null}
            </div>
            {hintOpen && card.hint ? <p className="hint-text">{card.hint}</p> : null}
            <p className="flip-progress">
              {t('cards.cardOf', { current: index + 1, total: cards.length })}
            </p>
            <div className="flip-card">
              <div className={`flip-inner${flipped ? ' is-flipped' : ''}`}>
                <div
                  className="flip-face flip-face-front"
                  role="button"
                  tabIndex={flipped ? -1 : 0}
                  aria-hidden={flipped}
                  onClick={() => setFlipped(true)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setFlipped(true)
                    }
                  }}
                >
                  <div className="flip-speak-row">
                    <strong>{card.front}</strong>
                    <SpeakButton text={card.front} lang={nativeLanguage} />
                  </div>
                  <span className="flip-cue">{t('cards.tap')}</span>
                </div>
                <div className="flip-face flip-face-back" aria-hidden={!flipped}>
                  <div className="flip-speak-row">
                    <p className="flip-prompt">{card.front}</p>
                    <SpeakButton text={card.front} lang={nativeLanguage} />
                  </div>
                  <div className="flip-speak-row">
                    <strong>{card.back}</strong>
                    <SpeakButton text={card.back} lang={targetLanguage} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {flipped ? (
            <div className="rating-row flip-ratings">
              <RateButton
                kind="again"
                label={t('cards.missed')}
                hint={reviewHint(t, 0, { thisSession: true })}
                disabled={busy}
                onClick={() => rate('AGAIN')}
              />
              <RateButton
                kind="hard"
                label={t('cards.hard')}
                hint={reviewHint(t, card.hardDays, { dueToday })}
                disabled={busy}
                onClick={() => rate('HARD')}
              />
              <RateButton
                kind="good"
                label={t('cards.good')}
                hint={reviewHint(t, card.goodDays, { dueToday })}
                disabled={busy}
                onClick={() => rate('GOOD')}
              />
              <RateButton
                kind="easy"
                label={t('cards.easy')}
                hint={reviewHint(t, card.easyDays, { dueToday })}
                disabled={busy}
                onClick={() => rate('EASY')}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </main>
  )
}

function RateButton({ kind, label, hint, disabled, onClick }) {
  return (
    <button className={`rating ${kind}`} type="button" disabled={disabled} onClick={onClick}>
      <span className="rating-label">{label}</span>
      <span className="rating-hint">{hint}</span>
    </button>
  )
}

function reviewHint(t, days, { thisSession = false, dueToday = false } = {}) {
  if (thisSession) {
    return t('cards.reviewThisSession')
  }
  if (dueToday || days <= 0) {
    return t('cards.reviewToday')
  }
  if (days === 1) {
    return t('cards.reviewTomorrow')
  }
  return t('cards.reviewInDays', { count: days })
}

function EditView({ deckId, title, onBack, onDeleted }) {
  const { t } = useTranslation()
  const [deck, setDeck] = useState(null)
  const [cards, setCards] = useState([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null)
  const [confirmDeck, setConfirmDeck] = useState(false)
  const [confirmCard, setConfirmCard] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([api(`/api/decks/${deckId}`), api(`/api/decks/${deckId}/cards`)])
      .then(([found, list]) => {
        if (!cancelled) {
          setDeck(found)
          setName(found.name || '')
          setCards(list)
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
  }, [deckId])

  async function reloadCards() {
    const list = await api(`/api/decks/${deckId}/cards`)
    setCards(list)
  }

  async function saveName() {
    const next = name.trim()
    if (!next) {
      setError(t('cards.needName'))
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const saved = await api(`/api/decks/${deckId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: next,
          description: deck.description || '',
          groupId: deck.group?.id || null,
          frontLanguage: deck.frontLanguage,
          backLanguage: deck.backLanguage,
        }),
      })
      setDeck(saved)
      setName(saved.name || next)
      setNotice(t('cards.saved'))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveCard() {
    const front = editing.front.trim()
    const back = editing.back.trim()
    if (!front || !back) {
      setError(t('cards.needBoth'))
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const hint = (editing.hint || '').trim()
      const body = JSON.stringify({ front, back, hint: hint || null })
      if (editing.id) {
        await api(`/api/cards/${editing.id}`, { method: 'PUT', body })
      } else {
        await api(`/api/decks/${deckId}/cards`, { method: 'POST', body })
      }
      await reloadCards()
      setEditing(null)
      setNotice(t('cards.saved'))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteCard() {
    setBusy(true)
    setError('')
    try {
      await api(`/api/cards/${editing.id}`, { method: 'DELETE' })
      await reloadCards()
      setEditing(null)
      setConfirmCard(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteDeck() {
    setBusy(true)
    setError('')
    try {
      await api(`/api/decks/${deckId}`, { method: 'DELETE' })
      onDeleted()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <main className="screen">
        <button
          className="back"
          type="button"
          onClick={() => {
            setEditing(null)
            setConfirmCard(false)
            setError('')
          }}
        >
          {t('back')}
        </button>
        <div className="screen-copy">
          <h1>{editing.id ? t('cards.editCard') : t('cards.add')}</h1>
        </div>
        {error ? <p className="error">{translateError(error)}</p> : null}
        <div className="card-form">
          <label className="field">
            <span>{t('cards.front')}</span>
            <textarea
              rows={3}
              value={editing.front}
              onChange={(event) => setEditing({ ...editing, front: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{t('cards.back')}</span>
            <textarea
              rows={3}
              value={editing.back}
              onChange={(event) => setEditing({ ...editing, back: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{t('cards.hint')}</span>
            <textarea
              rows={2}
              value={editing.hint || ''}
              placeholder={t('cards.hintPlaceholder')}
              onChange={(event) => setEditing({ ...editing, hint: event.target.value })}
            />
          </label>
          <div className="card-form-actions">
            <button className="btn email" type="button" disabled={busy} onClick={saveCard}>
              {t('cards.save')}
            </button>
            <button
              className="btn google"
              type="button"
              disabled={busy}
              onClick={() => {
                setEditing(null)
                setConfirmCard(false)
                setError('')
              }}
            >
              {t('cards.cancel')}
            </button>
          </div>
        </div>
        {editing.id ? (
          confirmCard ? (
            <div className="cards-confirm">
              <button className="danger-btn" type="button" disabled={busy} onClick={deleteCard}>
                {t('cards.deleteCardConfirm')}
              </button>
              <button className="back" type="button" onClick={() => setConfirmCard(false)}>
                {t('cards.cancel')}
              </button>
            </div>
          ) : (
            <button className="danger-btn" type="button" onClick={() => setConfirmCard(true)}>
              {t('cards.deleteCard')}
            </button>
          )
        ) : null}
      </main>
    )
  }

  return (
    <main className="screen">
      <button className="back" type="button" onClick={onBack}>
        {t('back')}
      </button>
      <div className="screen-copy">
        <h1>{t('cards.title')}</h1>
        <p>{title}</p>
      </div>
      {error ? <p className="error">{translateError(error)}</p> : null}
      {notice ? <p className="cards-notice">{notice}</p> : null}
      {deck ? (
        <label className="field">
          <span>{t('cards.deckName')}</span>
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
      ) : (
        <p>{t('loading')}</p>
      )}
      {deck ? (
        <button className="btn email" type="button" disabled={busy} onClick={saveName}>
          {t('cards.saveName')}
        </button>
      ) : null}
      <div className="phrase-list">
        {cards.map((card) => (
          <button
            key={card.id}
            className="card-row"
            type="button"
            onClick={() => {
              setError('')
              setNotice('')
              setConfirmCard(false)
              setEditing({ id: card.id, front: card.front, back: card.back, hint: card.hint })
            }}
          >
            <strong>{card.front}</strong>
            <span>{card.back}</span>
            {card.hint ? (
              <span className="card-hint">
                {t('cards.hint')}: {card.hint}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      {deck && cards.length === 0 ? <p>{t('cards.emptyDeck')}</p> : null}
      {deck ? (
        <button
          className="btn google"
          type="button"
          onClick={() => {
            setError('')
            setNotice('')
            setEditing({ id: null, front: '', back: '', hint: null })
          }}
        >
          {t('cards.add')}
        </button>
      ) : null}
      {deck ? (
        confirmDeck ? (
          <div className="cards-confirm">
            <button className="danger-btn" type="button" disabled={busy} onClick={deleteDeck}>
              {t('cards.deleteDeckConfirm')}
            </button>
            <button className="back" type="button" onClick={() => setConfirmDeck(false)}>
              {t('cards.cancel')}
            </button>
          </div>
        ) : (
          <button className="danger-btn" type="button" onClick={() => setConfirmDeck(true)}>
            {t('cards.deleteDeck')}
          </button>
        )
      ) : null}
    </main>
  )
}
