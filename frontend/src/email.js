export function isEmailVerified(user) {
  return Boolean(user) && user.emailVerified !== false
}
