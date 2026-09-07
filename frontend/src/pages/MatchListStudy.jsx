import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

const BOARD_SIZE = 6

export default function MatchListStudy({ cards, onGrade, onComplete }) {
  const { t } = useTranslation()
  const [board, setBoard] = useState([])
  const [left, setLeft] = useState([])
  const [right, setRight] = useState([])
  const [matched, setMatched] = useState(() => new Set())
  const [misses, setMisses] = useState(() => new Set())
  const [pick, setPick] = useState(null)
  const [flash, setFlash] = useState(null)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    setMatched(new Set())
    setMisses(new Set())
    setPick(null)
    setFlash(null)
    deal(cards)
  }, [cards])

  function deal(source, alreadyMatched = new Set()) {
    const next = source.filter((card) => !alreadyMatched.has(card.id)).slice(0, BOARD_SIZE)
    setBoard(next)
    setLeft(shuffle(next))
    setRight(shuffle(next))
  }

  const remaining = useMemo(
    () => cards.filter((card) => !matched.has(card.id)).length,
    [cards, matched],
  )

  async function onPick(side, card) {
    if (locked || matched.has(card.id) || flash) {
      return
    }
    if (!pick) {
      setPick({ side, id: card.id })
      return
    }
    if (pick.side === side) {
      setPick({ side, id: card.id })
      return
    }
    setLocked(true)
    if (pick.id === card.id) {
      const rating = misses.has(card.id) ? 'AGAIN' : 'GOOD'
      setFlash({ type: 'correct', ids: [card.id] })
      try {
        await onGrade(card, rating)
        const nextMatched = new Set(matched).add(card.id)
        setMatched(nextMatched)
        setPick(null)
        setFlash(null)
        const leftover = board.filter((item) => !nextMatched.has(item.id))
        if (nextMatched.size >= cards.length) {
          onComplete()
        } else if (leftover.length === 0) {
          deal(cards, nextMatched)
        }
      } catch {
        setPick(null)
        setFlash(null)
      } finally {
        setLocked(false)
      }
      return
    }

    setFlash({ type: 'wrong', ids: [pick.id, card.id] })
    setMisses((current) => new Set(current).add(pick.id).add(card.id))
    await wait(450)
    setPick(null)
    setFlash(null)
    setLocked(false)
  }

  return (
    <div className="match-stage">
      <p className="match-cue muted">{t('study.matchCue')}</p>
      <div className="match-board">
        <div className="match-col">
          <div className="eyebrow">{t('study.matchPrompt')}</div>
          {left.map((card) => (
            <MatchTile
              key={`left-${card.id}`}
              label={card.front}
              selected={pick?.side === 'left' && pick.id === card.id}
              matched={matched.has(card.id)}
              flash={flash?.ids.includes(card.id) ? flash.type : null}
              onClick={() => onPick('left', card)}
            />
          ))}
        </div>
        <div className="match-col">
          <div className="eyebrow">{t('study.matchAnswer')}</div>
          {right.map((card) => (
            <MatchTile
              key={`right-${card.id}`}
              label={card.back}
              selected={pick?.side === 'right' && pick.id === card.id}
              matched={matched.has(card.id)}
              flash={flash?.ids.includes(card.id) ? flash.type : null}
              onClick={() => onPick('right', card)}
            />
          ))}
        </div>
      </div>
      {remaining === 0 ? null : <p className="muted match-left">{t('study.matchLeft', { count: remaining })}</p>}
    </div>
  )
}

function MatchTile({ label, selected, matched, flash, onClick }) {
  const className = [
    'match-tile',
    selected ? 'selected' : '',
    matched ? 'matched' : '',
    flash === 'correct' ? 'correct' : '',
    flash === 'wrong' ? 'wrong' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button className={className} type="button" disabled={matched} onClick={onClick}>
      {label}
    </button>
  )
}

function shuffle(items) {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const swap = next[i]
    next[i] = next[j]
    next[j] = swap
  }
  return next
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
