import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'

// Android dismisses its launch splash on the first WebView frame. That frame is
// still the static document (or a blank WebView) before auth picks a screen.
// Keep the native splash up until that screen has been committed, then hide.
export function hideLaunchSplash() {
  if (!Capacitor.isNativePlatform()) {
    return
  }
  SplashScreen.hide().catch(() => {})
}
