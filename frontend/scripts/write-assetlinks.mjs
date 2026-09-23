import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const fingerprints = process.argv.slice(2).map(normalizeFingerprint).filter(Boolean)
if (fingerprints.length === 0) {
  console.error('Usage: node scripts/write-assetlinks.mjs <SHA-256> [SHA-256...]')
  console.error('Paste Play Console app-signing SHA-256 fingerprints. Do not put them in chat.')
  process.exit(1)
}

const statements = [
  {
    relation: ['delegate_permission/common.get_login_creds'],
    target: {
      namespace: 'android_app',
      package_name: 'com.zipdeck.app',
      sha256_cert_fingerprints: fingerprints,
    },
  },
]

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../public/.well-known/assetlinks.json')
await mkdir(dirname(out), { recursive: true })
await writeFile(out, `${JSON.stringify(statements, null, 2)}\n`)
console.log(`Wrote ${out}`)

function normalizeFingerprint(value) {
  const hex = String(value || '')
    .trim()
    .replace(/[^0-9a-fA-F]/g, '')
    .toUpperCase()
  if (hex.length !== 64) {
    console.error(`Not a SHA-256 fingerprint: ${value}`)
    process.exit(1)
  }
  return hex.match(/.{2}/g).join(':')
}
