import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(join(root, 'resources', 'play-feature-graphic.svg'))
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1024 },
  background: '#A59CFF',
}).render().asPng()
writeFileSync(join(root, 'resources', 'play-feature-graphic.png'), png)
console.log('Wrote resources/play-feature-graphic.png', png.length, 'bytes')
