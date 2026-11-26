import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import ChoiceMenu from '../ChoiceMenu'
import { translateError } from '../i18n/errors'
import { LANGUAGES } from '../languages'
import { isProLicensed } from '../pro'
import { LEVELS, SAMPLE_LANGUAGES, SCENES, generateConversation, samplePairOk } from '../studio'
import ProStrip, { MoreScenes } from '../ProStrip'

const sampleLanguages = LANGUAGES.filter((language) => SAMPLE_LANGUAGES.includes(language.code))

export default function ScenesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const pro = isProLicensed(user)
  const [params, setParams] = useSearchParams()
  const [scene, setScene] = useState(null)
  const [sampleNative, setSampleNative] = useState('en-US')
  const [sampleTarget, setSampleTarget] = useState('es-ES')
  const [samples, setSamples] = useState([])
  const [pairs, setPairs] = useState([])
  const [nativeLanguage, setNativeLanguage] = useState('en-US')
  const [targetLanguage, setTargetLanguage] = useState('es-ES')
  const [level, setLevel] = useState('A2')
  const [customPrompt, setCustomPrompt] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [useLearned, setUseLearned] = useState(true)

  const samplesReady = samplePairOk(sampleNative, sampleTarget)

  useEffect(() => {
    if (!samplesReady) {
      setSamples([])
      return undefined
    }
    let cancelled = false
    const query = `nativeLanguage=${encodeURIComponent(sampleNative)}&targetLanguage=${encodeURIComponent(sampleTarget)}`
    api(`/api/zipconvo/samples?${query}`)
      .then((rows) => {
        if (!cancelled) {
          setSamples(rows || [])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSamples([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [sampleNative, sampleTarget, samplesReady])

  useEffect(() => {
    let cancelled = false
    api('/api/language-studio/pairs')
      .then((rows) => {
        if (cancelled) {
          return
        }
        const list = rows || []
        setPairs(list)
        if (list[0]) {
          setNativeLanguage(list[0].nativeLanguage)
          setTargetLanguage(list[0].targetLanguage)
          setLevel(list[0].level || 'A2')
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  function openCreate(item) {
    if (!pro) {
      navigate('/pro')
      return
    }
    setCustomPrompt('')
    setScene(item)
  }

  const showSamples = !pro || params.get('view') === 'samples'

  function showSampleList() {
    setParams({ view: 'samples' }, { replace: true })
  }

  function showCreateList() {
    setParams({}, { replace: true })
  }

  if (!scene) {
    const sampleQuery = `native=${encodeURIComponent(sampleNative)}&target=${encodeURIComponent(sampleTarget)}`
    const sampleCards = samples.length
      ? samples.map((item) => ({
          id: item.slug,
          image: SCENES.find((sceneItem) => sceneItem.id === item.scenario)?.image || '',
          title: item.title,
        }))
      : SCENES.map((item) => ({ id: item.id, image: item.image, title: t(`scenes.${item.id}Title`) }))
    return (
      <main className="screen is-fit">
        <div className="screen-copy">
          <h1 className="start-title">{showSamples ? t('scenes.samplesTitle') : t('scenes.createTitle')}</h1>
          <p>{showSamples ? t('scenes.samplesLede') : t('scenes.createLede')}</p>
        </div>
        {showSamples ? (
          <div className="scene-langs">
            <ChoiceMenu
              id="sample-native"
              label={t('scenes.iSpeak')}
              value={sampleNative}
              options={sampleLanguages.map((language) => ({ value: language.code, label: language.name }))}
              onChange={setSampleNative}
            />
            <ChoiceMenu
              id="sample-target"
              label={t('scenes.learning')}
              value={sampleTarget}
              options={sampleLanguages.map((language) => ({ value: language.code, label: language.name }))}
              onChange={setSampleTarget}
            />
          </div>
        ) : null}
        {showSamples && !samplesReady ? <p className="card-meta">{t('scenes.samplesEnglish')}</p> : null}
        <div className="scene-list is-fit">
          {showSamples
            ? sampleCards.map((item) =>
                samplesReady ? (
                  <Link key={item.id} className="scene-card" to={`/samples/${item.id}?${sampleQuery}`}>
                    {item.image ? <img src={item.image} alt="" /> : null}
                    <span>
                      <h2>{item.title}</h2>
                    </span>
                  </Link>
                ) : (
                  <div key={item.id} className="scene-card is-quiet">
                    {item.image ? <img src={item.image} alt="" /> : null}
                    <span>
                      <h2>{item.title}</h2>
                    </span>
                  </div>
                ),
              )
            : SCENES.map((item) => (
                <button key={item.id} className="scene-card" type="button" onClick={() => openCreate(item)}>
                  <img src={item.image} alt="" />
                  <span>
                    <h2>{t(`scenes.${item.id}Title`)}</h2>
                  </span>
                </button>
              ))}
        </div>
        {showSamples ? (
          pro ? (
            <div className="scene-foot">
              <button className="scene-own" type="button" onClick={showCreateList}>
                {t('scenes.createLink')}
              </button>
            </div>
          ) : (
            <ProStrip />
          )
        ) : (
          <div className="scene-foot is-stack">
            <MoreScenes onClick={showSampleList} />
            <button className="scene-own" type="button" onClick={() => openCreate({ id: 'custom' })}>
              {t('scenes.describeOwn')}
            </button>
          </div>
        )}
      </main>
    )
  }

  const learned = pairs.find((pair) => pair.nativeLanguage === nativeLanguage && pair.targetLanguage === targetLanguage)
  const learnedCount = learned?.learnedCount || 0

  async function onSubmit(event) {
    event.preventDefault()
    if (busy) {
      return
    }
    if (nativeLanguage === targetLanguage) {
      setError(t('scenes.differentLanguages'))
      return
    }
    if (scene.id === 'custom' && !customPrompt.trim()) {
      setError(t('scenes.describeRequired'))
      return
    }
    setBusy(true)
    setError('')
    try {
      const conversation = await generateConversation({
        nativeLanguage,
        targetLanguage,
        scenario: scene.id,
        customPrompt: customPrompt.trim(),
        level,
        useLearned: learnedCount > 0 && useLearned,
      })
      navigate(`/conversations/${conversation.id}`)
    } catch (err) {
      if (err.message === 'Pro license required' || err.message === 'Out of AI credits') {
        navigate('/pro')
        return
      }
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <main className="screen">
      <button className="back" type="button" onClick={() => setScene(null)} disabled={busy}>
        {t('back')}
      </button>
      <form className="scene-form" onSubmit={onSubmit}>
        <div className="screen-copy">
          <h1>{scene.id === 'custom' ? t('scenes.ownTitle') : t(`scenes.${scene.id}Title`)}</h1>
        </div>
        <div className="scene-langs">
          <ChoiceMenu
            id="scene-native"
            label={t('scenes.iSpeak')}
            value={nativeLanguage}
            options={LANGUAGES.map((language) => ({ value: language.code, label: language.name }))}
            onChange={setNativeLanguage}
            disabled={busy}
          />
          <ChoiceMenu
            id="scene-target"
            label={t('scenes.learning')}
            value={targetLanguage}
            options={LANGUAGES.map((language) => ({ value: language.code, label: language.name }))}
            onChange={setTargetLanguage}
            disabled={busy}
          />
        </div>
        <div className="field">
          <span>{t('scenes.level')}</span>
          <div className="filters">
            {LEVELS.map((item) => (
              <button key={item} className={level === item ? 'is-on' : ''} type="button" onClick={() => setLevel(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>{scene.id === 'custom' ? t('scenes.describe') : t('scenes.what')}</span>
          <textarea
            rows={2}
            maxLength={240}
            placeholder={scene.id === 'custom' ? t('scenes.customPlaceholder') : t(`scenes.${scene.id}Line`)}
            value={customPrompt}
            onChange={(event) => setCustomPrompt(event.target.value)}
          />
        </label>
        {learnedCount > 0 ? (
          <button
            className={`scene-learned${useLearned ? ' is-on' : ''}`}
            type="button"
            disabled={busy}
            aria-pressed={useLearned}
            onClick={() => setUseLearned((value) => !value)}
          >
            {useLearned ? t('scenes.useLearned') : t('scenes.ignoreLearned')}
          </button>
        ) : null}
        {error ? <p className="error">{translateError(error)}</p> : null}
        <button className="btn email" type="submit" disabled={busy}>
          {busy ? t('scenes.writing') : t('scenes.generate')}
        </button>
      </form>
    </main>
  )
}
