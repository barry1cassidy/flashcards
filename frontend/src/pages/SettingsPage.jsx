import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { DECK_SORTS, normalizeDeckSort } from '../deckSort'
import { RESTUDY_WAITS, STUDY_ORDERS, normalizeRestudyWait, normalizeStudyOrder } from '../studySettings'
import { LOCALES, currentLocale } from '../i18n'
import { translateError } from '../i18n/errors'

export default function SettingsPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const { user, setTheme, setLocale, setDeckSort, setStudyOrder, setRestudyWait } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    if (location.hash !== '#study-options') {
      return
    }
    document.getElementById('study-options')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash])

  const theme = user?.theme === 'DARK' ? 'DARK' : 'LIGHT'
  const locale = currentLocale()
  const deckSort = normalizeDeckSort(user?.deckSort)
  const studyOrder = normalizeStudyOrder(user?.studyOrder)
  const restudyWait = normalizeRestudyWait(user?.restudyWait)

  async function run(work) {
    setError('')
    try {
      await work()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>{t('settings.title')}</h1>
          <p className="muted">{t('settings.subtitle')}</p>
        </div>
      </div>
      {error ? <div className="error">{translateError(t, error)}</div> : null}

      <section className="card-form">
        <h2 className="section-heading">{t('settings.appearance')}</h2>
        <p className="muted">{t('settings.appearanceHint')}</p>
        <div className="radio-list" role="radiogroup" aria-label={t('settings.appearance')}>
          <label className={`radio-row ${theme === 'LIGHT' ? 'selected' : ''}`}>
            <input type="radio" name="theme" value="LIGHT" checked={theme === 'LIGHT'} onChange={() => run(() => setTheme('LIGHT'))} />
            {t('theme.light')}
          </label>
          <label className={`radio-row ${theme === 'DARK' ? 'selected' : ''}`}>
            <input type="radio" name="theme" value="DARK" checked={theme === 'DARK'} onChange={() => run(() => setTheme('DARK'))} />
            {t('theme.dark')}
          </label>
        </div>
      </section>

      <section className="card-form">
        <h2 className="section-heading">{t('language.label')}</h2>
        <p className="muted">{t('settings.languageHint')}</p>
        <label className="locale-select">
          <select
            value={locale}
            aria-label={t('language.label')}
            onChange={(event) => run(() => setLocale(event.target.value))}
          >
            {LOCALES.map((option) => (
              <option key={option.code} value={option.code}>
                {option.nativeName}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="card-form">
        <h2 className="section-heading">{t('settings.sortDecks')}</h2>
        <p className="muted">{t('settings.sortHint')}</p>
        <div className="radio-list" role="radiogroup" aria-label={t('settings.sortDecks')}>
          {DECK_SORTS.map((option) => (
            <label key={option.value} className={`radio-row ${deckSort === option.value ? 'selected' : ''}`}>
              <input
                type="radio"
                name="deckSort"
                value={option.value}
                checked={deckSort === option.value}
                onChange={() => run(() => setDeckSort(option.value))}
              />
              {t(option.labelKey)}
            </label>
          ))}
        </div>
      </section>

      <section className="card-form" id="study-options">
        <h2 className="section-heading">{t('settings.studyOptions')}</h2>
        <p className="muted">{t('settings.studyOptionsHint')}</p>

        <h3 className="settings-subhead">{t('settings.studyOrder')}</h3>
        <p className="muted">{t('settings.studyOrderHint')}</p>
        <div className="radio-list" role="radiogroup" aria-label={t('settings.studyOrder')}>
          {STUDY_ORDERS.map((option) => (
            <label key={option.value} className={`radio-row ${studyOrder === option.value ? 'selected' : ''}`}>
              <input
                type="radio"
                name="studyOrder"
                value={option.value}
                checked={studyOrder === option.value}
                onChange={() => run(() => setStudyOrder(option.value))}
              />
              {t(option.labelKey)}
            </label>
          ))}
        </div>

        <h3 className="settings-subhead">{t('settings.restudyWait')}</h3>
        <p className="muted">{t('settings.restudyWaitHint')}</p>
        <div className="radio-list" role="radiogroup" aria-label={t('settings.restudyWait')}>
          {RESTUDY_WAITS.map((option) => (
            <label key={option.value} className={`radio-row ${restudyWait === option.value ? 'selected' : ''}`}>
              <input
                type="radio"
                name="restudyWait"
                value={option.value}
                checked={restudyWait === option.value}
                onChange={() => run(() => setRestudyWait(option.value))}
              />
              {t(option.labelKey)}
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}
