import { Capacitor } from '@capacitor/core'
import { api } from './api'

export function isNativeApp() {
  return Capacitor.isNativePlatform()
}

export function loadBillingStatus() {
  return api('/api/billing/status')
}

export async function startCheckout(plan, returnPath) {
  const result = await api('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan, returnPath: returnPath || '/settings' }),
  })
  if (!result?.url) {
    throw new Error('Payment failed')
  }
  window.location.assign(result.url)
}

export function completeCheckout(sessionId) {
  return api('/api/billing/checkout/complete', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  })
}

export async function openBillingPortal() {
  const result = await api('/api/billing/portal', {
    method: 'POST',
  })
  if (!result?.url) {
    throw new Error('Payment failed')
  }
  window.location.assign(result.url)
}
