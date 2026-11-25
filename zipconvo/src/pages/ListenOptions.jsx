import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LISTEN_PAUSE_MAX,
  LISTEN_PAUSE_MIN,
  LISTEN_SLEEP_CHOICES,
  clampListenPause,
  formatListenRate,
  stepListenRate,
} from '../listenPrefs'

export function listenPrefsSummary(prefs, t) {
  const sleep =
    prefs.sleepMinutes === 0
      ? t('listen.sleepOff')
      : prefs.sleepMinutes === 60
        ? t('settings.hour')
        : t('settings.minutes', { count: prefs.sleepMinutes })
  const parts = [
    t('listen.pauseSummary', { count: prefs.pauseSeconds }),
    t(prefs.side === 'back' ? 'settings.line' : 'settings.meaning'),
    t(prefs.loop ? 'settings.repeat' : 'settings.once'),
    t('listen.speedValue', { rate: formatListenRate(prefs.rate) }),
  ]
  if (prefs.questionTwice) {
    parts.push(t('listen.meaningTwiceSummary'))
  }
  if (prefs.answerTwice) {
    parts.push(t('listen.lineTwiceSummary'))
  }
  parts.push(sleep)
  return parts.join(' · ')
}

export function ListenOptionsToggle({ open, onToggle, summary }) {
  const { t } = useTranslation()
  return (
    <button
      className={`listen-options-toggle${open ? ' is-open' : ''}`}
      type="button"
      aria-expanded={open}
      onClick={onToggle}
    >
      <span className="listen-options-copy">
        <span>{open ? t('listen.optionsHide') : t('listen.options')}</span>
        <span className="listen-options-summary">{summary}</span>
      </span>
      <span className="listen-options-chevron" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </button>
  )
}

function PausePanel({ prefs, onChange }) {
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
    <fieldset className="listen-panel">
      <legend>{t('settings.pause')}</legend>
      <div className="listen-stepper">
        <button type="button" aria-label={t('settings.shorterPause')} onClick={() => commitPause(prefs.pauseSeconds - 1)}>
          −
        </button>
        <label className="listen-stepper-value">
          <input
            inputMode="numeric"
            min={LISTEN_PAUSE_MIN}
            max={LISTEN_PAUSE_MAX}
            aria-label={t('settings.pause')}
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
          <span>{t('settings.seconds')}</span>
        </label>
        <button type="button" aria-label={t('settings.longerPause')} onClick={() => commitPause(prefs.pauseSeconds + 1)}>
          +
        </button>
      </div>
    </fieldset>
  )
}

function ChoiceRow({ label, value, options, onChange }) {
  return (
    <fieldset className="listen-panel">
      <legend>{label}</legend>
      <div className="filters" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.id}
            className={value === option.id ? 'is-on' : ''}
            type="button"
            role="radio"
            aria-checked={value === option.id}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export default function ListenOptions({ prefs, onChange }) {
  const { t } = useTranslation()

  function sleepLabel(minutes) {
    if (minutes === 0) {
      return t('settings.off')
    }
    if (minutes === 60) {
      return t('settings.hour')
    }
    return t('settings.minutes', { count: minutes })
  }

  return (
    <div className="listen-setup-grid">
      <PausePanel prefs={prefs} onChange={onChange} />
      <ChoiceRow
        label={t('settings.playFirst')}
        value={prefs.side === 'back' ? 'back' : 'front'}
        options={[
          { id: 'front', label: t('settings.meaning') },
          { id: 'back', label: t('settings.line') },
        ]}
        onChange={(side) => onChange({ side })}
      />
      <ChoiceRow
        label={t('settings.whenFinishes')}
        value={prefs.loop ? 'repeat' : 'once'}
        options={[
          { id: 'once', label: t('settings.once') },
          { id: 'repeat', label: t('settings.repeat') },
        ]}
        onChange={(value) => onChange({ loop: value === 'repeat' })}
      />
      <fieldset className="listen-panel">
        <legend>{t('settings.speed')}</legend>
        <div className="listen-stepper">
          <button
            type="button"
            aria-label={t('settings.slower')}
            disabled={prefs.rate <= 0.5}
            onClick={() => onChange({ rate: stepListenRate(prefs.rate, -1) })}
          >
            −
          </button>
          <strong>{t('listen.speedValue', { rate: formatListenRate(prefs.rate) })}</strong>
          <button
            type="button"
            aria-label={t('settings.faster')}
            disabled={prefs.rate >= 1.25}
            onClick={() => onChange({ rate: stepListenRate(prefs.rate, 1) })}
          >
            +
          </button>
        </div>
      </fieldset>
      <fieldset className="listen-panel">
        <legend>{t('settings.stopAfter')}</legend>
        <div className="filters" role="radiogroup" aria-label={t('settings.stopAfter')}>
          {LISTEN_SLEEP_CHOICES.map((minutes) => (
            <button
              key={minutes}
              className={prefs.sleepMinutes === minutes ? 'is-on' : ''}
              type="button"
              role="radio"
              aria-checked={prefs.sleepMinutes === minutes}
              onClick={() => onChange({ sleepMinutes: minutes })}
            >
              {sleepLabel(minutes)}
            </button>
          ))}
        </div>
        <p className="listen-options-summary">{t('listen.sleepHint')}</p>
      </fieldset>
      <ChoiceRow
        label={t('settings.meaningTwice')}
        value={prefs.questionTwice ? 'on' : 'off'}
        options={[
          { id: 'on', label: t('settings.on') },
          { id: 'off', label: t('settings.off') },
        ]}
        onChange={(value) => onChange({ questionTwice: value === 'on' })}
      />
      <ChoiceRow
        label={t('settings.lineTwice')}
        value={prefs.answerTwice ? 'on' : 'off'}
        options={[
          { id: 'on', label: t('settings.on') },
          { id: 'off', label: t('settings.off') },
        ]}
        onChange={(value) => onChange({ answerTwice: value === 'on' })}
      />
    </div>
  )
}
