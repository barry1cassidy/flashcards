import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken } from './api'
import { applyLocale } from './i18n'
import { applyTheme } from './theme'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    applyTheme(user?.theme)
  }, [user?.theme])

  useEffect(() => {
    if (user?.locale) {
      applyLocale(user.locale)
    }
  }, [user?.locale])

  useEffect(() => {
    async function load() {
      if (!getToken()) {
        applyTheme('DARK')
        setReady(true)
        return
      }
      try {
        const me = await api('/api/auth/me')
        setUser(me)
      } catch {
        setToken(null)
        setUser(null)
        applyTheme('DARK')
      } finally {
        setReady(true)
      }
    }
    load()
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
        setToken(result.token)
        setUser(result.user)
        return result.user
      },
      async loginWithGoogle(idToken, locale) {
        const result = await api('/api/auth/google', {
          method: 'POST',
          body: JSON.stringify({ idToken, locale }),
        })
        setToken(result.token)
        setUser(result.user)
        return result.user
      },
      async register(displayName, email, password, locale) {
        const result = await api('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ displayName, email, password, locale }),
        })
        setToken(result.token)
        setUser(result.user)
        return result.user
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
      async setStudyScope(studyScope) {
        return patchUser(setUser, user, { studyScope })
      },
      async setRestudyWait(restudyWait) {
        return patchUser(setUser, user, { restudyWait })
      },
      async resetDueDates() {
        await api('/api/study/reset-due', { method: 'POST' })
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
        applyTheme('DARK')
      },
    }),
    [user, ready],
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
    setUser(updated)
    return updated
  } catch (error) {
    setUser(previous)
    throw error
  }
}
