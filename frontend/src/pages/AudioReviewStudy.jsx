import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { canSpeak, speak, stopSpeaking } from '../tts'
import RatingRow from './RatingRow'

export default function AudioReviewStudy({
  card,
  revealed,
  busy,
  exitKind,
  hideMissed = false,
  dueToday = false,
  onReveal,
  onRate,
}) {
  const { t } = useTranslation()
  const speechOk = canSpeak()

  useEffect(() => {
    if (!card || revealed || !speechOk) {
      return undefined
    }
    speak(card.front, card.frontLanguage)
    return () => {
      stopSpeaking()
    }
  }, [card, revealed, speechOk])

  useEffect(() => {
    if (!card || !revealed || !speechOk) {
      return undefined
    }
    speak(card.back, card.backLanguage)
    return () => {
      stopSpeaking()
    }
  }, [card, revealed, speechOk])

  return (
    <>
      <div className={`audio-stage${exitKind ? ` is-leaving is-leaving-${exitKind}` : ''}`}>
        <div className="audio-card">
          {speechOk ? (
            <button
              className="audio-play"
              type="button"
              onClick={() => speak(revealed ? card.back : card.front, revealed ? card.backLanguage : card.frontLanguage)}
              aria-label={t('study.replay')}
            >
              <PlayIcon />
            </button>
          ) : null}
          <div className="eyebrow">{revealed ? t('study.answer') : t('study.question')}</div>
          {revealed || !speechOk ? (
            <>
              <h2>{revealed ? card.back : card.front}</h2>
              {revealed ? <p className="flip-prompt muted">{card.front}</p> : null}
              {!speechOk ? <p className="muted">{t('study.audioUnavailable')}</p> : null}
            </>
          ) : (
            <>
              <h2 className="audio-hidden">
                <HeadphonesIcon />
                <span>{t('study.listening')}</span>
              </h2>
              <p className="muted">{t('study.audioCue')}</p>
            </>
          )}
          {!revealed ? (
            <button className="btn primary" type="button" onClick={onReveal}>
              {t('study.revealWhenReady')}
            </button>
          ) : null}
        </div>
      </div>
      {revealed ? (
        <RatingRow card={card} hideMissed={hideMissed} busy={busy} dueToday={dueToday} onRate={onRate} />
      ) : null}
    </>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72L19 12 8 5.14z" />
    </svg>
  )
}

function HeadphonesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 13a7 7 0 0 1 14 0" />
      <rect x="3.5" y="13" width="4" height="7" rx="1.5" />
      <rect x="16.5" y="13" width="4" height="7" rx="1.5" />
    </svg>
  )
}
