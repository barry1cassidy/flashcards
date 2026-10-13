import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in'
import { api, getCachedUser, getToken, isNetworkError, setCachedUser, setToken } from './api'
import { applyLocale, deviceLocale } from './i18n'
import { applyTheme } from './theme'
import { clearJoinInvite } from './authRedirect'
import { offerSavePassword } from './offerSavePassword'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [offline, setOffline] = useState(false)
  const [ready, setReady] = useState(false)

  function keepUser(next) {
    setCachedUser(next)
    setUser(next)
    setOffline(false)
    return next
  }

  useEffect(() => {
    applyTheme(user?.theme)
  }, [user?.theme])

  useEffect(() => {
    if (user?.locale) {
      applyLocale(user.locale)
    }
  }, [user?.locale])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!getToken()) {
        applyTheme('DARK')
        applyLocale(deviceLocale())
        setReady(true)
        return
      }
      try {
        const me = await api('/api/auth/me')
        if (cancelled) {
          return
        }
        setCachedUser(me)
        setUser(me)
        setOffline(false)
      } catch (error) {
        if (cancelled) {
          return
        }
        if (getToken()) {
          const cached = getCachedUser()
          if (cached) {
            setUser(cached)
          }
          setOffline(isNetworkError(error) || navigator.onLine === false)
        } else {
          setUser(null)
          setOffline(false)
          applyTheme('DARK')
          applyLocale(deviceLocale())
        }
      } finally {
        if (!cancelled) {
          setReady(true)
        }
      }
    }

    function onOnline() {
      if (!getToken()) {
        return
      }
      api('/api/auth/me')
        .then((me) => {
          if (cancelled) {
            return
          }
          setCachedUser(me)
          setUser(me)
          setOffline(false)
        })
        .catch(() => {
          if (!getToken()) {
            setUser(null)
            setOffline(false)
          }
        })
    }

    load()
    window.addEventListener('online', onOnline)
    return () => {
      cancelled = true
      window.removeEventListener('online', onOnline)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      offline,
      ready,
      async login(email, password) {
        const result = await api('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        setToken(result.token)
        keepUser(result.user)
        await offerSavePassword(email, password)
        return result.user
      },
      async loginWithGoogle(idToken, locale) {
        const result = await api('/api/auth/google', {
          method: 'POST',
          body: JSON.stringify({ idToken, locale }),
        })
        setToken(result.token)
        keepUser(result.user)
        return result.user
      },
      async register(displayName, email, password, locale) {
        const result = await api('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ displayName, email, password, locale }),
        })
        setToken(result.token)
        keepUser(result.user)
        await offerSavePassword(email, password)
        return result.user
      },
      async verifyEmail(code) {
        const updated = await api('/api/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ code }),
        })
        keepUser(updated)
        return updated
      },
      async resendVerification() {
        const updated = await api('/api/auth/resend-verification', {
          method: 'POST',
        })
        keepUser(updated)
        return updated
      },
      async setTheme(theme) {
        return patchUser(setUser, user, { theme })
      },
      async setDeckSort(deckSort) {
        return patchUser(setUser, user, { deckSort })
      },
      async setStudyOrder(studyOrder) {
        return patchUser(setUser, user, { studyOrder })
      },
      async setRestudyWait(restudyWait) {
        return patchUser(setUser, user, { restudyWait })
      },
      async setTeacherMode(teacherMode) {
        return patchUser(setUser, user, { teacherMode })
      },
      async setProLicensed(proLicensed) {
        const previous = user
        setUser((current) => (current ? { ...current, proLicensed } : current))
        try {
          const updated = await api('/api/billing/stub-pro', {
            method: 'POST',
            body: JSON.stringify({ proLicensed }),
          })
          setCachedUser(updated)
          setUser(updated)
          return updated
        } catch (error) {
          setUser(previous)
          throw error
        }
      },
      async refresh() {
        const me = await api('/api/auth/me')
        return keepUser(me)
      },
      async setLocale(locale) {
        await applyLocale(locale)
        if (!user) {
          return
        }
        const previous = user
        setUser((current) => (current ? { ...current, locale } : current))
        try {
          const updated = await api('/api/auth/me', {
            method: 'PATCH',
            body: JSON.stringify({ locale }),
          })
          setCachedUser(updated)
          setUser(updated)
        } catch (error) {
          setUser(previous)
          if (previous?.locale) {
            await applyLocale(previous.locale)
          }
          throw error
        }
      },
      logout() {
        setToken(null)
        setUser(null)
        clearJoinInvite()
        applyTheme('DARK')
        applyLocale(deviceLocale())
        if (Capacitor.isNativePlatform()) {
          GoogleSignIn.signOut().catch(() => {})
        }
      },
    }),
    [user, offline, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

async function patchUser(setUser, user, body) {
  const previous = user
  setUser((current) => (current ? { ...current, ...body } : current))
  try {
    const updated = await api('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    setCachedUser(updated)
    setUser(updated)
    return updated
  } catch (error) {
    setUser(previous)
    throw error
  }
}
