let playTimer = 0

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function stopSpeaking() {
  if (playTimer) {
    window.clearTimeout(playTimer)
    playTimer = 0
  }
  if (!canSpeak()) {
    return
  }
  window.speechSynthesis.cancel()
}

export function speak(text, lang = 'en-US') {
  if (!canSpeak() || !text) {
    return
  }
  const utterance = new SpeechSynthesisUtterance(String(text))
  utterance.lang = lang || 'en-US'
  const voice = pickVoice(utterance.lang)
  if (voice) {
    utterance.voice = voice
  }
  stopSpeaking()
  // Chromium drops speak() in the same turn as cancel(), and can stay paused.
  playTimer = window.setTimeout(() => {
    playTimer = 0
    window.speechSynthesis.speak(utterance)
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }
  }, 50)
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
