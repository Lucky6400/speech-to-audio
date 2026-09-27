# Speech to Audio

Turn text into natural-sounding speech and download an MP3 in one click.

Uses Microsoft Edge TTS online (free, no API keys). Works as a **desktop app** on Windows, or in the **Microsoft Edge** browser.

## Desktop app (Windows)

```bash
npm install
npm run electron:dev
```

Build installers / portable exe:

```bash
npm run electron:build
```

Output lands in `release/`:
- `Speech to Audio 1.0.0.exe` — portable single file (double-click to run)
- `win-unpacked/` — unpacked app folder if you prefer that

Internet is still required for Edge TTS. The desktop app does **not** require Microsoft Edge to be installed.

## Web (browser)

```bash
npm install
npm run dev
```

Open the local URL in **Microsoft Edge**.

```bash
npm run build
```

Deploy `dist/` to any static host.

## Features

- Paste text and create polished speech audio
- Choose from curated voices across languages
- Adjust **speed**, **pitch**, and **volume**
- Spotify-style player with download as MP3
- Conversion progress while audio is created
