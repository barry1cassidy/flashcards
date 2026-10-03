import { Capacitor, registerPlugin } from '@capacitor/core'
import { api } from './api'

const completing = new Map()

const PlayBilling = registerPlugin('PlayBilling')
const AppleBilling = registerPlugin('AppleBilling')

export function isNativeApp() {
  return Capacitor.isNativePlatform()
}

export function isAndroidApp() {
  return Capacitor.getPlatform() === 'android'
}

export function isIosApp() {
  return Capacitor.getPlatform() === 'ios'
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

export async function startPlayPurchase(billing, productId, accountId) {
  const native = await PlayBilling.purchase({
    productId,
    productType: playProductType(billing, productId),
    accountId: accountId || '',
  })
  if (native?.canceled) {
    return null
  }
  if (!native?.purchaseToken || !native?.productId) {
    throw new Error('Payment failed')
  }
  return api('/api/billing/google/purchase', {
    method: 'POST',
    skipSaving: true,
    body: JSON.stringify({
      productId: native.productId,
      purchaseToken: native.purchaseToken,
      orderId: native.orderId || '',
    }),
  })
}

export async function restorePlayPurchases(accountId) {
  const result = await PlayBilling.restore({ accountId: accountId || '' })
  const purchases = Array.isArray(result?.purchases) ? result.purchases : []
  let latest = null
  for (const purchase of purchases) {
    if (!purchase?.purchaseToken || !purchase?.productId) {
      continue
    }
    latest = await api('/api/billing/google/purchase', {
      method: 'POST',
      skipSaving: true,
      body: JSON.stringify({
        productId: purchase.productId,
        purchaseToken: purchase.purchaseToken,
        orderId: purchase.orderId || '',
      }),
    })
  }
  return latest
}

function playProductType(billing, productId) {
  if (billing?.googleProductAddon && productId === billing.googleProductAddon) {
    return 'inapp'
  }
  return 'subs'
}

export async function startApplePurchase(productId, accountId) {
  const native = await AppleBilling.purchase({
    productId,
    accountId: accountId || '',
  })
  if (native?.canceled) {
    return null
  }
  return submitAppleTransaction(native)
}

export async function restoreApplePurchases(accountId) {
  const result = await AppleBilling.restore({ accountId: accountId || '' })
  const purchases = Array.isArray(result?.purchases) ? result.purchases : []
  let latest = null
  for (const purchase of purchases) {
    try {
      const updated = await submitAppleTransaction(purchase)
      if (updated?.proLicensed) {
        latest = updated
      }
    } catch (err) {
      if (err?.message !== 'Not authenticated') {
        throw err
      }
    }
  }
  return latest
}

export async function syncApplePurchases(accountId) {
  return submitApplePurchases(await AppleBilling.entitlements({ accountId: accountId || '' }))
}

async function submitApplePurchases(result) {
  const purchases = Array.isArray(result?.purchases) ? result.purchases : []
  let latest = null
  for (const purchase of purchases) {
    try {
      const updated = await submitAppleTransaction(purchase)
      if (updated) {
        latest = updated
      }
    } catch (err) {
      if (err?.message === 'Not authenticated') {
        throw err
      }
    }
  }
  return latest
}

async function submitAppleTransaction(native) {
  if (!native?.jwsRepresentation || !native?.productId) {
    throw new Error('Payment failed')
  }
  const updated = await api('/api/billing/apple/purchase', {
    method: 'POST',
    skipSaving: true,
    body: JSON.stringify({
      productId: native.productId,
      signedTransaction: native.jwsRepresentation,
      transactionId: native.transactionId || '',
    }),
  })
  if (native.transactionId) {
    await AppleBilling.finish({ transactionId: native.transactionId })
  }
  return updated
}
