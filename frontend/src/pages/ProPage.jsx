import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { isAdmin } from '../admin'
import {
  completeCheckout,
  isAndroidApp,
  isIosApp,
  isNativeApp,
  loadBillingStatus,
  openBillingPortal,
  restoreApplePurchases,
  restorePlayPurchases,
  startApplePurchase,
  startCheckout,
  startPlayPurchase,
  syncApplePurchases,
} from '../billing'
import { isProLicensed } from '../pro'
import { useResumeExpiredSubscription } from '../useResumeExpiredSubscription'
import { translateError } from '../i18n/errors'

export default function ProPage() {
  const { t } = useTranslation()
  const { user, setProLicensed, refresh } = useAuth()
  useResumeExpiredSubscription()
  const [error, setError] = useState('')

  async function run(work) {
    setError('')
    try {
      await work()
    } catch (err) {
      setError(err.message)
    }
  }

  const pro = isProLicensed(user)

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>{pro ? t('pro.titleAccount') : t('pro.titleUpgrade')}</h1>
          <p className="muted">{pro ? t('pro.subtitleAccount') : t('pro.subtitleUpgrade')}</p>
        </div>
      </div>
      {error ? <div className="error">{translateError(t, error)}</div> : null}
      <ProSection user={user} onError={setError} onStub={(value) => run(() => setProLicensed(value))} refresh={refresh} />
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
  const [billingError, setBillingError] = useState('')
  const [plan, setPlan] = useState('YEARLY')
  const pro = isProLicensed(user)
  const native = isNativeApp()
  const android = isAndroidApp()
  const ios = isIosApp()
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
    if (!ios || !user?.id) {
      return
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
      .catch(() => {
        // Empty until a sandbox or App Store account has a purchase.
      })
    return () => {
      cancelled = true
    }
  }, [ios, user?.id, refresh])

  useEffect(() => {
    const billingParam = searchParams.get('billing')
    const sessionId = searchParams.get('session_id')
    if (billingParam === 'canceled') {
      setNotice('')
      navigate('/pro', { replace: true })
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
          navigate('/pro', { replace: true })
        }
      })
    return () => {
      cancelled = true
    }
  }, [searchParams, navigate, onError, refresh])

  async function runBilling(work) {
    setBusy(true)
    onError('')
    setBillingError('')
    setNotice('')
    try {
      await work()
    } catch (err) {
      const message = err?.message || 'Payment failed'
      setBillingError(message)
      onError(message)
    } finally {
      setBusy(false)
    }
  }

  function buy(work) {
    return runBilling(async () => {
      const updated = await work()
      if (updated) {
        await finishPlay(updated)
      }
    })
  }

  const monthly = billing?.monthlyPrice || '$7.99'
  const yearly = billing?.yearlyPrice || '$39.99'
  const periodEnd = formatDate(billing?.currentPeriodEnd || user?.proExpiresAt, i18n.language)
  const stripeOn = Boolean(billing?.stripeEnabled)
  const playOn = Boolean(billing?.googlePlayEnabled)
  const appleOn = Boolean(billing?.appleEnabled)
  const canPay = Boolean(billing?.checkoutAllowed)
  const showSubscribe = stripeOn && !native && !pro && canPay
  const showPlaySubscribe = playOn && android && !pro && canPay
  const showAppleSubscribe = appleOn && ios && !pro && canPay
  const showComingSoon = !pro && !showSubscribe && !showPlaySubscribe && !showAppleSubscribe
  const canSubscribe = showSubscribe || showPlaySubscribe || showAppleSubscribe
  const showManage = stripeOn && !native && pro && billing?.provider === 'STRIPE'
  const showPlayManage = playOn && android && pro && billing?.provider === 'GOOGLE'
  const showAppleManage = appleOn && ios && pro && billing?.provider === 'APPLE'
  const planLabel = billing?.plan === 'YEARLY' ? t('pro.planYearly') : billing?.plan === 'MONTHLY' ? t('pro.planMonthly') : ''

  function subscribe(selected) {
    const yearlyPlan = selected === 'YEARLY'
    if (showSubscribe) {
      return runBilling(() => startCheckout(yearlyPlan ? 'YEARLY' : 'MONTHLY', '/pro'))
    }
    if (showPlaySubscribe) {
      return buy(() =>
        startPlayPurchase(
          billing,
          yearlyPlan ? billing.googleProductYearly : billing.googleProductMonthly,
          user?.id
        )
      )
    }
    if (showAppleSubscribe) {
      return buy(() =>
        startApplePurchase(yearlyPlan ? billing.appleProductYearly : billing.appleProductMonthly, user?.id)
      )
    }
    return undefined
  }

  async function finishPlay(updated) {
    if (!updated) {
      setNotice('empty')
      return
    }
    await refresh()
    const status = await loadBillingStatus()
    setBilling(status)
    setNotice('success')
  }

  const stubButton =
    admin && billing?.stubEnabled ? (
      <div className="billing-actions">
        <button className={`btn ${pro ? '' : 'primary'}`} type="button" disabled={busy} onClick={() => onStub(!pro)}>
          {pro ? t('settings.proTurnOff') : t('settings.proTurnOn')}
        </button>
      </div>
    ) : null

  return (
    <>
      {notice === 'success' ? <p className="ok">{t('settings.proThanks')}</p> : null}

      {!pro && billing?.addonCredits > 0 ? (
        <section className="card-form pro-account-card">
          <h2 className="section-heading">{t('pro.balanceTitle')}</h2>
          <p className="credit-balance-value">
            <span className="credit-balance-count">{billing.addonCredits}</span>
            {t('pro.balanceLeftLabel', { count: billing.addonCredits })}
          </p>
          <p className="muted">{t('pro.addonBalanceNote', { count: billing.addonCredits })}</p>
          <div className="billing-actions">
            <Link className="btn" to="/create-with-ai">
              {t('agent.menu')}
            </Link>
          </div>
        </section>
      ) : null}

      {!pro ? (
        <section className="card-form pro-account-card pro-upgrade-card">
          {canSubscribe ? (
            <div className="pro-offer">
              {billingError ? (
                <div className="error" role="alert">
                  {translateError(t, billingError)}
                </div>
              ) : null}
              <div className="pro-plan-list" role="radiogroup" aria-label={t('pro.planChoiceLabel')}>
                <PlanOption
                  selected={plan === 'YEARLY'}
                  badge={t('pro.bestValue')}
                  title={t('pro.planYearlyTitle')}
                  price={t('pro.yearlyPerMonth', { price: yearlyMonthlyRate(yearly) })}
                  detail={t('pro.yearlyBilled', { price: yearly })}
                  onSelect={() => setPlan('YEARLY')}
                />
                <PlanOption
                  selected={plan === 'MONTHLY'}
                  title={t('pro.planMonthlyTitle')}
                  price={monthly}
                  detail={t('pro.monthlyBilled')}
                  onSelect={() => setPlan('MONTHLY')}
                />
              </div>
              <button className="btn primary pro-offer-subscribe" type="button" disabled={busy} onClick={() => subscribe(plan)}>
                {t('pro.subscribeCta')}
              </button>
              <p className="muted pro-offer-renew">{t('pro.renewNote')}</p>
              {showPlaySubscribe ? (
                <RestorePurchases
                  busy={busy}
                  hint={t('settings.proRestoreHint')}
                  label={t('settings.proRestore')}
                  result={notice === 'empty' ? t('settings.proRestoreNone') : ''}
                  onRestore={() => runBilling(() => restorePlayPurchases(user?.id).then(finishPlay))}
                />
              ) : null}
              {showAppleSubscribe ? (
                <RestorePurchases
                  busy={busy}
                  hint={t('settings.proRestoreHint')}
                  label={t('settings.proRestore')}
                  result={notice === 'empty' ? t('settings.proRestoreNone') : ''}
                  onRestore={() => runBilling(() => restoreApplePurchases(user?.id).then(finishPlay))}
                />
              ) : null}
            </div>
          ) : null}
          {showComingSoon ? <p className="muted">{t('pro.comingSoon')}</p> : null}
          <div className="pro-benefits">
            <h2 className="pro-benefits-heading">{t('pro.benefitsHeading')}</h2>
            <ul className="pro-benefit-list">
              <BenefitItem tone="ai" title={t('pro.featureAi')} detail={t('pro.featureAiDetail')} />
              <BenefitItem tone="mix" title={t('pro.featureMix')} detail={t('pro.featureMixDetail')} />
              <BenefitItem tone="images" title={t('pro.featureImages')} detail={t('pro.featureImagesDetail')} />
              <BenefitItem
                tone="credits"
                title={t('pro.featureCredits', { count: billing?.monthlyAllowance || 10 })}
                detail={t('pro.featureCreditsDetail', { count: billing?.monthlyAllowance || 10 })}
              />
              <BenefitItem tone="devices" title={t('pro.featureDevices')} detail={t('pro.featureDevicesDetail')} />
            </ul>
          </div>
          {stubButton}
        </section>
      ) : (
        <>
          <section className="card-form pro-account-card">
            <h2 className="section-heading">{t('pro.statusTitle')}</h2>
            <p>
              {billing?.cancelAtPeriodEnd && periodEnd
                ? t('settings.proCancelScheduled', { date: periodEnd })
                : periodEnd
                  ? t('settings.proUntil', { date: periodEnd })
                  : t('pro.accountIntro')}
            </p>
            {planLabel ? <p className="muted">{planLabel}</p> : null}
            {showManage ? (
              <div className="billing-actions">
                <button className="btn" type="button" disabled={busy} onClick={() => runBilling(() => openBillingPortal())}>
                  {t('settings.proManage')}
                </button>
              </div>
            ) : null}
            {showPlayManage ? (
              <div className="billing-actions">
                <a className="btn" href="https://play.google.com/store/account/subscriptions">
                  {t('settings.proManage')}
                </a>
              </div>
            ) : null}
            {showAppleManage ? (
              <div className="billing-actions">
                <a className="btn" href="https://apps.apple.com/account/subscriptions">
                  {t('settings.proManage')}
                </a>
              </div>
            ) : null}
          </section>

          <section className="card-form pro-account-card">
            <h2 className="section-heading">{t('pro.featuresTitle')}</h2>
            <ul className="pro-feature-list">
              <FeatureItem title={t('pro.featureAi')} detail={t('pro.featureAiDetail')} />
              <FeatureItem title={t('pro.featureMix')} detail={t('pro.featureMixDetail')} />
              <FeatureItem title={t('pro.featureImages')} detail={t('pro.featureImagesDetail')} />
            </ul>
          </section>

          <section className="card-form pro-account-card">
            <h2 className="section-heading">{t('pro.balanceTitle')}</h2>
            <p className="credit-balance-value">
              <span className="credit-balance-count">{billing?.remainingCredits ?? 0}</span>
              {t('pro.balanceLeftLabel', { count: billing?.remainingCredits ?? 0 })}
            </p>
            <p className="muted">
              {billing?.addonCredits > 0
                ? t('pro.balanceBreakdownExtra', {
                    included: billing.includedCredits,
                    allowance: billing.monthlyAllowance,
                    extra: billing.addonCredits,
                  })
                : t('pro.balanceBreakdown', {
                    included: billing?.includedCredits ?? 0,
                    allowance: billing?.monthlyAllowance ?? 10,
                  })}
            </p>
            <p className="muted">{t('pro.creditRule')}</p>
            <p className="muted">{t('pro.creditReset')}</p>
            {billing?.addonEnabled && !native && canPay ? (
              <div className="billing-actions">
                <button
                  className="btn"
                  type="button"
                  disabled={busy}
                  onClick={() => runBilling(() => startCheckout('ADDON', '/pro'))}
                >
                  {t('settings.buyCredits', {
                    count: billing.addonPackCredits,
                    price: billing.addonPrice,
                  })}
                </button>
              </div>
            ) : null}
            {billing?.googleAddonEnabled && android && canPay ? (
              <div className="billing-actions">
                <button
                  className="btn"
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    buy(() => startPlayPurchase(billing, billing.googleProductAddon, user?.id))
                  }
                >
                  {t('settings.buyCredits', {
                    count: billing.addonPackCredits,
                    price: billing.addonPrice,
                  })}
                </button>
              </div>
            ) : null}
            {billing?.appleAddonEnabled && ios && canPay ? (
              <div className="billing-actions">
                <button
                  className="btn"
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    buy(() => startApplePurchase(billing.appleProductAddon, user?.id))
                  }
                >
                  {t('settings.buyCredits', {
                    count: billing.addonPackCredits,
                    price: billing.addonPrice,
                  })}
                </button>
              </div>
            ) : null}
            {stubButton}
          </section>
        </>
      )}
    </>
  )
}

function PlanOption({ selected, badge, title, price, detail, onSelect }) {
  return (
    <label className={`pro-plan-card${selected ? ' is-selected' : ''}`}>
      <input type="radio" name="pro-plan" checked={selected} onChange={onSelect} />
      <span className="pro-plan-radio" aria-hidden="true" />
      <span className="pro-plan-copy">
        {badge ? <span className="pro-plan-badge">{badge}</span> : null}
        <span className="pro-plan-title">{title}</span>
        <span className="pro-plan-price">{price}</span>
        <span className="pro-plan-detail">{detail}</span>
      </span>
    </label>
  )
}

function BenefitItem({ tone, title, detail }) {
  return (
    <li className={`pro-benefit-item pro-benefit-item-${tone}`}>
      <span className="pro-benefit-icon" aria-hidden="true">
        {benefitIcon(tone)}
      </span>
      <div>
        <strong>{title}</strong>
        <p className="muted">{detail}</p>
      </div>
    </li>
  )
}

function benefitIcon(tone) {
  if (tone === 'mix') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 3l2.2 6.4H21l-5.4 3.9 2.1 6.5L12 16.8 6.3 19.8l2.1-6.5L3 9.4h6.8L12 3z" fill="currentColor" />
      </svg>
    )
  }
  if (tone === 'images') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="8.5" cy="10" r="1.6" fill="currentColor" />
        <path d="M6 17l4.2-4.2a1.4 1.4 0 0 1 2 0L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  if (tone === 'credits') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M13 3L6 14h6l-1 7 7-11h-6l1-7z" fill="currentColor" />
      </svg>
    )
  }
  if (tone === 'devices') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="12" height="9" rx="1.6" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="10" width="7" height="10" rx="1.5" stroke="currentColor" strokeWidth="2" />
        <path d="M6 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l1.6 5h5.2l-4.2 3.1 1.6 5L12 13.8 7.8 16.1l1.6-5L5.2 8h5.2L12 3z" fill="currentColor" />
      <circle cx="19" cy="6" r="1.4" fill="currentColor" />
    </svg>
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

function RestorePurchases({ busy, hint, label, onRestore, result }) {
  return (
    <div className="restore-purchases">
      <p className="muted">{hint}</p>
      <button className="restore-purchases-link" type="button" disabled={busy} onClick={onRestore}>
        {label}
      </button>
      {result ? (
        <p className="restore-purchases-result" role="status">
          {result}
        </p>
      ) : null}
    </div>
  )
}

function FeatureItem({ title, detail }) {
  return (
    <li>
      <strong>{title}</strong>
      <p className="muted">{detail}</p>
    </li>
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
