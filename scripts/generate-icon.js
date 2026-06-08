import sharp from 'sharp'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const SIZES = {
  'public/icon.png': 1024,
  'public/icon-192.png': 192,
  'public/icon-512.png': 512,
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a0a2e"/>
      <stop offset="40%" style="stop-color:#7b2d8e"/>
      <stop offset="70%" style="stop-color:#3a7bd5"/>
      <stop offset="100%" style="stop-color:#0a0a1a"/>
    </linearGradient>
    <linearGradient id="cross" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffd700"/>
      <stop offset="50%" style="stop-color:#f2c94c"/>
      <stop offset="100%" style="stop-color:#e6b800"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="30" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="crossGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="15" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1024" height="1024" rx="200" fill="url(#bg)"/>
  <circle cx="512" cy="512" r="420" fill="none" stroke="rgba(242,201,76,0.08)" stroke-width="2"/>
  <circle cx="512" cy="512" r="380" fill="none" stroke="rgba(242,201,76,0.05)" stroke-width="1"/>
  <!-- Glowing cross -->
  <g filter="url(#glow)" opacity="0.3">
    <rect x="440" y="140" width="144" height="744" rx="36" fill="url(#cross)"/>
    <rect x="140" y="440" width="744" height="144" rx="36" fill="url(#cross)"/>
  </g>
  <!-- Main cross -->
  <rect x="440" y="140" width="144" height="744" rx="36" fill="url(#cross)"/>
  <rect x="140" y="440" width="744" height="144" rx="36" fill="url(#cross)"/>
  <!-- Sparkle dots -->
  <circle cx="780" cy="200" r="12" fill="#ffd700" opacity="0.6"/>
  <circle cx="200" cy="780" r="8" fill="#ffd700" opacity="0.4"/>
  <circle cx="800" cy="800" r="10" fill="#ffd700" opacity="0.5"/>
  <circle cx="250" cy="250" r="6" fill="#ffd700" opacity="0.3"/>
  <circle cx="180" cy="400" r="4" fill="#ffd700" opacity="0.4"/>
  <circle cx="840" cy="600" r="6" fill="#ffd700" opacity="0.3"/>
</svg>`

async function main() {
  for (const [filepath, size] of Object.entries(SIZES)) {
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(resolve(root, filepath))
    console.log(`✓ Generated ${size}x${size} → ${filepath}`)
  }
  console.log('All icons done!')
}

main().catch(console.error)
