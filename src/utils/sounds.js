let audioCtx = null

function getContext() {
  if (typeof window === 'undefined') return null
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

async function ensureRunning(ctx) {
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch {
      /* ignore autoplay restrictions */
    }
  }
}

/**
 * Тихий короткий клик через Web Audio API.
 * @param {'swap' | 'copy'} type
 */
export async function playClick(type = 'copy') {
  try {
    const ctx = getContext()
    if (!ctx) return
    await ensureRunning(ctx)

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    // Два слегка разных мягких тона
    if (type === 'swap') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(520, now)
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.08)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)
      osc.start(now)
      osc.stop(now + 0.11)
    } else {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.06)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.035, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)
      osc.start(now)
      osc.stop(now + 0.09)
    }

    osc.connect(gain)
    gain.connect(ctx.destination)
  } catch {
    /* звук необязателен */
  }
}
