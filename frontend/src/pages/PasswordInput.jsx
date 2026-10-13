import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function PasswordInput(props) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  return (
    <span className="password-field">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        className="password-toggle"
        type="button"
        aria-pressed={visible}
        aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </span>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M3 4l18 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.5 6.4A10 10 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3.2 3.8M6.1 8.2C3.8 9.8 2 12 2 12s3.5 6 10 6c1.4 0 2.7-.3 3.8-.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
