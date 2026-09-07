import { useTranslation } from 'react-i18next'
import { canSpeak, speak } from '../tts'

export default function SpeakButton({ text, lang }) {
  const { t } = useTranslation()
  if (!canSpeak() || !text) {
    return null
  }
  return (
    <button
      className="speak-btn"
      type="button"
      aria-label={t('study.speak')}
      title={t('study.speak')}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        speak(text, lang)
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
        />
      </svg>
    </button>
  )
}
