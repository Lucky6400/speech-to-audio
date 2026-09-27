const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

const isDev = !app.isPackaged

/** @type {BrowserWindow | null} */
let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    title: 'Speech to Audio',
    backgroundColor: '#0f1419',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (!isDev) {
    mainWindow.removeMenu()
  }

  if (isDev) {
    void mainWindow.loadURL('http://localhost:5173')
  } else {
    void mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

/**
 * @param {import('electron').IpcMainInvokeEvent} event
 * @param {{ text: string, voice: string, rate: string, pitch: string, volume: string }} options
 */
async function synthesize(event, options) {
  const { Communicate } = await import('edge-tts-universal')
  const communicate = new Communicate(options.text, {
    voice: options.voice,
    rate: options.rate,
    pitch: options.pitch,
    volume: options.volume,
  })

  /** @type {Buffer[]} */
  const audioParts = []
  const totalChars = Math.max(1, options.text.replace(/\s+/g, '').length)
  let spokenChars = 0
  let lastShown = 2

  event.sender.send('tts:progress', 2)

  for await (const chunk of communicate.stream()) {
    if (chunk.type === 'audio' && chunk.data) {
      audioParts.push(Buffer.from(chunk.data))
      if (lastShown < 8) {
        lastShown = 8
        event.sender.send('tts:progress', 8)
      }
    }

    if (
      (chunk.type === 'WordBoundary' || chunk.type === 'SentenceBoundary') &&
      chunk.text
    ) {
      spokenChars += String(chunk.text).replace(/\s+/g, '').length
      const next = Math.min(95, Math.max(8, Math.round((spokenChars / totalChars) * 100)))
      if (next > lastShown) {
        lastShown = next
        event.sender.send('tts:progress', next)
      }
    }
  }

  if (audioParts.length === 0) {
    throw new Error('No audio was generated. Please try again.')
  }

  event.sender.send('tts:progress', 100)
  return Buffer.concat(audioParts)
}

app.whenReady().then(() => {
  ipcMain.handle('tts:synthesize', synthesize)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
