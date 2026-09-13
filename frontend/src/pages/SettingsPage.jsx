import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { isAdmin } from '../admin'
import { completeCheckout, isNativeApp, loadBillingStatus, openBillingPortal, startCheckout } from '../billing'
import { isProLicensed } from '../pro'
import { DECK_SORTS, normalizeDeckSort } from '../deckSort'
import { RESTUDY_WAITS, STUDY_ORDERS, normalizeRestudyWait, normalizeStudyOrder } from '../studySettings'
import { LOCALES, currentLocale } from '../i18n'
import { translateError } from '../i18n/errors'

export default function SettingsPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const { user, setTheme, setLocale, setDeckSort, setStudyOrder, setRestudyWait, setProLicensed, setTeacherMode, refresh } =
    useAuth()
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

      <ProSection user={user} onError={setError} onStub={(value) => run(() => setProLicensed(value))} refresh={refresh} />

      {isAdmin(user) ? (
        <section className="card-form">
          <h2 className="section-heading">{t('settings.teacherMode')}</h2>
          <p className="muted">{t('settings.teacherModeHint')}</p>
          <div className="radio-list" role="radiogroup" aria-label={t('settings.teacherMode')}>
            <label className={`radio-row ${user?.teacherMode ? 'selected' : ''}`}>
              <input
                type="radio"
                name="teacherMode"
                value="on"
                checked={Boolean(user?.teacherMode)}
                onChange={() => run(() => setTeacherMode(true))}
              />
              {t('settings.teacherModeOn')}
            </label>
            <label className={`radio-row ${user?.teacherMode ? '' : 'selected'}`}>
              <input
                type="radio"
                name="teacherMode"
                value="off"
                checked={!user?.teacherMode}
                onChange={() => run(() => setTeacherMode(false))}
              />
              {t('settings.teacherModeOff')}
            </label>
          </div>
        </section>
      ) : null}

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

      <section className="card-form">
        <h2 className="section-heading">{t('settings.about')}</h2>
        <Link className="settings-legal-link" to="/privacy">
          {t('privacy.title')}
        </Link>
      </section>
    </div>
  )
}

function ProSection({ user, onError, onStub, refresh }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [billing, setBilling] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const pro = isProLicensed(user)
  const native = isNativeApp()
  const admin = isAdmin(user)

  useEffect(() => {
    let cancelled = false
    loadBillingStatus()
      .then((status) => {
        if (!cancelled) {
          setBilling(status)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          onError(err.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [user?.proLicensed, user?.proExpiresAt, onError])

  useEffect(() => {
    const billingParam = searchParams.get('billing')
    const sessionId = searchParams.get('session_id')
    if (billingParam === 'canceled') {
      setNotice('')
      navigate('/settings', { replace: true })
      return
    }
    if (billingParam !== 'success') {
      return
    }
    let cancelled = false
    setBusy(true)
    onError('')
    const work = sessionId ? completeCheckout(sessionId) : refresh()
    work
      .then(async () => {
        if (cancelled) {
          return
        }
        if (sessionId) {
          await refresh()
        }
        const status = await loadBillingStatus()
        if (!cancelled) {
          setBilling(status)
          setNotice('success')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          onError(err.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBusy(false)
          navigate('/settings', { replace: true })
        }
      })
    return () => {
      cancelled = true
    }
  }, [searchParams, navigate, onError, refresh])

  async function runBilling(work) {
    setBusy(true)
    onError('')
    try {
      await work()
    } catch (err) {
      onError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const monthly = billing?.monthlyPrice || '$3.99'
  const yearly = billing?.yearlyPrice || '$12.99'
  const periodEnd = formatDate(billing?.currentPeriodEnd || user?.proExpiresAt, i18n.language)
  const stripeOn = Boolean(billing?.stripeEnabled)
  const showSubscribe = stripeOn && !native && !pro
  const showManage = stripeOn && !native && pro && billing?.provider === 'STRIPE'
  const showNativeHint = native && !pro

  return (
    <section className="card-form">
      <h2 className="section-heading">{t('settings.pro')}</h2>
      {notice === 'success' ? <p className="ok">{t('settings.proThanks')}</p> : null}
      <p className="muted">
        {pro
          ? billing?.cancelAtPeriodEnd && periodEnd
            ? t('settings.proCancelScheduled', { date: periodEnd })
            : periodEnd
              ? t('settings.proUntil', { date: periodEnd })
              : t('settings.proOnHint')
          : t('settings.proOffHint')}
      </p>
      {showNativeHint ? (
        <p className="muted">
          {t('settings.proOnWeb')}{' '}
          <a href="https://zipdeck.app/settings">{t('settings.proOpenWebsite')}</a>
        </p>
      ) : null}
      {!stripeOn && !pro && !admin ? <p className="muted">{t('settings.proUnavailable')}</p> : null}
      {pro ? (
        <p className="muted">
          {billing?.addonCredits > 0
            ? t('settings.creditsWithExtra', {
                included: billing.includedCredits,
                allowance: billing.monthlyAllowance,
                extra: billing.addonCredits,
              })
            : t('settings.credits', {
                included: billing?.includedCredits ?? 0,
                allowance: billing?.monthlyAllowance ?? 40,
              })}
        </p>
      ) : null}
      {showSubscribe ? (
        <div className="billing-actions">
          <button className="btn primary" type="button" disabled={busy} onClick={() => runBilling(() => startCheckout('MONTHLY'))}>
            {t('settings.proMonthly', { price: monthly })}
          </button>
          <button className="btn primary" type="button" disabled={busy} onClick={() => runBilling(() => startCheckout('YEARLY'))}>
            {t('settings.proYearly', { price: yearly })}
          </button>
        </div>
      ) : null}
      {showManage ? (
        <div className="billing-actions">
          <button className="btn" type="button" disabled={busy} onClick={() => runBilling(() => openBillingPortal())}>
            {t('settings.proManage')}
          </button>
          {billing?.addonEnabled && !native ? (
            <button
              className="btn"
              type="button"
              disabled={busy}
              onClick={() => runBilling(() => startCheckout('ADDON', '/settings'))}
            >
              {t('settings.buyCredits', {
                count: billing.addonPackCredits,
                price: billing.addonPrice,
              })}
            </button>
          ) : null}
        </div>
      ) : null}
      {pro && billing?.addonEnabled && !native && billing?.provider !== 'STRIPE' ? (
        <div className="billing-actions">
          <button
            className="btn"
            type="button"
            disabled={busy}
            onClick={() => runBilling(() => startCheckout('ADDON', '/settings'))}
          >
            {t('settings.buyCredits', {
              count: billing.addonPackCredits,
              price: billing.addonPrice,
            })}
          </button>
        </div>
      ) : null}
      {admin && billing?.stubEnabled ? (
        <div className="billing-actions">
          <button className={`btn ${pro ? '' : 'primary'}`} type="button" disabled={busy} onClick={() => onStub(!pro)}>
            {pro ? t('settings.proTurnOff') : t('settings.proTurnOn')}
          </button>
        </div>
      ) : null}
    </section>
  )
}

function formatDate(iso, locale) {
  if (!iso) {
    return ''
  }
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) {
    return ''
  }
  try {
    return new Intl.DateTimeFormat(locale || undefined, { dateStyle: 'medium' }).format(new Date(ms))
  } catch {
    return new Date(ms).toLocaleDateString()
  }
}
