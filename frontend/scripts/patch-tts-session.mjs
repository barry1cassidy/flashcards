import { existsSync, readFileSync, writeFileSync } from 'fs'

const path = 'node_modules/@capacitor-community/text-to-speech/ios/Sources/TextToSpeechPlugin/TextToSpeech.swift'
if (!existsSync(path)) {
  console.log('text-to-speech plugin is not installed; skipping the audio-session patch')
  process.exit(0)
}

const from = 'self.synthesizer.usesApplicationAudioSession = false'
const to = 'self.synthesizer.usesApplicationAudioSession = true'
const text = readFileSync(path, 'utf8')
if (text.includes(to)) {
  console.log('text-to-speech already uses the app audio session')
  process.exit(0)
}
if (!text.includes(from)) {
  console.error('Could not find the text-to-speech audio-session line to patch')
  process.exit(1)
}
writeFileSync(path, text.replace(from, to))
console.log('text-to-speech now uses the app audio session')
