/**
 * Main entry point for the Electron application.
 */

import { app, BrowserWindow } from 'electron';
import App from './app';

class Main {
  static initialize(): void {
    // Handle Squirrel events for Windows installer
    if (process.platform === 'win32') {
      // Check if we're running as result of an install/update
      if (require.main?.filename.indexOf('app.asar') === -1) {
        // Not in asar, might be during install
      }
    }
  }

  static bootstrapApp(): void {
    App.main(app, BrowserWindow);
  }
}

// Initialize and bootstrap
Main.initialize();
Main.bootstrapApp();
