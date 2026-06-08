import sharp from 'sharp'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const srcIcon = resolve(root, 'public', 'icon.png')
const androidRes = resolve(root, 'android', 'app', 'src', 'main', 'res')

const sizes = {
  'mipmap-mdpi': 48, 'mipmap-hdpi': 72, 'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144, 'mipmap-xxxhdpi': 192,
}

async function main() {
  for (const [dir, size] of Object.entries(sizes)) {
    await sharp(srcIcon).resize(size, size).png().toFile(resolve(androidRes, dir, 'ic_launcher.png'))
    await sharp(srcIcon).resize(size, size).png().toFile(resolve(androidRes, dir, 'ic_launcher_round.png'))
    await sharp(srcIcon).resize(size, size).png().toFile(resolve(androidRes, dir, 'ic_launcher_foreground.png'))
    console.log(`✓ ${size}x${size}`)
  }
  console.log('Android icons done!')
}

main().catch(console.error)
