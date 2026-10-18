import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { isProLicensed } from '../pro'
import Modal from './Modal'

const MODES = [
  { id: 'flip', titleKey: 'study.flip', hintKey: 'study.flipHint' },
  { id: 'quiz', titleKey: 'study.quiz', hintKey: 'study.quizHint' },
  { id: 'write', titleKey: 'study.write', hintKey: 'study.writeHint' },
  { id: 'match', titleKey: 'study.match', hintKey: 'study.matchHint' },
  { id: 'audio', titleKey: 'study.audio', hintKey: 'study.audioHint' },
  { id: 'rehearse', titleKey: 'study.rehearse', hintKey: 'study.rehearseHint', pro: true },
]

export default function StudyModeModal({ onSelect, onCancel, hint, hardCount = 0, againCount = 0 }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const pro = isProLicensed(user)

  function pickMode(mode, filter) {
    if (mode === 'rehearse' && !pro) {
      onCancel()
      navigate('/pro')
      return
    }
    onSelect(mode, filter)
  }

  return (
    <Modal variant="sheet" className="study-mode-modal" title={t('study.selectMode')} onClose={onCancel}>
        {hint ? <p className="muted">{hint}</p> : null}
        <div className="study-mode-list">
          {MODES.map((mode) => (
            <button key={mode.id} className="study-mode-item" type="button" onClick={() => pickMode(mode.id)}>
              <ModeIcon name={mode.id} />
              <span className="study-mode-copy">
                <strong>
                  {t(mode.titleKey)}
                  {mode.pro ? <span className="study-mode-pro">{t('settings.proBadge')}</span> : null}
                </strong>
                <span>{t(mode.hintKey)}</span>
              </span>
              <span className="study-mode-chevron" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
          {againCount > 0 ? (
            <button
              className="study-mode-item study-extra-item study-again-item"
              type="button"
              onClick={() => pickMode('flip', 'again')}
            >
              <ModeIcon name="again" />
              <span className="study-mode-copy">
                <strong>{t('study.studyAgainCards')}</strong>
                <span>{t('study.studyAgainHint')}</span>
              </span>
              <span className="study-mode-chevron" aria-hidden="true">
                ›
              </span>
            </button>
          ) : null}
          {hardCount > 0 ? (
            <button
              className={`study-mode-item study-extra-item study-hard-item${againCount > 0 ? ' is-follow-on' : ''}`}
              type="button"
              onClick={() => pickMode('flip', 'hard')}
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
    </Modal>
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
      ) : name === 'rehearse' ? (
        <>
          <path d="M5 6h14" />
          <path d="M5 12h10" />
          <path d="M5 18h14" />
          <path d="M17 10l3 2-3 2v-4z" />
        </>
      ) : name === 'again' ? (
        <path d="M7 7H3v4M3.5 11A8 8 0 1 0 7 5.3" />
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
