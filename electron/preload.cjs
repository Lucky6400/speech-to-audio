const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('speechDesktop', {
  isDesktop: true,
  /**
   * @param {{ text: string, voice: string, rate: string, pitch: string, volume: string }} options
   * @param {(progress: number) => void} [onProgress]
   */
  async synthesize(options, onProgress) {
    const progressHandler = (_event, value) => {
      if (typeof onProgress === 'function') onProgress(value)
    }
    ipcRenderer.on('tts:progress', progressHandler)
    try {
      const buffer = await ipcRenderer.invoke('tts:synthesize', options)
      return buffer
    } finally {
      ipcRenderer.removeListener('tts:progress', progressHandler)
    }
  },
})
