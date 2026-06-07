import sharp from 'sharp'
import { copyFileSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const srcIcon = resolve(root, 'public', 'icon.png')
const androidRes = resolve(root, 'android', 'app', 'src', 'main', 'res')

const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
}

async function main() {
  for (const [dir, size] of Object.entries(iconSizes)) {
    const outPath = resolve(androidRes, dir, 'ic_launcher.png')
    const outRoundPath = resolve(androidRes, dir, 'ic_launcher_round.png')
    await sharp(srcIcon).resize(size, size).png().toFile(outPath)
    await sharp(srcIcon).resize(size, size).png().toFile(outRoundPath)
    console.log(`Generated ${size}x${size} icon`)
  }

  console.log('All Android icons generated!')
}

main().catch(console.error)
