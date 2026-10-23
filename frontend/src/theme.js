import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'

export function applyTheme(theme) {
  const value = theme === 'LIGHT' ? 'light' : 'dark'
  document.documentElement.dataset.theme = value
  const color = value === 'light' ? '#f4f6fb' : '#0b0e17'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', color)
  }
  if (!Capacitor.isNativePlatform()) return
  const style = value === 'light' ? SystemBarsStyle.Light : SystemBarsStyle.Dark
  SystemBars.setStyle({ style }).catch(() => {})
}
