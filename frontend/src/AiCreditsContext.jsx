import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { loadBillingStatus } from './billing'

const AiCreditsContext = createContext(null)

export function AiCreditsProvider({ children }) {
  const { user } = useAuth()
  const [remainingCredits, setRemainingCredits] = useState(null)

  const refreshCredits = useCallback(async () => {
    if (!user) {
      setRemainingCredits(null)
      return null
    }
    const status = await loadBillingStatus()
    const next = typeof status?.remainingCredits === 'number' ? status.remainingCredits : null
    setRemainingCredits(next)
    return status
  }, [user])

  const reportCredits = useCallback((value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      setRemainingCredits(Math.max(0, value))
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setRemainingCredits(null)
      return undefined
    }
    let cancelled = false
    refreshCredits().catch(() => {
      if (!cancelled) {
        setRemainingCredits(null)
      }
    })
    return () => {
      cancelled = true
    }
  }, [user?.id, user?.proLicensed, user?.proExpiresAt, refreshCredits])

  const value = useMemo(
    () => ({
      remainingCredits,
      refreshCredits,
      reportCredits,
    }),
    [remainingCredits, refreshCredits, reportCredits]
  )

  return <AiCreditsContext.Provider value={value}>{children}</AiCreditsContext.Provider>
}

export function useAiCredits() {
  const value = useContext(AiCreditsContext)
  if (!value) {
    throw new Error('useAiCredits must be used within AiCreditsProvider')
  }
  return value
}
