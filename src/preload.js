const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('voiceflow', {
  processAudio: (payload) => ipcRenderer.invoke('process-audio', payload),
  copyText: (text) => ipcRenderer.invoke('copy-text', text)
});
