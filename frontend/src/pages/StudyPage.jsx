import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { translateError } from '../i18n/errors'
import { formatDay } from '../i18n/format'
import { stopSpeaking } from '../tts'
import SpeakButton from './SpeakButton'
import MatchListStudy from './MatchListStudy'
import AudioReviewStudy from './AudioReviewStudy'

export default function StudyPage() {
  const { t } = useTranslation()
  const { id, mode } = useParams()
  const [cards, setCards] = useState([])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [choice, setChoice] = useState('')
  const [written, setWritten] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [done, setDone] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [exitKind, setExitKind] = useState('')
  const [nextDueDate, setNextDueDate] = useState(null)

  const current = cards[index]
  const normalizedMode = (mode || 'flip').toLowerCase()
  const total = cards.length
  const currentNumber =
    normalizedMode === 'match' ? (done ? total : Math.min(reviewed + 1, total || 1)) : total ? Math.min(index + 1, total) : 0
  const progressPct = done ? 100 : total ? (currentNumber / total) * 100 : 0

  async function loadSession() {
    const session = await api(`/api/decks/${id}/study?mode=${normalizedMode}`)
    setCards(session.cards || [])
    setIndex(0)
    setRevealed(false)
    setHintOpen(false)
    setChoice('')
    setWritten('')
    setFeedback(null)
    setReviewed(0)
    setExitKind('')
    setNextDueDate(session.nextDueDate || null)
    setDone((session.cards || []).length === 0)
  }

  useEffect(() => {
    loadSession().catch((err) => setError(err.message))
  }, [id, normalizedMode])

  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [index, id])

  useEffect(() => {
    if ((normalizedMode !== 'flip' && normalizedMode !== 'audio') || revealed || done || !current || busy) {
      return undefined
    }
    function onKeyDown(event) {
      if (event.key !== ' ' && event.key !== 'Enter') {
        return
      }
      if (event.target.closest('button, input, textarea, a')) {
        return
      }
      event.preventDefault()
      setRevealed(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [busy, current, done, normalizedMode, revealed])

  const progressLabel = useMemo(() => {
    if (!total) {
      return t('study.cardProgress', { current: 0, total: 0 })
    }
    return t('study.cardProgress', { current: currentNumber, total })
  }, [currentNumber, t, total])

  function resetCardState() {
    setRevealed(false)
    setHintOpen(false)
    setChoice('')
    setWritten('')
    setFeedback(null)
    setExitKind('')
  }

  async function submitRating(rating, pauseMs = 0) {
    if (!current || busy) {
      return
    }
    setBusy(true)
    setError('')
    const usesExit = normalizedMode === 'flip' || normalizedMode === 'audio'
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (usesExit && !reduceMotion) {
      setExitKind(rating.toLowerCase())
    }
    try {
      await api(`/api/cards/${current.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating }),
      })
      const waitMs = usesExit && !reduceMotion ? 380 : pauseMs
      if (waitMs) {
        await new Promise((resolve) => setTimeout(resolve, waitMs))
      }
      const nextIndex = index + 1
      setReviewed((count) => count + 1)
      if (nextIndex >= cards.length) {
        setDone(true)
        setExitKind('')
      } else {
        setIndex(nextIndex)
        resetCardState()
      }
    } catch (err) {
      setExitKind('')
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function answersMatch(expected, actual) {
    return expected.trim().toLowerCase() === actual.trim().toLowerCase()
  }

  async function gradeQuiz(selected) {
    setChoice(selected)
    const correct = answersMatch(current.back, selected)
    setFeedback(correct ? 'correct' : 'wrong')
    await submitRating(correct ? 'GOOD' : 'AGAIN', 700)
  }

  async function gradeWrite(event) {
    event.preventDefault()
    const correct = answersMatch(current.back, written)
    setFeedback(correct ? 'correct' : 'wrong')
    await submitRating(correct ? 'GOOD' : 'AGAIN', 900)
  }

  async function gradeMatch(card, rating) {
    setError('')
    try {
      await api(`/api/cards/${card.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating }),
      })
      setReviewed((count) => count + 1)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  function modeLabel() {
    if (normalizedMode === 'quiz' || normalizedMode === 'write' || normalizedMode === 'match' || normalizedMode === 'audio') {
      return t(`study.${normalizedMode}`)
    }
    return t('study.flip')
  }

  function flipCard() {
    if (!revealed && !busy) {
      setRevealed(true)
    }
  }

  function doneMessage() {
    if (reviewed === 0) {
      if (nextDueDate) {
        return t('study.nothingDueUntil', { date: formatDay(nextDueDate) })
      }
      return t('study.nothingDue')
    }
    if (nextDueDate) {
      return t('study.reviewedUntil', { count: reviewed, date: formatDay(nextDueDate) })
    }
    return t('study.reviewedSoon', { count: reviewed })
  }

  return (
    <div className="page study-content">
      <div className="page-title">
        <div>
          <Link className="page-back" to={`/decks/${id}`}>
            {t('nav.backToDeck')}
          </Link>
          <h1>{modeLabel()}</h1>
        </div>
      </div>
      {!done && total > 0 ? (
        <div className="study-progress">
          <div className="study-progress-meta">
            <span>{progressLabel}</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div
            className="study-progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressPct)}
            aria-label={progressLabel}
          >
            <div className="study-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      ) : null}
      {error ? <div className="error">{translateError(t, error)}</div> : null}
      {done ? (
        <div className="study-card done-card">
          <h2>{reviewed === 0 ? t('study.caughtUp') : t('study.niceWork')}</h2>
          <p>{doneMessage()}</p>
          <p className="muted">
            {t('study.changeSchedule')}{' '}
            <Link to="/settings#study-options">{t('settings.studyOptions')}</Link>
          </p>
          <div className="header-actions">
            <Link className="btn primary" to={`/decks/${id}`}>
              {t('nav.backToDeck')}
            </Link>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setError('')
                loadSession().catch((err) => setError(err.message))
              }}
            >
              {t('study.studyAgain')}
            </button>
          </div>
        </div>
      ) : current && normalizedMode === 'match' ? (
        <MatchListStudy cards={cards} onGrade={gradeMatch} onComplete={() => setDone(true)} />
      ) : current && normalizedMode === 'audio' ? (
        <AudioReviewStudy
          card={current}
          revealed={revealed}
          busy={busy}
          exitKind={exitKind}
          onReveal={() => setRevealed(true)}
          onRate={(rating) => submitRating(rating)}
        />
      ) : current && normalizedMode === 'flip' ? (
        <>
          <div
            key={current.id}
            className={`flip-stage${exitKind ? ` is-leaving is-leaving-${exitKind}` : ''}`}
          >
            <div className="flip-toolbar">
              <div className="card-heading">
                <div className="eyebrow">{revealed ? t('study.answer') : t('study.question')}</div>
                <SpeakButton
                  text={revealed ? current.back : current.front}
                  lang={revealed ? current.backLanguage : current.frontLanguage}
                />
              </div>
              {current.hint ? (
                <button className="btn" type="button" onClick={() => setHintOpen((open) => !open)}>
                  {hintOpen ? t('study.hideHint') : t('study.showHint')}
                </button>
              ) : null}
            </div>
            {hintOpen && current.hint ? <p className="hint-text">{current.hint}</p> : null}
            <div className="flip-card">
              <div className={`flip-inner${revealed ? ' is-flipped' : ''}`}>
                <button
                  className="flip-face flip-face-front"
                  type="button"
                  onClick={(event) => {
                    event.currentTarget.blur()
                    flipCard()
                  }}
                  tabIndex={revealed ? -1 : 0}
                  aria-hidden={revealed}
                >
                  <h2>{current.front}</h2>
                  <span className="flip-cue">{t('study.tapToFlip')}</span>
                </button>
                <div className="flip-face flip-face-back" aria-hidden={!revealed}>
                  <p className="flip-prompt muted">{current.front}</p>
                  <p className="answer">{current.back}</p>
                </div>
              </div>
            </div>
          </div>
          {revealed ? (
            <div className="rating-row flip-ratings">
              <button className="btn rating again" type="button" disabled={busy} onClick={() => submitRating('AGAIN')}>
                {t('study.again')}
              </button>
              <button className="btn rating hard" type="button" disabled={busy} onClick={() => submitRating('HARD')}>
                {t('study.hard')}
              </button>
              <button className="btn rating good" type="button" disabled={busy} onClick={() => submitRating('GOOD')}>
                {t('study.good')}
              </button>
              <button className="btn rating easy" type="button" disabled={busy} onClick={() => submitRating('EASY')}>
                {t('study.easy')}
              </button>
            </div>
          ) : null}
        </>
      ) : current ? (
        <div className="study-card">
          <div className="card-heading">
            <div className="eyebrow">{t('study.question')}</div>
            <SpeakButton text={current.front} lang={current.frontLanguage} />
          </div>
          <h2>{current.front}</h2>
          {current.hint ? (
            <div className="hint-block">
              <button className="btn" type="button" onClick={() => setHintOpen((open) => !open)}>
                {hintOpen ? t('study.hideHint') : t('study.showHint')}
              </button>
              {hintOpen ? <p className="hint-text">{current.hint}</p> : null}
            </div>
          ) : null}
          {normalizedMode === 'quiz' ? (
            <div className="choice-list">
              {(current.choices || []).map((option) => (
                <button
                  key={option}
                  className={`choice ${choice === option ? (feedback === 'correct' ? 'correct' : 'wrong') : ''}`}
                  type="button"
                  disabled={busy || Boolean(choice)}
                  onClick={() => gradeQuiz(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}
          {normalizedMode === 'write' ? (
            <form className="stack" onSubmit={gradeWrite}>
              <input
                value={written}
                onChange={(e) => setWritten(e.target.value)}
                placeholder={t('study.typeAnswer')}
                autoFocus
                required
                disabled={busy}
              />
              <button className="btn primary" type="submit" disabled={busy}>
                {t('study.check')}
              </button>
              {feedback ? (
                <p className={feedback === 'correct' ? 'ok' : 'error'}>
                  {feedback === 'correct' ? t('study.correct') : t('study.answerWas', { answer: current.back })}
                  {feedback === 'wrong' ? (
                    <SpeakButton text={current.back} lang={current.backLanguage} />
                  ) : null}
                </p>
              ) : null}
            </form>
          ) : null}
        </div>
      ) : (
        <div className="empty">{t('study.loadingCards')}</div>
      )}
    </div>
  )
}
