import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { isProLicensed } from '../pro'
import { useResumeExpiredSubscription } from '../useResumeExpiredSubscription'
import { translateError } from '../i18n/errors'
import {
  STUDIO_LOCATION_ICONS,
  STUDIO_SAMPLE_LANGUAGES,
  defaultStudioSamplePair,
  studioLibraryPath,
  studioPairLabel,
  studioSamplesPath,
} from '../languageStudio'
import { SPEECH_LANGUAGES } from '../speechLanguages'
import LanguageSelect from './LanguageSelect'
import MenuIcon from './MenuIcon'

export default function LanguageStudioSamples() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  useResumeExpiredSubscription()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const pro = isProLicensed(user)
  const defaults = useMemo(
    () => defaultStudioSamplePair(i18n.resolvedLanguage || user?.locale),
    [i18n.resolvedLanguage, user?.locale],
  )
  const nativeLanguage = params.get('native') || defaults.nativeLanguage
  const targetLanguage = params.get('target') || defaults.targetLanguage
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [copying, setCopying] = useState('')

  const sampleLanguages = useMemo(
    () => SPEECH_LANGUAGES.filter((language) => STUDIO_SAMPLE_LANGUAGES.includes(language.code)),
    [],
  )
  const targetLanguages =
    nativeLanguage === 'en-US' ? sampleLanguages.filter((language) => language.code !== 'en-US') : sampleLanguages.filter((language) => language.code === 'en-US')

  useEffect(() => {
    const pair = normalizePair(nativeLanguage, targetLanguage)
    if (pair.native !== nativeLanguage || pair.target !== targetLanguage || !params.get('native') || !params.get('target')) {
      setParams(pair, { replace: true })
    }
  }, [nativeLanguage, targetLanguage, setParams])

  useEffect(() => {
    if (!pro) {
      setReady(true)
      setItems([])
      return
    }
    let cancelled = false
    setReady(false)
    api(
      `/api/language-studio/samples?nativeLanguage=${encodeURIComponent(nativeLanguage)}&targetLanguage=${encodeURIComponent(targetLanguage)}`,
    )
      .then((rows) => {
        if (!cancelled) {
          setItems(rows || [])
          setError('')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setItems([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [pro, nativeLanguage, targetLanguage])

  function setNative(value) {
    setParams(normalizePair(value, targetLanguage))
  }

  function setTarget(value) {
    setParams(normalizePair(nativeLanguage, value))
  }

  async function copy(item) {
    if (!pro) {
      navigate('/pro')
      return
    }
    if (item.copiedId) {
      navigate(`/language-studio/${item.copiedId}`)
      return
    }
    setCopying(item.slug)
    setError('')
    try {
      const created = await api(`/api/language-studio/samples/${item.slug}/copy`, {
        method: 'POST',
        skipSaving: true,
        body: JSON.stringify({ nativeLanguage, targetLanguage }),
      })
      navigate(`/language-studio/${created.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setCopying('')
    }
  }

  if (!pro) {
    return (
      <div className="page">
        <section className="card-form">
          <p>{t('studio.proRequired')}</p>
          <Link className="btn primary" to="/pro">
            {t('pro.goToPro')}
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="page">
      <button
        className="page-back"
        type="button"
        onClick={() => navigate(studioLibraryPath({ nativeLanguage, targetLanguage }))}
      >
        {t('studio.back')}
      </button>
      <div className="page-title">
        <div>
          <h1>{t('studio.samplesTitle')}</h1>
          <p className="muted">{t('studio.samplesIntro')}</p>
          <p className="muted">{t('studio.schedule')}</p>
        </div>
      </div>
      {error ? <div className="error">{translateError(t, error)}</div> : null}

      <div className="studio-lang-row">
        <LanguageSelect
          id="studio-sample-native"
          label={t('studio.native')}
          value={nativeLanguage}
          onChange={setNative}
          languages={sampleLanguages}
        />
        <LanguageSelect
          id="studio-sample-target"
          label={t('studio.target')}
          value={targetLanguage}
          onChange={setTarget}
          languages={targetLanguages}
        />
      </div>

      {!ready ? <p className="muted">{t('app.loading')}</p> : null}
      {ready && items.length === 0 ? <p className="muted">{t('studio.samplesEmpty')}</p> : null}

      {items.length > 0 ? (
        <div className="studio-list">
          {items.map((item) => (
            <article key={item.slug} className="studio-card">
              <div className="studio-card-copy">
                <div className="studio-card-title">
                  <span className="studio-location-icon" aria-hidden="true">
                    <MenuIcon name={STUDIO_LOCATION_ICONS[item.scenario] || 'studio'} />
                  </span>
                  <h2>{item.title}</h2>
                  <span className="studio-pill">{item.level}</span>
                  {item.copiedId ? <span className="studio-pill is-learned">{t('studio.samplesCopied')}</span> : null}
                </div>
                <p className="muted">
                  {t(`studio.scenarios.${item.scenario}`, { defaultValue: item.scenario })} · {studioPairLabel(item, t)} ·{' '}
                  {t('studio.turns', { count: item.turnCount })}
                </p>
              </div>
              <div className="deck-card-actions">
                {pro ? (
                  <>
                    <button
                      className="btn studio-mode-btn"
                      type="button"
                      onClick={() =>
                        navigate(
                          `/listen?source=studio-sample&slug=${encodeURIComponent(item.slug)}&native=${encodeURIComponent(nativeLanguage)}&target=${encodeURIComponent(targetLanguage)}`,
                          { state: { listenReturn: studioSamplesPath(nativeLanguage, targetLanguage) } },
                        )
                      }
                    >
                      <MenuIcon name="listen" />
                      {t('listen.menu')}
                    </button>
                    <button
                      className="btn primary studio-mode-btn"
                      type="button"
                      onClick={() =>
                        navigate(
                          `/language-studio/samples/${item.slug}?native=${encodeURIComponent(nativeLanguage)}&target=${encodeURIComponent(targetLanguage)}`,
                        )
                      }
                    >
                      <MenuIcon name="practice" />
                      {t('studio.practice')}
                    </button>
                    <button className="btn studio-mode-btn" type="button" disabled={copying === item.slug} onClick={() => copy(item)}>
                      {item.copiedId ? t('studio.samplesOpenCopy') : t('studio.samplesCopy')}
                    </button>
                  </>
                ) : (
                  <Link className="btn primary" to="/pro">
                    {t('pro.goToPro')}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function normalizePair(nativeLanguage, targetLanguage) {
  const native = STUDIO_SAMPLE_LANGUAGES.includes(nativeLanguage) ? nativeLanguage : 'en-US'
  if (native === 'en-US') {
    const target = targetLanguage !== 'en-US' && STUDIO_SAMPLE_LANGUAGES.includes(targetLanguage) ? targetLanguage : 'es-ES'
    return { native, target }
  }
  return { native, target: 'en-US' }
}
