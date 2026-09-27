import { Communicate } from 'edge-tts-universal/browser'

export type SynthesizeOptions = {
  text: string
  voice: string
  rate: string
  pitch: string
  volume: string
}

type DesktopApi = {
  isDesktop: true
  synthesize: (
    options: SynthesizeOptions,
    onProgress?: (progress: number) => void,
  ) => Promise<ArrayBuffer | Uint8Array>
}

declare global {
  interface Window {
    speechDesktop?: DesktopApi
  }
}

export function isDesktopApp(): boolean {
  return Boolean(window.speechDesktop?.isDesktop)
}

export function canUseBrowserTts(): boolean {
  return /Edg\//.test(navigator.userAgent)
}

export async function synthesizeSpeech(
  options: SynthesizeOptions,
  onProgress: (progress: number) => void,
): Promise<Blob> {
  if (window.speechDesktop?.isDesktop) {
    const data = await window.speechDesktop.synthesize(options, onProgress)
    const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    const copy = new Uint8Array(bytes.byteLength)
    copy.set(bytes)
    return new Blob([copy.buffer], { type: 'audio/mpeg' })
  }

  if (!canUseBrowserTts()) {
    throw new Error(
      'Open this page in Microsoft Edge, or use the desktop app to create audio.',
    )
  }

  const communicate = new Communicate(options.text, {
    voice: options.voice,
    rate: options.rate,
    pitch: options.pitch,
    volume: options.volume,
  })

  const audioParts: ArrayBuffer[] = []
  const totalChars = Math.max(1, options.text.replace(/\s+/g, '').length)
  let spokenChars = 0
  let lastShown = 2
  onProgress(2)

  for await (const chunk of communicate.stream()) {
    if (chunk.type === 'audio' && chunk.data) {
      const bytes = Uint8Array.from(chunk.data)
      const copy = new Uint8Array(bytes.byteLength)
      copy.set(bytes)
      audioParts.push(copy.buffer)
      if (lastShown < 8) {
        lastShown = 8
        onProgress(8)
      }
    }

    if (
      (chunk.type === 'WordBoundary' || chunk.type === 'SentenceBoundary') &&
      chunk.text
    ) {
      spokenChars += chunk.text.replace(/\s+/g, '').length
      const next = Math.min(95, Math.max(8, Math.round((spokenChars / totalChars) * 100)))
      if (next > lastShown) {
        lastShown = next
        onProgress(next)
      }
    }
  }

  if (audioParts.length === 0) {
    throw new Error('No audio was generated. Please try again.')
  }

  onProgress(100)
  return new Blob(audioParts, { type: 'audio/mpeg' })
}
