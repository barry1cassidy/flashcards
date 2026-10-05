import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { useAiCredits } from '../AiCreditsContext'
import { completeCheckout, isNativeApp, startCheckout } from '../billing'
import { isProLicensed } from '../pro'
import { useResumeExpiredSubscription } from '../useResumeExpiredSubscription'
import { translateError } from '../i18n/errors'
import LanguageSelect from './LanguageSelect'
import MenuIcon from './MenuIcon'

const POLL_MS = 500
const MAX_WAIT_MS = 5 * 60 * 1000
const MAX_PROMPT_CHARS = 2000
const MAX_FILE_BYTES = 8 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.text']
const FILE_ACCEPT = '.pdf,.docx,.txt,.text,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'
const PRESETS = [
  { id: 'speech', icon: 'speech' },
  { id: 'script', icon: 'script' },
  { id: 'cloze', icon: 'cloze' },
]

export default function AgentPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { reportCredits } = useAiCredits()
  useResumeExpiredSubscription()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState(null)
  const [groups, setGroups] = useState([])
  const [prompt, setPrompt] = useState('')
  const [presetId, setPresetId] = useState('')
  const [setId, setSetId] = useState('')
  const [frontLanguage, setFrontLanguage] = useState('')
  const [backLanguage, setBackLanguage] = useState('')
  const [upload, setUpload] = useState(null)
  const [fileError, setFileError] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [job, setJob] = useState(null)
  const [startedAt, setStartedAt] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const cancelled = useRef(false)
  const fileRef = useRef(null)
  const promptRef = useRef(null)

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
  }, [user?.proLicensed, user?.proExpiresAt])

  useEffect(() => {
    if (typeof status?.remainingCredits === 'number') {
      reportCredits(status.remainingCredits)
    }
  }, [status?.remainingCredits, reportCredits])

  useEffect(() => {
    const billingParam = searchParams.get('billing')
    const sessionId = searchParams.get('session_id')
    if (billingParam === 'canceled') {
      navigate('/create-with-ai', { replace: true })
      return
    }
    if (billingParam !== 'success') {
      return
    }
    let cancelledBilling = false
    const work = sessionId ? completeCheckout(sessionId) : Promise.resolve()
    work
      .then(() => api('/api/agent/status'))
      .then((agentStatus) => {
        if (!cancelledBilling) {
          setStatus(agentStatus)
        }
      })
      .catch((err) => {
        if (!cancelledBilling) {
          setError(err.message)
        }
      })
      .finally(() => {
        if (!cancelledBilling) {
          navigate('/create-with-ai', { replace: true })
        }
      })
    return () => {
      cancelledBilling = true
    }
  }, [searchParams, navigate])

  useEffect(() => {
    if (!busy) {
      return undefined
    }
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [busy])

  const promptOverLimit = prompt.length > MAX_PROMPT_CHARS

  function applyPreset(id) {
    const next = t(`agent.presets.${id}.prompt`)
    setPresetId(id)
    setPrompt(next)
    window.setTimeout(() => promptRef.current?.focus(), 0)
  }

  function clearPrompt() {
    setPresetId('')
    setPrompt('')
    window.setTimeout(() => promptRef.current?.focus(), 0)
  }

  function pickFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    setFileError('')
    if (!file) {
      return
    }
    const lower = file.name.toLowerCase()
    if (!ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      setUpload(null)
      setFileError(t('errors.uploadType'))
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setUpload(null)
      setFileError(t('errors.uploadTooLarge'))
      return
    }
    setUpload(file)
  }

  async function generate(event) {
    event.preventDefault()
    if (promptOverLimit || (!prompt.trim() && !upload)) {
      return
    }
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
      const body = new FormData()
      body.append('prompt', prompt)
      if (setId) {
        body.append('setId', setId)
      }
      if (frontLanguage) {
        body.append('frontLanguage', frontLanguage)
      }
      if (backLanguage) {
        body.append('backLanguage', backLanguage)
      }
      if (upload) {
        body.append('file', upload)
      }
      const started = await api('/api/agent/decks', {
        method: 'POST',
        skipSaving: true,
        body,
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
      try {
        const after = await api('/api/agent/status')
        if (!cancelled.current) {
          setStatus(after)
        }
      } catch {
        // keep the last known credit count
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
  const canUseAi = status ? !status.proRequired : pro
  const elapsed = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : job?.elapsedSeconds || 0
  const steps = job?.steps || []
  const remaining = status?.remainingCredits ?? 0
  const native = isNativeApp()
  const canBuyAddon = Boolean(status?.addonCheckoutEnabled) && !native
  const canSubmit =
    !busy && remaining > 0 && !promptOverLimit && !fileError && Boolean(prompt.trim() || upload)

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>{t('agent.title')}</h1>
          <p className="muted">{t('agent.subtitle')}</p>
        </div>
      </div>
      {error ? <div className="error">{translateError(t, error)}</div> : null}

      {status && !canUseAi ? (
        <section className="card-form agent-locked">
          <p>{t('agent.proRequired')}</p>
          <p>{t('agent.proWhy')}</p>
          <div className="agent-presets is-locked" aria-label={t('agent.presetsHeading')}>
            {PRESETS.map((preset) => (
              <div key={preset.id} className={`agent-preset agent-preset-${preset.id}`}>
                <span className="agent-preset-icon" aria-hidden="true">
                  <MenuIcon name={preset.icon} />
                </span>
                <div>
                  <strong>{t(`agent.presets.${preset.id}.title`)}</strong>
                  <p className="muted">{t(`agent.presets.${preset.id}.blurb`)}</p>
                </div>
              </div>
            ))}
          </div>
          <ul className="pro-feature-list">
            <li>{t('agent.proExample1')}</li>
            <li>{t('agent.proExample2')}</li>
            <li>{t('agent.proExample3')}</li>
          </ul>
          <Link className="btn primary" to="/pro">
            {t('pro.goToPro')}
          </Link>
        </section>
      ) : null}

      {canUseAi && status && !status.configured ? (
        <section className="card-form">
          <p>{t('agent.notConfigured')}</p>
        </section>
      ) : null}

      {canUseAi && status?.configured ? (
        <form className="card-form" onSubmit={generate}>
          <p className={remaining <= 0 ? 'credit-remaining is-empty' : 'muted'}>{creditSummary(t, status)}</p>
          {!pro ? <p className="muted">{t('agent.addonWithoutPro')}</p> : null}
          <p>{t('agent.creditCost')}</p>
          {remaining <= 0 && pro ? (
            <div className="billing-actions">
              {canBuyAddon ? (
                <button
                  className="btn primary"
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    startCheckout('ADDON', '/create-with-ai').catch((err) => setError(err.message))
                  }
                >
                  {t('agent.buyCredits', {
                    count: status.addonPackCredits,
                    price: status.addonPrice,
                  })}
                </button>
              ) : native ? (
                <Link className="btn primary" to="/pro">
                  {t('agent.buyCredits', {
                    count: status.addonPackCredits,
                    price: status.addonPrice,
                  })}
                </Link>
              ) : (
                <p>{t('agent.outOfCredits')}</p>
              )}
            </div>
          ) : null}
          <div className="agent-presets-block">
            <h2 className="section-heading">{t('agent.presetsHeading')}</h2>
            <p className="muted">{t('agent.presetsHint')}</p>
            <div className="agent-presets" role="group" aria-label={t('agent.presetsHeading')}>
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`agent-preset agent-preset-${preset.id}${presetId === preset.id ? ' selected' : ''}`}
                  disabled={busy}
                  aria-pressed={presetId === preset.id}
                  onClick={() => applyPreset(preset.id)}
                >
                  <span className="agent-preset-icon" aria-hidden="true">
                    <MenuIcon name={preset.icon} />
                  </span>
                  <span className="agent-preset-copy">
                    <strong>{t(`agent.presets.${preset.id}.title`)}</strong>
                    <span className="muted">{t(`agent.presets.${preset.id}.blurb`)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="agent-prompt-field">
            <div className="agent-prompt-heading">
              <label htmlFor="agent-prompt">{t('agent.prompt')}</label>
              {prompt ? (
                <button className="btn ghost agent-prompt-clear" type="button" disabled={busy} onClick={clearPrompt}>
                  {t('common.clear')}
                </button>
              ) : null}
            </div>
            <textarea
              id="agent-prompt"
              ref={promptRef}
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value)
                setPresetId('')
              }}
              rows={8}
              placeholder={t('agent.promptPlaceholder')}
              disabled={busy}
              className={promptOverLimit ? 'over-limit' : ''}
              aria-invalid={promptOverLimit}
              aria-describedby="agent-prompt-count"
            />
            <span id="agent-prompt-count" className={`prompt-count ${promptOverLimit ? 'over' : 'muted'}`}>
              {t('agent.promptCount', { used: prompt.length, max: MAX_PROMPT_CHARS })}
            </span>
            {promptOverLimit ? <span className="field-error">{t('agent.promptOverLimit', { max: MAX_PROMPT_CHARS })}</span> : null}
          </div>
          <div className="agent-file">
            <span className="agent-file-label">{t('agent.upload')}</span>
            <p className="muted">{t('agent.uploadHint')}</p>
            <div className="agent-file-row">
              <button className="btn" type="button" disabled={busy} onClick={() => fileRef.current?.click()}>
                {t('agent.chooseFile')}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept={FILE_ACCEPT}
                hidden
                onChange={pickFile}
              />
              {upload ? (
                <>
                  <span className="agent-file-name">
                    {upload.name} · {formatBytes(upload.size)}
                  </span>
                  <button
                    className="btn ghost"
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setUpload(null)
                      setFileError('')
                    }}
                  >
                    {t('agent.removeFile')}
                  </button>
                </>
              ) : null}
            </div>
            {fileError ? <p className="field-error">{fileError}</p> : null}
          </div>
          <div className="lang-row">
            <LanguageSelect
              id="agent-front-language"
              label={t('agent.frontLanguage')}
              value={frontLanguage}
              autoLabel={t('agent.languageAuto')}
              disabled={busy}
              onChange={setFrontLanguage}
            />
            <LanguageSelect
              id="agent-back-language"
              label={t('agent.backLanguage')}
              value={backLanguage}
              autoLabel={t('agent.languageAuto')}
              disabled={busy}
              onChange={setBackLanguage}
            />
          </div>
          <p className="muted">{t('agent.languageHint')}</p>
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
          <button className="btn primary" type="submit" disabled={!canSubmit}>
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

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
