import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { isAdmin } from '../admin'
import { completeCheckout, isAndroidApp, isNativeApp, loadBillingStatus, openBillingPortal, restorePlayPurchases, startCheckout, startPlayPurchase } from '../billing'
import { isProLicensed } from '../pro'
import { translateError } from '../i18n/errors'

export default function ProPage() {
  const { t } = useTranslation()
  const { user, setProLicensed, refresh } = useAuth()
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
  const pro = isProLicensed(user)
  const native = isNativeApp()
  const android = isAndroidApp()
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
    try {
      await work()
    } catch (err) {
      onError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const monthly = billing?.monthlyPrice || '$7.99'
  const yearly = billing?.yearlyPrice || '$39.99'
  const periodEnd = formatDate(billing?.currentPeriodEnd || user?.proExpiresAt, i18n.language)
  const stripeOn = Boolean(billing?.stripeEnabled)
  const playOn = Boolean(billing?.googlePlayEnabled)
  const canPay = Boolean(billing?.publicCheckout) || admin
  const showSubscribe = stripeOn && !native && !pro && canPay
  const showPlaySubscribe = playOn && android && !pro
  const showComingSoon = !pro && !showSubscribe && !showPlaySubscribe
  const showManage = stripeOn && !native && pro && billing?.provider === 'STRIPE'
  const showPlayManage = playOn && android && pro && billing?.provider === 'GOOGLE'
  const planLabel = billing?.plan === 'YEARLY' ? t('pro.planYearly') : billing?.plan === 'MONTHLY' ? t('pro.planMonthly') : ''

  async function finishPlay(updated) {
    if (!updated) {
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

      {!pro ? (
        <section className="card-form pro-account-card">
          <h2 className="section-heading">{t('pro.featuresTitle')}</h2>
          <ul className="pro-feature-list">
            <FeatureItem title={t('pro.featureAi')} detail={t('pro.featureAiDetail')} />
            <FeatureItem title={t('pro.featureMix')} detail={t('pro.featureMixDetail')} />
            <FeatureItem title={t('pro.featureImages')} detail={t('pro.featureImagesDetail')} />
            <FeatureItem
              title={t('pro.featureCredits', { count: billing?.monthlyAllowance || 10 })}
              detail={t('pro.featureCreditsDetail', { count: billing?.monthlyAllowance || 10 })}
            />
            <FeatureItem title={t('pro.featureDevices')} detail={t('pro.featureDevicesDetail')} />
          </ul>
          <p className="muted">{t('pro.priceBlurb', { monthly, yearly })}</p>
          {showComingSoon ? <p className="muted">{t('pro.comingSoon')}</p> : null}
          {showSubscribe ? (
            <div className="billing-actions">
              <button className="btn primary" type="button" disabled={busy} onClick={() => runBilling(() => startCheckout('MONTHLY', '/pro'))}>
                {t('settings.proMonthly', { price: monthly })}
              </button>
              <button className="btn primary" type="button" disabled={busy} onClick={() => runBilling(() => startCheckout('YEARLY', '/pro'))}>
                {t('settings.proYearly', { price: yearly })}
              </button>
            </div>
          ) : null}
          {showPlaySubscribe ? (
            <div className="billing-actions">
              <button
                className="btn primary"
                type="button"
                disabled={busy}
                onClick={() =>
                  runBilling(() =>
                    startPlayPurchase(billing, billing.googleProductMonthly, user?.id).then(finishPlay)
                  )
                }
              >
                {t('settings.proMonthly', { price: monthly })}
              </button>
              <button
                className="btn primary"
                type="button"
                disabled={busy}
                onClick={() =>
                  runBilling(() =>
                    startPlayPurchase(billing, billing.googleProductYearly, user?.id).then(finishPlay)
                  )
                }
              >
                {t('settings.proYearly', { price: yearly })}
              </button>
              <button className="btn" type="button" disabled={busy} onClick={() => runBilling(() => restorePlayPurchases(user?.id).then(finishPlay))}>
                {t('settings.proRestore')}
              </button>
            </div>
          ) : null}
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
                <button className="btn" type="button" disabled={busy} onClick={() => runBilling(() => restorePlayPurchases(user?.id).then(finishPlay))}>
                  {t('settings.proRestore')}
                </button>
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
            {billing?.googleAddonEnabled && android ? (
              <div className="billing-actions">
                <button
                  className="btn"
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    runBilling(() =>
                      startPlayPurchase(billing, billing.googleProductAddon, user?.id).then(finishPlay)
                    )
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
