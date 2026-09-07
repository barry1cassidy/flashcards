import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { canSpeak, speak, stopSpeaking } from '../tts'

export default function AudioReviewStudy({ card, revealed, busy, exitKind, onReveal, onRate }) {
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
              <h2 className="audio-hidden">{t('study.listening')}</h2>
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
        <div className="rating-row flip-ratings">
          <button className="btn rating again" type="button" disabled={busy} onClick={() => onRate('AGAIN')}>
            {t('study.again')}
          </button>
          <button className="btn rating hard" type="button" disabled={busy} onClick={() => onRate('HARD')}>
            {t('study.hard')}
          </button>
          <button className="btn rating good" type="button" disabled={busy} onClick={() => onRate('GOOD')}>
            {t('study.good')}
          </button>
          <button className="btn rating easy" type="button" disabled={busy} onClick={() => onRate('EASY')}>
            {t('study.easy')}
          </button>
        </div>
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
