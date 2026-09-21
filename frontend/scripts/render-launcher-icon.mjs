import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(join(root, 'resources', 'icon.svg'))
const resDir = join(root, 'android', 'app', 'src', 'main', 'res')
const sizes = [
  ['mipmap-mdpi', 48],
  ['mipmap-hdpi', 72],
  ['mipmap-xhdpi', 96],
  ['mipmap-xxhdpi', 144],
  ['mipmap-xxxhdpi', 192],
]

function pngAt(width) {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    background: '#A59CFF',
  }).render().asPng()
}

writeFileSync(join(root, 'resources', 'icon.png'), pngAt(1024))

for (const [folder, size] of sizes) {
  const dir = join(resDir, folder)
  mkdirSync(dir, { recursive: true })
  const png = pngAt(size)
  writeFileSync(join(dir, 'ic_launcher.png'), png)
  writeFileSync(join(dir, 'ic_launcher_round.png'), png)
}
