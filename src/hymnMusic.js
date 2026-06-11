const API_URL = import.meta.env.VITE_API_URL || ''

const PITCH_MAP = {
  'C4': 262, 'Db4': 277, 'D4': 294, 'Eb4': 311, 'E4': 330, 'F4': 349, 'Gb4': 370, 'G4': 392, 'Ab4': 415, 'A4': 440, 'Bb4': 466, 'B4': 494,
  'C5': 523, 'Db5': 554, 'D5': 587, 'Eb5': 622, 'E5': 659, 'F5': 698, 'Gb5': 740, 'G5': 784, 'Ab5': 831, 'A5': 880, 'Bb5': 932, 'B5': 988,
  'C6': 1047, 'D6': 1175, 'E6': 1319, 'F6': 1397, 'F#5': 740, 'F#4': 370, 'F#6': 1480,
}

let tuneCache = {}
let cachedHasTune = {}

let audioCtx = null
let playbackTimeout = null
let isPlaying = false

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

function initAudio() {
  const ctx = getAudioCtx()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playNote(freq, duration, startTime) {
  if (freq <= 0) return
  const ctx = getAudioCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'triangle'
  osc.frequency.setValueAtTime(freq, startTime)

  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02)
  gain.gain.linearRampToValueAtTime(0.3, startTime + duration * 0.7)
  gain.gain.linearRampToValueAtTime(0, startTime + duration - 0.02)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1200, startTime)
  filter.frequency.linearRampToValueAtTime(800, startTime + duration)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  osc.start(startTime)
  osc.stop(startTime + duration)
}

async function getTune(hymnId) {
  if (tuneCache[hymnId]) return tuneCache[hymnId]
  if (cachedHasTune[hymnId] === false) return null

  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/api/hymns/tune/${hymnId}`)
      if (res.ok) {
        const data = await res.json()
        tuneCache[hymnId] = data.tune
        cachedHasTune[hymnId] = true
        return data.tune
      }
    } catch {}
  }

  const { FALLBACK_TUNES } = await import('./hymnFallbackTunes.js')
  const tune = FALLBACK_TUNES[hymnId] || null
  tuneCache[hymnId] = tune
  cachedHasTune[hymnId] = !!tune
  return tune
}

function stopHymn() {
  if (playbackTimeout) {
    clearTimeout(playbackTimeout)
    playbackTimeout = null
  }
  isPlaying = false
}

async function playHymn(hymnId, onComplete) {
  stopHymn()

  const tune = await getTune(hymnId)
  if (!tune) { isPlaying = false; if (onComplete) onComplete(); return }

  const ctx = initAudio()

  isPlaying = true

  const totalDuration = tune.notes.reduce((s, n) => s + n.d, 0)
  let elapsed = 0

  tune.notes.forEach(note => {
    const startTime = ctx.currentTime + elapsed
    const freq = PITCH_MAP[note.p] || 0
    if (freq > 0) playNote(freq, note.d, startTime)
    elapsed += note.d
  })

  playbackTimeout = setTimeout(() => {
    isPlaying = false
    if (onComplete) onComplete()
  }, totalDuration * 1000 + 300)
}

function isHymnPlaying() {
  return isPlaying
}

async function hasTune(hymnId) {
  if (cachedHasTune[hymnId] !== undefined) return cachedHasTune[hymnId]
  const tune = await getTune(hymnId)
  return !!tune
}

export { playHymn, stopHymn, isHymnPlaying, hasTune }
