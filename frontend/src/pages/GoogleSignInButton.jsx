import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { currentLocale, localeBcp47 } from '../i18n'

const GIS_SRC = 'https://accounts.google.com/gsi/client'

export function getGoogleClientId() {
  return String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
}

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id)
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`)
    const script = existing || document.createElement('script')
    function onReady() {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id)
      } else {
        reject(new Error('Google sign-in failed to load'))
      }
    }
    script.addEventListener('load', onReady, { once: true })
    script.addEventListener('error', () => reject(new Error('Google sign-in failed to load')), { once: true })
    if (!existing) {
      script.src = GIS_SRC
      script.async = true
      document.head.appendChild(script)
    } else if (window.google?.accounts?.id) {
      onReady()
    }
  })
}

export default function GoogleSignInButton({ onCredential, disabled }) {
  const { t } = useTranslation()
  const hostRef = useRef(null)
  const onCredentialRef = useRef(onCredential)
  const [loadError, setLoadError] = useState('')
  const clientId = getGoogleClientId()
  const locale = localeBcp47(currentLocale())

  onCredentialRef.current = onCredential

  useEffect(() => {
    if (!clientId) {
      return undefined
    }
    let cancelled = false
    const host = hostRef.current
    setLoadError('')

    loadGoogleIdentity()
      .then((accounts) => {
        if (cancelled || !host) {
          return
        }
        host.replaceChildren()
        accounts.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onCredentialRef.current(response.credential)
            }
          },
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
        })
        accounts.renderButton(host, {
          type: 'standard',
          theme: document.documentElement.dataset.theme === 'light' ? 'outline' : 'filled_black',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: Math.min(400, Math.max(240, host.clientWidth || 320)),
          locale,
        })
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error.message)
        }
      })

    return () => {
      cancelled = true
      host?.replaceChildren()
    }
  }, [clientId, locale])

  if (!clientId) {
    return null
  }

  return (
    <div className={`google-signin ${disabled ? 'is-busy' : ''}`}>
      <div ref={hostRef} className="google-signin-host" />
      {loadError ? <p className="error">{t('errors.googleFailedToLoad')}</p> : null}
    </div>
  )
}
