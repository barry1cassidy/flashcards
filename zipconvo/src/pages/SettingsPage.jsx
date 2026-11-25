import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import ChoiceMenu from '../ChoiceMenu'
import { LOCALES, normalizeLocale } from '../i18n'
import { translateError } from '../i18n/errors'
import {
  LISTEN_SLEEP_CHOICES,
  clampListenPause,
  formatListenRate,
  listenPrefsFromUser,
  listenPrefsToApi,
  stepListenRate,
} from '../listenPrefs'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, patchMe } = useAuth()
  const [error, setError] = useState('')
  const theme = user?.theme === 'LIGHT' ? 'LIGHT' : 'DARK'
  const locale = normalizeLocale(user?.locale)
  const prefs = listenPrefsFromUser(user)

  async function save(body) {
    setError('')
    try {
      await patchMe(body)
    } catch (err) {
      setError(err.message)
    }
  }

  function savePrefs(partial) {
    return save(listenPrefsToApi({ ...prefs, ...partial }))
  }

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
    <main className="screen settings">
      <button className="back" type="button" onClick={() => navigate('/me')}>
        {t('back')}
      </button>
      <div className="screen-copy">
        <h1>{t('settings.title')}</h1>
        <p>{t('settings.lede')}</p>
      </div>
      {error ? <p className="error">{translateError(error)}</p> : null}

      <section className="settings-card">
        <h2>{t('settings.appearance')}</h2>
        <div className="settings-pad">
          <Segment label={t('settings.appearance')} wide>
            <SegmentOption on={theme === 'LIGHT'} onClick={() => save({ theme: 'LIGHT' })}>
              {t('settings.light')}
            </SegmentOption>
            <SegmentOption on={theme === 'DARK'} onClick={() => save({ theme: 'DARK' })}>
              {t('settings.dark')}
            </SegmentOption>
          </Segment>
        </div>
      </section>

      <section className="settings-card">
        <h2>{t('settings.language')}</h2>
        <p className="settings-hint">{t('settings.languageHint')}</p>
        <div className="settings-pad">
          <ChoiceMenu
            id="settings-language"
            label={t('settings.accountLanguage')}
            value={locale}
            options={LOCALES.map((item) => ({ value: item.code, label: item.nativeName }))}
            onChange={(next) => save({ locale: next })}
          />
        </div>
      </section>

      <section className="settings-card">
        <h2>{t('settings.listening')}</h2>
        <p className="settings-hint">{t('settings.listeningHint')}</p>

        <div className="settings-row">
          <span>{t('settings.pause')}</span>
          <Stepper
            value={`${clampListenPause(prefs.pauseSeconds)} ${t('settings.seconds')}`}
            downLabel={t('settings.shorterPause')}
            upLabel={t('settings.longerPause')}
            onDown={() => savePrefs({ pauseSeconds: prefs.pauseSeconds - 1 })}
            onUp={() => savePrefs({ pauseSeconds: prefs.pauseSeconds + 1 })}
          />
        </div>

        <div className="settings-row">
          <span>{t('settings.playFirst')}</span>
          <Segment label={t('settings.playFirst')}>
            <SegmentOption on={prefs.side !== 'back'} onClick={() => savePrefs({ side: 'front' })}>
              {t('settings.meaning')}
            </SegmentOption>
            <SegmentOption on={prefs.side === 'back'} onClick={() => savePrefs({ side: 'back' })}>
              {t('settings.line')}
            </SegmentOption>
          </Segment>
        </div>

        <div className="settings-row">
          <span>{t('settings.speed')}</span>
          <Stepper
            value={formatListenRate(prefs.rate)}
            downLabel={t('settings.slower')}
            upLabel={t('settings.faster')}
            downDisabled={prefs.rate <= 0.5}
            upDisabled={prefs.rate >= 1.25}
            onDown={() => savePrefs({ rate: stepListenRate(prefs.rate, -1) })}
            onUp={() => savePrefs({ rate: stepListenRate(prefs.rate, 1) })}
          />
        </div>

        <div className="settings-row">
          <span>{t('settings.meaningTwice')}</span>
          <Switch on={prefs.questionTwice} label={t('settings.meaningTwice')} onClick={() => savePrefs({ questionTwice: !prefs.questionTwice })} />
        </div>

        <div className="settings-row">
          <span>{t('settings.lineTwice')}</span>
          <Switch on={prefs.answerTwice} label={t('settings.lineTwice')} onClick={() => savePrefs({ answerTwice: !prefs.answerTwice })} />
        </div>

        <div className="settings-row">
          <span>{t('settings.whenFinishes')}</span>
          <Segment label={t('settings.whenFinishes')}>
            <SegmentOption on={!prefs.loop} onClick={() => savePrefs({ loop: false })}>
              {t('settings.once')}
            </SegmentOption>
            <SegmentOption on={prefs.loop} onClick={() => savePrefs({ loop: true })}>
              {t('settings.repeat')}
            </SegmentOption>
          </Segment>
        </div>

        <div className="settings-row settings-stack">
          <span>{t('settings.stopAfter')}</span>
          <div className="chip-row" role="radiogroup" aria-label={t('settings.stopAfter')}>
            {LISTEN_SLEEP_CHOICES.map((minutes) => (
              <button
                key={minutes}
                className={prefs.sleepMinutes === minutes ? 'is-on' : ''}
                type="button"
                role="radio"
                aria-checked={prefs.sleepMinutes === minutes}
                onClick={() => savePrefs({ sleepMinutes: minutes })}
              >
                {sleepLabel(minutes)}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function Segment({ label, wide = false, children }) {
  return (
    <div className={`segment${wide ? ' is-wide' : ''}`} role="radiogroup" aria-label={label}>
      {children}
    </div>
  )
}

function SegmentOption({ on, onClick, children }) {
  return (
    <button className={on ? 'is-on' : ''} type="button" role="radio" aria-checked={on} onClick={onClick}>
      {children}
    </button>
  )
}

function Switch({ on, label, onClick }) {
  return (
    <button className={`switch${on ? ' is-on' : ''}`} type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick}>
      <span />
    </button>
  )
}

function Stepper({ value, downLabel, upLabel, downDisabled = false, upDisabled = false, onDown, onUp }) {
  return (
    <div className="stepper">
      <button type="button" aria-label={downLabel} disabled={downDisabled} onClick={onDown}>
        −
      </button>
      <strong>{value}</strong>
      <button type="button" aria-label={upLabel} disabled={upDisabled} onClick={onUp}>
        +
      </button>
    </div>
  )
}
