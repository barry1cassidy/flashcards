import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'

export function applyTheme(theme) {
  const value = theme === 'LIGHT' ? 'light' : 'dark'
  document.documentElement.dataset.theme = value
  if (!Capacitor.isNativePlatform()) return
  const style = value === 'light' ? SystemBarsStyle.Light : SystemBarsStyle.Dark
  SystemBars.setStyle({ style }).catch(() => {})
}
