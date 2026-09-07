import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { DECK_SORTS, normalizeDeckSort } from '../deckSort'
import {
  RESTUDY_WAITS,
  STUDY_ORDERS,
  STUDY_SCOPES,
  normalizeRestudyWait,
  normalizeStudyOrder,
  normalizeStudyScope,
} from '../studySettings'
import { LOCALES } from '../i18n'
import { translateError } from '../i18n/errors'
import ConfirmModal from './ConfirmModal'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const { user, setTheme, setLocale, setDeckSort, setStudyOrder, setStudyScope, setRestudyWait, resetDueDates } =
    useAuth()
  const [error, setError] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    if (location.hash !== '#study-options') {
      return
    }
    document.getElementById('study-options')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash])

  const theme = user?.theme === 'DARK' ? 'DARK' : 'LIGHT'
  const locale = i18n.resolvedLanguage === 'es' ? 'es' : 'en'
  const deckSort = normalizeDeckSort(user?.deckSort)
  const studyOrder = normalizeStudyOrder(user?.studyOrder)
  const studyScope = normalizeStudyScope(user?.studyScope)
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
        <div className="radio-list" role="radiogroup" aria-label={t('language.label')}>
          {LOCALES.map((option) => (
            <label key={option.code} className={`radio-row ${locale === option.code ? 'selected' : ''}`}>
              <input
                type="radio"
                name="locale"
                value={option.code}
                checked={locale === option.code}
                onChange={() => run(() => setLocale(option.code))}
              />
              {t(option.nameKey)}
            </label>
          ))}
        </div>
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

        <h3 className="settings-subhead">{t('settings.studyScope')}</h3>
        <p className="muted">{t('settings.studyScopeHint')}</p>
        <div className="radio-list" role="radiogroup" aria-label={t('settings.studyScope')}>
          {STUDY_SCOPES.map((option) => (
            <label key={option.value} className={`radio-row ${studyScope === option.value ? 'selected' : ''}`}>
              <input
                type="radio"
                name="studyScope"
                value={option.value}
                checked={studyScope === option.value}
                onChange={() => run(() => setStudyScope(option.value))}
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

        <h3 className="settings-subhead">{t('settings.resetDue')}</h3>
        <p className="muted">{t('settings.resetDueHint')}</p>
        <button className="btn" type="button" onClick={() => setConfirmReset(true)}>
          {t('settings.resetDueButton')}
        </button>
      </section>

      {confirmReset ? (
        <ConfirmModal
          title={t('settings.resetDueTitle')}
          message={t('settings.resetDueMessage')}
          confirmLabel={t('settings.resetDueConfirm')}
          onConfirm={async () => {
            setConfirmReset(false)
            await run(() => resetDueDates())
          }}
          onCancel={() => setConfirmReset(false)}
        />
      ) : null}
    </div>
  )
}
