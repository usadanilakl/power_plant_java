const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Flag to indicate we're running in Electron
  isElectron: true,

  // Close window function
  closeWindow: () => {
    ipcRenderer.send('close-window');
  }
});
