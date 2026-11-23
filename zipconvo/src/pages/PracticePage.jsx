import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { languageName } from '../languages'
import { GRADES } from '../studio'

export default function PracticePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [conversation, setConversation] = useState(null)
  const [error, setError] = useState('')
  const [turn, setTurn] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [rating, setRating] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    api(`/api/language-studio/conversations/${id}`)
      .then((found) => {
        if (!cancelled) {
          setConversation(found)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (error) {
    return (
      <main className="screen">
        <p className="error">{error}</p>
        <Link className="btn email" to="/conversations">
          Back to conversations
        </Link>
      </main>
    )
  }

  if (!conversation) {
    return (
      <main className="screen">
        <p className="empty">Loading…</p>
      </main>
    )
  }

  const turns = conversation.turns || []
  const last = turn + 1 >= turns.length
  const shown = turns.slice(0, turn + 1)
  const current = shown[turn]

  function nextTurn() {
    if (last) {
      setRating(true)
      return
    }
    setTurn((value) => value + 1)
    setRevealed(false)
  }

  async function choose(status) {
    if (saving) {
      return
    }
    setSaving(true)
    setError('')
    try {
      await api(`/api/language-studio/conversations/${conversation.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      navigate('/conversations')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <main className="screen practice">
      <button className="back" type="button" onClick={() => (rating ? setRating(false) : navigate('/conversations'))}>
        Back
      </button>
      {error ? <p className="error">{error}</p> : null}

      {rating ? (
        <div className="rate">
          <div className="screen-copy">
            <h1>How did that conversation go?</h1>
            <p>{conversation.title}. Grade the whole scene, not each line.</p>
          </div>
          <div className="rate-list">
            {GRADES.map((option) => (
              <button
                key={option.status}
                className={`rate-choice grade-${option.status.toLowerCase()}`}
                type="button"
                disabled={saving}
                onClick={() => choose(option.status)}
              >
                <span>{option.label}</span>
                <small>{option.hint}</small>
              </button>
            ))}
          </div>
          <p className="rate-note">Fully learned is the one that stays with you. A later conversation can bring those words back. Still practicing keeps the scene in the list you are working through.</p>
        </div>
      ) : (
        <>
          <div className="screen-copy">
            <h1>{conversation.title}</h1>
            <p>
              Turn {turn + 1} of {turns.length}. You play the {conversation.yourRole}. {languageName(conversation.nativeLanguage)} is the
              meaning; {languageName(conversation.targetLanguage)} is the line to say.
            </p>
          </div>
          <div className="chat" aria-live="polite">
            {shown.map((item, index) => {
              const yours = item.role === 'you'
              const open = !yours || index < turn || revealed
              return (
                <article key={`${item.speaker}-${index}`} className={`turn ${yours ? 'you' : 'them'}`}>
                  <p className="speaker">{item.speaker}</p>
                  {yours ? (
                    <>
                      <p className="line">{item.nativeText}</p>
                      {open ? (
                        <p className="meaning">{item.targetText}</p>
                      ) : (
                        <p className="meaning">Say the {languageName(conversation.targetLanguage)}, then reveal.</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="line">{item.targetText}</p>
                      <p className="meaning">{item.nativeText}</p>
                    </>
                  )}
                </article>
              )
            })}
          </div>
          <div className="practice-bar">
            {current?.role === 'you' && !revealed ? (
              <button className="btn email" type="button" onClick={() => setRevealed(true)}>
                Reveal {languageName(conversation.targetLanguage)}
              </button>
            ) : (
              <button className="btn email" type="button" onClick={nextTurn}>
                {last ? 'Finish' : 'Next turn'}
              </button>
            )}
          </div>
        </>
      )}
    </main>
  )
}
