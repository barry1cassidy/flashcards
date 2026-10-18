import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { useAiCredits } from '../AiCreditsContext'
import { isProLicensed } from '../pro'
import { translateError } from '../i18n/errors'
import MenuIcon from './MenuIcon'
import Modal from './Modal'

const POLL_MS = 500
const POLL_TIMEOUT_MS = 3000
const MAX_WAIT_MS = 5 * 60 * 1000
const EXAMPLES = ['swap', 'term', 'hint', 'numbers', 'shorten']

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function apiSoon(path, options = {}) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), POLL_TIMEOUT_MS)
  return api(path, { cache: 'no-store', skipSaving: true, ...options, signal: controller.signal }).finally(() => {
    window.clearTimeout(timer)
  })
}

function CardSide({ variant, label, frontLabel, backLabel, hintLabel, noHint, front, back, hint, showHint }) {
  return (
    <div className={`ai-edit-side${variant === 'after' ? ' ai-edit-after' : ''}`}>
      <div className="ai-edit-mark">{label}</div>
      <div className="ai-edit-fields">
        <p>
          <span className="muted">{frontLabel} </span>
          {front}
        </p>
        <p>
          <span className="muted">{backLabel} </span>
          {back}
        </p>
        {showHint ? (
          <p>
            <span className="muted">{hintLabel} </span>
            {hint || noHint}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default function EditCardsWithAi({ deck, cards, onClose, onSaved }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { reportCredits } = useAiCredits()
  const pro = isProLicensed(user)
  const cancelled = useRef(false)
  const [status, setStatus] = useState(null)
  const [instruction, setInstruction] = useState('')
  const [exampleId, setExampleId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [job, setJob] = useState(null)
  const [preview, setPreview] = useState(null)
  const [examplesOpen, setExamplesOpen] = useState(false)
  const [startedAt, setStartedAt] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    cancelled.current = false
    return () => {
      cancelled.current = true
    }
  }, [])

  useEffect(() => {
    let ignore = false
    api('/api/agent/status')
      .then((next) => {
        if (!ignore) {
          setStatus(next)
          if (next?.remainingCredits != null) {
            reportCredits(next.remainingCredits)
          }
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message)
        }
      })
    return () => {
      ignore = true
    }
  }, [deck.id, reportCredits])

  useEffect(() => {
    if (!busy) {
      return undefined
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [busy])

  const locked = status ? status.proRequired : !pro
  const remaining = status?.remainingCredits ?? 0
  const elapsed = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0
  const steps = job?.steps || []
  const canPreview =
    !busy && !locked && status?.configured && cards.length >= 2 && remaining > 0 && instruction.trim().length > 0

  function close() {
    if (saving) {
      return
    }
    cancelled.current = true
    onClose()
  }

  function chooseExample(id) {
    setExampleId(id)
    setInstruction(t(`agent.edit.example.${id}`))
    setExamplesOpen(false)
  }

  function applySettledJob(current) {
    if (!current || current.state === 'running') {
      return false
    }
    if (current.remainingCredits != null) {
      reportCredits(current.remainingCredits)
      setStatus((previous) => (previous ? { ...previous, remainingCredits: current.remainingCredits } : previous))
    }
    if (current.state === 'done' && current.preview?.changes?.length) {
      setPreview(current.preview)
      return true
    }
    setError(current.error || t('errors.requestFailed'))
    return true
  }

  async function pollJob(jobId, postPromise) {
    const deadline = Date.now() + MAX_WAIT_MS
    let sawJob = false
    let postError = null
    postPromise.catch((err) => {
      postError = err
    })
    while (!cancelled.current) {
      try {
        const current = await apiSoon(`/api/agent/jobs/${jobId}`)
        if (cancelled.current) {
          return null
        }
        sawJob = true
        setJob(current)
        if (applySettledJob(current)) {
          return current
        }
      } catch (err) {
        if (postError && !sawJob) {
          throw postError
        }
        if (sawJob && err?.name !== 'AbortError' && err?.message !== 'No connection') {
          throw err
        }
      }
      if (Date.now() > deadline) {
        throw new Error('Timed out waiting for AI')
      }
      await sleep(POLL_MS)
    }
    return null
  }

  async function previewChanges(event) {
    event.preventDefault()
    if (!canPreview) {
      return
    }
    setError('')
    setPreview(null)
    setBusy(true)
    setStartedAt(Date.now())
    setNow(Date.now())
    const requestedJobId = crypto.randomUUID()
    setJob({
      jobId: requestedJobId,
      state: 'running',
      steps: [{ code: 'starting', detail: null, at: new Date().toISOString() }],
      error: null,
      preview: null,
    })
    const postPromise = api(
      `/api/agent/decks/${deck.id}/edits?jobId=${encodeURIComponent(requestedJobId)}`,
      {
        method: 'POST',
        skipSaving: true,
        body: JSON.stringify({ instruction: instruction.trim(), jobId: requestedJobId }),
      },
    )
    postPromise.then((started) => {
      if (cancelled.current || !started?.jobId) {
        return
      }
      setJob((previous) => (previous?.state && previous.state !== 'running' ? previous : started))
      applySettledJob(started)
    }).catch(() => {
      // The status poll reports the job. A stuck POST must not hide a finished preview.
    })
    try {
      await pollJob(requestedJobId, postPromise)
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

  async function saveChanges() {
    if (!preview?.changes?.length || saving) {
      return
    }
    setSaving(true)
    setError('')
    try {
      await api(`/api/decks/${deck.id}/cards/ai-edits`, {
        method: 'PUT',
        body: JSON.stringify({
          cards: preview.changes.map((change) => ({
            cardId: change.cardId,
            front: change.afterFront,
            back: change.afterBack,
            hint: change.afterHint,
          })),
        }),
      })
      onSaved(preview.changes.length)
      onClose()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const creditLine = status
    ? status.addonCredits > 0
      ? t('agent.remainingWithExtra', {
          included: status.includedCredits,
          allowance: status.monthlyAllowance,
          extra: status.addonCredits,
          total: status.remainingCredits,
        })
      : t('agent.remaining', {
          included: status.includedCredits,
          allowance: status.monthlyAllowance,
        })
    : ''

  let footer = null
  if (preview) {
    footer = (
      <>
        <p className="muted">{t('agent.edit.spent')}</p>
        <div className="modal-actions">
          <button className="btn primary" type="button" disabled={saving} onClick={saveChanges}>
            {saving ? t('agent.edit.saving') : t('agent.edit.save')}
          </button>
          <button className="btn ghost" type="button" disabled={saving} onClick={close}>
            {t('agent.edit.discard')}
          </button>
        </div>
      </>
    )
  } else if (status && locked) {
    footer = (
      <div className="modal-actions">
        <Link className="btn primary" to="/pro">
          {t('pro.goToPro')}
        </Link>
      </div>
    )
  } else if (status && !locked && status.configured) {
    footer = (
      <>
        <div className="ai-edit-credits">
          {remaining <= 0 ? <p>{t('agent.outOfCredits')}</p> : <p className="muted">{t('agent.edit.credit')}</p>}
          {creditLine ? <p className={remaining <= 0 ? 'credit-remaining is-empty' : 'muted'}>{creditLine}</p> : null}
        </div>
        <button className="btn ai-edit-btn" type="submit" form="ai-edit-form" disabled={!canPreview}>
          <MenuIcon name="agent" />
          {busy ? t('agent.edit.previewing') : t('agent.edit.preview')}
        </button>
      </>
    )
  }

  return (
    <Modal
      variant="form"
      className="ai-edit-modal"
      title={t('agent.edit.title')}
      onClose={close}
      closeDisabled={saving}
      footer={footer}
    >
        {error ? <div className="error ai-edit-error">{translateError(t, error)}</div> : null}

        {preview ? (
          <>
            {preview.unchangedCount > 0 ? (
              <p>{t('agent.edit.unchanged', { count: preview.unchangedCount })}</p>
            ) : null}
            <ol className="ai-edit-samples">
                {preview.changes.map((change) => {
                  const showHint = Boolean(change.beforeHint || change.afterHint)
                  return (
                    <li key={change.cardId} className="ai-edit-change">
                      <strong>{t('agent.edit.card', { number: change.position + 1 })}</strong>
                      <CardSide
                        variant="now"
                        label={t('agent.edit.now')}
                        frontLabel={t('agent.edit.front')}
                        backLabel={t('agent.edit.back')}
                        hintLabel={t('agent.edit.hint')}
                        noHint={t('agent.edit.noHint')}
                        front={change.beforeFront}
                        back={change.beforeBack}
                        hint={change.beforeHint}
                        showHint={showHint}
                      />
                      <CardSide
                        variant="after"
                        label={t('agent.edit.after')}
                        frontLabel={t('agent.edit.front')}
                        backLabel={t('agent.edit.back')}
                        hintLabel={t('agent.edit.hint')}
                        noHint={t('agent.edit.noHint')}
                        front={change.afterFront}
                        back={change.afterBack}
                        hint={change.afterHint}
                        showHint={showHint}
                      />
                    </li>
                  )
                })}
            </ol>
          </>
        ) : null}

        {!preview && !status && !error ? <p className="muted">{t('agent.step.starting')}</p> : null}

        {!preview && status && locked ? (
          <section className="ai-edit-lock">
            <h3>{t('agent.edit.proTitle')}</h3>
            <p>{t('agent.edit.proBody')}</p>
          </section>
        ) : null}

        {!preview && status && !locked && !status.configured ? <p>{t('agent.notConfigured')}</p> : null}

        {!preview && status && !locked && status.configured ? (
          <form id="ai-edit-form" className="ai-edit-form" onSubmit={previewChanges}>
              <p>
                <strong>{t('agent.edit.deckLine', { name: deck.name, count: cards.length })}</strong>
              </p>
              {cards.length < 2 ? <p>{t('agent.edit.needTwo')}</p> : null}
              <div className="ai-edit-field">
                <div className="ai-edit-field-label">
                  <span id="ai-edit-instruction-label">{t('agent.edit.instruction')}</span>
                  <button
                    className="ai-edit-examples-toggle"
                    type="button"
                    aria-expanded={examplesOpen}
                    onClick={() => setExamplesOpen((open) => !open)}
                  >
                    {examplesOpen ? t('agent.edit.hideExamples') : t('agent.edit.examples')}
                  </button>
                </div>
                <p className="muted">{t('agent.edit.clear')}</p>
                {examplesOpen ? (
                  <div className="ai-edit-example-list" role="group" aria-label={t('agent.edit.examples')}>
                    {EXAMPLES.map((id) => (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={exampleId === id}
                        onClick={() => chooseExample(id)}
                      >
                        {t(`agent.edit.example.${id}`)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    aria-labelledby="ai-edit-instruction-label"
                    value={instruction}
                    onChange={(event) => {
                      setExampleId('')
                      setInstruction(event.target.value)
                    }}
                    placeholder={t('agent.edit.placeholder')}
                    rows={6}
                    maxLength={2000}
                  />
                )}
              </div>
              {busy || steps.length > 0 ? (
                <div className="agent-progress" aria-live="polite">
                  <strong>{busy ? t('agent.working', { seconds: elapsed }) : t('agent.failed')}</strong>
                  {busy && elapsed >= 45 ? <p className="muted">{t('agent.stillWaiting')}</p> : null}
                  {steps.length > 0 ? (
                    <ol>
                      {steps.map((step, index) => (
                        <li key={`${step.code}-${index}`}>
                          {t(`agent.step.${step.code}`, { defaultValue: step.code })}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              ) : null}
          </form>
        ) : null}
    </Modal>
  )
}
