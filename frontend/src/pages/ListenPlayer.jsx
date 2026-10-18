import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import AudioTrack from './AudioTrack'
import { canListenSpeak } from '../listenSpeech'
import { canHearCommands, voiceCommand } from '../listenSession'

const SPEAKING = new Set(['announce', 'question', 'answer'])

export default function ListenPlayer({
  playback,
  title,
  loop,
  voice,
  onPause,
  onResume,
  onNext,
  onPrevious,
  onReplay,
  onRestart,
  onBack,
}) {
  const { t } = useTranslation()
  const actions = useRef({})
  actions.current = { onPause, onResume, onNext, onPrevious, onReplay, onRestart }
  const phase = playback?.phase || 'question'
  const card = playback?.card
  const speaking = SPEAKING.has(phase)
  const line = playback?.line || ''
  const showPrompt = phase === 'answer' && playback?.prompt && playback.prompt !== line

  useEffect(() => {
    if (!playback || !('mediaSession' in navigator) || !('MediaMetadata' in window)) {
      return undefined
    }
    const label = line || title || t('listen.menu')
    navigator.mediaSession.metadata = new MediaMetadata({
      title: label,
      artist: card?.deckName || title || t('app.name'),
      album: title || t('listen.menu'),
    })
    navigator.mediaSession.playbackState = phase === 'paused' || phase === 'done' || phase === 'blocked' ? 'paused' : 'playing'
    const bindings = [
      ['play', () => actions.current.onResume()],
      ['pause', () => actions.current.onPause()],
      ['previoustrack', () => actions.current.onPrevious()],
      ['nexttrack', () => actions.current.onNext()],
    ]
    for (const [name, handler] of bindings) {
      try {
        navigator.mediaSession.setActionHandler(name, handler)
      } catch {
        // This browser does not offer that lock-screen control.
      }
    }
    return () => {
      for (const [name] of bindings) {
        try {
          navigator.mediaSession.setActionHandler(name, null)
        } catch {
          // Ignore.
        }
      }
    }
  }, [line, title, card?.deckName, phase, t])

  useEffect(() => {
    if (!voice || !canHearCommands()) {
      return undefined
    }
    if (speaking) {
      return undefined
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new Recognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    let stopped = false
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        stopped = true
      }
    }
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript
      const command = voiceCommand(transcript)
      if (command === 'next') {
        actions.current.onNext()
      } else if (command === 'previous') {
        actions.current.onPrevious()
      } else if (command === 'replay') {
        actions.current.onReplay()
      } else if (command === 'pause') {
        actions.current.onPause()
      } else if (command === 'resume') {
        actions.current.onResume()
      }
    }
    recognition.onend = () => {
      if (!stopped && !speaking) {
        try {
          recognition.start()
        } catch {
          // Already listening.
        }
      }
    }
    try {
      recognition.start()
    } catch {
      // The mic is busy.
    }
    return () => {
      stopped = true
      recognition.onend = null
      try {
        recognition.stop()
      } catch {
        // Already stopped.
      }
    }
  }, [voice, speaking, phase])

  const phaseLabel =
    phase === 'announce'
      ? t('listen.announcePhase')
      : phase === 'answer'
        ? t('listen.answer')
        : phase === 'gap'
          ? t('listen.gap')
          : phase === 'paused' || phase === 'blocked'
            ? t('listen.paused')
            : t('listen.question')

  return (
    <div className="listen-player">
      <button className="page-back" type="button" onClick={onBack}>
        {t('listen.back')}
      </button>
      <div className="page-title">
        <div>
          <h1>{title || card?.deckName || t('listen.menu')}</h1>
          <p className="muted">
            {card?.deckName && title && card.deckName !== title ? `${card.deckName} · ` : ''}
            {playback?.total
              ? t('listen.progress', { current: Math.min(playback.total, playback.index + 1), total: playback.total })
              : t('listen.schedule')}
            {loop ? ` · ${t('listen.loop')}` : ''}
          </p>
        </div>
      </div>

      {phase === 'done' ? (
        <section className="card-form">
          <h2 className="section-heading">{t('listen.doneTitle')}</h2>
          <p className="muted">{t('listen.doneBody')}</p>
          <div className="header-actions">
            <button className="btn primary" type="button" onClick={onRestart}>
              {t('listen.again')}
            </button>
            <button className="btn" type="button" onClick={onBack}>
              {t('listen.back')}
            </button>
          </div>
        </section>
      ) : (
        <section className="listen-stage" aria-live="polite">
          <p className="eyebrow">{phaseLabel}</p>
          <AudioTrack text={line || title} progress={playback?.progress || 0} active={speaking} />
          {showPrompt ? <p className="listen-prompt muted">{playback.prompt}</p> : null}
          <h2>{line}</h2>
          {phase === 'blocked' ? <p className="muted">{t('listen.blocked')}</p> : null}
          {!canListenSpeak() ? <p className="muted">{t('listen.speechOff')}</p> : null}
        </section>
      )}

      {phase === 'done' ? null : (
        <div className="listen-transport">
          <button className="btn" type="button" onClick={onPrevious}>
            {t('listen.previous')}
          </button>
          <button className="btn" type="button" onClick={onReplay}>
            {t('listen.replay')}
          </button>
          <button className="btn primary" type="button" onClick={phase === 'paused' || phase === 'blocked' ? onResume : onPause}>
            {phase === 'paused' || phase === 'blocked' ? t('listen.resume') : t('listen.pause')}
          </button>
          <button className="btn" type="button" onClick={onNext}>
            {t('listen.next')}
          </button>
        </div>
      )}
      {phase === 'done' ? null : (
        <button className="btn listen-restart" type="button" onClick={onRestart}>
          {t('listen.restart')}
        </button>
      )}
    </div>
  )
}
