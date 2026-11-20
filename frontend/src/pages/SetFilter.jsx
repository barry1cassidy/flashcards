import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { contrastText, normalizeHex } from '../colors'
import { GroupBadge } from './ColorPicker'

export default function SetFilter({ groups, value, onChange }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const labelId = useId()
  const valueId = useId()
  const listId = useId()
  const label = t('decks.filterGroup')
  const allLabel = t('decks.allGroups')
  const selected = groups.find((group) => String(group.id) === value) || null

  useEffect(() => {
    if (!open) {
      return undefined
    }
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    function onKeyDown(event) {
      if (event.key !== 'Escape') {
        return
      }
      event.preventDefault()
      setOpen(false)
      window.requestAnimationFrame(() => triggerRef.current?.focus())
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return undefined
    }
    const frame = window.requestAnimationFrame(() => {
      const current = rootRef.current?.querySelector('.set-filter-option.is-selected')
      current?.focus()
      current?.scrollIntoView({ block: 'nearest' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  function close() {
    setOpen(false)
    window.requestAnimationFrame(() => triggerRef.current?.focus())
  }

  function choose(next) {
    onChange(next)
    close()
  }

  function onListKeyDown(event) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') {
      return
    }
    const options = [...event.currentTarget.querySelectorAll('.set-filter-option')]
    if (options.length === 0) {
      return
    }
    event.preventDefault()
    const index = options.indexOf(document.activeElement)
    let next = 0
    if (event.key === 'ArrowDown') {
      next = index < 0 ? 0 : (index + 1) % options.length
    } else if (event.key === 'ArrowUp') {
      next = index <= 0 ? options.length - 1 : index - 1
    } else if (event.key === 'End') {
      next = options.length - 1
    }
    options[next]?.focus()
  }

  const list = (
    <div
      id={listId}
      className="set-filter-list"
      role="listbox"
      aria-labelledby={labelId}
      onKeyDown={onListKeyDown}
    >
      <SetFilterOption selected={!selected} onClick={() => choose('')}>
        {allLabel}
      </SetFilterOption>
      {groups.map((group) => (
        <SetFilterOption
          key={group.id}
          group={group}
          selected={String(group.id) === value}
          onClick={() => choose(String(group.id))}
        />
      ))}
    </div>
  )

  return (
    <div className="deck-filter" ref={rootRef}>
      <label className="set-filter-label" id={labelId} htmlFor={`${listId}-trigger`}>
        {label}
      </label>
      <button
        ref={triggerRef}
        id={`${listId}-trigger`}
        className="set-filter-trigger"
        type="button"
        aria-labelledby={`${labelId} ${valueId}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="set-filter-value" id={valueId}>
          {selected ? <GroupBadge group={selected} /> : allLabel}
        </span>
        <span className="set-filter-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      {open ? <div className="set-filter-menu">{list}</div> : null}
    </div>
  )
}

function SetFilterOption({ group, selected, onClick, children }) {
  const background = group ? normalizeHex(group.color) : undefined
  const color = background ? contrastText(background) : undefined
  return (
    <button
      className={`set-filter-option${group ? ' is-colored' : ''}${selected ? ' is-selected' : ''}`}
      type="button"
      role="option"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      title={group ? group.name : undefined}
      style={group ? { background: `color-mix(in srgb, ${background} 80%, transparent)`, color } : undefined}
      onClick={onClick}
    >
      <span className="set-filter-option-label">{group ? group.name : children}</span>
      {selected ? (
        <svg className="set-filter-check" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      ) : null}
    </button>
  )
}
