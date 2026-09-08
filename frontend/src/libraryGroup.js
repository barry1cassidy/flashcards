export function isLanguageLibraryGroup(group) {
  if (!group) {
    return false
  }
  const source = group.sourceLanguage || 'en-US'
  const target = group.targetLanguage || 'en-US'
  return source !== target || target !== 'en-US'
}
