import { useEffect, useRef, useState } from 'react'

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

export default function GoogleSignIn({ onCredential, disabled, children }) {
  const hostRef = useRef(null)
  const onCredentialRef = useRef(onCredential)
  const [error, setError] = useState('')
  const clientId = googleClientId()
  onCredentialRef.current = onCredential

  useEffect(() => {
    if (!clientId) {
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
        accounts.renderButton(hostRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width,
          locale: 'en',
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
  }, [clientId])

  return (
    <div className={`google-signin${disabled ? ' is-busy' : ''}`}>
      <div className="google-signin-shell">
        <div className="btn google google-signin-face" aria-hidden="true">
          {children}
        </div>
        {clientId ? <div ref={hostRef} className="google-signin-host" /> : null}
      </div>
      {!clientId ? <p className="error">Google sign-in is not configured.</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  )
}
