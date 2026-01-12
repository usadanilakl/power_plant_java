const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: false, // Frameless for custom title bar
    fullscreen: true, // Start in fullscreen
    resizable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    autoHideMenuBar: true,
    backgroundColor: '#121212',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the Angular app
  const indexPath = path.join(__dirname, '..', 'dist', 'loto-boxes', 'browser', 'index.html');

  console.log('Loading from:', indexPath);
  console.log('File exists:', fs.existsSync(indexPath));

  // In development, you might want to load from the dev server
  if (process.env.ELECTRON_DEV) {
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(indexPath);
    // Open DevTools for debugging (remove in production)
    mainWindow.webContents.openDevTools();
  }

  // Prevent closing with Alt+F4 or system close - must use app close button
  mainWindow.on('close', (e) => {
    // Allow close only if triggered by our IPC
    if (!mainWindow.allowClose) {
      e.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent new windows from opening
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // App events
  app.whenReady().then(() => {
    // Handle close request from renderer
    ipcMain.on('close-window', () => {
      if (mainWindow) {
        mainWindow.allowClose = true;
        mainWindow.close();
      }
    });

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
