const UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
const MIX_PATH = new RegExp(`^/mixes/${UUID}$`)
const OWNED_PATH = new RegExp(`^/(decks|sets|mixes)/${UUID}$`)

export function mixReturnTo(value) {
  return typeof value === 'string' && MIX_PATH.test(value) ? value : ''
}

export function withMixReturn(path, mixPath) {
  const back = mixReturnTo(mixPath)
  if (!back) {
    return path
  }
  return `${path}${path.includes('?') ? '&' : '?'}return=${encodeURIComponent(back)}`
}

export function listenReturnPath(path) {
  if (typeof path !== 'string' || path.length > 240) {
    return ''
  }
  const split = path.indexOf('?')
  const pathname = split === -1 ? path : path.slice(0, split)
  if (!OWNED_PATH.test(pathname)) {
    return ''
  }
  if (split === -1) {
    return pathname
  }
  const params = new URLSearchParams(path.slice(split + 1))
  const keys = [...params.keys()]
  const back = mixReturnTo(params.get('return'))
  if (keys.length !== 1 || keys[0] !== 'return' || !back) {
    return ''
  }
  return `${pathname}?return=${encodeURIComponent(back)}`
}
