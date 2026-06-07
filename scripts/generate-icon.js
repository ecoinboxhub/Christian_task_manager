import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#7b2d8e"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="200" fill="url(#bg)"/>
  <rect x="440" y="120" width="144" height="784" rx="36" fill="#f2c94c"/>
  <rect x="120" y="440" width="784" height="144" rx="36" fill="#f2c94c"/>
  <circle cx="820" cy="820" r="160" fill="#f2c94c" opacity="0.15"/>
  <circle cx="200" cy="200" r="120" fill="#f2c94c" opacity="0.1"/>
</svg>`

async function main() {
  await sharp(Buffer.from(svg))
    .resize(1024, 1024)
    .png()
    .toFile(resolve(root, 'public', 'icon.png'))

  await sharp(Buffer.from(svg))
    .resize(192, 192)
    .png()
    .toFile(resolve(root, 'public', 'icon-192.png'))

  await sharp(Buffer.from(svg))
    .resize(512, 512)
    .png()
    .toFile(resolve(root, 'public', 'icon-512.png'))

  console.log('Icons generated successfully!')
}

main().catch(console.error)
