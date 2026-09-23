import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.join(root, 'resources', 'play-screenshots', 'src')
const outDir = path.join(root, 'resources', 'play-screenshots')

const files = [
  ['Screenshot_20260922-132500.png', 'play-phone-01-flip.png'],
  ['Screenshot_20260922-132630.png', 'play-phone-02-quiz.png'],
  ['Screenshot_20260922-132652.png', 'play-phone-03-ai.png'],
  ['Screenshot_20260922-132703.png', 'play-phone-04-classes.png'],
]

const NAME_LEFT = 478
const NAME_TOP = 152
const NAME_WIDTH = 208
const NAME_HEIGHT = 42
const TARGET_W = 1080
const TARGET_H = 1920
const BG = '#0b0e17'

const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${NAME_WIDTH}" height="${NAME_HEIGHT}">
  <rect width="${NAME_WIDTH}" height="${NAME_HEIGHT}" fill="${BG}"/>
  <text x="8" y="28" fill="#edeff5" font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif" font-size="21" font-weight="600">Zipdeck User</text>
</svg>`)

for (const [srcName, outName] of files) {
  const named = await sharp(path.join(srcDir, srcName))
    .composite([{ input: overlay, left: NAME_LEFT, top: NAME_TOP }])
    .toBuffer()
  const namedMeta = await sharp(named).metadata()
  const paddedW = Math.round((namedMeta.height * 9) / 16)
  const extra = paddedW - namedMeta.width
  const left = Math.floor(extra / 2)
  const right = extra - left
  const padded = await sharp(named)
    .extend({ left, right, top: 0, bottom: 0, background: BG })
    .toBuffer()
  await sharp(padded)
    .resize(TARGET_W, TARGET_H, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, outName))

  const out = fs.readFileSync(path.join(outDir, outName))
  console.log(
    outName,
    out.readUInt32BE(16) + 'x' + out.readUInt32BE(20),
    out.length + ' bytes',
  )
}
