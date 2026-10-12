import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function ExampleDeck({ cards, accent }) {
  const [phase, setPhase] = useState(0)
  const [paused, setPaused] = useState(false)
  const index = Math.floor(phase / 2) % cards.length
  const flipped = phase % 2 === 1
  const card = cards[index]

  useEffect(() => {
    if (paused || cards.length < 2) {
      return undefined
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }
    const timer = window.setInterval(() => {
      setPhase((current) => current + 1)
    }, 3200)
    return () => window.clearInterval(timer)
  }, [paused, cards.length])

  function show(next) {
    setPaused(true)
    setPhase(next * 2)
  }

  return (
    <div className="guide-stage">
      <button
        type="button"
        className={`guide-flip${flipped ? ' is-flipped' : ''}`}
        style={{ '--guide-accent': accent }}
        aria-pressed={flipped}
        onClick={() => {
          setPaused(true)
          setPhase((current) => (current % 2 === 1 ? current - 1 : current + 1))
        }}
      >
        <span className="guide-flip-inner">
          <span className="guide-face guide-front" aria-hidden={flipped}>
            <span className="guide-kind">{card.kind}</span>
            {card.frontNote ? <span className="guide-who">{card.frontNote}</span> : null}
            <span className="guide-line">{card.front}</span>
            <span className="guide-tap">Tap to flip</span>
          </span>
          <span className="guide-face guide-back" aria-hidden={!flipped}>
            <span className="guide-kind">Answer</span>
            <span className="guide-line">{card.back}</span>
            {card.backSub ? <span className="guide-sub">{card.backSub}</span> : null}
            {card.hint ? <span className="guide-hint">{card.hint}</span> : null}
          </span>
        </span>
      </button>
      <div className="guide-dots" role="tablist" aria-label="Example cards">
        {cards.map((item, itemIndex) => (
          <button
            key={item.kind}
            type="button"
            role="tab"
            aria-selected={itemIndex === index}
            className={itemIndex === index ? 'is-active' : undefined}
            onClick={() => show(itemIndex)}
          >
            {item.kind}
          </button>
        ))}
      </div>
    </div>
  )
}

export function RichText({ parts }) {
  return parts.map((part, index) => {
    if (typeof part === 'string') {
      return <span key={index}>{part}</span>
    }
    if (part.to) {
      return (
        <Link key={index} to={part.to}>
          {part.t}
        </Link>
      )
    }
    return (
      <a key={index} href={part.h} target="_blank" rel="noreferrer">
        {part.t}
      </a>
    )
  })
}
