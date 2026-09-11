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

function GoogleMark() {
  return (
    <span className="google-signin-g" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18" height="18">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
    </span>
  )
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
    let observer
    setLoadError('')

    loadGoogleIdentity()
      .then((accounts) => {
        if (cancelled) {
          return
        }
        const host = hostRef.current
        if (!host) {
          return
        }
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

        function paint() {
          const host = hostRef.current
          if (cancelled || !host) {
            return
          }
          const width = Math.min(400, Math.max(240, Math.floor(host.clientWidth) || 320))
          if (width === host.dataset.gisWidth && host.childElementCount) {
            return
          }
          host.dataset.gisWidth = String(width)
          host.replaceChildren()
          accounts.renderButton(host, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width,
            locale,
          })
        }

        paint()
        observer = new ResizeObserver(paint)
        observer.observe(host)
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error.message)
        }
      })

    return () => {
      cancelled = true
      observer?.disconnect()
      hostRef.current?.replaceChildren()
    }
  }, [clientId, locale])

  if (!clientId) {
    return null
  }

  return (
    <div className={`google-signin ${disabled ? 'is-busy' : ''}`}>
      <div className="google-signin-shell">
        <div className="google-signin-face" aria-hidden="true">
          <GoogleMark />
          <span>{t('auth.continueWithGoogle')}</span>
        </div>
        <div ref={hostRef} className="google-signin-host" />
      </div>
      {loadError ? <p className="error">{t('errors.googleFailedToLoad')}</p> : null}
    </div>
  )
}
