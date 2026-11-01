import { registerPlugin } from '@capacitor/core'
import { isAndroidApp, isIosApp } from './billing'

const AppleSignIn = registerPlugin('AppleSignIn')
const APPLE_SRC = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'
const DEFAULT_WEB_CLIENT_ID = 'com.zipdeck.web'

let appleScript
let prepared = null

export function getAppleWebClientId() {
  return String(import.meta.env.VITE_APPLE_CLIENT_ID || DEFAULT_WEB_CLIENT_ID).trim() || DEFAULT_WEB_CLIENT_ID
}

export function appleRedirectUri() {
  return `${window.location.origin}/apple-callback.html`
}

export function appleSignInAvailable() {
  if (isAndroidApp()) {
    return false
  }
  if (isIosApp()) {
    return true
  }
  return Boolean(getAppleWebClientId())
}

export function ensureAppleWebReady() {
  if (isIosApp() || isAndroidApp()) {
    return Promise.resolve()
  }
  return loadAppleScript().then(() => (prepared ? null : prepareWebSignIn()))
}

export function signInWithApple() {
  if (isAndroidApp()) {
    return Promise.reject(new Error('Sign in with Apple is only on iPhone and iPad'))
  }
  if (isIosApp()) {
    return AppleSignIn.signIn()
  }
  return signInWithAppleWeb()
}

function signInWithAppleWeb() {
  const auth = window.AppleID?.auth
  const attempt = prepared
  if (!auth || !attempt) {
    return Promise.reject(new Error('Invalid Apple sign-in'))
  }
  prepared = null
  auth.init({
    clientId: getAppleWebClientId(),
    scope: 'name email',
    redirectURI: appleRedirectUri(),
    state: attempt.state,
    nonce: attempt.nonceHash,
    usePopup: true,
  })
  return auth
    .signIn()
    .then((response) => {
      const authorization = response?.authorization || {}
      if (!authorization.id_token || authorization.state !== attempt.state) {
        throw new Error('Invalid Apple sign-in')
      }
      const result = {
        identityToken: authorization.id_token,
        nonce: attempt.rawNonce,
      }
      const fullName = fullNameFrom(response)
      if (fullName) {
        result.fullName = fullName
      }
      return result
    })
    .catch((error) => {
      if (appleCanceled(error)) {
        return { canceled: true }
      }
      if (error?.message === 'Invalid Apple sign-in') {
        throw error
      }
      throw new Error('Invalid Apple sign-in')
    })
    .finally(() => prepareWebSignIn())
}

function loadAppleScript() {
  if (window.AppleID?.auth) {
    return Promise.resolve()
  }
  if (!appleScript) {
    appleScript = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${APPLE_SRC}"]`)
      const script = existing || document.createElement('script')
      function finish() {
        if (window.AppleID?.auth) {
          resolve()
        } else {
          reject(new Error('Invalid Apple sign-in'))
        }
      }
      script.addEventListener('load', finish, { once: true })
      script.addEventListener('error', () => reject(new Error('Invalid Apple sign-in')), { once: true })
      if (!existing) {
        script.src = APPLE_SRC
        script.async = true
        document.head.appendChild(script)
      } else if (window.AppleID?.auth) {
        finish()
      }
    }).catch((error) => {
      appleScript = null
      throw error
    })
  }
  return appleScript
}

function prepareWebSignIn() {
  const rawNonce = randomHex(32)
  const state = randomHex(16)
  return sha256Hex(rawNonce).then((nonceHash) => {
    prepared = { rawNonce, state, nonceHash }
  })
}

function randomHex(bytes) {
  const data = new Uint8Array(bytes)
  crypto.getRandomValues(data)
  return [...data].map((value) => value.toString(16).padStart(2, '0')).join('')
}

function sha256Hex(value) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then((digest) => {
    return [...new Uint8Array(digest)].map((item) => item.toString(16).padStart(2, '0')).join('')
  })
}

function fullNameFrom(response) {
  let user = response?.user
  if (!user) {
    return ''
  }
  if (typeof user === 'string') {
    try {
      user = JSON.parse(user)
    } catch {
      return ''
    }
  }
  const name = user?.name
  if (!name) {
    return ''
  }
  const text = typeof name === 'string'
    ? name
    : [name.firstName, name.middleName, name.lastName].filter(Boolean).join(' ')
  return text.trim().slice(0, 100)
}

function appleCanceled(error) {
  const code = String(error?.error || error?.code || error?.message || '').toLowerCase()
  return code.includes('cancel') || code.includes('closed')
}
