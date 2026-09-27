import { useEffect, useId, useRef, useState } from 'react'
import { Communicate } from 'edge-tts-universal/browser'
import { AudioPlayer, EmptyOutput } from './AudioPlayer'
import { DEFAULT_VOICE, VOICES, type StaticVoice } from './voices'
import './App.css'

const MAX_CHARS = 5000
const DEFAULT_RATE = 0
const DEFAULT_PITCH = 0
const DEFAULT_VOLUME = 0

function isMicrosoftEdge(): boolean {
  return /Edg\//.test(navigator.userAgent)
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value}%`
}

function formatPitch(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value}Hz`
}

function rateLabel(value: number): string {
  if (value === 0) return 'Normal'
  if (value <= -30) return 'Very slow'
  if (value < 0) return 'Slower'
  if (value < 40) return 'Faster'
  return 'Very fast'
}

function pitchLabel(value: number): string {
  if (value === 0) return 'Natural'
  if (value < 0) return 'Lower'
  return 'Higher'
}

function volumeLabel(value: number): string {
  if (value === 0) return 'Balanced'
  if (value < 0) return 'Softer'
  return 'Louder'
}

function trackTitleFromText(value: string): string {
  const clean = value.trim().replace(/\s+/g, ' ')
  if (!clean) return 'Untitled track'
  return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean
}

function App() {
  const [text, setText] = useState('')
  const [isEdge] = useState(() => isMicrosoftEdge())
  const [voice, setVoice] = useState(DEFAULT_VOICE)
  const [rate, setRate] = useState(DEFAULT_RATE)
  const [pitch, setPitch] = useState(DEFAULT_PITCH)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [trackTitle, setTrackTitle] = useState('Untitled track')
  const [trackVoice, setTrackVoice] = useState(VOICES[0])
  const menuRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  const selected = VOICES.find((v) => v.id === voice) ?? VOICES[0]
  const controlsChanged =
    rate !== DEFAULT_RATE || pitch !== DEFAULT_PITCH || volume !== DEFAULT_VOLUME

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  function pickVoice(next: StaticVoice) {
    setVoice(next.id)
    setMenuOpen(false)
  }

  function resetVoiceStyle() {
    setRate(DEFAULT_RATE)
    setPitch(DEFAULT_PITCH)
    setVolume(DEFAULT_VOLUME)
  }

  function resetInputs() {
    setText('')
    setVoice(DEFAULT_VOICE)
    setMenuOpen(false)
    resetVoiceStyle()
    setError(null)
    setProgress(0)
    setTrackTitle('Untitled track')
    setTrackVoice(VOICES[0])
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }

  const hasInputs =
    text.length > 0 ||
    voice !== DEFAULT_VOICE ||
    controlsChanged ||
    Boolean(audioUrl) ||
    Boolean(error)

  async function handleConvert() {
    const trimmed = text.trim()
    if (!trimmed) {
      setError('Add some text to turn into speech.')
      return
    }
    if (trimmed.length > MAX_CHARS) {
      setError(`Keep it under ${MAX_CHARS.toLocaleString()} characters.`)
      return
    }
    if (!isEdge) {
      setError('Please open this page in Microsoft Edge to create your audio.')
      return
    }

    setLoading(true)
    setError(null)
    setProgress(2)

    try {
      const communicate = new Communicate(trimmed, {
        voice,
        rate: formatPercent(rate),
        pitch: formatPitch(pitch),
        volume: formatPercent(volume),
      })

      const audioParts: BlobPart[] = []
      const totalChars = Math.max(1, trimmed.replace(/\s+/g, '').length)
      let spokenChars = 0
      let lastShown = 2

      for await (const chunk of communicate.stream()) {
        if (chunk.type === 'audio' && chunk.data) {
          audioParts.push(Uint8Array.from(chunk.data))
          if (lastShown < 8) {
            lastShown = 8
            setProgress(8)
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
            setProgress(next)
          }
        }
      }

      if (audioParts.length === 0) {
        throw new Error('No audio was generated. Please try again.')
      }

      setProgress(100)
      const blob = new Blob(audioParts, { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      setTrackTitle(trackTitleFromText(trimmed))
      setTrackVoice(selected)

      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
    } catch (err) {
      setProgress(0)
      const message =
        err instanceof Error
          ? err.message
          : 'Something went wrong creating your audio. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const charsLeft = MAX_CHARS - text.length
  const canConvert = !loading && text.trim().length > 0

  return (
    <main className="app">
      <header className="header">
        <p className="brand">Speech to Audio</p>
        <h1>Turn your words into natural speech</h1>
        <p className="subtitle">
          Write or paste anything — scripts, notes, emails — and download a
          polished MP3 in one click. Free, private, and ready in seconds.
        </p>
      </header>

      {!isEdge && (
        <div className="notice" role="status" data-testid="edge-notice">
          For the best experience, open this page in <strong>Microsoft Edge</strong>.
          You can explore voices and settings here; audio creation works in Edge.
        </div>
      )}

      <div className="workspace">
        <section className="composer" aria-label="Create audio">
          <label className="field" htmlFor="text-input">
            <span className="field-label">What should we say?</span>
            <textarea
              id="text-input"
              data-testid="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your script, message, or any text you want spoken aloud…"
              rows={9}
              maxLength={MAX_CHARS}
              disabled={loading}
            />
            <span
              className={`char-count${charsLeft < 200 ? ' warn' : ''}`}
              data-testid="char-count"
            >
              {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
          </label>

          <div className="field" ref={menuRef}>
            <span className="field-label" id="voice-label">
              Choose a voice
            </span>
            <button
              type="button"
              className="voice-trigger"
              data-testid="voice-trigger"
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
              aria-controls={listboxId}
              aria-labelledby="voice-label"
              disabled={loading}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span data-testid="voice-trigger-label">
                {selected.label} · {selected.locale}
              </span>
              <span className="voice-chevron" aria-hidden="true">
                {menuOpen ? '▴' : '▾'}
              </span>
            </button>
            {menuOpen && (
              <ul
                id={listboxId}
                className="voice-menu"
                role="listbox"
                aria-labelledby="voice-label"
                data-testid="voice-menu"
              >
                {VOICES.map((v) => (
                  <li key={v.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={v.id === voice}
                      className={`voice-option${v.id === voice ? ' selected' : ''}`}
                      data-testid={`voice-option-${v.id}`}
                      onClick={() => pickVoice(v)}
                    >
                      <span>{v.label}</span>
                      <span className="voice-option-locale">{v.locale}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <section className="controls" aria-labelledby="style-heading">
            <div className="controls-header">
              <h2 id="style-heading">Fine-tune the delivery</h2>
              {controlsChanged && (
                <button
                  type="button"
                  className="reset"
                  onClick={resetVoiceStyle}
                  disabled={loading}
                >
                  Reset
                </button>
              )}
            </div>

            <label className="slider-field" htmlFor="rate-slider">
              <span className="slider-meta">
                <span className="field-label">Speed</span>
                <span className="slider-value">
                  {rateLabel(rate)} · {formatPercent(rate)}
                </span>
              </span>
              <input
                id="rate-slider"
                data-testid="rate-slider"
                type="range"
                min={-50}
                max={100}
                step={5}
                value={rate}
                disabled={loading}
                onChange={(e) => setRate(Number(e.target.value))}
              />
              <span className="slider-ends">
                <span>Slower</span>
                <span>Faster</span>
              </span>
            </label>

            <label className="slider-field" htmlFor="pitch-slider">
              <span className="slider-meta">
                <span className="field-label">Pitch</span>
                <span className="slider-value">
                  {pitchLabel(pitch)} · {formatPitch(pitch)}
                </span>
              </span>
              <input
                id="pitch-slider"
                data-testid="pitch-slider"
                type="range"
                min={-50}
                max={50}
                step={5}
                value={pitch}
                disabled={loading}
                onChange={(e) => setPitch(Number(e.target.value))}
              />
              <span className="slider-ends">
                <span>Lower</span>
                <span>Higher</span>
              </span>
            </label>

            <label className="slider-field" htmlFor="volume-slider">
              <span className="slider-meta">
                <span className="field-label">Volume</span>
                <span className="slider-value">
                  {volumeLabel(volume)} · {formatPercent(volume)}
                </span>
              </span>
              <input
                id="volume-slider"
                data-testid="volume-slider"
                type="range"
                min={-50}
                max={50}
                step={5}
                value={volume}
                disabled={loading}
                onChange={(e) => setVolume(Number(e.target.value))}
              />
              <span className="slider-ends">
                <span>Softer</span>
                <span>Louder</span>
              </span>
            </label>
          </section>

          <div className="actions">
            <button
              type="button"
              className="primary"
              data-testid="convert-button"
              onClick={handleConvert}
              disabled={!canConvert}
            >
              {loading ? `Creating… ${progress}%` : 'Create audio'}
            </button>
            <button
              type="button"
              className="secondary"
              data-testid="reset-inputs"
              onClick={resetInputs}
              disabled={loading || !hasInputs}
            >
              Reset inputs
            </button>
          </div>

          {error && (
            <p className="error" role="alert" data-testid="error-message">
              {error}
            </p>
          )}
        </section>

        <aside className="output-panel" aria-label="Audio output">
          {audioUrl ? (
            <AudioPlayer
              src={audioUrl}
              title={trackTitle}
              voiceLabel={trackVoice.label}
              locale={trackVoice.locale}
            />
          ) : (
            <EmptyOutput loading={loading} progress={progress} />
          )}
        </aside>
      </div>
    </main>
  )
}

export default App
