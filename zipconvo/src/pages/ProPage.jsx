import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth'
import {
  isAndroidApp,
  isIosApp,
  isNativeApp,
  loadBillingStatus,
  restoreApplePurchases,
  restorePlayPurchases,
  startApplePurchase,
  startPlayPurchase,
  syncApplePurchases,
} from '../billing'
import { translateError } from '../i18n/errors'
import { isProLicensed } from '../pro'

export default function ProPage() {
  const { t, i18n } = useTranslation()
  const { user, refresh } = useAuth()
  const [billing, setBilling] = useState(null)
  const [plan, setPlan] = useState('YEARLY')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const pro = isProLicensed(user)
  const android = isAndroidApp()
  const ios = isIosApp()
  const native = isNativeApp()

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
          setError(err.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [user?.proLicensed, user?.proExpiresAt])

  useEffect(() => {
    if (!ios || !user?.id) {
      return undefined
    }
    let cancelled = false
    syncApplePurchases(user.id)
      .then(async (updated) => {
        if (cancelled || !updated) {
          return
        }
        await refresh()
        const status = await loadBillingStatus()
        if (!cancelled) {
          setBilling(status)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [ios, user?.id, refresh])

  const monthly = billing?.monthlyPrice || '$5.99'
  const yearly = billing?.yearlyPrice || '$39.99'
  const playOn = Boolean(billing?.googlePlayEnabled)
  const appleOn = Boolean(billing?.appleEnabled)
  const showPlay = playOn && android && !pro
  const showApple = appleOn && ios && !pro
  const canSubscribe = showPlay || showApple
  const periodEnd = formatDate(billing?.currentPeriodEnd || user?.proExpiresAt, i18n.language)
  const planLabel = billing?.plan === 'YEARLY' ? t('pro.planYearly') : billing?.plan === 'MONTHLY' ? t('pro.planMonthly') : ''

  async function run(work) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const updated = await work()
      if (updated === 'cancel') {
        return
      }
      if (updated) {
        await refresh()
        setBilling(await loadBillingStatus())
        setNotice('success')
      } else {
        setNotice('empty')
      }
    } catch (err) {
      setError(err?.message || 'Payment failed')
    } finally {
      setBusy(false)
    }
  }

  function subscribe() {
    const yearlyPlan = plan === 'YEARLY'
    if (showPlay) {
      return run(async () => {
        const updated = await startPlayPurchase(
          billing,
          yearlyPlan ? billing.googleProductYearly : billing.googleProductMonthly,
          user?.id,
        )
        return updated === null ? 'cancel' : updated
      })
    }
    if (showApple) {
      return run(async () => {
        const updated = await startApplePurchase(
          yearlyPlan ? billing.appleProductYearly : billing.appleProductMonthly,
          user?.id,
        )
        return updated === null ? 'cancel' : updated
      })
    }
    return undefined
  }

  return (
    <main className="screen">
      <div className="screen-copy">
        <h1 className="start-title">{pro ? t('pro.titleAccount') : t('pro.titleUpgrade')}</h1>
        <p>{pro ? t('pro.subtitleAccount') : t('pro.subtitleUpgrade')}</p>
      </div>
      {error ? <p className="error">{translateError(error)}</p> : null}
      {notice === 'success' ? <p className="ok">{t('pro.thanks')}</p> : null}

      {!pro && canSubscribe ? (
        <section className="pro-offer">
          <div className="pro-plan-list" role="radiogroup" aria-label={t('pro.planChoiceLabel')}>
            <button
              className={`pro-plan${plan === 'YEARLY' ? ' is-on' : ''}`}
              type="button"
              role="radio"
              aria-checked={plan === 'YEARLY'}
              onClick={() => setPlan('YEARLY')}
            >
              <span className="pro-plan-badge">{t('pro.bestValue')}</span>
              <strong>{t('pro.planYearlyTitle')}</strong>
              <span>{t('pro.yearlyPrice', { price: yearly })}</span>
              <small>{t('pro.yearlyPerMonth', { price: yearlyMonthlyRate(yearly) })}</small>
            </button>
            <button
              className={`pro-plan${plan === 'MONTHLY' ? ' is-on' : ''}`}
              type="button"
              role="radio"
              aria-checked={plan === 'MONTHLY'}
              onClick={() => setPlan('MONTHLY')}
            >
              <strong>{t('pro.planMonthlyTitle')}</strong>
              <span>{monthly}</span>
              <small>{t('pro.monthlyBilled')}</small>
            </button>
          </div>
          <button className="btn email" type="button" disabled={busy} onClick={subscribe}>
            {t('pro.subscribeCta')}
          </button>
          <p className="card-meta">{t('pro.renewNote')}</p>
          <button
            className="btn google"
            type="button"
            disabled={busy}
            onClick={() =>
              run(() => (showPlay ? restorePlayPurchases(user?.id) : restoreApplePurchases(user?.id)))
            }
          >
            {t('pro.restore')}
          </button>
          <p className="card-meta">{t('pro.restoreHint')}</p>
          {notice === 'empty' ? <p className="card-meta">{t('pro.restoreNone')}</p> : null}
        </section>
      ) : null}

      {!pro && !canSubscribe ? <p className="card-meta">{native ? t('pro.comingSoon') : t('pro.appOnly')}</p> : null}

      {pro ? (
        <section className="pro-card">
          <h2>{t('pro.statusTitle')}</h2>
          <p>
            {billing?.cancelAtPeriodEnd && periodEnd
              ? t('pro.cancelScheduled', { date: periodEnd })
              : periodEnd
                ? t('pro.until', { date: periodEnd })
                : t('pro.accountIntro')}
          </p>
          {planLabel ? <p className="card-meta">{planLabel}</p> : null}
          {billing?.provider === 'GOOGLE' ? (
            <a className="btn google" href="https://play.google.com/store/account/subscriptions">
              {t('pro.manage')}
            </a>
          ) : null}
          {billing?.provider === 'APPLE' ? (
            <a className="btn google" href="https://apps.apple.com/account/subscriptions">
              {t('pro.manage')}
            </a>
          ) : null}
          <h2>{t('pro.balanceTitle')}</h2>
          <p className="pro-credit-count">{billing?.remainingCredits ?? 0}</p>
          <p className="card-meta">
            {billing?.addonCredits > 0
              ? t('pro.balanceExtra', {
                  included: billing.includedCredits,
                  extra: billing.addonCredits,
                })
              : t('pro.balanceIncluded', {
                  included: billing?.includedCredits ?? 0,
                  allowance: billing?.monthlyAllowance ?? 20,
                })}
          </p>
          {billing?.googleAddonEnabled && android ? (
            <button
              className="btn email"
              type="button"
              disabled={busy}
              onClick={() => run(() => startPlayPurchase(billing, billing.googleProductAddon, user?.id))}
            >
              {t('pro.buyCredits', { count: billing.addonPackCredits, price: billing.addonPrice })}
            </button>
          ) : null}
          {billing?.appleAddonEnabled && ios ? (
            <button
              className="btn email"
              type="button"
              disabled={busy}
              onClick={() => run(() => startApplePurchase(billing.appleProductAddon, user?.id))}
            >
              {t('pro.buyCredits', { count: billing.addonPackCredits, price: billing.addonPrice })}
            </button>
          ) : null}
        </section>
      ) : (
        <section className="pro-card">
          <h2>{t('pro.benefitsHeading')}</h2>
          <p>
            <strong>{t('pro.featureGenerate')}</strong>
          </p>
          <p className="card-meta">{t('pro.featureGenerateDetail')}</p>
          <p>
            <strong>{t('pro.featureCredits', { count: billing?.monthlyAllowance || 20 })}</strong>
          </p>
          <p className="card-meta">{t('pro.featureCreditsDetail', { count: billing?.monthlyAllowance || 20 })}</p>
          <p>
            <strong>{t('pro.featureShared')}</strong>
          </p>
          <p className="card-meta">{t('pro.featureSharedDetail')}</p>
        </section>
      )}
    </main>
  )
}

function yearlyMonthlyRate(yearlyDisplay) {
  const match = String(yearlyDisplay || '').match(/([^\d.-]*)(\d+(?:\.\d+)?)/)
  if (!match) {
    return yearlyDisplay
  }
  const amount = Number(match[2]) / 12
  if (!Number.isFinite(amount)) {
    return yearlyDisplay
  }
  return `${match[1] || '$'}${amount.toFixed(2)}`
}

function formatDate(value, language) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return new Intl.DateTimeFormat(language || undefined, { dateStyle: 'medium' }).format(date)
}
