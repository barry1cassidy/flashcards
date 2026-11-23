import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setCachedUser, setToken } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      setReady(true)
      return undefined
    }
    let cancelled = false
    api('/api/auth/me')
      .then((me) => {
        if (!cancelled) {
          setUser(me)
          setCachedUser(me)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true)
        }
      })
    function onUnauthorized() {
      setToken(null)
      setUser(null)
    }
    window.addEventListener('zipconvo-unauthorized', onUnauthorized)
    return () => {
      cancelled = true
      window.removeEventListener('zipconvo-unauthorized', onUnauthorized)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready,
      async login(email, password) {
        const result = await api('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        return storeSession(setUser, result)
      },
      async register(displayName, email, password) {
        const result = await api('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ displayName, email, password, locale: 'en' }),
        })
        return storeSession(setUser, result)
      },
      async loginWithGoogle(idToken) {
        const result = await api('/api/auth/google', {
          method: 'POST',
          body: JSON.stringify({ idToken, locale: 'en' }),
        })
        return storeSession(setUser, result)
      },
      async verifyEmail(code) {
        const updated = await api('/api/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ code }),
        })
        setUser(updated)
        setCachedUser(updated)
        return updated
      },
      async resendVerification() {
        const updated = await api('/api/auth/resend-verification', { method: 'POST' })
        setUser(updated)
        setCachedUser(updated)
        return updated
      },
      logout() {
        setToken(null)
        setUser(null)
      },
    }),
    [user, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return value
}

function storeSession(setUser, result) {
  setToken(result.token)
  setCachedUser(result.user)
  setUser(result.user)
  return result.user
}

export function cachedUser() {
  return getCachedUser()
}
