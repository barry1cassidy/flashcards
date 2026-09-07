import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const MODES = [
  { id: 'flip', titleKey: 'study.flip', hintKey: 'study.flipHint' },
  { id: 'quiz', titleKey: 'study.quiz', hintKey: 'study.quizHint' },
  { id: 'write', titleKey: 'study.write', hintKey: 'study.writeHint' },
  { id: 'match', titleKey: 'study.match', hintKey: 'study.matchHint' },
  { id: 'audio', titleKey: 'study.audio', hintKey: 'study.audioHint' },
]

export default function StudyModeModal({ onSelect, onCancel, hint, hardCount = 0 }) {
  const { t } = useTranslation()

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal study-mode-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-mode-title"
      >
        <div className="modal-header">
          <h2 id="study-mode-title">{t('study.selectMode')}</h2>
          <button className="modal-close" type="button" aria-label={t('common.close')} onClick={onCancel}>
            ×
          </button>
        </div>
        {hint ? <p className="muted">{hint}</p> : null}
        <div className="study-mode-list">
          {MODES.map((mode) => (
            <button key={mode.id} className="study-mode-item" type="button" onClick={() => onSelect(mode.id)}>
              <ModeIcon name={mode.id} />
              <span className="study-mode-copy">
                <strong>{t(mode.titleKey)}</strong>
                <span>{t(mode.hintKey)}</span>
              </span>
              <span className="study-mode-chevron" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
          {hardCount > 0 ? (
            <button
              className="study-mode-item study-hard-item"
              type="button"
              onClick={() => onSelect('flip', 'hard')}
            >
              <ModeIcon name="hard" />
              <span className="study-mode-copy">
                <strong>{t('study.studyHard')}</strong>
                <span>{t('study.studyHardHint')}</span>
              </span>
              <span className="study-mode-chevron" aria-hidden="true">
                ›
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ModeIcon({ name }) {
  return (
    <svg className="study-mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {name === 'quiz' ? (
        <>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 12l2.5 2.5L16 9" />
        </>
      ) : name === 'write' ? (
        <path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4" />
      ) : name === 'match' ? (
        <>
          <path d="M4 7h7M4 12h7M4 17h7" />
          <path d="M13 7h7M13 12h7M13 17h7" />
        </>
      ) : name === 'audio' ? (
        <>
          <path d="M5 13a7 7 0 0 1 14 0" />
          <rect x="3.5" y="13" width="4" height="7" rx="1.5" />
          <rect x="16.5" y="13" width="4" height="7" rx="1.5" />
        </>
      ) : name === 'hard' ? (
        <path d="M4 18l5-8 3 4 3-6 5 10H4z" />
      ) : (
        <>
          <rect x="4" y="5" width="12" height="14" rx="2" />
          <path d="M8 9h4M8 13h6" />
        </>
      )}
    </svg>
  )
}
