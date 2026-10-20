export function publicSiteOrigin() {
  const origin = window.location.origin
  if (origin.startsWith('http://') || origin.startsWith('https://')) {
    return origin.replace('://www.zipdeck.app', '://zipdeck.app')
  }
  return 'https://zipdeck.app'
}
