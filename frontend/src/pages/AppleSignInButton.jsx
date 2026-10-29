import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { appleSignInAvailable, signInWithApple } from '../appleSignIn'
import { translateError } from '../i18n/errors'

function AppleMark() {
  return (
    <span className="apple-signin-mark" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 17" width="16" height="19">
        <path
          fill="currentColor"
          d="M11.8 9.1c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.9-3.5 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.6.7 2.8.7c1.2 0 1.9-1 2.6-2 .8-1.1 1.1-2.2 1.1-2.3 0 0-2.2-.8-2.2-3.3zM9.7 3.2c.6-.7 1-1.7.9-2.7-1 .1-2.1.6-2.8 1.4-.6.6-1.1 1.7-.9 2.6 1.1.1 2.2-.5 2.8-1.3z"
        />
      </svg>
    </span>
  )
}

export default function AppleSignInButton({ onCredential, disabled }) {
  const { t } = useTranslation()
  const [loadError, setLoadError] = useState('')

  if (!appleSignInAvailable()) {
    return null
  }

  async function onClick() {
    if (disabled) {
      return
    }
    setLoadError('')
    try {
      const result = await signInWithApple()
      if (result?.canceled) {
        return
      }
      if (result?.identityToken) {
        onCredential(result)
        return
      }
      setLoadError('Invalid Apple sign-in')
    } catch (error) {
      const message = String(error?.message || '').trim()
      const lower = message.toLowerCase()
      if (lower.includes('cancel')) {
        return
      }
      setLoadError(message || 'Invalid Apple sign-in')
    }
  }

  return (
    <div className={`apple-signin ${disabled ? 'is-busy' : ''}`}>
      <button className="apple-signin-btn" type="button" disabled={disabled} onClick={onClick}>
        <AppleMark />
        <span>{t('auth.continueWithApple')}</span>
      </button>
      {loadError ? <p className="error">{translateError(t, loadError)}</p> : null}
    </div>
  )
}
