export function downloadBlob(data, filename) {
  const blob =
    data instanceof Blob ? data : new Blob([data], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function csvFilename(name) {
  const cleaned = String(name || 'deck')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return `${cleaned || 'deck'}.csv`
}
