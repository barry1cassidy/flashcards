import assert from 'node:assert/strict'
import test from 'node:test'

import { parsePhrase, phrasesBySection } from './ingest-wikivoyage-library.mjs'

test('arabic greetings keep both phrases when Lang templates sit around a comma', () => {
  const card = parsePhrase(
    "; Hello (informal): {{Lang|ar|سَلاَم}} ''({{Lang|ar-Latn|salām}})'', {{Lang|ar|مَرْحَبًا}} ''({{Lang|ar-Latn|marḥaban}})''",
    'ar-SA',
  )
  assert.equal(card.front, 'Hello')
  assert.equal(card.back, 'سَلاَم, مَرْحَبًا')
  assert.equal(card.hint, 'salām; marḥaban')
})

test('arabic please keeps the word and the male pronunciation', () => {
  const card = parsePhrase("; Please. :{{Lang|ar|من فضلك}}:(''min faDlak) (male)''", 'ar-SA')
  assert.equal(card.front, 'Please.')
  assert.equal(card.back, 'من فضلك')
  assert.equal(card.hint, 'min faDlak (male)')
})

test('apostrophes inside italics stay in the pronunciation', () => {
  const yes = parsePhrase("; Yes.: {{Lang|ar|نَعَمْ}}  ''na'am''", 'ar-SA')
  assert.equal(yes.back, 'نَعَمْ')
  assert.equal(yes.hint, "na'am")

  const evening = parsePhrase("; Good evening.: {{Lang|ar|مساء الخير}}  ''masaa' al-khair''", 'ar-SA')
  assert.equal(evening.back, 'مساء الخير')
  assert.equal(evening.hint, "masaa' al-khair")
})

test('bold translations that contain commas stay on the back', () => {
  const card = parsePhrase(
    "; Fine, thank you: '''Dziękuję, dobrze.''' (''Jenkoo-yeng dob-zhe'')",
    'pl-PL',
  )
  assert.equal(card.front, 'Fine, thank you')
  assert.equal(card.back, 'Dziękuję, dobrze.')
  assert.equal(card.hint, 'Jenkoo-yeng dob-zhe')
})

test('bold polish words are not discarded as pronunciation', () => {
  const card = parsePhrase(
    "; Hello: Informal - '''Cześć''' (''Tch-esh-ch'') Formal - '''Dzień dobry''' (''Jeyn Dob-ry'')",
    'pl-PL',
  )
  assert.equal(card.back, 'Informal - Cześć Formal - Dzień dobry')
  assert.equal(card.hint, 'Tch-esh-ch; Jeyn Dob-ry')
})

test('a colon inside a clock time is not the phrase separator', () => {
  const card = parsePhrase("; '''1:00''':一点/一點 (''yat dim'')", 'zh-HK')
  assert.equal(card.front, '1:00')
  assert.equal(card.back, '一点/一點')
  assert.equal(card.hint, 'yat dim')
})

test('latin pronunciations with apostrophes and commas are hints', () => {
  const danish = parsePhrase("; Excuse me. : Undskyld mig (''On'skil ma'ee'').", 'da-DK')
  assert.equal(danish.back, 'Undskyld mig.')
  assert.equal(danish.hint, "On'skil ma'ee")

  const french = parsePhrase(
    "; ...pain reliever. : ...d'un analgésique (''d'aspirine, d'ibuprofène'').",
    'fr-FR',
  )
  assert.equal(french.back, "...d'un analgésique.")
  assert.equal(french.hint, "d'aspirine, d'ibuprofène")
})

test('audio file links and phonetic slashes stay off the card', () => {
  const card = parsePhrase(
    "; Hello. : Olá. (''o-LAH'') (, /o.ˈɫa/) [[File:LL-Q5146 (por)-Santamarcanda-olá.wav]]",
    'pt-BR',
  )
  assert.equal(card.front, 'Hello.')
  assert.equal(card.back, 'Olá.')
  assert.equal(card.hint, 'o-LAH')
})

test('spanish italics stay a pronunciation hint', () => {
  const card = parsePhrase("; Hello/Hi : Hola (''OH-lah'')", 'es-ES')
  assert.equal(card.front, 'Hello/Hi')
  assert.equal(card.back, 'Hola')
  assert.equal(card.hint, 'OH-lah')
})

test('following pronunciation lines attach to the phrase', () => {
  const sections = phrasesBySection(`
==Phrase list==
===Basics===
; How are you? : {{Lang|ar|كيف حالك؟}}
::''kayfa haalak? (male singular)''
::''kayfa haalik? (female singular)''
`)
  const card = parsePhrase(sections.get('basics')[0], 'ar-SA')
  assert.equal(card.back, 'كيف حالك؟')
  assert.equal(card.hint, 'kayfa haalak? (male singular); kayfa haalik? (female singular)')
})
