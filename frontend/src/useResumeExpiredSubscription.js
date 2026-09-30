import { useEffect, useRef } from 'react'
import { api } from './api'
import { useAuth } from './AuthContext'
import { isIosApp, syncApplePurchases } from './billing'

export function useResumeExpiredSubscription() {
  const { user, refresh } = useAuth()
  const attempted = useRef('')

  useEffect(() => {
    if (!user?.id || user.proLicensed) {
      return undefined
    }
    const expires = user.proExpiresAt ? Date.parse(user.proExpiresAt) : NaN
    if (!Number.isFinite(expires) || expires > Date.now()) {
      return undefined
    }
    const token = `${user.id}:${user.proExpiresAt}`
    if (attempted.current === token) {
      return undefined
    }
    attempted.current = token
    let cancelled = false
    async function resume() {
      if (isIosApp()) {
        try {
          await syncApplePurchases(user.id)
        } catch {
          // StoreKit had nothing to apply. The account check below still runs.
        }
      }
      try {
        await api('/api/billing/refresh-expired', { method: 'POST' })
      } catch {
        // The feature stays locked when the store cannot be checked.
      }
      if (!cancelled) {
        await refresh().catch(() => {})
      }
    }
    resume()
    return () => {
      cancelled = true
    }
  }, [user?.id, user?.proLicensed, user?.proExpiresAt, refresh])
}
