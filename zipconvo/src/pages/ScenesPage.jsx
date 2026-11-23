import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { LANGUAGES, languageName } from '../languages'
import { LEVELS, SCENES, generateConversation } from '../studio'

export default function ScenesPage() {
  const navigate = useNavigate()
  const [scene, setScene] = useState(null)
  const [pairs, setPairs] = useState([])
  const [nativeLanguage, setNativeLanguage] = useState('en-US')
  const [targetLanguage, setTargetLanguage] = useState('es-ES')
  const [level, setLevel] = useState('A2')
  const [customPrompt, setCustomPrompt] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

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
          <h1>Choose a scene</h1>
          <p>Pick a place. The conversation starts there.</p>
        </div>
        <div className="scene-list">
          {SCENES.map((item) => (
            <button key={item.id} className="scene-card" type="button" onClick={() => setScene(item)}>
              <img src={item.image} alt="" />
              <span>
                <h2>{item.title}</h2>
                <p>{item.line}</p>
              </span>
            </button>
          ))}
        </div>
      </main>
    )
  }

  const learned = pairs.find((pair) => pair.nativeLanguage === nativeLanguage && pair.targetLanguage === targetLanguage)

  async function onSubmit(event) {
    event.preventDefault()
    if (busy) {
      return
    }
    if (nativeLanguage === targetLanguage) {
      setError('Choose two different languages.')
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
        useLearned: Boolean(learned?.learnedCount),
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
        Back
      </button>
      <form className="scene-form" onSubmit={onSubmit}>
        <img className="scene-hero" src={scene.image} alt="" />
        <div className="screen-copy">
          <h1>{scene.title}</h1>
          <p>{scene.line}</p>
        </div>
        <label className="field">
          <span>I speak</span>
          <select value={nativeLanguage} onChange={(event) => setNativeLanguage(event.target.value)}>
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>I am learning</span>
          <select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)}>
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.name}
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          <span>Level</span>
          <div className="filters">
            {LEVELS.map((item) => (
              <button key={item} className={level === item ? 'is-on' : ''} type="button" onClick={() => setLevel(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>What should happen?</span>
          <textarea
            rows={3}
            maxLength={240}
            placeholder={scene.line}
            value={customPrompt}
            onChange={(event) => setCustomPrompt(event.target.value)}
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn email" type="submit" disabled={busy}>
          {busy ? 'Writing the conversation…' : 'Generate'}
        </button>
        <p className="rate-note">
          {languageName(nativeLanguage)} is the meaning. {languageName(targetLanguage)} is the line to say. Generating uses 1 credit.
        </p>
      </form>
    </main>
  )
}
