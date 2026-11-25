import { Capacitor } from '@capacitor/core'
import { ErrorCode, GoogleSignIn as NativeGoogleSignIn } from '@capawesome/capacitor-google-sign-in'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { localeBcp47 } from './i18n'
import { translateError } from './i18n/errors'

let nativeGoogleReady

const GIS_SRC = 'https://accounts.google.com/gsi/client'

export function googleClientId() {
  return String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
}

function loadGoogle() {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id)
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`)
    const script = existing || document.createElement('script')
    function ready() {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id)
      } else {
        reject(new Error('Google sign-in failed to load'))
      }
    }
    script.addEventListener('load', ready, { once: true })
    script.addEventListener('error', () => reject(new Error('Google sign-in failed to load')), { once: true })
    if (!existing) {
      script.src = GIS_SRC
      script.async = true
      document.head.appendChild(script)
    } else if (window.google?.accounts?.id) {
      ready()
    }
  })
}

function ensureNativeGoogle(clientId) {
  if (!nativeGoogleReady) {
    nativeGoogleReady = NativeGoogleSignIn.initialize({ clientId })
  }
  return nativeGoogleReady
}

function nativeSignInError(error) {
  const code = String(error?.code || '')
  const message = String(error?.message || '').trim()
  const lower = message.toLowerCase()
  if (lower.includes('reauth') || lower.includes('unregistered')) {
    return message
  }
  if (code === ErrorCode.SignInCanceled || code === 'SIGN_IN_CANCELED' || lower.includes('cancel')) {
    return ''
  }
  return message || 'Google sign-in failed to load'
}

export default function GoogleSignIn({ onCredential, disabled, children }) {
  const hostRef = useRef(null)
  const onCredentialRef = useRef(onCredential)
  const [error, setError] = useState('')
  const { i18n, t } = useTranslation()
  const clientId = googleClientId()
  const locale = localeBcp47(i18n.language)
  const native = Capacitor.isNativePlatform()
  onCredentialRef.current = onCredential

  useEffect(() => {
    if (!clientId || native) {
      return undefined
    }
    let cancelled = false
    loadGoogle()
      .then((accounts) => {
        if (cancelled || !hostRef.current) {
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
        const width = Math.min(400, Math.max(280, Math.floor(hostRef.current.clientWidth) || 320))
        hostRef.current.replaceChildren()
        accounts.renderButton(hostRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width,
          locale,
        })
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [clientId, locale, native])

  async function onNativeClick() {
    if (!clientId || disabled) {
      return
    }
    setError('')
    try {
      await ensureNativeGoogle(clientId)
      try {
        await NativeGoogleSignIn.signOut()
      } catch {
        // No previous Google session.
      }
      const result = await NativeGoogleSignIn.signIn()
      if (result?.idToken) {
        onCredentialRef.current(result.idToken)
      } else {
        setError('Google sign-in failed to load')
      }
    } catch (err) {
      const shown = nativeSignInError(err)
      if (shown) {
        setError(shown)
      }
    }
  }

  if (native) {
    return (
      <div className={`google-signin${disabled ? ' is-busy' : ''}`}>
        <button className="btn google google-signin-native" type="button" disabled={disabled || !clientId} onClick={onNativeClick}>
          {children}
        </button>
        {!clientId ? <p className="error">{t('errors.googleNotConfigured')}</p> : null}
        {error ? <p className="error">{translateError(error)}</p> : null}
      </div>
    )
  }

  return (
    <div className={`google-signin${disabled ? ' is-busy' : ''}`}>
      <div className="google-signin-shell">
        <div className="btn google google-signin-face" aria-hidden="true">
          {children}
        </div>
        {clientId ? <div ref={hostRef} className="google-signin-host" /> : null}
      </div>
      {!clientId ? <p className="error">{t('errors.googleNotConfigured')}</p> : null}
      {error ? <p className="error">{translateError(error)}</p> : null}
    </div>
  )
}
