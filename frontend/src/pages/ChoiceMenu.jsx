import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { contrastText, normalizeHex } from '../colors'

export default function ChoiceMenu({
  id,
  label,
  labelledBy,
  ariaLabel,
  value,
  options,
  onChange,
  disabled = false,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const labelId = useId()
  const valueId = useId()
  const listId = useId()
  const selected = options.find((option) => option.value === value) || null
  const currentLabel = selected?.label || value || ''
  const selectedBackground = selected?.color ? normalizeHex(selected.color) : undefined
  const selectedColor = selectedBackground ? contrastText(selectedBackground) : undefined

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
      event.stopPropagation()
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

  useLayoutEffect(() => {
    if (!open) {
      return undefined
    }
    function place() {
      const trigger = triggerRef.current
      const menu = menuRef.current
      if (!trigger || !menu) {
        return
      }
      const rect = trigger.getBoundingClientRect()
      const gap = 4
      const menuHeight = menu.offsetHeight
      let top = rect.bottom + gap
      if (top + menuHeight > window.innerHeight - 8 && rect.top - gap - menuHeight > 8) {
        top = rect.top - gap - menuHeight
      }
      menu.style.top = `${Math.max(8, top)}px`
      menu.style.left = `${Math.max(8, rect.left)}px`
      menu.style.width = `${rect.width}px`
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, options])

  useEffect(() => {
    if (!open) {
      return undefined
    }
    const frame = window.requestAnimationFrame(() => {
      const current = menuRef.current?.querySelector('.choice-option.is-selected')
      current?.focus()
      current?.scrollIntoView({ block: 'nearest' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  function choose(next) {
    onChange(next)
    setOpen(false)
    window.requestAnimationFrame(() => triggerRef.current?.focus())
  }

  function onListKeyDown(event) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') {
      return
    }
    const items = [...event.currentTarget.querySelectorAll('.choice-option')]
    if (items.length === 0) {
      return
    }
    event.preventDefault()
    const index = items.indexOf(document.activeElement)
    let next = 0
    if (event.key === 'ArrowDown') {
      next = index < 0 ? 0 : (index + 1) % items.length
    } else if (event.key === 'ArrowUp') {
      next = index <= 0 ? items.length - 1 : index - 1
    } else if (event.key === 'End') {
      next = items.length - 1
    }
    items[next]?.focus()
  }

  const spokenName = [ariaLabel, currentLabel].filter((part, index, parts) => part && parts.indexOf(part) === index)
  const nameProps = label
    ? { 'aria-labelledby': `${labelId} ${valueId}` }
    : labelledBy
      ? { 'aria-labelledby': `${labelledBy} ${valueId}` }
      : { 'aria-label': spokenName.join(', ') }

  return (
    <div className={`choice-field${className ? ` ${className}` : ''}`} ref={rootRef}>
      {label ? (
        <label id={labelId} htmlFor={id}>
          {label}
        </label>
      ) : null}
      <button
        ref={triggerRef}
        id={id}
        className={`choice-trigger${selectedBackground ? ' is-colored' : ''}`}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        style={
          selectedBackground
            ? { background: `color-mix(in srgb, ${selectedBackground} 80%, transparent)`, color: selectedColor }
            : undefined
        }
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current)
          }
        }}
        {...nameProps}
      >
        <span className="choice-value" id={valueId}>
          {currentLabel}
        </span>
        {selectedBackground ? (
          <svg className="choice-check" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        ) : null}
        <span className="choice-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      {open ? (
        <div ref={menuRef} className="choice-menu">
          <div
            id={listId}
            className="choice-list"
            role="listbox"
            aria-labelledby={label ? labelId : labelledBy}
            aria-label={!label && !labelledBy ? ariaLabel : undefined}
            onKeyDown={onListKeyDown}
          >
            {options.map((option) => {
              const isSelected = option.value === value
              const background = option.color ? normalizeHex(option.color) : undefined
              return (
                <button
                  key={String(option.value) || option.label}
                  className={`choice-option${background ? ' is-colored' : ''}${isSelected ? ' is-selected' : ''}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  title={background ? option.label : undefined}
                  style={
                    background
                      ? { background: `color-mix(in srgb, ${background} 80%, transparent)`, color: contrastText(background) }
                      : undefined
                  }
                  onClick={() => choose(option.value)}
                >
                  <span className="choice-option-label">{option.label}</span>
                  {isSelected ? (
                    <svg className="choice-check" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
