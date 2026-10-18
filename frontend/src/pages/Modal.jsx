import { useEffect, useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'

let scrollLocks = 0

function lockPageScroll() {
  scrollLocks += 1
  if (scrollLocks === 1) {
    document.body.dataset.modalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
}

function unlockPageScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1)
  if (scrollLocks === 0) {
    document.body.style.overflow = document.body.dataset.modalOverflow || ''
    delete document.body.dataset.modalOverflow
  }
}

export default function Modal({
  title,
  onClose,
  children,
  footer = null,
  variant = 'sheet',
  className = '',
  as: Tag = 'div',
  closeDisabled = false,
  ...rest
}) {
  const { t } = useTranslation()
  const titleId = useId()
  const rootRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    lockPageScroll()
    return unlockPageScroll
  }, [])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape' || closeDisabled) {
        return
      }
      const open = document.querySelectorAll('.modal-backdrop')
      if (open[open.length - 1] !== rootRef.current) {
        return
      }
      event.preventDefault()
      onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closeDisabled])

  return (
    <div
      ref={rootRef}
      className={`modal-backdrop modal-${variant}`}
      onClick={() => {
        if (variant === 'sheet' && !closeDisabled) {
          onClose()
        }
      }}
    >
      <Tag
        {...rest}
        className={`modal${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button
            className="modal-close"
            type="button"
            data-modal-dismiss
            aria-label={t('common.close')}
            disabled={closeDisabled}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </Tag>
    </div>
  )
}
