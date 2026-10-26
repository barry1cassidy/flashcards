import { Capacitor } from '@capacitor/core'
import { useTranslation } from 'react-i18next'
import { speechLanguageListUrl } from '../speechPrefs'

export default function SpeechLanguagesNote({ className = 'speech-languages-note' }) {
  const { t } = useTranslation()
  // A new-window link is ignored by the Android WebView. A normal tap to another
  // site is handed to the system browser on both Android and iOS.
  const native = Capacitor.isNativePlatform()
  return (
    <p className={className}>
      {t('listen.speechEngine')}{' '}
      <a href={speechLanguageListUrl()} {...(native ? {} : { target: '_blank', rel: 'noreferrer' })}>
        {t('listen.speechLanguages')}
      </a>
    </p>
  )
}
