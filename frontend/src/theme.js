export function applyTheme(theme) {
  const value = theme === 'LIGHT' ? 'light' : 'dark'
  document.documentElement.dataset.theme = value
}
