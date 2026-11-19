import { useLayoutEffect, useRef, useState } from 'react'

export default function DeckTitle({ name }) {
  const ref = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const [trackedName, setTrackedName] = useState(name)

  if (name !== trackedName) {
    setTrackedName(name)
    setExpanded(false)
  }

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || expanded) {
      return undefined
    }
    const measure = () => {
      const next = el.scrollHeight > el.clientHeight + 1
      setOverflows((current) => (current === next ? current : next))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    let canceled = false
    document.fonts?.ready?.then(() => {
      if (!canceled) measure()
    })
    return () => {
      canceled = true
      observer.disconnect()
    }
  }, [name, expanded, overflows])

  if (overflows || expanded) {
    return (
      <h1>
        <button
          ref={ref}
          type="button"
          className={expanded ? 'deck-title-text is-expanded' : 'deck-title-text'}
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
        >
          {name}
        </button>
      </h1>
    )
  }

  return (
    <h1>
      <span ref={ref} className="deck-title-text">
        {name}
      </span>
    </h1>
  )
}
