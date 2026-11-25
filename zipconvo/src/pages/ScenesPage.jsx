import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import ChoiceMenu from '../ChoiceMenu'
import { translateError } from '../i18n/errors'
import { LANGUAGES } from '../languages'
import { LEVELS, SCENES, generateConversation } from '../studio'

export default function ScenesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [scene, setScene] = useState(null)
  const [pairs, setPairs] = useState([])
  const [nativeLanguage, setNativeLanguage] = useState('en-US')
  const [targetLanguage, setTargetLanguage] = useState('es-ES')
  const [level, setLevel] = useState('A2')
  const [customPrompt, setCustomPrompt] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [useLearned, setUseLearned] = useState(true)

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

  if (!scene) {
    return (
      <main className="screen">
        <div className="screen-copy">
          <h1>{t('scenes.title')}</h1>
          <p>{t('scenes.lede')}</p>
        </div>
        <div className="scene-list">
          {SCENES.map((item) => (
            <button key={item.id} className="scene-card" type="button" onClick={() => setScene(item)}>
              <img src={item.image} alt="" />
              <span>
                <h2>{t(`scenes.${item.id}Title`)}</h2>
              </span>
            </button>
          ))}
        </div>
        <button className="scene-own" type="button" onClick={() => setScene({ id: 'custom' })}>
          {t('scenes.describeOwn')}
        </button>
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
