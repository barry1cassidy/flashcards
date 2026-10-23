import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { useAiCredits } from '../AiCreditsContext'
import { isProLicensed } from '../pro'
import { useResumeExpiredSubscription } from '../useResumeExpiredSubscription'
import { translateError } from '../i18n/errors'
import {
  STUDIO_LEVELS,
  STUDIO_LOCATIONS,
  STUDIO_LOCATION_ICONS,
  defaultStudioLanguages,
  findStudioPair,
  studioLibraryPath,
  studioPairLabel,
} from '../languageStudio'
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
  const [params] = useSearchParams()
  const pro = isProLicensed(user)
  const defaults = useMemo(
    () => defaultStudioLanguages(i18n.resolvedLanguage || user?.locale),
    [i18n.resolvedLanguage, user?.locale],
  )
  const [nativeLanguage, setNativeLanguage] = useState(params.get('native') || defaults.nativeLanguage)
  const [targetLanguage, setTargetLanguage] = useState(params.get('target') || defaults.targetLanguage)
  const [scenario, setScenario] = useState('pharmacy')
  const [customPrompt, setCustomPrompt] = useState('')
  const [level, setLevel] = useState('A2')
  const [useLearned, setUseLearned] = useState(true)
  const [pairs, setPairs] = useState(null)
  const [configured, setConfigured] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState(1)
  const cancelled = useRef(false)
  const primed = useRef(false)

  useEffect(() => {
    cancelled.current = false
    return () => {
      cancelled.current = true
    }
  }, [])

  useEffect(() => {
    if (!pro) {
      setPairs([])
      return
    }
    let cancelledLoad = false
    api('/api/language-studio/pairs')
      .then((rows) => {
        if (!cancelledLoad) {
          setPairs(rows || [])
        }
      })
      .catch(() => {
        if (!cancelledLoad) {
          setPairs([])
        }
      })
    api('/api/agent/status')
      .then((status) => {
        if (cancelledLoad) {
          return
        }
        setConfigured(Boolean(status?.configured))
        if (typeof status?.remainingCredits === 'number') {
          reportCredits(status.remainingCredits)
        }
      })
      .catch(() => {})
    return () => {
      cancelledLoad = true
    }
  }, [pro])

  useEffect(() => {
    if (!Array.isArray(pairs) || primed.current) {
      return
    }
    primed.current = true
    const requested = findStudioPair(pairs, params.get('native'), params.get('target'))
    const fallback = requested || pairs[0]
    if (!fallback) {
      return
    }
    setNativeLanguage(fallback.nativeLanguage)
    setTargetLanguage(fallback.targetLanguage)
    setLevel(fallback.level || 'A2')
  }, [pairs, params])

  const selectedPair = findStudioPair(pairs, nativeLanguage, targetLanguage)
  const learnedCount = selectedPair?.learnedCount || 0
  const pairsReady = Array.isArray(pairs)
  const firstTime = pairsReady && pairs.length === 0

  function applyPair(pair) {
    setNativeLanguage(pair.nativeLanguage)
    setTargetLanguage(pair.targetLanguage)
    setLevel(pair.level || 'A2')
    setUseLearned(true)
  }

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

  function goBack() {
    if (firstTime && step > 1) {
      setStep((current) => current - 1)
      return
    }
    navigate(studioLibraryPath({ nativeLanguage, targetLanguage }))
  }

  const title =
    firstTime && step === 1
      ? t('studio.setupLanguagesTitle')
      : firstTime && step === 2
        ? t('studio.setupLevelTitle')
        : firstTime
          ? t('studio.setupSceneTitle')
          : t('studio.createTitle')
  const intro =
    firstTime && step === 1
      ? t('studio.setupLanguagesIntro')
      : firstTime && step === 2
        ? t('studio.setupLevelIntro')
        : firstTime
          ? t('studio.setupSceneIntro')
          : t('studio.createIntro')

  return (
    <div className="page">
      <button className="page-back" type="button" onClick={goBack}>
        {t('studio.back')}
      </button>
      <div className="page-title">
        <div>
          <h1>{title}</h1>
          <p className="muted">{intro}</p>
          {firstTime ? <p className="muted">{t('studio.stepProgress', { current: step, total: 3 })}</p> : null}
        </div>
      </div>
      {error ? <div className="error">{translateError(t, error)}</div> : null}
      {!configured ? <p className="muted">{t('agent.notConfigured')}</p> : null}
      {!pairsReady ? <p className="muted">{t('app.loading')}</p> : null}

      {pairsReady ? (
      <form
        className="card-form studio-create"
        onSubmit={(event) => {
          if (firstTime && step < 3) {
            event.preventDefault()
            return
          }
          generate(event)
        }}
      >
        {firstTime && step === 1 ? (
          <>
            <LanguageFields
              nativeLanguage={nativeLanguage}
              targetLanguage={targetLanguage}
              setNativeLanguage={setNativeLanguage}
              setTargetLanguage={setTargetLanguage}
              busy={busy}
            />
            <div className="studio-setup-actions">
              <button
                className="btn primary"
                type="button"
                disabled={nativeLanguage === targetLanguage}
                onClick={() => setStep(2)}
              >
                {t('common.continue')}
              </button>
            </div>
          </>
        ) : null}

        {firstTime && step === 2 ? (
          <>
            <LevelCards level={level} setLevel={setLevel} busy={busy} />
            <div className="studio-setup-actions">
              <button className="btn primary" type="button" onClick={() => setStep(3)}>
                {t('common.continue')}
              </button>
            </div>
          </>
        ) : null}

        {firstTime && step === 3 ? (
          <>
            <p className="muted studio-setup-pair">{studioPairLabel({ nativeLanguage, targetLanguage }, t)} · {level}</p>
            <CreditNote remaining={remaining} />
            <SceneFields
              scenario={scenario}
              setScenario={setScenario}
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              busy={busy}
            />
            <button className="btn primary listen-play" type="submit" disabled={!canSubmit}>
              {busy ? t('studio.generating') : t('studio.generate')}
            </button>
          </>
        ) : null}

        {!firstTime ? (
          <>
            <CreditNote remaining={remaining} />
            {pairs?.length > 1 ? (
              <div className="listen-choice-row studio-filters" role="radiogroup" aria-label={t('studio.pairs')}>
                {pairs.map((pair) => (
                  <button
                    key={pair.id}
                    className={`btn${selectedPair?.id === pair.id ? ' primary' : ''}`}
                    type="button"
                    disabled={busy}
                    aria-pressed={selectedPair?.id === pair.id}
                    onClick={() => applyPair(pair)}
                  >
                    {studioPairLabel(pair, t)}
                  </button>
                ))}
              </div>
            ) : null}
            <LanguageFields
              nativeLanguage={nativeLanguage}
              targetLanguage={targetLanguage}
              setNativeLanguage={(code) => {
                setNativeLanguage(code)
                const pair = findStudioPair(pairs, code, targetLanguage)
                if (pair) {
                  setLevel(pair.level || 'A2')
                }
              }}
              setTargetLanguage={(code) => {
                setTargetLanguage(code)
                const pair = findStudioPair(pairs, nativeLanguage, code)
                if (pair) {
                  setLevel(pair.level || 'A2')
                }
              }}
              busy={busy}
            />
            <SceneFields
              scenario={scenario}
              setScenario={setScenario}
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              busy={busy}
            />
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
            {learnedCount > 0 ? (
              <div className="studio-learned">
                <button
                  className={`btn${useLearned ? ' primary' : ''}`}
                  type="button"
                  disabled={busy}
                  aria-pressed={useLearned}
                  onClick={() => setUseLearned((value) => !value)}
                >
                  {useLearned ? t('studio.useLearned') : t('studio.ignoreLearned')}
                </button>
                <p className="muted">{t('studio.useLearnedHint', { count: learnedCount })}</p>
              </div>
            ) : null}
            <button className="btn primary listen-play" type="submit" disabled={!canSubmit}>
              {busy ? t('studio.generating') : t('studio.generate')}
            </button>
          </>
        ) : null}
      </form>
      ) : null}
    </div>
  )
}

function CreditNote({ remaining }) {
  const { t } = useTranslation()
  return (
    <>
      <p className={remaining <= 0 ? 'credit-remaining is-empty' : 'muted'}>
        {t('pro.balanceLeft', { count: remaining })}
      </p>
      <p>{t('studio.creditCost')}</p>
    </>
  )
}

function LanguageFields({ nativeLanguage, targetLanguage, setNativeLanguage, setTargetLanguage, busy }) {
  const { t } = useTranslation()
  return (
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
  )
}

function LevelCards({ level, setLevel, busy }) {
  const { t } = useTranslation()
  return (
    <div className="studio-level-cards" role="radiogroup" aria-label={t('studio.fluency')}>
      {STUDIO_LEVELS.map((item) => (
        <button
          key={item}
          className={`studio-level-card${level === item ? ' is-selected' : ''}`}
          type="button"
          disabled={busy}
          aria-pressed={level === item}
          onClick={() => setLevel(item)}
        >
          <span className="studio-level-card-head">
            <strong>{item}</strong>
            <span>{t(`studio.levelTitle${item}`)}</span>
          </span>
          <span className="muted">{t(`studio.levelHint${item}`)}</span>
        </button>
      ))}
    </div>
  )
}

function SceneFields({ scenario, setScenario, customPrompt, setCustomPrompt, busy }) {
  const { t } = useTranslation()
  const examples = sceneExamples(scenario, t)
  return (
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
        {scenario === 'custom' ? t('studio.describeRequired') : t('studio.describeOptional')}
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
      <p className="muted studio-describe-hint">{t('studio.describeHint')}</p>
      <p className="muted studio-examples-label">{t('studio.describeExamplesLabel')}</p>
      <div className="studio-examples">
        {examples.map((example) => (
          <button
            key={example}
            className="studio-example"
            type="button"
            disabled={busy}
            onClick={() => setCustomPrompt(example)}
          >
            {example}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function sceneExamples(scenario, t) {
  const first =
    scenario === 'custom'
      ? t('studio.scenarioCustomPlaceholder')
      : t(`studio.placeholders.${scenario}`)
  const second = t(`studio.exampleExtra.${scenario}`)
  return [first, second]
}
