import { existsSync, readFileSync, writeFileSync } from 'fs'

const path = 'node_modules/@capacitor-community/text-to-speech/ios/Sources/TextToSpeechPlugin/TextToSpeech.swift'
if (!existsSync(path)) {
  console.log('text-to-speech plugin is not installed; skipping the audio-session patch')
  process.exit(0)
}

let text = readFileSync(path, 'utf8')
let changed = false

const sessionFrom = 'self.synthesizer.usesApplicationAudioSession = false'
const sessionTo = 'self.synthesizer.usesApplicationAudioSession = true'
if (text.includes(sessionFrom)) {
  text = text.replace(sessionFrom, sessionTo)
  changed = true
} else if (!text.includes(sessionTo)) {
  console.error('Could not find the text-to-speech audio-session line to patch')
  process.exit(1)
}

const sleepName = 'zipdeck.listen.sleep'
if (!text.includes(sleepName)) {
  const anchor = 'self.synthesizer.delegate = self'
  if (!text.includes(anchor)) {
    console.error('Could not find the speech delegate line to patch')
    process.exit(1)
  }
  const observer = [
    anchor,
    'NotificationCenter.default.addObserver(forName: Notification.Name("zipdeck.listen.sleep"), object: nil, queue: .main) { [weak self] _ in',
    '            self?.stop()',
    '        }',
  ].join('\n        ')
  text = text.replace(anchor, observer)
  changed = true
}

if (changed) {
  writeFileSync(path, text)
}
console.log('text-to-speech uses the app audio session and stops when the sleep timer ends')
