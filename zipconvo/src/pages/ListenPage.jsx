import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { translateError } from '../i18n/errors'
import { languageName } from '../languages'
import { clampListenPause, clampListenRate, clampListenSleep, formatSleepLeft, listenPrefsFromUser, listenPrefsToApi } from '../listenPrefs'
import AudioTrack from '../AudioTrack'
import ListenOptions, { ListenOptionsToggle, listenPrefsSummary } from './ListenOptions'
import { createListenSession } from '../listenSession'
import { canListenSpeak } from '../listenSpeech'
import { placeLabel } from '../studio'

export default function ListenPage() {
  const { id } = useParams()
  if (id) {
    return <ListenPlayer id={id} />
  }
  return <ListenList />
}

function ListenList() {
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api('/api/language-studio/conversations')
      .then((rows) => {
        if (!cancelled) {
          setItems(rows || [])
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="screen">
      <div className="screen-copy">
        <h1>{t('listen.title')}</h1>
        <p>{t('listen.lede')}</p>
      </div>
      {error ? <p className="error">{translateError(error)}</p> : null}
      {loading ? <p className="empty">{t('loading')}</p> : null}
      {!loading && items.length === 0 ? (
        <p className="empty">
          {t('listen.empty')} <Link to="/scenes">{t('listen.chooseScene')}</Link>
        </p>
      ) : null}
      <div className="conversation-list">
        {items.map((item) => (
          <Link key={item.id} className="conversation-card" to={`/listen/${item.id}`}>
            <div className="card-title">
              <h2>{item.title}</h2>
              <span className="pill">{item.level}</span>
            </div>
            <p className="card-meta">
              {placeLabel(item.scenario)} · {languageName(item.nativeLanguage)} → {languageName(item.targetLanguage)}
            </p>
            <span className="card-action">{t('listen.action')}</span>
          </Link>
        ))}
      </div>
    </main>
  )
}

function ListenPlayer({ id }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, patchMe } = useAuth()
  const [conversation, setConversation] = useState(null)
  const [error, setError] = useState('')
  const [playback, setPlayback] = useState(null)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [prefs, setPrefs] = useState(() => listenPrefsFromUser(user))
  const prefsRef = useRef(prefs)
  const sessionRef = useRef(null)
  prefsRef.current = prefs

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
      sessionRef.current?.stop()
      sessionRef.current = null
    }
  }, [id])

  useEffect(() => {
    const next = listenPrefsFromUser(user)
    prefsRef.current = next
    setPrefs(next)
  }, [user])

  function changePrefs(partial) {
    const current = prefsRef.current
    const next = {
      pauseSeconds: clampListenPause(partial.pauseSeconds ?? current.pauseSeconds),
      side: (partial.side ?? current.side) === 'back' ? 'back' : 'front',
      loop: partial.loop ?? current.loop,
      sleepMinutes: clampListenSleep(partial.sleepMinutes ?? current.sleepMinutes),
      rate: clampListenRate(partial.rate ?? current.rate),
      questionTwice: partial.questionTwice ?? current.questionTwice,
      answerTwice: partial.answerTwice ?? current.answerTwice,
    }
    prefsRef.current = next
    setPrefs(next)
    const session = sessionRef.current
    session?.setWaitMs(next.pauseSeconds * 1000)
    session?.setLoop(next.loop)
    session?.setRate(next.rate)
    session?.setQuestionTwice(next.questionTwice)
    session?.setAnswerTwice(next.answerTwice)
    patchMe(listenPrefsToApi(next)).catch((err) => setError(err.message))
  }

  const phase = playback?.phase || ''
  const active = Boolean(playback) && phase !== 'done' && phase !== 'slept' && phase !== 'error'
  const finished = phase === 'done' || phase === 'slept'
  const paused = phase === 'paused' || phase === 'blocked'
  const speaking = Boolean(playback) && !playback.voiceUnsupported && (phase === 'question' || phase === 'answer')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!playback?.sleepDeadline || finished) {
      return undefined
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [playback?.sleepDeadline, finished])

  const sleepLeft = playback?.sleepDeadline > now ? playback.sleepDeadline - now : 0
  const firstIsLine = prefs.side === 'back'
  const phaseLabel = !active
    ? ''
    : paused
      ? t('listen.paused')
      : phase === 'gap'
        ? t('listen.gap')
        : phase === 'answer'
          ? t(firstIsLine ? 'settings.meaning' : 'settings.line')
          : t(firstIsLine ? 'settings.line' : 'settings.meaning')

  function play() {
    if (!conversation || active) {
      return
    }
    if (!canListenSpeak()) {
      setError(t('listen.cannotSpeak'))
      return
    }
    const cards = conversationCards(conversation)
    if (cards.length === 0) {
      return
    }
    sessionRef.current?.stop()
    const chosen = prefsRef.current
    const session = createListenSession({
      cards,
      options: {
        waitMs: chosen.pauseSeconds * 1000,
        side: chosen.side,
        loop: chosen.loop,
        announce: false,
        sleepMs: chosen.sleepMinutes * 60 * 1000,
        rate: chosen.rate,
        questionTwice: chosen.questionTwice,
        answerTwice: chosen.answerTwice,
      },
      onChange: setPlayback,
    })
    sessionRef.current = session
    setOptionsOpen(false)
    setError('')
    session.start()
  }

  function stop() {
    sessionRef.current?.stop()
    sessionRef.current = null
    setPlayback(null)
  }

  const line = playback?.line || ''
  const showPrompt = phase === 'answer' && playback?.prompt && playback.prompt !== line

  return (
    <main className="screen listen-player">
      <button className="back" type="button" onClick={() => { stop(); navigate('/listen') }}>
        {t('back')}
      </button>
      {!conversation && !error ? <p className="empty">{t('loading')}</p> : null}
      {error ? <p className="error">{translateError(error)}</p> : null}
      {phase === 'error' && playback?.error ? <p className="error">{translateError(playback.error)}</p> : null}
      {conversation ? (
        <>
          <div className="screen-copy">
            <h1>{conversation.title}</h1>
            <p>
              {playback?.total
                ? t('listen.progress', { current: Math.min(playback.total, playback.index + 1), total: playback.total })
                : t('listen.plays')}
              {prefs.loop && active ? ` · ${t('settings.repeat')}` : ''}
              {sleepLeft > 0 ? ` · ${t('listen.sleepLeft', { time: formatSleepLeft(sleepLeft) })}` : ''}
            </p>
          </div>
          {finished ? (
            <section className="listen-stage">
              <h2>{t(phase === 'slept' ? 'listen.sleptTitle' : 'listen.doneTitle')}</h2>
              <p className="listen-prompt">{t('listen.end')}</p>
              <button className="listen-restart" type="button" onClick={play}>
                {t('listen.again')}
              </button>
            </section>
          ) : active ? (
            <section className="listen-stage" aria-live="polite">
              <p className="listen-phase">{phaseLabel}</p>
              <AudioTrack text={line || conversation.title} progress={playback?.progress || 0} active={speaking} />
              {showPrompt ? <p className="listen-prompt">{playback.prompt}</p> : null}
              <h2>{line}</h2>
              {phase === 'blocked' ? <p className="listen-prompt">{t('listen.blocked')}</p> : null}
              {playback?.voiceUnsupported ? <p className="speak-voice-note">{t('practice.voiceUnsupported')}</p> : null}
            </section>
          ) : null}
          {active ? (
            <div className="listen-controls">
              <div className="listen-transport">
                <button type="button" onClick={() => sessionRef.current?.previous()}>
                  <TransportIcon name="previous" />
                  <span>{t('listen.previous')}</span>
                </button>
                <button type="button" onClick={() => sessionRef.current?.replay()}>
                  <TransportIcon name="replay" />
                  <span>{t('listen.replay')}</span>
                </button>
                <button
                  className="is-primary"
                  type="button"
                  onClick={() => (paused ? sessionRef.current?.resume() : sessionRef.current?.pause())}
                >
                  <TransportIcon name={paused ? 'play' : 'pause'} />
                  <span>{paused ? t('listen.resume') : t('listen.pause')}</span>
                </button>
                <button type="button" onClick={() => sessionRef.current?.next()}>
                  <TransportIcon name="next" />
                  <span>{t('listen.next')}</span>
                </button>
              </div>
              <ListenOptionsToggle
                open={optionsOpen}
                onToggle={() => setOptionsOpen((open) => !open)}
                summary={listenPrefsSummary(prefs, t)}
              />
              {optionsOpen ? <ListenOptions prefs={prefs} onChange={changePrefs} /> : null}
              <button className="listen-restart" type="button" onClick={() => sessionRef.current?.restart()}>
                <TransportIcon name="restart" />
                <span>{t('listen.restart')}</span>
              </button>
            </div>
          ) : finished ? null : (
            <>
              <div className="listen-play-bar">
                <button className="btn email" type="button" onClick={play}>
                  {t('listen.play')}
                </button>
              </div>
              <ListenOptionsToggle
                open={optionsOpen}
                onToggle={() => setOptionsOpen((open) => !open)}
                summary={listenPrefsSummary(prefs, t)}
              />
              {optionsOpen ? <ListenOptions prefs={prefs} onChange={changePrefs} /> : null}
            </>
          )}
        </>
      ) : null}
    </main>
  )
}

function TransportIcon({ name }) {
  return (
    <svg className="listen-control-icon" viewBox="0 0 24 24" aria-hidden="true">
      {name === 'previous' ? <path d="M6 6v12M18 6l-8 6 8 6z" /> : null}
      {name === 'next' ? <path d="M6 6l8 6-8 6zM18 6v12" /> : null}
      {name === 'replay' ? (
        <>
          <path d="M8 8H4V4" />
          <path d="M4.5 8a8 8 0 1 1-1 4" />
        </>
      ) : null}
      {name === 'pause' ? (
        <>
          <rect x="7" y="5" width="3.5" height="14" rx="1" />
          <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
        </>
      ) : null}
      {name === 'play' ? <path d="M8 5v14l11-7z" fill="currentColor" stroke="none" /> : null}
      {name === 'restart' ? (
        <>
          <path d="M4 12a8 8 0 1 0 2.3-5.6" />
          <path d="M4 4v5h5" />
        </>
      ) : null}
    </svg>
  )
}

function conversationCards(conversation) {
  return (conversation.turns || [])
    .map((turn, index) => ({
      id: `${conversation.id}-${index}`,
      deckId: conversation.id,
      deckName: conversation.title || '',
      front: String(turn.nativeText || '').trim(),
      back: String(turn.targetText || '').trim(),
      frontLanguage: conversation.nativeLanguage || 'en-US',
      backLanguage: conversation.targetLanguage || 'en-US',
    }))
    .filter((card) => card.front || card.back)
}
