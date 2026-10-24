import { Capacitor } from '@capacitor/core'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AudioTrack from './AudioTrack'
import { translateError } from '../i18n/errors'
import { formatSleepLeft } from '../listenPrefs'
import { canListenSpeak } from '../listenSpeech'
import { ListenLiveOptions, listenLiveSummary } from './ListenOptions'
import StudioRatePanel from './StudioRatePanel'

export default function ListenPlayer({
  playback,
  title,
  loop,
  prefs,
  onChangePrefs,
  onExtendSleep,
  onPause,
  onResume,
  onNext,
  onPrevious,
  onReplay,
  onRestart,
  onBack,
  onRate,
  ratingBusy = false,
  ratingError = '',
}) {
  const { t } = useTranslation()
  const actions = useRef({})
  actions.current = { onPause, onResume, onNext, onPrevious, onReplay, onRestart }
  const phase = playback?.phase || 'question'
  const speaking = phase === 'announce' || phase === 'question' || phase === 'answer'
  const finished = phase === 'done' || phase === 'slept'
  const studioEnd = finished && typeof onRate === 'function'
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!playback?.sleepDeadline || finished) {
      return undefined
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [playback?.sleepDeadline, finished])
  const sleepLeft = playback?.sleepDeadline > now ? playback.sleepDeadline - now : 0
  const card = playback?.card
  const line = playback?.line || ''
  const showPrompt = phase === 'answer' && playback?.prompt && playback.prompt !== line

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      return undefined
    }
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
    <div className={`listen-player${optionsOpen && !finished ? ' is-options-open' : ''}${studioEnd ? ' is-studio-end' : ''}`}>
      <button className="page-back" type="button" onClick={onBack}>
        {t('listen.back')}
      </button>
      {studioEnd ? (
        <div className="listen-studio-end">
          {ratingError ? <div className="error">{translateError(t, ratingError)}</div> : null}
          <StudioRatePanel
            saving={ratingBusy}
            onChoose={onRate}
            lead={phase === 'slept' ? <p className="muted">{t('listen.sleptTitle')}</p> : null}
            footer={
              <div className="listen-play-again">
                <button className="btn primary" type="button" disabled={ratingBusy} onClick={onRestart}>
                  {t('listen.again')}
                </button>
              </div>
            }
          />
        </div>
      ) : null}
      {studioEnd ? null : (
      <>
      <div className="page-title">
        <div>
          <h1>{title || card?.deckName || t('listen.menu')}</h1>
          <p className="muted">
            {card?.deckName && title && card.deckName !== title ? `${card.deckName} · ` : ''}
            {playback?.total
              ? t('listen.progress', { current: Math.min(playback.total, playback.index + 1), total: playback.total })
              : t('listen.schedule')}
            {loop ? ` · ${t('listen.repeat')}` : ''}
            {sleepLeft > 0 ? ` · ${t('listen.sleepLeft', { time: formatSleepLeft(sleepLeft) })}` : ''}
          </p>
        </div>
      </div>

      {finished ? (
        <section className="card-form">
          <h2 className="section-heading">{t(phase === 'slept' ? 'listen.sleptTitle' : 'listen.doneTitle')}</h2>
          <p className="muted">{t('listen.doneBody')}</p>
          <div className="listen-play-again">
            <button className="btn primary" type="button" onClick={onRestart}>
              {t('listen.again')}
            </button>
          </div>
        </section>
      ) : optionsOpen ? (
        <p className="admin-sr" aria-live="polite">
          {phaseLabel}. {line}
        </p>
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

      {finished ? null : (
        <div className="listen-controls">
          <div className="listen-transport">
            <button className="btn" type="button" onClick={onPrevious}>
              <TransportIcon name="previous" />
              <span>{t('listen.previous')}</span>
            </button>
            <button className="btn" type="button" onClick={onReplay}>
              <TransportIcon name="replay" />
              <span>{t('listen.replay')}</span>
            </button>
            <button className="btn primary" type="button" onClick={phase === 'paused' || phase === 'blocked' ? onResume : onPause}>
              <TransportIcon name={phase === 'paused' || phase === 'blocked' ? 'play' : 'pause'} />
              <span>{phase === 'paused' || phase === 'blocked' ? t('listen.resume') : t('listen.pause')}</span>
            </button>
            <button className="btn" type="button" onClick={onNext}>
              <TransportIcon name="next" />
              <span>{t('listen.next')}</span>
            </button>
          </div>
          {prefs && onChangePrefs && onExtendSleep ? (
            <>
              <button
                className="listen-options-toggle"
                type="button"
                aria-expanded={optionsOpen}
                onClick={() => setOptionsOpen((open) => !open)}
              >
                <span>{optionsOpen ? t('listen.optionsHide') : t('listen.options')}</span>
                <span className="muted">{listenLiveSummary(prefs, sleepLeft, t)}</span>
              </button>
              {optionsOpen ? (
                <ListenLiveOptions
                  prefs={prefs}
                  sleepLeft={sleepLeft}
                  onChange={onChangePrefs}
                  onExtendSleep={onExtendSleep}
                />
              ) : null}
            </>
          ) : null}
          <button className="btn listen-restart" type="button" onClick={onRestart}>
            <TransportIcon name="restart" />
            <span>{t('listen.restart')}</span>
          </button>
        </div>
      )}
      </>
      )}
    </div>
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
