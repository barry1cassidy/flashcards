export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text, lang = 'en-US') {
  if (!canSpeak() || !text) {
    return
  }
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  const voice = pickVoice(lang)
  if (voice) {
    utterance.voice = voice
  }
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

function pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) {
    return null
  }
  const wanted = (lang || 'en-US').toLowerCase()
  return (
    voices.find((voice) => voice.lang.toLowerCase() === wanted) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(wanted.split('-')[0])) ||
    null
  )
}

if (typeof window !== 'undefined' && canSpeak()) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    window.speechSynthesis.getVoices()
  })
}
