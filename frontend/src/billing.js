import { Capacitor } from '@capacitor/core'
import { api } from './api'

const completing = new Map()

export function isNativeApp() {
  return Capacitor.isNativePlatform()
}

export function loadBillingStatus() {
  return api('/api/billing/status')
}

export async function startCheckout(plan, returnPath) {
  const result = await api('/api/billing/checkout', {
    method: 'POST',
    skipSaving: true,
    body: JSON.stringify({ plan, returnPath: returnPath || '/pro' }),
  })
  if (!result?.url) {
    throw new Error('Payment failed')
  }
  window.location.assign(result.url)
}

export function completeCheckout(sessionId) {
  const existing = completing.get(sessionId)
  if (existing) {
    return existing
  }
  const pending = api('/api/billing/checkout/complete', {
    method: 'POST',
    skipSaving: true,
    body: JSON.stringify({ sessionId }),
  }).finally(() => completing.delete(sessionId))
  completing.set(sessionId, pending)
  return pending
}

export async function openBillingPortal() {
  const result = await api('/api/billing/portal', {
    method: 'POST',
    skipSaving: true,
  })
  if (!result?.url) {
    throw new Error('Payment failed')
  }
  window.location.assign(result.url)
}
