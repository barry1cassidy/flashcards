import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { completeCheckout, isNativeApp, startCheckout } from '../billing'
import { isProLicensed } from '../pro'
import { translateError } from '../i18n/errors'

const POLL_MS = 500
const MAX_WAIT_MS = 5 * 60 * 1000

export default function AgentPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState(null)
  const [groups, setGroups] = useState([])
  const [prompt, setPrompt] = useState('')
  const [setId, setSetId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [job, setJob] = useState(null)
  const [startedAt, setStartedAt] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const cancelled = useRef(false)

  useEffect(() => {
    cancelled.current = false
    return () => {
      cancelled.current = true
    }
  }, [])

  useEffect(() => {
    Promise.all([api('/api/agent/status'), api('/api/groups')])
      .then(([agentStatus, groupData]) => {
        setStatus(agentStatus)
        setGroups(groupData)
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    const billingParam = searchParams.get('billing')
    const sessionId = searchParams.get('session_id')
    if (billingParam === 'canceled') {
      navigate('/agent', { replace: true })
      return
    }
    if (billingParam !== 'success') {
      return
    }
    let cancelled = false
    const work = sessionId ? completeCheckout(sessionId) : Promise.resolve()
    work
      .then(() => api('/api/agent/status'))
      .then((agentStatus) => {
        if (!cancelled) {
          setStatus(agentStatus)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          navigate('/agent', { replace: true })
        }
      })
    return () => {
      cancelled = true
    }
  }, [searchParams, navigate])

  useEffect(() => {
    if (!busy) {
      return undefined
    }
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [busy])

  async function generate(event) {
    event.preventDefault()
    setError('')
    setJob(null)
    setBusy(true)
    setStartedAt(Date.now())
    setNow(Date.now())
    setJob({
      state: 'running',
      steps: [{ code: 'starting', detail: null, at: new Date().toISOString() }],
      error: null,
      result: null,
    })
    try {
      const started = await api('/api/agent/decks', {
        method: 'POST',
        skipSaving: true,
        body: JSON.stringify({
          prompt,
          setId: setId || null,
        }),
      })
      if (cancelled.current) {
        return
      }
      if (started.deckId && !started.jobId) {
        navigate(`/decks/${started.deckId}`)
        return
      }
      if (!started.jobId) {
        throw new Error('AI request failed')
      }
      setJob(started)
      const latest = await api('/api/agent/status')
      if (!cancelled.current) {
        setStatus(latest)
      }
      const current = await pollJob(started.jobId)
      if (!current || cancelled.current) {
        return
      }
      if (current.state === 'done' && current.result?.deckId) {
        navigate(`/decks/${current.result.deckId}`)
        return
      }
      setError(current.error || current.result?.message || t('errors.requestFailed'))
    } catch (err) {
      if (!cancelled.current) {
        setError(err.message)
      }
    } finally {
      if (!cancelled.current) {
        setBusy(false)
      }
    }
  }

  async function pollJob(jobId) {
    const deadline = Date.now() + MAX_WAIT_MS
    while (!cancelled.current) {
      const current = await api(`/api/agent/jobs/${jobId}`)
      if (cancelled.current) {
        return null
      }
      setJob(current)
      if (current.state !== 'running') {
        return current
      }
      if (Date.now() > deadline) {
        throw new Error('Timed out waiting for AI')
      }
      await sleep(POLL_MS)
    }
    return null
  }

  const pro = isProLicensed(user)
  const elapsed = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : job?.elapsedSeconds || 0
  const steps = job?.steps || []
  const remaining = status?.remainingCredits ?? 0
  const canBuyAddon = Boolean(status?.addonCheckoutEnabled) && !isNativeApp()

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>{t('agent.title')}</h1>
          <p className="muted">{t('agent.subtitle')}</p>
        </div>
      </div>
      {error ? <div className="error">{translateError(t, error)}</div> : null}

      {!pro ? (
        <section className="card-form">
          <p>{t('agent.proRequired')}</p>
          <Link className="btn primary" to="/settings">
            {t('agent.goToSettings')}
          </Link>
        </section>
      ) : null}

      {pro && status && !status.configured ? (
        <section className="card-form">
          <p>{t('agent.notConfigured')}</p>
        </section>
      ) : null}

      {pro && status?.configured ? (
        <form className="card-form" onSubmit={generate}>
          <p className="muted">{creditSummary(t, status)}</p>
          {remaining <= 0 ? (
            <div className="billing-actions">
              {canBuyAddon ? (
                <button
                  className="btn primary"
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    startCheckout('ADDON', '/agent').catch((err) => setError(err.message))
                  }
                >
                  {t('agent.buyCredits', {
                    count: status.addonPackCredits,
                    price: status.addonPrice,
                  })}
                </button>
              ) : (
                <p>{t('agent.outOfCredits')}</p>
              )}
            </div>
          ) : null}
          <label>
            {t('agent.prompt')}
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              required
              maxLength={2000}
              rows={6}
              placeholder={t('agent.promptPlaceholder')}
              disabled={busy}
            />
          </label>
          <label>
            {t('agent.set')}
            <select value={setId} onChange={(event) => setSetId(event.target.value)} disabled={busy}>
              <option value="">{t('agent.noSet')}</option>
              {groups.map((group) => (
                <option key={group.id} value={String(group.id)}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <p className="muted">{t('agent.waitHint')}</p>
          <button className="btn primary" type="submit" disabled={busy || !prompt.trim() || remaining <= 0}>
            {busy ? t('agent.generating') : t('agent.generate')}
          </button>
          {busy || steps.length > 0 ? (
            <div className="agent-progress" aria-live="polite">
              <div className="agent-progress-meta">
                <strong>
                  {busy
                    ? t('agent.working', { seconds: elapsed })
                    : error
                      ? t('agent.failed')
                      : t('agent.finished')}
                </strong>
              </div>
              {busy && elapsed >= 45 ? <p className="muted">{t('agent.stillWaiting')}</p> : null}
              {steps.length > 0 ? (
                <ol>
                  {steps.map((step, index) => (
                    <li
                      key={`${step.code}-${step.at}-${index}`}
                      aria-current={busy && index === steps.length - 1 ? 'true' : undefined}
                    >
                      <span>{t(`agent.step.${step.code}`, { defaultValue: step.code })}</span>
                      {step.detail ? <span className="muted"> {step.detail}</span> : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="muted">{t('agent.step.starting')}</p>
              )}
            </div>
          ) : null}
        </form>
      ) : null}
    </div>
  )
}

function creditSummary(t, status) {
  if (!status) {
    return ''
  }
  if (status.addonCredits > 0) {
    return t('agent.remainingWithExtra', {
      included: status.includedCredits,
      allowance: status.monthlyAllowance,
      extra: status.addonCredits,
      total: status.remainingCredits,
    })
  }
  return t('agent.remaining', {
    included: status.includedCredits,
    allowance: status.monthlyAllowance,
  })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
