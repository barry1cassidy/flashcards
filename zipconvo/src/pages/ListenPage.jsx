import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { languageName } from '../languages'
import { placeLabel } from '../studio'

export default function ListenPage() {
  const { id } = useParams()
  if (id) {
    return <ListenPlayer id={id} />
  }
  return <ListenList />
}

function ListenList() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api('/api/language-studio/conversations')
      .then((rows) => {
        if (!cancelled) {
          setItems(rows || [])
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="screen">
      <div className="screen-copy">
        <h1>Listen</h1>
        <p>Hear both sides of a conversation, with a pause before the next line.</p>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="empty">Loading…</p> : null}
      {!loading && items.length === 0 ? (
        <p className="empty">
          No conversations yet. <Link to="/scenes">Choose a scene</Link>
        </p>
      ) : null}
      <div className="conversation-list">
        {items.map((item) => (
          <Link key={item.id} className="conversation-card" to={`/listen/${item.id}`}>
            <div className="card-title">
              <h2>{item.title}</h2>
              <span className="pill">{item.level}</span>
            </div>
            <p className="card-meta">
              {placeLabel(item.scenario)} · {languageName(item.nativeLanguage)} → {languageName(item.targetLanguage)}
            </p>
            <span className="card-action">Listen</span>
          </Link>
        ))}
      </div>
    </main>
  )
}

function ListenPlayer({ id }) {
  const navigate = useNavigate()
  const [conversation, setConversation] = useState(null)
  const [error, setError] = useState('')
  const [index, setIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const stopRef = useRef(false)

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
      stopRef.current = true
      window.speechSynthesis?.cancel()
    }
  }, [id])

  async function play() {
    if (!conversation || playing || !window.speechSynthesis) {
      if (!window.speechSynthesis) {
        setError('This browser cannot speak aloud.')
      }
      return
    }
    stopRef.current = false
    setPlaying(true)
    setError('')
    const turns = conversation.turns || []
    for (let i = 0; i < turns.length; i += 1) {
      if (stopRef.current) {
        break
      }
      setIndex(i)
      const turn = turns[i]
      await speak(turn.targetText, conversation.targetLanguage)
      if (stopRef.current) {
        break
      }
      await pause(900)
      await speak(turn.nativeText, conversation.nativeLanguage)
      if (stopRef.current) {
        break
      }
      await pause(1200)
    }
    setPlaying(false)
    if (!stopRef.current) {
      setIndex(turns.length)
    }
  }

  function stop() {
    stopRef.current = true
    window.speechSynthesis?.cancel()
    setPlaying(false)
  }

  const turns = conversation?.turns || []
  const current = index >= 0 && index < turns.length ? turns[index] : null

  return (
    <main className="screen">
      <button className="back" type="button" onClick={() => navigate('/listen')}>
        Back
      </button>
      {!conversation && !error ? <p className="empty">Loading…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {conversation ? (
        <>
          <div className="screen-copy">
            <h1>{conversation.title}</h1>
            <p>
              {playing ? `Line ${index + 1} of ${turns.length}` : 'Plays the line, then the meaning.'}
            </p>
          </div>
          {current ? (
            <article className={`turn ${current.role === 'you' ? 'you' : 'them'}`}>
              <p className="speaker">{current.speaker}</p>
              <p className="line">{current.targetText}</p>
              <p className="meaning">{current.nativeText}</p>
            </article>
          ) : null}
          {index >= turns.length ? <p className="empty">That’s the end of the scene.</p> : null}
          <div className="practice-bar">
            {playing ? (
              <button className="btn google" type="button" onClick={stop}>
                Stop
              </button>
            ) : (
              <button className="btn email" type="button" onClick={play}>
                {index >= turns.length ? 'Play again' : 'Play'}
              </button>
            )}
          </div>
        </>
      ) : null}
    </main>
  )
}

function speak(text, lang) {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    window.speechSynthesis.speak(utterance)
  })
}

function pause(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
