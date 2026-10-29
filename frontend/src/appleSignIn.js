import { registerPlugin } from '@capacitor/core'
import { isIosApp } from './billing'

const AppleSignIn = registerPlugin('AppleSignIn')

export function appleSignInAvailable() {
  return isIosApp()
}

export async function signInWithApple() {
  if (!appleSignInAvailable()) {
    throw new Error('Sign in with Apple is only on iPhone and iPad')
  }
  return AppleSignIn.signIn()
}
