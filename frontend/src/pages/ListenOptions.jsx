import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LISTEN_PAUSE_MAX,
  LISTEN_PAUSE_MIN,
  LISTEN_SLEEP_CHOICES,
  clampListenPause,
} from '../listenPrefs'

export function listenPrefsSummary(prefs, t, showAnnounce) {
  const sleep =
    prefs.sleepMinutes === 0
      ? t('listen.sleepOff')
      : prefs.sleepMinutes === 60
        ? t('listen.sleepHour')
        : t('listen.sleepMinutes', { count: prefs.sleepMinutes })
  const parts = [
    t('listen.pauseSummary', { count: prefs.pauseSeconds }),
    t(prefs.side === 'back' ? 'listen.sideBack' : 'listen.sideFront'),
    t(prefs.loop ? 'listen.repeat' : 'listen.once'),
    sleep,
  ]
  if (showAnnounce && !prefs.announce) {
    parts.splice(3, 0, t('listen.announceOff'))
  }
  return parts.join(' · ')
}

export default function ListenOptions({ prefs, onChange, showAnnounce = true }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(String(prefs.pauseSeconds))
  const pauseTimer = useRef(0)

  useEffect(() => {
    setDraft(String(prefs.pauseSeconds))
  }, [prefs.pauseSeconds])

  useEffect(() => () => window.clearTimeout(pauseTimer.current), [])

  function commitPause(value) {
    window.clearTimeout(pauseTimer.current)
    onChange({ pauseSeconds: clampListenPause(value) })
  }

  function typePause(value) {
    setDraft(value)
    window.clearTimeout(pauseTimer.current)
    if (value.trim() === '') {
      return
    }
    pauseTimer.current = window.setTimeout(() => commitPause(value), 400)
  }

  return (
    <div className="listen-setup-grid">
      <fieldset className="listen-panel">
        <legend>{t('listen.wait')}</legend>
        <div className="listen-stepper">
          <button
            className="btn"
            type="button"
            aria-label={t('listen.pauseDecrease')}
            onClick={() => commitPause(prefs.pauseSeconds - 1)}
          >
            −
          </button>
          <label className="listen-stepper-value">
            <input
              inputMode="numeric"
              min={LISTEN_PAUSE_MIN}
              max={LISTEN_PAUSE_MAX}
              aria-label={t('listen.wait')}
              value={draft}
              onChange={(event) => typePause(event.target.value)}
              onBlur={() => {
                if (draft.trim() === '') {
                  setDraft(String(prefs.pauseSeconds))
                  return
                }
                commitPause(draft)
              }}
            />
            <span>{t('listen.pauseUnit')}</span>
          </label>
          <button
            className="btn"
            type="button"
            aria-label={t('listen.pauseIncrease')}
            onClick={() => commitPause(prefs.pauseSeconds + 1)}
          >
            +
          </button>
        </div>
      </fieldset>
      <fieldset className="listen-panel">
        <legend>{t('listen.side')}</legend>
        <div className="listen-choice-row" role="radiogroup" aria-label={t('listen.side')}>
          {['front', 'back'].map((item) => (
            <button
              key={item}
              className={`btn${prefs.side === item ? ' primary' : ''}`}
              type="button"
              aria-pressed={prefs.side === item}
              onClick={() => onChange({ side: item })}
            >
              {t(item === 'front' ? 'listen.sideFront' : 'listen.sideBack')}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="listen-panel">
        <legend>{t('listen.finish')}</legend>
        <div className="listen-choice-row" role="radiogroup" aria-label={t('listen.finish')}>
          {[false, true].map((item) => (
            <button
              key={item ? 'repeat' : 'once'}
              className={`btn${prefs.loop === item ? ' primary' : ''}`}
              type="button"
              aria-pressed={prefs.loop === item}
              onClick={() => onChange({ loop: item })}
            >
              {t(item ? 'listen.repeat' : 'listen.once')}
            </button>
          ))}
        </div>
      </fieldset>
      {showAnnounce ? (
        <fieldset className="listen-panel">
          <legend>{t('listen.announce')}</legend>
          <div className="listen-choice-row" role="radiogroup" aria-label={t('listen.announce')}>
            {[true, false].map((item) => (
              <button
                key={item ? 'on' : 'off'}
                className={`btn${prefs.announce === item ? ' primary' : ''}`}
                type="button"
                aria-pressed={prefs.announce === item}
                onClick={() => onChange({ announce: item })}
              >
                {t(item ? 'listen.on' : 'listen.off')}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}
      <fieldset className="listen-panel listen-sleep-panel">
        <legend>{t('listen.sleep')}</legend>
        <div className="listen-choice-row listen-sleep-row" role="radiogroup" aria-label={t('listen.sleep')}>
          {LISTEN_SLEEP_CHOICES.map((minutes) => (
            <button
              key={minutes}
              className={`btn${prefs.sleepMinutes === minutes ? ' primary' : ''}`}
              type="button"
              aria-pressed={prefs.sleepMinutes === minutes}
              onClick={() => onChange({ sleepMinutes: minutes })}
            >
              {minutes === 0
                ? t('listen.off')
                : minutes === 60
                  ? t('listen.sleepHour')
                  : t('listen.sleepMinutes', { count: minutes })}
            </button>
          ))}
        </div>
        <p className="muted">{t('listen.sleepHint')}</p>
      </fieldset>
    </div>
  )
}
