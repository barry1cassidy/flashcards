import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const srcDir = path.join(root, 'local_notes_files', 'zipdeck-play-screenshots')
const outDir = path.join(root, 'local_notes_files', 'zipdeck-ios-screenshots')
const iconSvg = path.join(root, 'frontend', 'resources', 'icon.svg')

const files = [
  ['play-phone-01-flip.png', '01-flip'],
  ['play-phone-02-quiz.png', '02-quiz'],
  ['play-phone-03-ai.png', '03-ai'],
  ['play-phone-04-classes.png', '04-classes'],
]

const sizes = [
  ['ios-6.5', 1284, 2778],
  ['ios-6.9', 1320, 2868],
]
const BG = '#0b0e17'

fs.mkdirSync(outDir, { recursive: true })

for (const [srcName, slug] of files) {
  for (const [prefix, width, height] of sizes) {
    const dest = path.join(outDir, `${prefix}-${slug}.png`)
    await sharp(path.join(srcDir, srcName))
      .resize(width, height, { fit: 'contain', background: BG })
      .png({ compressionLevel: 9 })
      .toFile(dest)
    const buf = fs.readFileSync(dest)
    console.log(path.basename(dest), buf.readUInt32BE(16) + 'x' + buf.readUInt32BE(20), buf.length + ' bytes')
  }
}

const iconDest = path.join(outDir, 'ios-app-store-icon-1024.png')
await sharp(iconSvg).resize(1024, 1024).flatten({ background: '#A59CFF' }).png({ compressionLevel: 9 }).toFile(iconDest)
const icon = fs.readFileSync(iconDest)
console.log(path.basename(iconDest), icon.readUInt32BE(16) + 'x' + icon.readUInt32BE(20), icon.length + 'bytes')
