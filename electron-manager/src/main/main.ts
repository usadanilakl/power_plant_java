/**
 * Main entry point for the Electron application.
 */

import { app, BrowserWindow } from 'electron';
import App from './app';

App.main(app, BrowserWindow);
