import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import ChoiceMenu from '../ChoiceMenu'
import { translateError } from '../i18n/errors'
import { LANGUAGES, languageName } from '../languages'
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
  const [advanced, setAdvanced] = useState(false)
  const [length, setLength] = useState('QUICK')
  const [sourceIds, setSourceIds] = useState([])
  const [learnedScenes, setLearnedScenes] = useState([])
  const [terms, setTerms] = useState([])
  const [draftNative, setDraftNative] = useState('')
  const [draftTarget, setDraftTarget] = useState('')
  const [translating, setTranslating] = useState(false)

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
    if (!pro) {
      return undefined
    }
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
    setAdvanced(false)
    setLength('QUICK')
    setSourceIds([])
    setTerms([])
    setDraftNative('')
    setDraftTarget('')
    setScene(item)
  }

  const showSamples = !pro || params.get('view') === 'samples'

  function showSampleList() {
    setParams({ view: 'samples' }, { replace: true })
  }

  function showCreateList() {
    setParams({}, { replace: true })
  }

  useEffect(() => {
    setSourceIds([])
    setTerms([])
    setDraftNative('')
    setDraftTarget('')
  }, [nativeLanguage, targetLanguage])

  useEffect(() => {
    if (!advanced || !pro) {
      return undefined
    }
    let cancelled = false
    const query = `nativeLanguage=${encodeURIComponent(nativeLanguage)}&targetLanguage=${encodeURIComponent(targetLanguage)}`
    api(`/api/language-studio/conversations?${query}`)
      .then((rows) => {
        if (!cancelled) {
          setLearnedScenes((rows || []).filter((row) => row.status === 'LEARNED'))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLearnedScenes([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [advanced, nativeLanguage, targetLanguage, pro])

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

  function chooseLength(next) {
    setLength(next)
    setTerms((current) => current.slice(0, wordCap(next)))
  }

  function toggleSource(id) {
    setSourceIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id)
      }
      if (current.length >= 3) {
        return current
      }
      return [...current, id]
    })
  }

  async function translateWord() {
    const text = draftNative.trim()
    if (!text || translating) {
      return
    }
    setTranslating(true)
    setError('')
    try {
      const result = await api('/api/translate', {
        method: 'POST',
        body: JSON.stringify({ text, source: nativeLanguage, target: targetLanguage }),
      })
      setDraftTarget(result.text || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setTranslating(false)
    }
  }

  function addWord() {
    const nativeText = draftNative.trim()
    const targetText = draftTarget.trim()
    if (!nativeText || !targetText || terms.length >= wordCap(length)) {
      return
    }
    setTerms((current) => [...current, { nativeText, targetText }])
    setDraftNative('')
    setDraftTarget('')
  }

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
        length,
        sourceIds: learnedCount > 0 && useLearned ? sourceIds : [],
        terms,
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
        <button
          className={`scene-advanced-toggle${advanced ? ' is-on' : ''}`}
          type="button"
          aria-expanded={advanced}
          onClick={() => setAdvanced((open) => !open)}
        >
          <strong>{t('scenes.advanced')}</strong>
          <small>{advancedSummary(t, length, sourceIds, terms, learnedCount > 0 && useLearned)}</small>
        </button>
        {advanced ? (
          <div className="scene-advanced">
            <div className="field">
              <span>{t('scenes.length')}</span>
              <div className="scene-length" role="radiogroup" aria-label={t('scenes.length')}>
                <button
                  className={length === 'QUICK' ? 'is-on' : ''}
                  type="button"
                  onClick={() => chooseLength('QUICK')}
                >
                  {t('scenes.quick')}
                  <small>{t('scenes.quickHint')}</small>
                </button>
                <button
                  className={length === 'FULL' ? 'is-on' : ''}
                  type="button"
                  onClick={() => chooseLength('FULL')}
                >
                  {t('scenes.full')}
                  <small>{t('scenes.fullHint')}</small>
                </button>
              </div>
            </div>
            <div className="field">
              <span>{t('scenes.buildOn')}</span>
              <p className="scene-advanced-note">
                {learnedCount > 0 && useLearned ? t('scenes.buildOnHint') : t('scenes.buildOnOff')}
              </p>
              {learnedCount > 0 && useLearned && learnedScenes.length === 0 ? <p className="scene-advanced-note">{t('scenes.noLearned')}</p> : null}
              {learnedCount > 0 && useLearned
                ? learnedScenes.map((item) => (
                    <button
                      key={item.id}
                      className={`scene-source${sourceIds.includes(item.id) ? ' is-on' : ''}`}
                      type="button"
                      aria-pressed={sourceIds.includes(item.id)}
                      disabled={busy || (!sourceIds.includes(item.id) && sourceIds.length >= 3)}
                      onClick={() => toggleSource(item.id)}
                    >
                      {item.title}
                    </button>
                  ))
                : null}
            </div>
            <div className="field">
              <span>{t('scenes.includeWords')}</span>
              <p className="scene-advanced-note">
                {t('scenes.includeWordsHint', { language: languageName(nativeLanguage) })}{' '}
                {length === 'FULL' ? t('scenes.wordLimitFull') : t('scenes.wordLimitQuick')}
              </p>
              <label className="field">
                <span>{t('scenes.wordIn', { language: languageName(nativeLanguage) })}</span>
                <input
                  value={draftNative}
                  maxLength={80}
                  onChange={(event) => setDraftNative(event.target.value)}
                />
              </label>
              <button className="btn google" type="button" disabled={busy || translating || !draftNative.trim()} onClick={translateWord}>
                {translating ? t('scenes.translating') : t('scenes.translate')}
              </button>
              <label className="field">
                <span>{t('scenes.wordIn', { language: languageName(targetLanguage) })}</span>
                <input
                  value={draftTarget}
                  maxLength={80}
                  onChange={(event) => setDraftTarget(event.target.value)}
                />
              </label>
              <button
                className="btn email"
                type="button"
                disabled={busy || !draftNative.trim() || !draftTarget.trim() || terms.length >= wordCap(length)}
                onClick={addWord}
              >
                {t('scenes.addWord')}
              </button>
              {terms.map((term) => (
                <div className="scene-word" key={`${term.nativeText}-${term.targetText}`}>
                  <span>
                    {term.nativeText}
                    <small>{term.targetText}</small>
                  </span>
                  <button type="button" onClick={() => setTerms((current) => current.filter((item) => item !== term))}>
                    {t('scenes.removeWord')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {error ? <p className="error">{translateError(error)}</p> : null}
        <button className="btn email" type="submit" disabled={busy}>
          {busy ? t('scenes.writing') : t('scenes.generate')}
        </button>
      </form>
    </main>
  )
}

function wordCap(length) {
  return length === 'FULL' ? 4 : 2
}

function advancedSummary(t, length, sourceIds, terms, reviewing) {
  const parts = [length === 'FULL' ? t('scenes.summaryFull') : t('scenes.summaryQuick')]
  if (reviewing) {
    parts.push(sourceIds.length ? t('scenes.buildOnCount', { count: sourceIds.length }) : t('scenes.buildOnRecent'))
  }
  if (terms.length) {
    parts.push(t('scenes.wordCount', { count: terms.length }))
  }
  return parts.join(' · ')
}
