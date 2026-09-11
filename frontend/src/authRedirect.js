export function pathAfterAuth(location) {
  const from = location?.state?.from
  if (typeof from === 'string' && isSafePath(from)) {
    return from
  }
  if (from && typeof from.pathname === 'string' && isSafePath(from.pathname)) {
    return `${from.pathname}${from.search || ''}${from.hash || ''}`
  }
  return '/'
}

function isSafePath(path) {
  return path.startsWith('/') && !path.startsWith('//')
}
