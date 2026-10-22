import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { useAiCredits } from '../AiCreditsContext'
import { isProLicensed } from '../pro'
import { useResumeExpiredSubscription } from '../useResumeExpiredSubscription'
import { translateError } from '../i18n/errors'
import { STUDIO_LEVELS, STUDIO_LOCATIONS, STUDIO_LOCATION_ICONS, defaultStudioLanguages } from '../languageStudio'
import LanguageSelect from './LanguageSelect'
import MenuIcon from './MenuIcon'

const POLL_MS = 500
const MAX_WAIT_MS = 5 * 60 * 1000

export default function LanguageStudioCreate() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { remainingCredits, reportCredits } = useAiCredits()
  useResumeExpiredSubscription()
  const navigate = useNavigate()
  const pro = isProLicensed(user)
  const defaults = useMemo(() => defaultStudioLanguages(i18n.resolvedLanguage || user?.locale), [i18n.resolvedLanguage, user?.locale])
  const [nativeLanguage, setNativeLanguage] = useState(defaults.nativeLanguage)
  const [targetLanguage, setTargetLanguage] = useState(defaults.targetLanguage)
  const [scenario, setScenario] = useState('pharmacy')
  const [customPrompt, setCustomPrompt] = useState('')
  const [level, setLevel] = useState('A2')
  const [useLearned, setUseLearned] = useState(true)
  const [learnedCount, setLearnedCount] = useState(0)
  const [configured, setConfigured] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const cancelled = useRef(false)

  useEffect(() => {
    cancelled.current = false
    return () => {
      cancelled.current = true
    }
  }, [])

  useEffect(() => {
    if (!pro) {
      return
    }
    api('/api/language-studio/conversations')
      .then((rows) => setLearnedCount((rows || []).filter((row) => row.status === 'LEARNED').length))
      .catch(() => setLearnedCount(0))
    api('/api/agent/status')
      .then((status) => {
        setConfigured(Boolean(status?.configured))
        if (typeof status?.remainingCredits === 'number') {
          reportCredits(status.remainingCredits)
        }
      })
      .catch(() => {})
  }, [pro])

  async function generate(event) {
    event.preventDefault()
    if (!pro || busy || remainingCredits <= 0) {
      return
    }
    if (nativeLanguage === targetLanguage) {
      setError('Choose two different languages')
      return
    }
    if (scenario === 'custom' && !customPrompt.trim()) {
      setError('Describe the scene')
      return
    }
    setError('')
    setBusy(true)
    try {
      const started = await api('/api/language-studio/conversations', {
        method: 'POST',
        skipSaving: true,
        body: JSON.stringify({
          nativeLanguage,
          targetLanguage,
          scenario,
          customPrompt: customPrompt.trim(),
          level,
          useLearned: useLearned && learnedCount > 0,
        }),
      })
      if (cancelled.current) {
        return
      }
      if (started.conversation?.id) {
        reportCredits(started.remainingCredits)
        navigate(`/language-studio/${started.conversation.id}`)
        return
      }
      const current = await pollJob(started.jobId)
      if (!current || cancelled.current) {
        return
      }
      if (typeof current.remainingCredits === 'number') {
        reportCredits(current.remainingCredits)
      }
      if (current.state === 'done' && current.conversation?.id) {
        navigate(`/language-studio/${current.conversation.id}`)
        return
      }
      setError(current.error || t('errors.requestFailed'))
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
      const current = await api(`/api/language-studio/jobs/${jobId}`)
      if (cancelled.current) {
        return null
      }
      if (current.state !== 'running') {
        return current
      }
      if (Date.now() > deadline) {
        throw new Error('Timed out waiting for AI')
      }
      await new Promise((resolve) => window.setTimeout(resolve, POLL_MS))
    }
    return null
  }

  if (!pro) {
    return (
      <div className="page">
        <button className="page-back" type="button" onClick={() => navigate('/language-studio')}>
          {t('studio.back')}
        </button>
        <section className="card-form">
          <p>{t('studio.proRequired')}</p>
          <Link className="btn primary" to="/pro">
            {t('pro.goToPro')}
          </Link>
        </section>
      </div>
    )
  }

  const remaining = remainingCredits ?? 0
  const canSubmit =
    configured &&
    !busy &&
    remaining > 0 &&
    nativeLanguage !== targetLanguage &&
    (scenario !== 'custom' || Boolean(customPrompt.trim()))

  return (
    <div className="page">
      <button className="page-back" type="button" onClick={() => navigate('/language-studio')}>
        {t('studio.back')}
      </button>
      <div className="page-title">
        <div>
          <h1>{t('studio.createTitle')}</h1>
          <p className="muted">{t('studio.createIntro')}</p>
        </div>
      </div>
      {error ? <div className="error">{translateError(t, error)}</div> : null}
      {!configured ? <p className="muted">{t('agent.notConfigured')}</p> : null}

      <form className="card-form studio-create" onSubmit={generate}>
        <p className={remaining <= 0 ? 'credit-remaining is-empty' : 'muted'}>
          {t('pro.balanceLeft', { count: remaining })}
        </p>
        <p>{t('studio.creditCost')}</p>

        <div className="studio-lang-row">
          <LanguageSelect
            id="studio-native"
            label={t('studio.native')}
            value={nativeLanguage}
            onChange={setNativeLanguage}
            disabled={busy}
          />
          <LanguageSelect
            id="studio-target"
            label={t('studio.target')}
            value={targetLanguage}
            onChange={setTargetLanguage}
            disabled={busy}
          />
        </div>

        <fieldset className="listen-panel">
          <legend>{t('studio.scenario')}</legend>
          <div className="studio-locations" role="radiogroup" aria-label={t('studio.scenario')}>
            {STUDIO_LOCATIONS.map((item) => (
              <button
                key={item}
                className={`studio-location studio-location-${item}${scenario === item ? ' is-selected' : ''}`}
                type="button"
                disabled={busy}
                aria-pressed={scenario === item}
                onClick={() => setScenario(item)}
              >
                <span className="studio-location-icon" aria-hidden="true">
                  <MenuIcon name={STUDIO_LOCATION_ICONS[item]} />
                </span>
                <span>{item === 'custom' ? t('common.custom') : t(`studio.scenarios.${item}`)}</span>
              </button>
            ))}
          </div>
          <label htmlFor="studio-custom">
            {scenario === 'custom'
              ? t('studio.describeRequired')
              : t('studio.describeOptional', { place: t(`studio.places.${scenario}`) })}
            <textarea
              id="studio-custom"
              rows={3}
              maxLength={240}
              disabled={busy}
              required={scenario === 'custom'}
              value={customPrompt}
              placeholder={
                scenario === 'custom'
                  ? t('studio.scenarioCustomPlaceholder')
                  : t(`studio.placeholders.${scenario}`)
              }
              onChange={(event) => setCustomPrompt(event.target.value)}
            />
          </label>
        </fieldset>

        <fieldset className="listen-panel">
          <legend>{t('studio.fluency')}</legend>
          <div className="listen-choice-row" role="radiogroup" aria-label={t('studio.fluency')}>
            {STUDIO_LEVELS.map((item) => (
              <button
                key={item}
                className={`btn${level === item ? ' primary' : ''}`}
                type="button"
                disabled={busy}
                aria-pressed={level === item}
                onClick={() => setLevel(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="muted">{t(`studio.levelHint${level}`)}</p>
        </fieldset>

        <div className="studio-learned">
          <button
            className={`btn${useLearned ? ' primary' : ''}`}
            type="button"
            disabled={busy || learnedCount === 0}
            aria-pressed={useLearned}
            onClick={() => setUseLearned((value) => !value)}
          >
            {useLearned && learnedCount > 0 ? t('studio.useLearned') : t('studio.ignoreLearned')}
          </button>
          <p className="muted">{learnedCount > 0 ? t('studio.useLearnedHint', { count: learnedCount }) : t('studio.useLearnedHintEmpty')}</p>
        </div>

        <button className="btn primary listen-play" type="submit" disabled={!canSubmit}>
          {busy ? t('studio.generating') : t('studio.generate')}
        </button>
      </form>
    </div>
  )
}
