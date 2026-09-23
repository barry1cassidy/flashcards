export async function offerSavePassword(email, password) {
  const id = String(email || '').trim()
  if (!id || !password || typeof navigator === 'undefined' || !navigator.credentials?.store) {
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
