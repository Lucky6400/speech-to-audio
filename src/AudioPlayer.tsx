import { useEffect, useRef, useState } from 'react'

type AudioPlayerProps = {
  src: string
  title: string
  voiceLabel: string
  locale: string
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function AudioPlayer({ src, title, voiceLabel, locale }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [seeking, setSeeking] = useState(false)

  useEffect(() => {
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }, [src])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play()
    } else {
      audio.pause()
    }
  }

  function onSeek(value: number) {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(duration) || duration <= 0) return
    const next = (value / 100) * duration
    audio.currentTime = next
    setCurrentTime(next)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const coverLetter = voiceLabel.charAt(0).toUpperCase()

  return (
    <div className="now-playing" data-testid="result">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        data-testid="audio-player"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => {
          if (!seeking) setCurrentTime(e.currentTarget.currentTime)
        }}
      />

      <div className="np-cover" aria-hidden="true">
        <span className="np-cover-letter">{coverLetter}</span>
        <div className={`np-bars${playing ? ' active' : ''}`}>
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="np-meta">
        <p className="np-eyebrow">Now playing</p>
        <h2 className="np-title" title={title}>
          {title}
        </h2>
        <p className="np-artist">
          {voiceLabel} · {locale}
        </p>
      </div>

      <div className="np-timeline">
        <input
          type="range"
          className="np-seek"
          min={0}
          max={100}
          step={0.1}
          value={progress}
          aria-label="Seek"
          onMouseDown={() => setSeeking(true)}
          onTouchStart={() => setSeeking(true)}
          onMouseUp={(e) => {
            onSeek(Number(e.currentTarget.value))
            setSeeking(false)
          }}
          onTouchEnd={(e) => {
            onSeek(Number(e.currentTarget.value))
            setSeeking(false)
          }}
          onChange={(e) => {
            const value = Number(e.target.value)
            setCurrentTime((value / 100) * (duration || 0))
            if (!seeking) onSeek(value)
          }}
        />
        <div className="np-times">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="np-controls">
        <button
          type="button"
          className="np-play"
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Play'}
          data-testid="play-pause"
        >
          {playing ? (
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
              <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
              <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
            </svg>
          )}
        </button>
      </div>

      <a
        className="np-download"
        href={src}
        download="speech.mp3"
        data-testid="download-link"
      >
        Download MP3
      </a>
    </div>
  )
}

type EmptyOutputProps = {
  loading: boolean
  progress: number
}

export function EmptyOutput({ loading, progress }: EmptyOutputProps) {
  return (
    <div className="output-empty" data-testid="output-empty">
      <div className="output-empty-art" aria-hidden="true">
        <span>♪</span>
      </div>
      {loading ? (
        <>
          <h2>Creating your track…</h2>
          <p>{progress}% complete</p>
          <div
            className="progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Conversion progress"
            data-testid="conversion-progress"
          >
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </>
      ) : (
        <>
          <h2>Your audio will appear here</h2>
          <p>Write something, pick a voice, then hit Create audio.</p>
        </>
      )}
    </div>
  )
}
