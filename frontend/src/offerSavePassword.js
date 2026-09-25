import { Capacitor } from '@capacitor/core'
import { SavePassword } from '@capgo/capacitor-autofill-save-password'

export async function offerSavePassword(email, password) {
  const id = String(email || '').trim()
  if (!id || !password) {
    return
  }
  if (Capacitor.getPlatform() === 'ios') {
    try {
      await SavePassword.promptDialog({
        username: id,
        password,
        url: 'zipdeck.app',
      })
    } catch {
      // User dismissed the sheet, or Keychain is unavailable.
    }
    return
  }
  if (typeof navigator === 'undefined' || !navigator.credentials?.store) {
    return
  }
  try {
    if (typeof PasswordCredential !== 'function') {
      return
    }
    await navigator.credentials.store(new PasswordCredential({ id, password }))
  } catch {
    // Unsupported WebView, or the user dismissed the save sheet.
  }
}
